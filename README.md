# ☀️ お天気カレンダー

都市名を入力すると、OpenWeatherMap の「5日間・3時間ごと予報」を取得し、カレンダーから日付を選んでその日の天気を確認できる Web アプリです。

## 主な機能

- 都市名（日本語・英語どちらも可）で天気予報を検索
- 気温（℃）・天気・湿度（％）・降水確率（％）を表示
- カレンダーで日付を選ぶと、その日の天気予報に切り替え
- 予報データがある期間の日付だけ選択可能（それ以外はグレー表示）
- 今日の天気、3時間ごとの予報、今後の天気一覧を表示
- 日付・時刻は検索した都市の現地タイムゾーンで表示
- スマートフォン対応のレスポンシブデザイン
- 都市が見つからない場合や通信エラー時のメッセージ表示

## 使用技術

- Next.js（App Router） / React / TypeScript
- Tailwind CSS
- OpenWeatherMap API（Geocoding API・5 Day / 3 Hour Forecast API。どちらも無料プランで利用可）

## ファイル構成

```
app/
  api/weather/route.ts   … サーバー側の API（ここで OpenWeatherMap を呼び出す）
  layout.tsx, page.tsx, globals.css
components/              … 画面部品（検索フォーム・カレンダー・天気詳細・予報一覧）
lib/
  openweather.ts         … OpenWeatherMap の呼び出しと日付ごとの集計（サーバー専用）
  date.ts, types.ts
.env.example             … 環境変数のひな形（変数名のみ）
```

## APIキーの扱い

- API キーは環境変数 `OPENWEATHER_API_KEY` から読み込みます。ソースコードには書かれていません。
- OpenWeatherMap への通信は Next.js のサーバー側（`/api/weather`）で行うため、ブラウザに API キーは送られません。
- `.env.local` は `.gitignore` に登録済みなので、GitHub には公開されません。

## ローカルでの起動方法

必要なもの: Node.js 20.9 以上

1. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

2. [OpenWeatherMap](https://home.openweathermap.org/users/sign_up) でアカウントを作成し、「API keys」ページで API キーを取得します。
   ※ 新しく発行したキーは、有効になるまで数十分〜数時間かかることがあります。

3. `.env.example` をコピーして `.env.local` を作成し、取得したキーを設定します。

   ```bash
   cp .env.example .env.local
   ```

   ```
   OPENWEATHER_API_KEY=取得したAPIキー
   ```

4. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

5. ブラウザで http://localhost:3000 を開きます。

本番ビルドを確認する場合:

```bash
npm run build
npm start
```

## Vercel へのデプロイ方法

1. このプロジェクトを GitHub にプッシュします（`.env.local` はプッシュされません）。

   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```

2. [Vercel](https://vercel.com/) にログインし、「Add New… → Project」から GitHub のリポジトリを選んで「Import」します。
3. Framework Preset が「Next.js」になっていることを確認します（ビルド設定は変更不要です）。
4. 「Environment Variables」に次を追加します。
   - Key: `OPENWEATHER_API_KEY`
   - Value: 取得した API キー
5. 「Deploy」を押すと、数分で公開 URL が発行されます。

> デプロイ後に環境変数を追加・変更した場合は、Vercel の「Deployments」から再デプロイ（Redeploy）してください。

Vercel CLI を使う場合は、`npx vercel` でプロジェクトを作成し、`npx vercel env add OPENWEATHER_API_KEY` でキーを登録してから `npx vercel --prod` でデプロイできます。

## 補足

- 無料の予報 API は「現在から約5日先まで・3時間ごと」のデータです。そのため、今日や最終日は一部の時間帯だけの表示になることがあります。
- 1日ごとの「降水確率」はその日の3時間ごとの値の最大値、「湿度」は平均値です。天気アイコンは昼12時に近い時間帯の予報を代表として表示します。
- 同じ都市への問い合わせはサーバー側で10分間キャッシュし、API の呼び出し回数を抑えています。
