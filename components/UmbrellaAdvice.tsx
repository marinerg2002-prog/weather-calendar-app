import { getUmbrellaAdvice, UMBRELLA_WINDOW_LABEL } from "@/lib/umbrella";
import type { DailyForecast } from "@/lib/types";

type Props = {
  /** 選択中の日の予報（データがない日は undefined） */
  day: DailyForecast | undefined;
};

export default function UmbrellaAdvice({ day }: Props) {
  const advice = getUmbrellaAdvice(day);

  return (
    <section
      aria-labelledby="umbrella-advice-heading"
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6"
    >
      <h2 id="umbrella-advice-heading" className="mb-3 text-lg font-bold text-slate-700">
        ☂️ 傘の必要度
      </h2>

      {!advice ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
          データがありません
          <span className="mt-1 block text-xs">
            （{UMBRELLA_WINDOW_LABEL}の降水確率を取得できませんでした）
          </span>
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
                {UMBRELLA_WINDOW_LABEL}の最大降水確率（目安: {advice.level.range}）
              </p>
              <p className="flex flex-wrap items-baseline gap-x-2 text-lg font-bold sm:text-xl">
                <span>必要度: {advice.level.label}</span>
                <span className="text-2xl sm:text-3xl">{advice.basisPop}％</span>
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">{advice.level.message}</p>

          <ul className="flex flex-wrap gap-2" aria-label="時間帯ごとの降水確率">
            {advice.slots.map((h) => (
              <li
                key={h.time}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100"
              >
                {h.time} 💧{h.pop}％
              </li>
            ))}
          </ul>

          {advice.partial && (
            <p className="text-xs text-slate-500">※ 一部の時間帯の予報による参考値</p>
          )}
        </div>
      )}
    </section>
  );
}
