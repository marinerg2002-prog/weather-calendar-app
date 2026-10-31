import { NextResponse, type NextRequest } from "next/server";
import { getWeather, WeatherError } from "@/lib/openweather";
import type { ErrorResponse, WeatherResponse } from "@/lib/types";

// APIキーはサーバー側でのみ使用し、ブラウザには結果だけを返す
export async function GET(
  request: NextRequest,
): Promise<NextResponse<WeatherResponse | ErrorResponse>> {
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";

  if (!city) {
    return NextResponse.json({ error: "都市名を入力してください。" }, { status: 400 });
  }
  if (city.length > 100) {
    return NextResponse.json({ error: "都市名が長すぎます。" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getWeather(city));
  } catch (e) {
    if (e instanceof WeatherError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}
