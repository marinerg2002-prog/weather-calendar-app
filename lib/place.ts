import type { PlaceCandidate } from "./types";

let regionNames: Intl.DisplayNames | null | undefined;

/** 国コード（"JP"）を日本語の国名（"日本"）にする。変換できなければコードのまま */
export function countryName(code: string): string {
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(["ja"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** 州・地域名と国名をつなげた補足表示（例: "Ile-de-France・フランス"） */
export function placeRegion(p: Pick<PlaceCandidate, "state" | "country">): string {
  return [p.state, countryName(p.country)].filter(Boolean).join("・");
}

export function isSamePlace(a: PlaceCandidate, b: PlaceCandidate): boolean {
  return Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
}

/** 緯度経度を "北緯35.68° 東経139.76°" の形にする（同名の候補を見分けるため） */
export function formatCoords(p: Pick<PlaceCandidate, "lat" | "lon">): string {
  const lat = `${p.lat >= 0 ? "北緯" : "南緯"}${Math.abs(p.lat).toFixed(2)}°`;
  const lon = `${p.lon >= 0 ? "東経" : "西経"}${Math.abs(p.lon).toFixed(2)}°`;
  return `${lat} ${lon}`;
}
