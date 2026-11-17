import { getLaundryAdvice } from "@/lib/laundry";
import { UMBRELLA_WINDOW_LABEL } from "@/lib/umbrella";
import type { DailyForecast } from "@/lib/types";

type Props = {
  /** 選択中の日の予報（データがない日は undefined） */
  day: DailyForecast | undefined;
};

export default function LaundryAdvice({ day }: Props) {
  const advice = getLaundryAdvice(day);

  return (
    <section
      aria-labelledby="laundry-advice-heading"
      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6"
    >
      <h2 id="laundry-advice-heading" className="mb-3 text-lg font-bold text-slate-700">
        🧺 洗濯おすすめ度
      </h2>

      {!advice ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
          データがありません
          <span className="mt-1 block text-xs">
            （{UMBRELLA_WINDOW_LABEL}の判定に必要な天気データを取得できませんでした）
          </span>
        </p>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-2xl px-4 py-3 ring-1 ${advice.level.tone}`}>
            <p className="text-xs opacity-80">{UMBRELLA_WINDOW_LABEL}の天気から判定</p>
            <p className="flex flex-wrap items-baseline gap-x-3 text-lg font-bold sm:text-xl">
              <span
                className="text-2xl tracking-wider sm:text-3xl"
                role="img"
                aria-label={`5段階中${advice.level.stars}`}
              >
                {"★".repeat(advice.level.stars)}
                <span className="opacity-30">{"★".repeat(5 - advice.level.stars)}</span>
              </span>
              <span>{advice.level.label}</span>
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">{advice.level.message}</p>

          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3" aria-label="判定に使った天気情報">
            {[
              ["☁️ 天気", advice.basis.description],
              ["💧 最大降水確率", `${advice.basis.maxPop}％`],
              ["💦 平均湿度", `${advice.basis.humidity}％`],
              ["🍃 平均風速", `${advice.basis.windSpeed}m/s`],
              ["🌡️ 平均気温", `${advice.basis.temp}℃`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
                <dt className="text-sky-600">{label}</dt>
                <dd className="mt-0.5 text-sm font-bold text-sky-800">{value}</dd>
              </div>
            ))}
          </dl>

          {advice.partial && (
            <p className="text-xs text-slate-500">※ 一部の時間帯の予報による参考値</p>
          )}
        </div>
      )}
    </section>
  );
}
