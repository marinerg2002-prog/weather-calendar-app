import { formatDate } from "@/lib/date";
import type { DailyForecast } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

type Props = {
  day: DailyForecast;
  isToday: boolean;
};

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2.5 text-center ring-1 ring-sky-100">
      <div className="text-xs text-slate-500">
        {emoji} {label}
      </div>
      <div className="mt-0.5 text-lg font-bold text-slate-700">{value}</div>
    </div>
  );
}

export default function DayDetail({ day, isToday }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6">
      <div className="flex items-center gap-2">
        {isToday && (
          <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-bold text-white">
            今日
          </span>
        )}
        <h2 className="text-lg font-bold text-slate-700">{formatDate(day.date)}の天気</h2>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:gap-4">
        <WeatherIcon icon={day.icon} description={day.description} size={96} />
        <div>
          <p className="text-xl font-bold text-slate-700">{day.description}</p>
          <p className="mt-1 text-slate-600">
            <span className="text-3xl font-bold text-rose-500">{day.tempMax}</span>
            <span className="text-sm">℃</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-2xl font-bold text-sky-600">{day.tempMin}</span>
            <span className="text-sm">℃</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat emoji="🌡️" label="最高 / 最低" value={`${day.tempMax}° / ${day.tempMin}°`} />
        <Stat emoji="💧" label="湿度（平均）" value={`${day.humidity}%`} />
        <Stat emoji="☂️" label="降水確率" value={`${day.pop}%`} />
      </div>

      <h3 className="mt-5 mb-2 text-sm font-bold text-slate-600">⏰ 3時間ごとの予報（現地時刻）</h3>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {day.hourly.map((h) => (
          <li
            key={h.time}
            className="flex w-20 shrink-0 flex-col items-center rounded-2xl bg-white px-2 py-2 text-center ring-1 ring-sky-100"
          >
            <span className="text-sm font-bold text-slate-600">{h.time}</span>
            <WeatherIcon icon={h.icon} description={h.description} size={48} />
            <span className="text-lg font-bold text-slate-700">{h.temp}℃</span>
            <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{h.description}</span>
            <span className="mt-1 text-xs text-sky-600">☂️ {h.pop}%</span>
            <span className="text-xs text-slate-500">💧 {h.humidity}%</span>
          </li>
        ))}
      </ul>
      {day.hourly.length < 8 && (
        <p className="mt-1 text-xs text-slate-500">
          ※ 予報データの提供範囲の都合で、この日は一部の時間帯のみ表示しています。
        </p>
      )}
    </section>
  );
}
