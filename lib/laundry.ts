import type { DailyForecast, HourlyForecast } from "./types";
import { expectedSlotCount, inWindow, toMinutes } from "./umbrella";

/**
 * 洗濯おすすめ度の判定
 *
 * 対象: 選択日の 9:00〜18:00（都市の現地時間）の3時間ごとの予報。
 * 天気コード・降水確率・湿度・風速・気温がすべてそろっている予報だけを使う
 * （降水確率が API から返されなかった予報は 0％ とみなさず、判定に使わない）。
 *
 * 1. 雨・雪などの予報が1件でもある、または最大降水確率が60％以上 → ★1
 * 2. それ以外は、次の点数の合計で判定する
 *    天気   : 快晴(800) +2 / 晴れ時々曇り(801〜802) +1 / 曇り(803〜804) 0 / 霧・もや(7xx) −1
 *             （各時間帯の点数を平均して四捨五入）
 *    降水確率（最大）: 〜10％ +2 / 〜20％ +1 / 〜30％ 0 / 31％〜 −1
 *    湿度（平均）    : 〜49％ +1 / 50〜69％ 0 / 70〜84％ −1 / 85％〜 −2
 *    風速（平均）    : 2〜7m/s +1（適度な風）/ 2m/s未満・7〜10m/s 0 / 10m/s以上 −1（強風）
 *    気温（平均）    : 20℃〜 +1 / 10〜19℃ 0 / 10℃未満 −1
 *    合計 5以上 ★5 / 3〜4 ★4 / 1〜2 ★3 / 0以下 ★2
 * 3. 最大降水確率が40〜59％の場合は、点数にかかわらず★2を上限とする
 */

export type LaundryLevel = {
  stars: 1 | 2 | 3 | 4 | 5;
  label: string;
  message: string;
  /** カード内の背景色など（Tailwind のクラス） */
  tone: string;
};

const LEVELS: Record<LaundryLevel["stars"], LaundryLevel> = {
  5: {
    stars: 5,
    label: "とても良い",
    message: "今日は洗濯日和！外干しがおすすめです",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  4: {
    stars: 4,
    label: "良い",
    message: "外干しに適した天気です",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  3: {
    stars: 3,
    label: "普通",
    message: "乾くまで少し時間がかかりそうです",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  2: {
    stars: 2,
    label: "あまり良くない",
    message: "部屋干しも検討しましょう",
    tone: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  1: {
    stars: 1,
    label: "良くない",
    message: "雨の可能性があります。部屋干しがおすすめです",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

export type LaundryAdvice = {
  level: LaundryLevel;
  /** 判定に使った主な天気情報 */
  basis: {
    /** 対象時間帯で最も多い天気の説明 */
    description: string;
    /** 最大降水確率（％） */
    maxPop: number;
    /** 平均湿度（％） */
    humidity: number;
    /** 平均風速（m/s） */
    windSpeed: number;
    /** 平均気温（℃） */
    temp: number;
  };
  /** 判定に使った時間帯の予報 */
  slots: HourlyForecast[];
  /** 対象時間帯のうち一部の予報しか使えず、参考値であるか */
  partial: boolean;
};

/** 雨・雪など、外干しできない天気か（2xx 雷雨 / 3xx 霧雨 / 5xx 雨 / 6xx 雪） */
const isPrecipitation = (id: number) => id >= 200 && id < 700;

function weatherPoint(id: number): number {
  if (id === 800) return 2;
  if (id === 801 || id === 802) return 1;
  if (id === 803 || id === 804) return 0;
  return -1; // 7xx: 霧・もや・砂塵など
}

function popPoint(maxPop: number): number {
  if (maxPop <= 10) return 2;
  if (maxPop <= 20) return 1;
  if (maxPop <= 30) return 0;
  return -1;
}

function humidityPoint(h: number): number {
  if (h < 50) return 1;
  if (h < 70) return 0;
  if (h < 85) return -1;
  return -2;
}

function windPoint(w: number): number {
  if (w >= 10) return -1;
  if (w >= 2 && w < 7) return 1;
  return 0;
}

function tempPoint(t: number): number {
  if (t >= 20) return 1;
  if (t >= 10) return 0;
  return -1;
}

const average = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;

/** 判定に必要な情報がすべてそろっている予報か */
const isComplete = (h: HourlyForecast): h is HourlyForecast & { weatherId: number } =>
  h.popAvailable &&
  h.weatherId !== null &&
  [h.pop, h.humidity, h.windSpeed, h.temp].every(Number.isFinite);

function mostFrequentDescription(slots: HourlyForecast[]): string {
  const counts = new Map<string, number>();
  for (const h of slots) {
    if (h.description) counts.set(h.description, (counts.get(h.description) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [d, c] of counts) {
    if (c > bestCount) {
      best = d;
      bestCount = c;
    }
  }
  return best || "—";
}

/**
 * 対象日の 9:00〜18:00（都市の現地時間）の予報から洗濯おすすめ度を返す。
 * 判定に使える予報が1件もない場合は null（無理に判定しない）。
 */
export function getLaundryAdvice(day: DailyForecast | undefined): LaundryAdvice | null {
  if (!day || day.hourly.length === 0) return null;

  const inRange = day.hourly.filter((h) => inWindow(toMinutes(h.time)));
  const slots = inRange.filter(isComplete);
  if (slots.length === 0) return null;

  const maxPop = Math.min(100, Math.max(0, ...slots.map((h) => h.pop)));
  const humidity = Math.round(average(slots.map((h) => h.humidity)));
  const windSpeed = Math.round(average(slots.map((h) => h.windSpeed)) * 10) / 10;
  const temp = Math.round(average(slots.map((h) => h.temp)));

  let stars: LaundryLevel["stars"];
  if (maxPop >= 60 || slots.some((h) => isPrecipitation(h.weatherId))) {
    stars = 1;
  } else {
    const score =
      Math.round(average(slots.map((h) => weatherPoint(h.weatherId)))) +
      popPoint(maxPop) +
      humidityPoint(humidity) +
      windPoint(windSpeed) +
      tempPoint(temp);
    stars = score >= 5 ? 5 : score >= 3 ? 4 : score >= 1 ? 3 : 2;
    if (maxPop >= 40) stars = Math.min(stars, 2) as LaundryLevel["stars"];
  }

  return {
    level: LEVELS[stars],
    basis: { description: mostFrequentDescription(slots), maxPop, humidity, windSpeed, temp },
    slots,
    partial: slots.length < expectedSlotCount(toMinutes(slots[0].time)),
  };
}
