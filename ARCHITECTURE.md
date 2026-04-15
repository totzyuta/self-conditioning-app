# Self Conditioning App — 構造メモ

クライアントは **Vite + React**、永続化は **ブラウザ localStorage（V2 キーのみ）** と **Supabase（`/api/v2/state` 経由）**。v1 の JSON blob API と移行ロジックは **削除済み**（`main` の PR #3）。

## エントリ

- `index.html` → `src/main.jsx`（`src/styles/index.css` を import）→ `src/App.jsx`

## 主要ディレクトリ

| パス | 役割 |
|------|------|
| `src/lib/` | 純関数・API クライアント・セッション・V2 状態ヘルパ（React 非依存） |
| `src/components/auth/` | `PasswordGate` |
| `src/components/charts/` | `SmoothLineChart` |
| `src/components/condition/` | コンディション UI（チャートカード、オーブ、ミニカード等） |
| `src/components/training/` | `TrainingRecordScreen` |
| `src/components/layout/` | ヘッダー+タブ、設定シート、フッター、更新バナー |
| `src/components/ui/` | 小さな共通 UI（`AddBtn`） |
| `src/hooks/` | `useIsMobile`, `useElementWidth` |
| `src/pages/` | タブ画面（ダッシュボード / コンディション / トレーニング） |
| `src/styles/` | `tokens.css` / `base.css` / `animations.css` を `index.css` で束ねる |
| `src/seed/` | localhost 用シードデータ |
| `api/v2/state.js` | Vercel Serverless：V2 同期（GET/PUT/DELETE） |
| `api/lib/syncAuth.js` | `SYNC_PASSWORD` + `ALLOWED_SYNC_USERS` + `user_id` クエリ |
| `supabase/` | DB スキーマ・ユーザー seed |
| `public/` | `favicon.svg` 等 |

## 認証

- **画面:** `src/lib/constants.js` の `LOGIN_ALLOWED` と `components/auth/PasswordGate.jsx`。本番の許可ユーザーは **サーバー環境変数 `ALLOWED_SYNC_USERS`** と揃える。
- **API:** ヘッダ `x-sync-password`（`SYNC_PASSWORD`）とクエリ `user_id` が一致する必要がある。

## 同期の向き

- **ユーザー単位:** セッションは `phl_sync_session_v2`（`lib/session.js`）。V2 ローカル状態は `phl_tracker_v2__{userId}`（`lib/storageV2.js`）。ログイン中の `user_id` と Supabase 行は 1:1。
- ログイン後、`/api/v2/state` GET でリモートを取り込み、日単位の更新は PUT。競合時は 409 と `refetch` パターン。

## 依存の向き（import）

- `src/lib/*` — React を import しない（純関数・fetch・localStorage ラッパ）。
- `src/pages/*` — `components/*` と `lib/*` を参照。アプリ状態は `App.jsx` から props で渡す現状維持。
- `src/components/*` — `lib/*` / `hooks/*` を参照。サーバー用コードは `api/`（リポジトリ直下）と混同しないこと。

## タスク別の参照先（例）

| 変更したいもの | 主に見る場所 |
|----------------|--------------|
| コンディション・チャート UI | `src/components/condition/` |
| トレーニング記録フルスクリーン | `src/components/training/TrainingRecordScreen.jsx` |
| クライアント同期 API 呼び出し | `src/lib/apiV2.js`（サーバー実装は `api/v2/state.js`） |
| 許可ユーザー・バージョン定数 | `src/lib/constants.js` + デプロイ `ALLOWED_SYNC_USERS` / `SYNC_PASSWORD` |
| 表示用フォーマット | `src/lib/format.js` |
