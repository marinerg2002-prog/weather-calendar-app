import "server-only";
import type { DailyForecast, HourlyForecast, WeatherResponse } from "./types";

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
};

type ForecastItem = {
  dt: number;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { description: string; icon: string }[];
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

async function fetchJson<T>(url: URL): Promise<T> {
  let res: Response;
  try {
    // 同じ問い合わせは10分間キャッシュして API の呼び出し回数を抑える
    res = await fetch(url, { next: { revalidate: 600 } });
  } catch {
    throw new WeatherError(
      "天気サービスに接続できませんでした。時間をおいて再度お試しください。",
      502,
    );
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
      `天気情報の取得に失敗しました（エラーコード: ${res.status}）。`,
      502,
    );
  }
  return (await res.json()) as T;
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

export async function getWeather(city: string): Promise<WeatherResponse> {
  const appid = getApiKey();

  // 1. 都市名 → 緯度経度（日本語の都市名にも対応するため Geocoding API を使う）
  const geoUrl = new URL(GEO_URL);
  geoUrl.search = new URLSearchParams({ q: city, limit: "1", appid }).toString();
  const geo = await fetchJson<GeoResult[]>(geoUrl);
  if (geo.length === 0) {
    throw new WeatherError(
      `「${city}」という都市が見つかりませんでした。都市名を確認してください（例: 東京、大阪、London）。`,
      404,
    );
  }
  const place = geo[0];

  // 2. 5日間・3時間ごとの予報
  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
    units: "metric",
    lang: "ja",
    appid,
  }).toString();
  const forecast = await fetchJson<ForecastResult>(forecastUrl);
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
      name: place.local_names?.ja ?? place.name,
      country: place.country,
      timezoneOffset: offset,
    },
    today: toLocal(Math.floor(Date.now() / 1000), offset).date,
    days,
  };
}
