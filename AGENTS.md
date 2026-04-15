# エージェント向け Git / Pull Request 運用

このリポジトリでコードや履歴を変更するときは、**以下を必ず守る**。詳細は Cursor の `.cursor/rules/git-pr-workflow.mdc` および `CLAUDE.md` のチェックリストと整合している。

## 前提

- `main` は本番相当のブランチとして扱う。
- Git が未初期化・`remote` 未設定などで手順が実行できない場合は、**ユーザーに確認してから**進める。

## 1. ブランチ運用

- 作業開始前に `main` を最新にする（例: `git fetch origin` → `git checkout main` → `git pull origin main`）。
- そこから **作業用ブランチ** を切って変更する（例: `git checkout -b feature/short-description`）。
- ユーザーが **「`main` で直接」「`main` にコミット」などと明示しない限り**、`main` 上でファイルを編集したりコミットしたり **しない**。

## 2. 実装フェーズでの step 単位（ビルドとコミット）

Cursor の **Plan Mode は編集できない**ため、次は **承認済みプランに沿った実装**や **複数ステップに分けた作業**（Agent モードなど）に適用する。

- プランやタスクを **step ごと** に進める。
- **各 step の変更のあと** に `npm run build` を実行し、**成功するまで** その step 内でエラーを直す。
- **その step でビルドが通った時点で** `git commit` する（**step ごとにコミットを分ける**）。

## 3. 作業完了時: Pull Request

- 作業ブランチの変更がまとまったら **Pull Request を作成**する。
- GitHub CLI が使える場合は `gh pr create` を優先する。使えない場合は GitHub の UI から PR を作成する。

## 4. マージ後: remote ブランチの削除

- PR が **マージされたことを確認**したら、GitHub 上の **該当する remote の作業ブランチを削除**する（例: `git push origin --delete <branch-name>`）。

## 5. `main` への直接変更（禁止と例外）

- **具体的な指示がない限り**、`main` を直接書き換えたり、`main` に直接 push したり **しない**。
- どうしても `main` を直接触る必要がある場合は、**事前にユーザーへ確認**し、了承を得てから行う。

## その他

- `main` への取り込みは **PR 経由**をデフォルトとする（コンフリクト解消も PR 上で行う）。
- 緊急 hotfix で `main` を直接触る場合も、**ユーザーが明示した場合のみ**とし、上記の確認・例外ルールに従う。
