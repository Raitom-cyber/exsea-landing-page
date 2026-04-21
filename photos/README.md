# 📸 写真追加ガイド

このフォルダに写真を入れると、サイトに自動で反映されます。
**ファイル名が重要**です。以下のルールに従ってください。

---

## 📁 フォルダ構成

```
photos/
├── hero/       ← ヒーロー画像（メインビジュアル）
├── stock/      ← 各車両の写真
└── staff/      ← スタッフの顔写真
```

---

## 🎯 1. ヒーロー画像（`hero/` フォルダ）

サイト最上部のメインビジュアルです。

| ファイル名 | 内容 | 推奨サイズ |
|---|---|---|
| `hero-featured.jpg` | ページ最上部の注目車両 | 800×600px (4:3) |

**おすすめ:** Harrier Premium のような"見栄えする" 1台のフロント写真

---

## 🚗 2. 在庫写真（`stock/` フォルダ）

各車両カードに写真を表示します。

### ファイル名ルール

`photos/stock/[slug].jpg` 形式で保存してください。以下は各車両のスラグ一覧：

| 車両 | ファイル名 |
|---|---|
| Toyota Hiace Long DX 2019 | `hiace-long-dx.jpg` |
| Toyota Harrier Premium 2019 | `harrier-premium.jpg` |
| Toyota Harrier Elegance 2019 | `harrier-elegance.jpg` |
| Toyota RAV4 Hybrid G 2019 | `rav4-hybrid.jpg` |
| Subaru Forester Advance 2019 | `forester-advance.jpg` |
| Toyota C-HR G Hybrid 2017 | `chr-g-hybrid.jpg` |
| Toyota C-HR S Hybrid 2017 | `chr-s-hybrid.jpg` |
| Corolla Fielder Hybrid 2019 (74k) | `fielder-74k.jpg` |
| Corolla Fielder Hybrid 2019 (130k) | `fielder-130k.jpg` |
| Honda Fit 13G S 2018 | `fit-13g.jpg` |
| Suzuki Swift Hybrid RS 2017 | `swift-hybrid.jpg` |
| Toyota Caldina GT-T 1999 | `caldina-gtt.jpg` |
| Toyota Aqua S Style Black 2018 | `aqua-s-black.jpg` |
| Honda Fit Hybrid F Pkg 2016 | `fit-hybrid-fpkg.jpg` |
| Mitsubishi GTO 1996 | `gto.jpg` |
| Nissan Fairlady Z 1991 | `fairlady-z.jpg` |
| BMW 218i Active Tourer 2016 | `bmw-218i.jpg` |
| Suzuki Swift XG Limited 2017 | `swift-xg.jpg` |
| Nissan March Cabriolet 1998 (89k) | `march-cab-89k.jpg` |
| Mazda Demio 13S 2016 | `demio.jpg` |
| Corolla Fielder X HID 2009 | `fielder-2009.jpg` |
| Toyota Aqua S 2013 | `aqua-2013.jpg` |
| Nissan March Cabriolet 1998 (90k) | `march-cab-90k.jpg` |

### 推奨仕様
- **サイズ**: 横 800px × 縦 450px（16:9）
- **フォーマット**: JPG または WebP
- **容量**: 200KB 以下（サイト速度のため）
- **内容**: 車両の**フロント斜め45度**写真が最も魅力的

### 簡単な写真リサイズ方法

1. exsea.jp の各車両ページから画像を右クリック保存
2. 無料ツールで800×450pxに切り出し：
   - **Windows**: [Paint.NET](https://www.getpaint.net/) 無料
   - **Web**: [squoosh.app](https://squoosh.app/)（インストール不要）
3. 上記ファイル名で `photos/stock/` に保存

---

## 👥 3. スタッフ写真（`staff/` フォルダ）

| ファイル名 | スタッフ名 |
|---|---|
| `tom.jpg` | Tom Tanaka（代表） |
| `marcus.jpg` | Marcus（ベテラン輸出スタッフ） |
| `hakim.jpg` | Hakim |
| `masao.jpg` | Masao |

### 推奨仕様
- **サイズ**: 400×400px（正方形・円型切り抜きに自動対応）
- **内容**: 顔がはっきり写った胸から上のビジネスポートレート
- **背景**: 白またはオフィス背景が好印象

---

## ✨ 写真がない場合

写真がないファイルは、自動でオシャレなSVGグラフィック（現在のデザイン）にフォールバックします。
段階的に写真を追加していけばOKです。

---

## 🔄 写真を追加した後

1. 写真を適切なフォルダ・ファイル名で保存
2. ブラウザで `index.html` を再読み込み（Ctrl+F5で強制リロード）
3. 自動で表示される

**問題がある場合**: ファイル名のスペルミス、大文字小文字（すべて小文字推奨）、拡張子（.jpg推奨）を確認してください。
