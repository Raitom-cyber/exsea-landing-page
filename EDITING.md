# EXSEA ランディングページ — 編集ガイド

## ブラウザから直接編集する（おすすめ）

### 手順

1. ブラウザで次の URL を開く:

   ```
   https://raitom-cyber.github.io/exsea-landing-page/?edit=ON
   ```

2. 上部に **「✎ EXSEA 編集モード」** のピンクバーが表示されます。

3. 編集（枠の色）:
   - **🟨 価格（黄点線）**: クリック → USD と **FOB 横のラベル**（「セール」「値引き後」「was $8,000」など）を変更。通貨切替・WhatsApp 内の金額も保存時に HTML が更新されます。
   - **POA カード**: 「✉️ POA」をクリック → 価格入力で在庫表示に変換。
   - **🟪 画像（紫枠）**:
     - 各在庫カードの **サムネ（thumb）** → `photos/stock/...` または `https://...`
     - **ヒーロー右の大きな写真**（.featured-img）
     - **スタッフ顔写真**（丸アイコン）
     - **QR 画像・CTA 内の img**（`src` を変更）
     - 新しいファイルは GitHub リポジトリの同じパスにアップロードしてください（エディタは `index.html` のみ書き換えます）。
   - **🟦 テキスト（青点線）**: ページの **ほぼすべての表示文言** を直接編集できます。
     - ナビ・ヒーロー・Dealer バナー・フィーチャー車情報
     - Nile / 比較 / 柱 / チーム / カテゴリ見出し・説明・統計
     - 各在庫カード: 車名・グレード文・タグ・サムネ上の Make/Model/年式・ボタン文言・バッジ
     - タブ名・通貨ボタン・レビュー・フォーム見出し・フッター など

4. 右上の **「💾 保存」** をクリック

5. 初回のみ GitHub トークン入力が求められます（ブラウザに保存されるので次回以降は不要）:
   - [Generate token](https://github.com/settings/tokens/new?scopes=repo&description=EXSEA%20Editor) で発行
   - `Expiration` は `90 days` 推奨
   - 生成された `ghp_xxx...` をコピーしてダイアログに貼り付け

6. 保存後、GitHub Pages が **1〜2 分** で本番反映します。

### 編集モードの終了

- 右上「終了」ボタン、または URL から `?edit=ON` を外す

### トークンの再設定

- 編集バーの **「🔑 Token」** ボタンから上書き可能

---

## PowerShell からファイル直接編集する場合（バックアップ法）

1. `c:\Users\tom\.cursor\projects\hirakawa-enterprise\06_marketing\landing_page\index.html` をエディタで開く
2. 価格 (`data-price="11975"`) や文章を書き換える
3. 次を実行:

   ```powershell
   cd "c:\Users\tom\.cursor\projects\hirakawa-enterprise\06_marketing\landing_page"
   powershell -ExecutionPolicy Bypass -File .\deploy-github.ps1
   ```

---

## セキュリティ

- `?edit=ON` を付けない限り、通常訪問者には編集機能は **一切** 見えません。
- トークンは **お使いのブラウザの localStorage** にだけ保存されます（サーバーには送られません）。
- トークンは **GitHub リポジトリへの書き込み権限** だけ与えます。他のリポジトリには影響しません。
- 編集履歴は GitHub にすべて残るので、誤編集はいつでもロールバック可能:
  ```
  https://github.com/Raitom-cyber/exsea-landing-page/commits/main
  ```

---

## トラブル

| 症状 | 対処 |
|---|---|
| 「トークンが無効です」 | 🔑 Token から再入力。有効期限切れなら新しいトークンを発行 |
| 「変更を適用できませんでした」 | ソースが外で更新されている。ページ再読込してから再度編集 |
| 保存したが反映されない | GitHub Pages のビルドに 1〜2 分かかります。それでも来ない場合は [Actions](https://github.com/Raitom-cyber/exsea-landing-page/actions) を確認 |
| 編集モードに入れない | URL 末尾が **`?edit=ON`**（全部半角、大文字）になっているか確認 |
