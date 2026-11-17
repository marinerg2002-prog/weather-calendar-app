/** 3時間ごとの予報1件分 */
export type HourlyForecast = {
  /** 都市の現地時刻 "HH:mm" */
  time: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  /** 降水確率（0〜100％） */
  pop: number;
  description: string;
  icon: string;
  windSpeed: number;
  /** OpenWeatherMap の天気コード（weather[0].id）。取得できなかった場合は null */
  weatherId: number | null;
  /** API から降水確率が返されたか（false の場合 pop は 0 で補完されている） */
  popAvailable: boolean;
};

/** 1日分の予報（都市の現地日付ごとにまとめたもの） */
export type DailyForecast = {
  /** 都市の現地日付 "YYYY-MM-DD" */
  date: string;
  tempMin: number;
  tempMax: number;
  /** 平均湿度（％） */
  humidity: number;
  /** その日の最大降水確率（％） */
  pop: number;
  description: string;
  icon: string;
  hourly: HourlyForecast[];
};

/** 都市名の検索結果の候補1件分 */
export type PlaceCandidate = {
  /** 表示名（日本語名があれば日本語） */
  name: string;
  /** 州・地域名（API が返した場合のみ） */
  state?: string;
  /** 国コード（ISO 3166） */
  country: string;
  lat: number;
  lon: number;
};

export type WeatherResponse = {
  city: PlaceCandidate & {
    /** UTCからのオフセット（秒） */
    timezoneOffset: number;
  };
  /** 都市の現地時刻での「今日」 "YYYY-MM-DD" */
  today: string;
  days: DailyForecast[];
  /** 検索語に一致した場所の候補（一致度の高い順。表示中の場所を含む） */
  candidates: PlaceCandidate[];
};

export type ErrorResponse = {
  error: string;
};
