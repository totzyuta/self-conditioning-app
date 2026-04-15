# Claude Code 向け指示

このリポジトリでは **Git / Pull Request / `main` 保護** について **[AGENTS.md](AGENTS.md) を最優先で遵守**する。内容の正本は `AGENTS.md` である。

## 実装時チェックリスト（必須）

`.cursor/rules/git-pr-workflow.mdc` と同一の MUST である。

1. **ブランチ**: `main` を fetch/pull で最新化してから作業ブランチを作成。ユーザーが「`main` で直接」と明示しない限り、`main` へ直接コミット・編集しない。
2. **step ごと**: 承認済みプランの実装など、step 単位の作業では各 step のあと `npm run build` を実行し、通るまで修正する。その step が緑になったら **その step 用の commit** を切る（step ごとにコミットを分ける）。※ Cursor の Plan Mode 自体は編集不可のため、このルールは実装フェーズに適用する。
3. **PR**: 作業がまとまったら Pull Request を作成（`gh pr create` を優先、不可なら GitHub UI）。
4. **マージ後**: マージを確認したら remote の作業ブランチを削除（例: `git push origin --delete <branch>`）。
5. **`main`**: 本番相当。具体的な指示がない限り **直接書き換えない**。必要な場合は **事前にユーザー確認**。

Git が使えない状態ではユーザーに確認する。
