import { formatDate } from "@/lib/date";
import type { DailyForecast } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

type Props = {
  today: string;
  days: DailyForecast[];
  selected: string;
  onSelect: (date: string) => void;
};

export default function ForecastList({ today, days, selected, onSelect }: Props) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6">
      <h2 className="mb-3 text-lg font-bold text-slate-700">🗓️ 今後の天気予報</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const isSelected = day.date === selected;
          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onSelect(day.date)}
                aria-pressed={isSelected}
                className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                  isSelected
                    ? "bg-sky-100 ring-2 ring-sky-400"
                    : "bg-sky-50/60 ring-1 ring-sky-100 hover:bg-sky-100/70"
                }`}
              >
                <WeatherIcon icon={day.icon} description={day.description} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-700">
                    {formatDate(day.date)}
                    {day.date === today && (
                      <span className="ml-1.5 rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] text-white">
                        今日
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">{day.description}</p>
                </div>
                <div className="text-right text-xs leading-5 text-slate-500">
                  <p>
                    <span className="text-base font-bold text-rose-500">{day.tempMax}°</span>
                    <span className="mx-0.5">/</span>
                    <span className="text-base font-bold text-sky-600">{day.tempMin}°</span>
                  </p>
                  <p>
                    ☂️ {day.pop}% ・ 💧 {day.humidity}%
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
