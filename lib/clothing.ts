import type { DailyForecast } from "./types";

/** 服装アドバイス1段階分 */
export type ClothingLevel = {
  /** この段階の下限気温（℃）。最高気温がこれ以上ならこの段階 */
  min: number;
  /** 気温の目安の表示用ラベル */
  range: string;
  emoji: string;
  /** おすすめの服装 */
  clothes: string;
  /** 気温に合わせた一言メッセージ */
  message: string;
  /** カード内のアクセント色（Tailwind のクラス） */
  tone: string;
};

// 気温が高い順に並べる（上から順に判定する）
const LEVELS: ClothingLevel[] = [
  {
    min: 25,
    range: "25℃以上",
    emoji: "👕",
    clothes: "半袖・薄手の服",
    message: "暑くなりそうです。通気性のよい半袖で涼しく過ごしましょう。",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  {
    min: 20,
    range: "20〜24℃",
    emoji: "👔",
    clothes: "長袖シャツ・薄手の羽織り",
    message: "過ごしやすい気温です。長袖シャツ1枚か、薄手の羽織りがあると安心です。",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    min: 15,
    range: "15〜19℃",
    emoji: "🧥",
    clothes: "カーディガン・ジャケット",
    message: "少しひんやりします。カーディガンや軽めのジャケットを用意しましょう。",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    min: 10,
    range: "10〜14℃",
    emoji: "🧶",
    clothes: "ニット・コート",
    message: "肌寒い一日です。ニットにコートを重ねて暖かくしましょう。",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    min: -Infinity,
    range: "9℃以下",
    emoji: "🧣",
    clothes: "厚手のコート・マフラー",
    message: "かなり寒くなります。厚手のコートにマフラーや手袋でしっかり防寒を。",
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
];

export type ClothingAdvice = {
  level: ClothingLevel;
  /** 判定に使った気温（その日の最高気温） */
  basisTemp: number;
  /** 朝晩との寒暖差が大きい日の補足メッセージ */
  extraNote?: string;
  /** 予報が一部の時間帯しかなく、参考値であるか */
  partial: boolean;
};

/** 朝晩の冷え込みに注意を促す寒暖差（℃） */
const BIG_TEMP_GAP = 8;

/**
 * その日の最高気温をもとに服装アドバイスを返す。
 * 気温データがない・不正な場合は null（無理に判定しない）。
 */
export function getClothingAdvice(day: DailyForecast | undefined): ClothingAdvice | null {
  if (!day || day.hourly.length === 0) return null;
  const { tempMax, tempMin } = day;
  if (!Number.isFinite(tempMax) || !Number.isFinite(tempMin)) return null;

  const level = LEVELS.find((l) => tempMax >= l.min) ?? LEVELS[LEVELS.length - 1];
  const gap = tempMax - tempMin;

  return {
    level,
    basisTemp: tempMax,
    extraNote:
      gap >= BIG_TEMP_GAP
        ? `朝晩は${tempMin}℃まで下がり、寒暖差が${gap}℃あります。脱ぎ着しやすい上着があると便利です。`
        : undefined,
    // 3時間ごとの予報が1日分（8件）そろっていない日は参考値とする
    partial: day.hourly.length < 8,
  };
}
