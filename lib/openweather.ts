import "server-only";
import type { DailyForecast, HourlyForecast, PlaceCandidate, WeatherResponse } from "./types";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

/** 画面に表示してよいメッセージと HTTP ステータスを持つエラー */
export class WeatherError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type GeoResult = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

type ForecastItem = {
  dt: number;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { id?: number; description: string; icon: string }[];
  wind: { speed: number };
  pop?: number;
};

type ForecastResult = {
  list: ForecastItem[];
  city: { name: string; country: string; timezone: number };
};

function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new WeatherError(
      "APIキーが設定されていません。.env.local に OPENWEATHER_API_KEY を設定してください。",
      500,
    );
  }
  return key;
}

/** OpenWeatherMap の1回の呼び出しを待つ最大時間（ミリ秒） */
const API_TIMEOUT_MS = 15_000;

/** ログ用に URL から APIキーを伏せる */
function redact(url: URL): string {
  const safe = new URL(url);
  if (safe.searchParams.has("appid")) safe.searchParams.set("appid", "***");
  return safe.toString();
}

/**
 * OpenWeatherMap を呼び出して JSON を返す。
 * @param api ログやエラーメッセージに出す API の名前（例: "Geocoding API"）
 */
async function fetchJson<T>(url: URL, api: string): Promise<T> {
  let res: Response;
  try {
    // 同じ問い合わせは10分間キャッシュして API の呼び出し回数を抑える
    res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "TimeoutError";
    // 原因（ENOTFOUND / ECONNRESET など）をサーバーのログにだけ残す
    console.error(`[weather] ${api} への接続に失敗: ${redact(url)}`, timedOut ? "timeout" : e);
    throw new WeatherError(
      timedOut
        ? `天気サービス（${api}）の応答がありませんでした。時間をおいて再度お試しください。`
        : `天気サービス（${api}）に接続できませんでした。サーバーのネットワーク接続を確認し、時間をおいて再度お試しください。`,
      timedOut ? 504 : 502,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[weather] ${api} がエラーを返しました: HTTP ${res.status} ${redact(url)}`, body.slice(0, 200));
  }
  if (res.status === 401) {
    throw new WeatherError(
      "APIキーが無効です。OPENWEATHER_API_KEY の値を確認してください（新規発行したキーは有効になるまで数時間かかる場合があります）。",
      500,
    );
  }
  if (res.status === 429) {
    throw new WeatherError(
      "アクセスが集中しています。しばらく待ってから再度お試しください。",
      429,
    );
  }
  if (!res.ok) {
    throw new WeatherError(
      `天気情報の取得に失敗しました（${api} のエラーコード: ${res.status}）。`,
      502,
    );
  }

  try {
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[weather] ${api} の応答を読み取れませんでした: ${redact(url)}`, e);
    throw new WeatherError(
      `天気サービス（${api}）から正しい応答がありませんでした。時間をおいて再度お試しください。`,
      502,
    );
  }
}

