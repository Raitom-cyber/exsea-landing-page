# EXSEA ランディングページ — 編集ガイド

## ブラウザから直接編集する（おすすめ）

### 手順

1. ブラウザで次の URL を開く:

   ```
   https://raitom-cyber.github.io/exsea-landing-page/?edit=ON
   ```

2. 上部に **「✎ EXSEA 編集モード」** のピンクバーが表示されます。

3. 編集:
   - **価格**: 金額をクリック → ダイアログで新しい USD 値を入力 → 「更新」
     - 通貨表示 (NZD/AUD 等) と WhatsApp メッセージの金額も自動更新されます。
   - **POA / 要相談カード** (Skyline R34, Supra MK4, RX-7, S15, DC2, Evo VI など): 「POA」をクリック
     → 価格を入力すると、その POA カードが **自動で在庫車表示 ($X,XXX FOB)** に変換されます。
     再度クリックすれば普通の価格編集として再修正できます。
   - **テキスト**: 次の要素は直接クリックして編集できます
     - ヒーロー見出し
     - 各車両の「車種名」「スペック（色・AT・走行距離など）」
     - カテゴリ説明（SUV / Compact / Classic）
     - 統計数字（1,200 Stock など）
     - レビュー本文

4. 右上の **「💾 保存 & 公開」** をクリック

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
