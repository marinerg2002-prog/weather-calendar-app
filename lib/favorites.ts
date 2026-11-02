/** お気に入りの都市を localStorage に保存・読み込みするための関数群（ブラウザ専用） */

export const FAVORITES_STORAGE_KEY = "weather-calendar:favorite-cities";
export const MAX_FAVORITES = 10;
export const MAX_CITY_NAME_LENGTH = 50;
export const DEFAULT_FAVORITES = ["東京", "大阪", "札幌", "福岡", "那覇", "London"];

/**
 * 重複チェック用に都市名を正規化する。
 * 全角/半角・大文字/小文字・前後や連続する空白の違いは同じ都市として扱う。
 * 例: "london" と "ＬＯＮＤＯＮ" と " London " は同じ
 */
export function normalizeCityName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSameCity(a: string, b: string): boolean {
  return normalizeCityName(a) === normalizeCityName(b);
}

/** 保存データが壊れていても安全に使えるよう、文字列だけ・重複なし・上限以内に整える */
function sanitize(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const name = item.trim().slice(0, MAX_CITY_NAME_LENGTH);
    if (!name || result.some((c) => isSameCity(c, name))) continue;
    result.push(name);
    if (result.length >= MAX_FAVORITES) break;
  }
  return result;
}

/**
 * 保存済みのお気に入りを読み込む。
 * 一度も保存されていない（初回利用）場合は初期値の6都市を返す。
 * 全件削除した場合は空配列が保存されるので、初期値には戻らない。
 */
export function loadFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw === null) return [...DEFAULT_FAVORITES];
    return sanitize(JSON.parse(raw));
  } catch {
    // プライベートブラウズ等で localStorage が使えない、または JSON が壊れている
    return [...DEFAULT_FAVORITES];
  }
}

export function saveFavorites(cities: string[]): void {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cities));
  } catch {
    // 保存できない環境では、そのページを開いている間だけ有効になる
  }
}