/** UNIX秒 + タイムゾーンオフセットから、都市の現地日付・時刻を求める */
function toLocal(unixSec: number, offsetSec: number) {
  const iso = new Date((unixSec + offsetSec) * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** その日の代表となる天気（昼12時に最も近い予報）を選ぶ */
function pickRepresentative(hourly: HourlyForecast[]): HourlyForecast {
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return hourly.reduce((best, h) =>
    Math.abs(minutes(h.time) - 720) < Math.abs(minutes(best.time) - 720) ? h : best,
  );
}

// ---- 都市名の検索（Geocoding API） ----
//
// Geocoding API は登録名との完全一致で検索するため、日本の市区は「札幌市」「目黒区」のような
// 正式名称でないとヒットしない（「札幌」では0件、「福岡」「那覇」では中国の地名などが返る）。
// そこで漢字の地名には「市」「区」を付けた名前でも検索し、候補をまとめて並べ替える。

const KANJI = /\p{Script=Han}/u;
/** 行政区分の接尾辞。並び順は同じ名前で複数見つかったときの優先順 */
const ADMIN_SUFFIXES = ["都", "市", "区", "町", "村", "府", "県", "道"];
/** 接尾辞を付けて追加で検索するもの（API の呼び出し回数を抑えるため市・区のみ） */
const QUERY_SUFFIXES = ["市", "区"];
const GEO_LIMIT = "5";
/** 画面に表示する候補の最大数 */
const MAX_CANDIDATES = 5;

/** 比較用に表記ゆれ（全角半角・大文字小文字・アクセント記号・空白）をそろえる */
function normalizeName(s: string): string {
  return s
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ラテン文字のアクセントのみ除く（濁点は残す）
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 「市」「区」などを付けて検索し直す対象か。
 * 「京都」「成都」のように都・府・県・道で終わる地名もあるため、市区町村で終わる名前だけを除く。
 */
const needsSuffixSearch = (name: string) =>
  KANJI.test(name) && !["市", "区", "町", "村"].some((s) => name.endsWith(s));

/**
 * 候補の並び順を決める値（小さいほど優先）。
 * 0: 「札幌」→「札幌市」のように行政区分を付けた名前と一致
 * 1: 名前（各言語の表記を含む）と完全一致
 * 2: それ以外（API があいまい一致で返したもの）
 */
function rankCandidate(g: GeoResult, base: string): [number, number] {
  const names = [g.name, ...Object.values(g.local_names ?? {})].map(normalizeName);
  const b = normalizeName(base);
  if (needsSuffixSearch(base)) {
    const i = ADMIN_SUFFIXES.findIndex((s) => names.includes(b + s));
    if (i !== -1) return [0, i];
  }
  if (names.includes(b)) return [1, 0];
  return [2, 0];
}

async function searchPlaces(query: string, appid: string): Promise<GeoResult[]> {
  // "Paris,FR" のような国コード指定はそのまま API に渡し、名前の部分だけで比較する
  const [base, ...rest] = query.split(",");
  const baseName = base.trim();
  const tail = rest.length ? `,${rest.join(",")}` : "";

  const queries = [query];
  if (needsSuffixSearch(baseName)) {
    for (const s of QUERY_SUFFIXES) queries.push(`${baseName}${s}${tail}`);
  }

  const results = await Promise.all(
    queries.map((q) => {
      const url = new URL(GEO_URL);
      url.search = new URLSearchParams({ q, limit: GEO_LIMIT, appid }).toString();
      return fetchJson<GeoResult[]>(url, "Geocoding API").then((r) => {
        if (!Array.isArray(r)) {
          console.error("[weather] Geocoding API の応答が配列ではありません:", JSON.stringify(r).slice(0, 200));
          throw new WeatherError(
            "天気サービス（Geocoding API）から正しい応答がありませんでした。時間をおいて再度お試しください。",
            502,
          );
        }
        return r;
      });
    }),
  );

  // 同じ場所（座標がほぼ同じ）の重複を除く
  const seen = new Set<string>();
  const unique: GeoResult[] = [];
  for (const g of results.flat()) {
    const key = `${g.lat.toFixed(2)},${g.lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(g);
  }

  // 一致度の高い順に。同じなら API が返した順（＝元の検索語の結果が先）を保つ
  return unique
    .map((g, index) => ({ g, index, rank: rankCandidate(g, baseName) }))
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.index - b.index)
    .map((x) => x.g);
}

const toCandidate = (g: GeoResult): PlaceCandidate => ({
  name: g.local_names?.ja ?? g.name,
  ...(g.state ? { state: g.state } : {}),
  country: g.country,
  lat: g.lat,
  lon: g.lon,
});

/**
 * 都市名から天気予報を取得する。
 * `pick` を指定すると、検索結果の候補のうちその座標の場所を使う（候補の切り替え用）。
 */
export async function getWeather(
  city: string,
  pick?: { lat: number; lon: number },
): Promise<WeatherResponse> {
  const appid = getApiKey();

  // 1. 都市名 → 緯度経度（日本語の都市名にも対応するため Geocoding API を使う）
  const geo = await searchPlaces(city, appid);
  if (geo.length === 0) {
    throw new WeatherError(
      `「${city}」という都市が見つかりませんでした。都市名を確認してください（例: 東京、大阪、London）。`,
      404,
    );
  }
  const candidates = geo.slice(0, MAX_CANDIDATES);
  const place = pick
    ? candidates.find(
        (g) => Math.abs(g.lat - pick.lat) < 1e-4 && Math.abs(g.lon - pick.lon) < 1e-4,
      )
    : candidates[0];
  if (!place) {
    throw new WeatherError("選択した場所が見つかりませんでした。もう一度検索してください。", 404);
  }

  // 2. 5日間・3時間ごとの予報
  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
    units: "metric",
    lang: "ja",
    appid,
  }).toString();
  const forecast = await fetchJson<ForecastResult>(forecastUrl, "Forecast API");
  if (!Array.isArray(forecast?.list) || !forecast.city) {
    console.error("[weather] Forecast API の応答の形式が想定と異なります:", JSON.stringify(forecast).slice(0, 200));
    throw new WeatherError(
      "天気サービス（Forecast API）から正しい応答がありませんでした。時間をおいて再度お試しください。",
      502,
    );
  }
  const offset = forecast.city.timezone;

  // 3. 都市の現地日付ごとにまとめる
  const byDate = new Map<string, HourlyForecast[]>();
  for (const item of forecast.list) {
    const { date, time } = toLocal(item.dt, offset);
    const w = item.weather[0];
    const hourly: HourlyForecast = {
      time,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pop: Math.round((item.pop ?? 0) * 100),
      description: w?.description ?? "",
      icon: w?.icon ?? "01d",
      windSpeed: Math.round(item.wind.speed * 10) / 10,
      weatherId: typeof w?.id === "number" ? w.id : null,
      popAvailable: typeof item.pop === "number" && Number.isFinite(item.pop),
    };
    const list = byDate.get(date);
    if (list) list.push(hourly);
    else byDate.set(date, [hourly]);
  }

  const days: DailyForecast[] = [...byDate.entries()].map(([date, hourly]) => {
    const rep = pickRepresentative(hourly);
    const temps = hourly.map((h) => h.temp);
    return {
      date,
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      humidity: Math.round(hourly.reduce((s, h) => s + h.humidity, 0) / hourly.length),
      pop: Math.max(...hourly.map((h) => h.pop)),
      description: rep.description,
      icon: rep.icon.replace("n", "d"),
      hourly,
    };
  });

  return {
    city: {
      ...toCandidate(place),
      timezoneOffset: offset,
    },
    today: toLocal(Math.floor(Date.now() / 1000), offset).date,
    days,
    candidates: candidates.map(toCandidate),
  };
}
