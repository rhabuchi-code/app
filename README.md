# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## YouTubeライブ配信スケジュールの連携

YouTube のライブ配信予定をカレンダーに自動反映できます。**2つの経路を併用するハイブリッド方式** で、ユースケースに合わせて選べます。

### 2つの経路

| | API Key 経路（推奨） | OAuth 経路（任意） |
|---|---|---|
| ユーザー作業 | チャンネルURL/`@ハンドル` を追加するだけ | Google ログイン |
| 認証 | 不要 | Google アカウント連携 |
| 取得対象 | 任意のチャンネルの **公開** された予定配信（複数登録可） | 連携した本人の **非公開・限定公開を含む** 予定配信 |
| 開発者の事前準備 | API キー1つ発行（HTTPリファラ制限） | OAuth クライアントID + 同意画面整備 + テストユーザー登録 |
| 用途の典型 | 推し配信者の予定を集約／視聴者向け | 配信者本人の予定管理 |

両方の経路で取得したイベントは同じカレンダーに自動マージされます（同一配信は動画ID で重複排除）。一般ユーザー向けにアプリを配るなら **API Key だけ** 設定して OAuth は省く運用が現実的です。

### 仕組み

- YouTube 由来のイベントは `CalendarEvent`（`source: 'youtube'`）として手動イベントとマージされます。タップすると YouTube の視聴ページが新規タブで開き、編集・削除はできません（同期で上書きされます）。
- API Key 経路は `channels.list?forHandle=...` でチャンネル解決し、`search.list?eventType=upcoming` + `videos.list?part=liveStreamingDetails` で開始時刻まで取得します。登録チャンネルは `localStorage` に永続化されます。
- OAuth 経路は [Google Identity Services](https://developers.google.com/identity/oauth2/web) の Token Client で `youtube.readonly` のアクセストークンを取得し、`liveBroadcasts.list?broadcastStatus=upcoming` を呼び出します。トークンは `sessionStorage` のみに保持されます。
- どちらも **過去日付や 1970-01-01 などのデフォルトブロードキャストは自動除外** され、未来の予定だけが表示されます。

### セットアップ

#### A. API Key 経路（最低限これだけでOK）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成（または選択）
2. **APIとサービス → ライブラリ** で `YouTube Data API v3` を有効化
3. **APIとサービス → 認証情報 → 認証情報を作成 → APIキー**
4. 発行された API キーの「鍵を制限」を編集（推奨）
   - APIの制限: **YouTube Data API v3** のみ
   - アプリケーションの制限: **HTTPリファラー**
     - dev: `http://localhost:5173/*`
     - prod: `https://yourdomain.example/*`
5. 鍵を `.env.local` に貼る

```bash
cp .env.example .env.local
# .env.local を編集
# VITE_GOOGLE_API_KEY=AIzaSy...
npm run dev
```

#### B. OAuth 経路（自分の非公開予定も使いたい場合のみ）

A を済ませた **同じプロジェクト** で以下を追加で行います。

1. **APIとサービス → OAuth同意画面**
   - User type: **External**
   - スコープに `.../auth/youtube.readonly` を追加
   - 「テスト」ステータスのまま、テストユーザーに連携対象の Google アカウントを登録
2. **APIとサービス → 認証情報 → 認証情報を作成 → OAuthクライアントID**
   - アプリケーションの種類: **ウェブアプリケーション**
   - 承認済みのJavaScript生成元: `http://localhost:5173`
3. 発行されたクライアントID を `.env.local` の `VITE_GOOGLE_CLIENT_ID` に設定

> ℹ️ OAuth で `youtube.readonly` を一般公開する（誰でも連携できる状態にする）には Google の本番審査が必要で、個人開発では実用的ではありません。「テスト」ステータスのまま100ユーザーまで運用するのが現実的です。一般配布が前提なら API Key 経路だけにすることを推奨します。

### 使い方

カレンダー画面のヘッダー下「YouTubeライブ」カードから操作します。

- **チャンネル追加（API Key 経路）**:
  - 入力欄に `@ChannelName` か `https://www.youtube.com/@ChannelName` か `UCxxxxxx` を入力 → 「追加」
  - 追加されたチャンネルはチップで一覧表示。`×` で削除可能
  - 「すべて更新」で最新を再取得
- **Google アカウント連携（OAuth 経路）**:
  - 「Google アカウントを連携」→ ポップアップで許可
  - 連携後は自動で同期。「更新」「解除」ボタンで操作
- イベントタップで YouTube の視聴ページが新規タブで開きます。

### 注意点

- API Key 経路: 公開設定の予定配信のみ取得可能。非公開・限定公開は OAuth 経路でしか取得できません。
- OAuth 経路: アクセストークンは1時間で切れます。期限切れ時は「更新」で再連携を促されます。
- どちらも **過去日付の broadcast は自動除外** されるため、配信中止後に放置された予定や YouTube が自動生成するデフォルトブロードキャストは表示されません。
- クォータ: API Key 経路は 1チャンネル/同期につき約101ユニット消費（1日無料枠1万ユニット → 約99同期/チャンネル/日 = 視聴者向けに十分）。
