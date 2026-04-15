# Self Conditioning App — 構造メモ

クライアントは **Vite + React**、永続化は **ブラウザ localStorage（V2 キーのみ）** と **Supabase（`/api/v2/state` 経由）**。v1 の JSON blob API と移行ロジックは **削除済み**（`main` の PR #3）。

## エントリ

- `index.html` → `src/main.jsx`（グローバル CSS）→ `src/App.jsx`

## 主要ディレクトリ

| パス | 役割 |
|------|------|
| `src/pages/` | タブ画面（ダッシュボード / コンディション / トレーニング） |
| `src/seed/` | localhost 用シードデータ |
| `src/styles/` | グローバル CSS |
| `api/v2/state.js` | Vercel Serverless：V2 同期（GET/PUT/DELETE） |
| `api/lib/syncAuth.js` | `SYNC_PASSWORD` + `ALLOWED_SYNC_USERS` + `user_id` クエリ |
| `supabase/` | DB スキーマ・ユーザー seed |
| `public/` | `favicon.svg` 等 |

## 認証

- **画面:** `App.jsx` 内 `LOGIN_ALLOWED`（`PasswordGate`）。本番の許可ユーザーは **サーバー環境変数 `ALLOWED_SYNC_USERS`** と揃える。
- **API:** ヘッダ `x-sync-password`（`SYNC_PASSWORD`）とクエリ `user_id` が一致する必要がある。

## 同期の向き

- ログイン後、`/api/v2/state` GET でリモートを取り込み、日単位の更新は PUT。競合時は 409 と `refetch` パターン。

モジュール化の詳細な分割案は、作業用ブランチのプラン（Cursor プラン）を参照。
