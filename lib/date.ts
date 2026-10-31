// 日付は都市の現地日付 "YYYY-MM-DD" 文字列で扱う。
// ブラウザのタイムゾーンの影響を受けないよう、すべて UTC として計算する。

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** "10月30日(木)" */
export function formatDate(date: string): string {
  const d = parseDate(date);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日(${WEEKDAYS[d.getUTCDay()]})`;
}

/** "10/30" */
export function formatShortDate(date: string): string {
  const d = parseDate(date);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** "YYYY-MM" */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** その月のカレンダー表示用の日付（前後の空白は null） */
export function monthGrid(month: string): (string | null)[] {
  const first = parseDate(`${month}-01`);
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  const d = new Date(first);
  while (toDateString(d).startsWith(month)) {
    cells.push(toDateString(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** 秒単位のオフセットを "UTC+9" や "UTC+5:30" の形式にする */
export function formatUtcOffset(offsetSec: number): string {
  const sign = offsetSec >= 0 ? "+" : "-";
  const abs = Math.abs(offsetSec);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}
