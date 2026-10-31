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

export type WeatherResponse = {
  city: {
    name: string;
    country: string;
    /** UTCからのオフセット（秒） */
    timezoneOffset: number;
  };
  /** 都市の現地時刻での「今日」 "YYYY-MM-DD" */
  today: string;
  days: DailyForecast[];
};

export type ErrorResponse = {
  error: string;
};
