import WeatherApp from "@/components/WeatherApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="text-3xl font-bold tracking-wide text-sky-700 sm:text-4xl">
          <span aria-hidden>☀️</span> お天気カレンダー
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          都市を検索して、カレンダーから見たい日の天気をチェック
        </p>
      </header>

      <WeatherApp />

      <footer className="mt-10 text-center text-xs text-slate-400">
        気象データ提供:{" "}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-sky-600"
        >
          OpenWeatherMap
        </a>
      </footer>
    </main>
  );
}
