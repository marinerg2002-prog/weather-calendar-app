import type { DailyForecast, HourlyForecast } from "./types";

/** 傘の必要度1段階分 */
export type UmbrellaLevel = {
  /** この段階の下限降水確率（％）。最大降水確率がこれ以上ならこの段階 */
  min: number;
  /** 降水確率の目安の表示用ラベル */
  range: string;
  emoji: string;
  /** 必要度のラベル */
  label: string;
  /** 一言メッセージ */
  message: string;
  /** カード内のアクセント色（Tailwind のクラス） */
  tone: string;
};

// 降水確率が高い順に並べる（上から順に判定する）
const LEVELS: UmbrellaLevel[] = [
  {
    min: 60,
    range: "60〜100％",
    emoji: "🔴",
    label: "高い",
    message: "傘を持ってお出かけしましょう",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  {
    min: 30,
    range: "30〜59％",
    emoji: "🟡",
    label: "中程度",
    message: "折りたたみ傘があると安心です",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    min: -Infinity,
    range: "0〜29％",
    emoji: "🟢",
    label: "低い",
    message: "傘は基本的に必要なさそうです",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
];

/** 判定の対象とする時間帯（都市の現地時刻、分単位・両端を含む） */
export const UMBRELLA_START = 9 * 60; // 09:00
export const UMBRELLA_END = 18 * 60; // 18:00
export const UMBRELLA_WINDOW_LABEL = "9:00〜18:00";

/** OpenWeatherMap の予報は3時間ごと */
const SLOT_INTERVAL = 180;

export type UmbrellaAdvice = {
  level: UmbrellaLevel;
  /** 判定に使った降水確率（対象時間帯の最大値） */
  basisPop: number;
  /** 判定に使った時間帯の予報 */
  slots: HourlyForecast[];
  /** 対象時間帯のうち一部の予報しか取得できず、参考値であるか */
  partial: boolean;
};

export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const inWindow = (minutes: number) => minutes >= UMBRELLA_START && minutes <= UMBRELLA_END;

/**
 * 1日分の予報がそろっていた場合に、対象時間帯に入る予報の件数。
 * 予報の時刻は都市のタイムゾーンによって 09:00 / 10:00 / 08:30 などずれるため、
 * 実際の予報時刻から3時間刻みの位相を求めて数える。
 */
export function expectedSlotCount(sampleMinutes: number): number {
  const phase = ((sampleMinutes % SLOT_INTERVAL) + SLOT_INTERVAL) % SLOT_INTERVAL;
  let count = 0;
  for (let m = phase; m < 24 * 60; m += SLOT_INTERVAL) {
    if (inWindow(m)) count++;
  }
  return count;
}

/**
 * 対象日の 9:00〜18:00（都市の現地時間）の最大降水確率をもとに傘の必要度を返す。
 * 対象時間帯の降水確率が1件も取得できない場合は null（無理に判定しない）。
 */
export function getUmbrellaAdvice(day: DailyForecast | undefined): UmbrellaAdvice | null {
  if (!day || day.hourly.length === 0) return null;

  const slots = day.hourly.filter(
    (h) => inWindow(toMinutes(h.time)) && Number.isFinite(h.pop),
  );
  if (slots.length === 0) return null;

  const basisPop = Math.min(100, Math.max(0, ...slots.map((h) => h.pop)));
  const level = LEVELS.find((l) => basisPop >= l.min) ?? LEVELS[LEVELS.length - 1];

  return {
    level,
    basisPop,
    slots,
    partial: slots.length < expectedSlotCount(toMinutes(slots[0].time)),
  };
}
