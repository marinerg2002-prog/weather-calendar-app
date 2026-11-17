import { getClothingAdvice } from "@/lib/clothing";
import type { DailyForecast } from "@/lib/types";

type Props = {
  /** 選択中の日の予報（データがない日は undefined） */
  day: DailyForecast | undefined;
};

export default function ClothingAdvice({ day }: Props) {
  const advice = getClothingAdvice(day);

  return (
    <section
      aria-labelledby="clothing-advice-heading"
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6"
    >
      <h2 id="clothing-advice-heading" className="mb-3 text-lg font-bold text-slate-700">
        👗 服装アドバイス
      </h2>

      {!advice ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
          この日の服装アドバイスは表示できません
        </p>
      ) : (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 sm:gap-4 ${advice.level.tone}`}
          >
            <span className="text-4xl sm:text-5xl" aria-hidden>
              {advice.level.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs opacity-80">
                最高気温 {advice.basisTemp}℃（目安: {advice.level.range}）
              </p>
              <p className="text-lg font-bold sm:text-xl">{advice.level.clothes}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">{advice.level.message}</p>

          {advice.extraNote && (
            <p className="rounded-2xl bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-700 ring-1 ring-sky-100">
              🌙 {advice.extraNote}
            </p>
          )}

          {advice.partial && (
            <p className="text-xs text-slate-500">
              ※ この日は一部の時間帯の予報のみのため、参考値として表示しています。
            </p>
          )}
        </div>
      )}
    </section>
  );
}
