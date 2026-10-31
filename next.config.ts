import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // OpenWeatherMap の天気アイコン画像を next/image で表示するための許可設定
    remotePatterns: [
      { protocol: "https", hostname: "openweathermap.org", pathname: "/img/wn/**" },
    ],
  },
};

export default nextConfig;
