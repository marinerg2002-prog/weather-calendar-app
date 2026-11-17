"use client";

import { useRef, useState } from "react";
import { formatUtcOffset } from "@/lib/date";
import { placeRegion } from "@/lib/place";
import type { ErrorResponse, PlaceCandidate, WeatherResponse } from "@/lib/types";
import Calendar from "./Calendar";
import ClothingAdvice from "./ClothingAdvice";
import DayDetail from "./DayDetail";
import LaundryAdvice from "./LaundryAdvice";
import ForecastList from "./ForecastList";
import PlaceCandidates from "./PlaceCandidates";
import SearchForm from "./SearchForm";
import UmbrellaAdvice from "./UmbrellaAdvice";

/**
 * 検索リクエストを待つ最大時間（ミリ秒）。
 * サーバー側は API 1回あたり15秒で打ち切り、Geocoding → Forecast の順に呼ぶため、それより長くする。
 */
const CLIENT_TIMEOUT_MS = 40_000;

export default function WeatherApp() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeCity, setActiveCity] = useState<string>("");
  const requestId = useRef(0);

  /** `place` を指定すると、検索結果の候補のうちその場所の天気を取得する */
  const search = async (city: string, place?: PlaceCandidate) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ city });
      if (place) {
        params.set("lat", String(place.lat));
        params.set("lon", String(place.lon));
      }
      let res: Response;
      try {
        res = await fetch(`/api/weather?${params}`, {
          signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
        });
      } catch (e) {
        if (id !== requestId.current) return;
        // ここに来るのは、アプリのサーバーまで届かなかった（または応答がなかった）場合だけ
        setError(
          e instanceof DOMException && e.name === "TimeoutError"
            ? "サーバーの応答に時間がかかっています。しばらく待ってから、もう一度お試しください。"
            : typeof navigator !== "undefined" && !navigator.onLine
              ? "インターネットに接続されていません。接続を確認して、もう一度お試しください。"
              : "アプリのサーバーに接続できませんでした。サーバー（npm run dev）が起動しているか確認して、もう一度お試しください。",
        );
        return;
      }

      const json = (await res.json().catch(() => null)) as WeatherResponse | ErrorResponse | null;
      if (id !== requestId.current) return; // 後から出した検索を優先する

      if (json && "error" in json) {
        // サーバー（API）側で判明したエラー。原因に合わせたメッセージが入っている
        setError(json.error || `天気情報の取得に失敗しました（サーバーのエラーコード: ${res.status}）。`);
        return;
      }
      if (!res.ok || !json || !Array.isArray(json.days)) {
        setError(`天気情報の取得に失敗しました（サーバーのエラーコード: ${res.status}）。`);
        return;
      }
      if (json.days.length === 0) {
        setError("この都市の予報データがありませんでした。");
        return;
      }
      setData(json);
      setActiveCity(city);
      // 今日の予報があれば今日、なければ最初の日を選択
      const hasToday = json.days.some((d) => d.date === json.today);
      setSelected(hasToday ? json.today : json.days[0].date);
    } catch (e) {
      // 通信以外の想定外のエラー（データの処理中など）。通信エラーとは区別して表示する
      if (id !== requestId.current) return;
      console.error(e);
      setError("天気情報の表示中にエラーが発生しました。ページを再読み込みして、もう一度お試しください。");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const selectedDay = data?.days.find((d) => d.date === selected);

  return (
    <div className="space-y-4 sm:space-y-6">
      <SearchForm loading={loading} activeCity={activeCity} onSearch={search} />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200"
        >
          <span aria-hidden>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-sky-100">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
          天気予報を取得しています…
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-sky-100">
          <p className="text-5xl" aria-hidden>
            ⛅
          </p>
          <p className="mt-3 font-bold text-slate-700">都市名を入力して天気予報を調べましょう</p>
          <p className="mt-1 text-sm text-slate-500">
            カレンダーの日付をタップすると、その日の天気に切り替わります。
          </p>
        </div>
      )}

      {data && selectedDay && (
        <div className={`space-y-4 transition-opacity sm:space-y-6 ${loading ? "opacity-50" : ""}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
            <h2 className="text-2xl font-bold text-slate-800">📍 {data.city.name}</h2>
            <span className="text-sm text-slate-500">
              {placeRegion(data.city)} ・ 現地時間 {formatUtcOffset(data.city.timezoneOffset)}
            </span>
          </div>

          <PlaceCandidates
            candidates={data.candidates}
            current={data.city}
            loading={loading}
            onPick={(place) => search(activeCity, place)}
          />

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Calendar
              key={`${data.city.lat},${data.city.lon}-${data.today}`}
              today={data.today}
              days={data.days}
              selected={selected}
              onSelect={setSelected}
            />
            <DayDetail day={selectedDay} isToday={selectedDay.date === data.today} />
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <ClothingAdvice day={selectedDay} />
            <UmbrellaAdvice day={selectedDay} />
            <div className="md:col-span-2">
              <LaundryAdvice day={selectedDay} />
            </div>
          </div>

          <ForecastList
            today={data.today}
            days={data.days}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      )}
    </div>
  );
}
