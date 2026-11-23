# CLAUDE.md

## コンテキスト保存ルール（必須）
新しいコンテキスト（メモ・議事録・URL・要約・成果物・作業記録など）を保存するとき、
フックで自動投入するときも含め、必ず `_obsidian/速戦ゼミ/rules/コンテキスト保存ルール.md` に従う。

- `context/raw/` 原本（上書き禁止） / `context/web/` Web記事・URL / `context/md/` 人が整理したMarkdown / `context/ai/` AIの要約・下書き
- `output/` 人に渡す成果物 / `logs/` 作業・検査の記録（YYYY-MM-DD.md）/ `rules/` 方針・制約・禁止事項
- Obsidian 形式（frontmatter の tags、`[[リンク]]`、ファイル名 `YYYY-MM-DD_内容`）で書く。
- AIが作ったものは `context/ai/` へ。`context/md/` や `output/` には人の確認後に移す。
