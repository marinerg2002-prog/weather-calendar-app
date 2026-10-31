"use client";

import { useState } from "react";
import { WEEKDAYS, formatShortDate, monthGrid, monthKey, parseDate } from "@/lib/date";
import type { DailyForecast } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

type Props = {
  today: string;
  days: DailyForecast[];
  selected: string;
  onSelect: (date: string) => void;
};

export default function Calendar({ today, days, selected, onSelect }: Props) {
  const byDate = new Map(days.map((d) => [d.date, d]));

  // 予報期間にかかる月だけ切り替えられるようにする
  const months = [...new Set([today, ...days.map((d) => d.date)].map(monthKey))].sort();
  const indexOfSelected = Math.max(0, months.indexOf(monthKey(selected)));
  const [monthIndex, setMonthIndex] = useState(indexOfSelected);

  // 一覧など別の場所で日付が選ばれたら、その日付の月を表示する
  const [prevSelected, setPrevSelected] = useState(selected);
  if (prevSelected !== selected) {
    setPrevSelected(selected);
    setMonthIndex(indexOfSelected);
  }

  const month = months[Math.min(monthIndex, months.length - 1)];
  const [year, mon] = month.split("-").map(Number);

  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthIndex((i) => i - 1)}
          disabled={monthIndex <= 0}
          aria-label="前の月"
          className="grid size-9 place-items-center rounded-full text-xl text-sky-600 hover:bg-sky-50 disabled:invisible"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold text-slate-700">
          📅 {year}年{mon}月
        </h2>
        <button
          type="button"
          onClick={() => setMonthIndex((i) => i + 1)}
          disabled={monthIndex >= months.length - 1}
          aria-label="次の月"
          className="grid size-9 place-items-center rounded-full text-xl text-sky-600 hover:bg-sky-50 disabled:invisible"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 ${i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : "text-slate-400"}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthGrid(month).map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const forecast = byDate.get(date);
          const d = parseDate(date);
          const dow = d.getUTCDay();
          const dayNum = d.getUTCDate();

          // 予報がない日は選択できない
          if (!forecast) {
            return (
              <div
                key={date}
                className="flex aspect-square flex-col items-center rounded-xl pt-1.5 text-sm text-slate-300"
                title="予報期間外のため選択できません"
                aria-disabled="true"
              >
                {dayNum}
              </div>
            );
          }

          const isSelected = date === selected;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${mon}月${dayNum}日 ${forecast.description} 最高${forecast.tempMax}度 最低${forecast.tempMin}度`}
              className={`flex aspect-square flex-col items-center rounded-xl pt-1 text-sm font-bold transition ${
                isSelected
                  ? "bg-sky-500 text-white shadow-md"
                  : "bg-sky-50 text-slate-700 hover:bg-sky-100"
              } ${isToday && !isSelected ? "ring-2 ring-sky-400" : ""}`}
            >
              <span
                className={
                  isSelected ? "" : dow === 0 ? "text-rose-500" : dow === 6 ? "text-sky-600" : ""
                }
              >
                {dayNum}
              </span>
              <span className="-my-1.5">
                <WeatherIcon icon={forecast.icon} description={forecast.description} size={34} />
              </span>
              <span className="hidden text-[10px] font-normal leading-none sm:block">
                {forecast.tempMax}°
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        {first && last && (
          <p>
            選択できるのは予報がある
            <span className="mx-1 font-bold text-sky-600">
              {formatShortDate(first)}〜{formatShortDate(last)}
            </span>
            の日付です。
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded ring-2 ring-sky-400" />
          は今日（都市の現地日付）
        </p>
      </div>
    </section>
  );
}
