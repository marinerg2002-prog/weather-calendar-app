"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  FAVORITES_STORAGE_KEY,
  MAX_CITY_NAME_LENGTH,
  MAX_FAVORITES,
  isSameCity,
  loadFavorites,
  saveFavorites,
} from "@/lib/favorites";

type Props = {
  loading: boolean;
  /** いま表示中の都市名（該当するお気に入りを強調表示する） */
  activeCity?: string;
  onSelect: (city: string) => void;
};

export default function FavoriteCities({ loading, activeCity, onSelect }: Props) {
  // null = まだ localStorage から読み込んでいない（サーバー描画との不一致を防ぐため）
  const [favorites, setFavorites] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
    // 別のタブで変更された場合も反映する
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY) setFavorites(loadFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const update = (next: string[]) => {
    setFavorites(next);
    saveFavorites(next);
  };

  const list = favorites ?? [];
  const isFull = list.length >= MAX_FAVORITES;

  const openForm = () => {
    setMessage(null);
    setInput("");
    setAdding(true);
  };

  const closeForm = () => {
    setAdding(false);
    setInput("");
    setMessage(null);
    addButtonRef.current?.focus();
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const city = input.trim().replace(/\s+/g, " ");
    if (!city) {
      setMessage({ text: "都市名を入力してください。", error: true });
      return;
    }
    if (list.some((c) => isSameCity(c, city))) {
      setMessage({ text: `「${city}」はすでに登録されています。`, error: true });
      return;
    }
    if (isFull) {
      setMessage({
        text: `登録できるのは${MAX_FAVORITES}件までです。不要な都市を削除してください。`,
        error: true,
      });
      return;
    }
    update([...list, city]);
    setAdding(false);
    setInput("");
    setMessage({ text: `「${city}」をお気に入りに追加しました。`, error: false });
  };

  const handleRemove = (city: string) => {
    update(list.filter((c) => c !== city));
    setMessage({ text: `「${city}」をお気に入りから削除しました。`, error: false });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") closeForm();
  };

  return (
    <section aria-labelledby="favorites-heading" className="mt-4 border-t border-sky-100 pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="favorites-heading" className="text-sm font-bold text-slate-600">
          ⭐ お気に入りの都市
        </h2>
        {favorites && (
          <span className="text-xs text-slate-400">
            {list.length} / {MAX_FAVORITES} 件
          </span>
        )}
      </div>

      {favorites === null ? (
        <div className="h-9" aria-hidden />
      ) : (
        <ul className="flex flex-wrap items-center gap-2 text-sm">
          {list.length === 0 && (
            <li className="text-slate-400">登録された都市はありません。</li>
          )}
          {list.map((city) => {
            const active = activeCity !== undefined && isSameCity(city, activeCity);
            return (
              <li
                key={city}
                className={`flex items-center rounded-full ring-1 transition ${
                  active ? "bg-sky-500 text-white ring-sky-500" : "bg-sky-50 text-sky-700 ring-sky-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  disabled={loading}
                  aria-current={active ? "true" : undefined}
                  className={`max-w-[12rem] truncate rounded-l-full py-1.5 pl-3 pr-1 disabled:opacity-50 ${
                    active ? "hover:bg-sky-600" : "hover:bg-sky-100"
                  }`}
                  title={`${city}の天気を表示`}
                >
                  {city}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(city)}
                  aria-label={`${city}をお気に入りから削除`}
                  title="削除"
                  className={`grid size-8 shrink-0 place-items-center rounded-r-full text-base leading-none ${
                    active
                      ? "text-sky-100 hover:bg-sky-600 hover:text-white"
                      : "text-sky-400 hover:bg-rose-50 hover:text-rose-500"
                  }`}
                >
                  ×
                </button>
              </li>
            );
          })}
          {!adding && (
            <li>
              <button
                ref={addButtonRef}
                type="button"
                onClick={openForm}
                disabled={isFull}
                className="rounded-full border border-dashed border-sky-300 bg-white px-3 py-1.5 font-bold text-sky-600 transition hover:border-sky-400 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
              >
                ＋ 都市を追加
              </button>
            </li>
          )}
        </ul>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="favorite-city" className="sr-only">
            お気に入りに追加する都市名
          </label>
          <input
            ref={inputRef}
            id="favorite-city"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setMessage(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="追加する都市名（例: 横浜、Paris）"
            maxLength={MAX_CITY_NAME_LENGTH}
            autoComplete="off"
            enterKeyHint="done"
            className="min-w-0 flex-1 rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] sm:flex-none"
            >
              追加
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 sm:flex-none"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      <p
        role="status"
        className={`mt-2 min-h-5 text-xs ${message?.error ? "text-rose-600" : "text-sky-600"}`}
      >
        {message?.text ||
          (favorites && isFull && !adding
            ? `登録できるのは${MAX_FAVORITES}件までです。追加するには「×」で削除してください。`
            : "")}
      </p>
    </section>
  );
}
