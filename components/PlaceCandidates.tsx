import { formatCoords, isSamePlace, placeRegion } from "@/lib/place";
import type { PlaceCandidate } from "@/lib/types";

type Props = {
  candidates: PlaceCandidate[];
  current: PlaceCandidate;
  loading: boolean;
  onPick: (place: PlaceCandidate) => void;
};

/** 同じ名前の場所が複数見つかったときに、別の候補へ切り替えるためのボタン一覧 */
export default function PlaceCandidates({ candidates, current, loading, onPick }: Props) {
  if (candidates.length < 2) return null;

  const label = (p: PlaceCandidate) => `${p.name}（${placeRegion(p)}）`;
  // 名前・地域だけでは区別できない候補には座標も添える
  const counts = new Map<string, number>();
  for (const c of candidates) counts.set(label(c), (counts.get(label(c)) ?? 0) + 1);

  return (
    <div className="px-1">
      <p className="mb-2 text-xs text-slate-500">
        ほかにも同じ名前の場所が見つかりました。目的の場所でない場合は選び直してください。
      </p>
      <ul className="flex flex-wrap gap-2">
        {candidates.map((c) => {
          const active = isSamePlace(c, current);
          const text = label(c);
          return (
            <li key={`${c.lat},${c.lon}`}>
              <button
                type="button"
                disabled={loading || active}
                aria-pressed={active}
                onClick={() => onPick(c)}
                className={`rounded-full px-3 py-1.5 text-left text-xs ring-1 transition ${
                  active
                    ? "bg-sky-500 font-bold text-white ring-sky-500"
                    : "bg-white text-slate-600 ring-sky-200 hover:bg-sky-50 disabled:opacity-50"
                }`}
              >
                {active && <span aria-hidden>✓ </span>}
                {text}
                {(counts.get(text) ?? 0) > 1 && (
                  <span className="ml-1 opacity-75">{formatCoords(c)}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
