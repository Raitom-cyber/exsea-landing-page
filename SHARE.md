# EXSEA ランディングページ — 共有リンクの作り方

このフォルダを **GitHub Pages** に載せると、`https://あなたのユーザー名.github.io/exsea-landing-page/` のような **共有可能な URL** が得られます。

## 手順（推奨）

1. [GitHub CLI](https://cli.github.com/) をインストール（未導入なら `deploy-github.ps1` が winget で案内します）。
2. PowerShell でこのフォルダに移動し、次を実行:

   ```powershell
   cd "このフォルダのパス"
   powershell -ExecutionPolicy Bypass -File .\deploy-github.ps1
   ```

3. ブラウザで GitHub ログインが求められたら承認。
4. 完了メッセージに表示される **公開 URL** をチームに送る。

## VS Code / Cursor から

- **タスク**: `Deploy EXSEA Landing Page to GitHub Pages` を実行（`Ctrl+Shift+B` でビルドタスク一覧から選択可能な場合あり）。

## 更新のしかた

- `index.html` や `photos/` を編集したあと、**もう一度 `deploy-github.ps1` を実行**するだけです。

## 検索エンジンについて

- `robots.txt` で `Disallow: /` により、通常は検索に載りにくくしています（チーム共有向け）。
- 公開 SEO を強めたい場合は `robots.txt` を削除または内容を変更してください。

## その他の共有方法（参考）

| 方法 | 特徴 |
|------|------|
| **Netlify Drop** | ZIP をドラッグ＆ドロップで即 URL（Git 不要） |
| **Google Drive** | HTML をそのまま公開できないため非推奨 |
| **ローカル LAN** | 同じ Wi‑Fi 内のみ: `python -m http.server 8000` で `http://あなたのPCのIP:8000` |

## トラブル

- **Pages が 404**: リポジトリが **public** か、有料プランで private Pages かを確認。
- **push できない**: `gh auth login` で再ログイン。
