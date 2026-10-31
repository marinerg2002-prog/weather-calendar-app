"use client";

import { useState, type FormEvent } from "react";

const SUGGESTIONS = ["東京", "大阪", "札幌", "福岡", "那覇", "London"];

type Props = {
  loading: boolean;
  onSearch: (city: string) => void;
};

export default function SearchForm({ loading, onSearch }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const city = value.trim();
    if (city) onSearch(city);
  };

  const pick = (city: string) => {
    setValue(city);
    onSearch(city);
  };

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="city" className="sr-only">
          都市名
        </label>
        <input
          id="city"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="都市名を入力（例: 東京、横浜、Paris）"
          className="min-w-0 flex-1 rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-2xl bg-sky-500 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-sky-200"
        >
          {loading ? "検索中…" : "🔍 検索"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">よく使う都市:</span>
        {SUGGESTIONS.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => pick(city)}
            disabled={loading}
            className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 disabled:opacity-50"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
