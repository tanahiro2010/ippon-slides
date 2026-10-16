# ippon-slides

**1 枚 1 メッセージ** のスライドを Markdown から作る CLI。

- 黒背景・大きな文字・切り替え時のフェードイン
- 出力は CSS / JS まで全部入った **HTML 1 ファイル**（会場がオフラインでも開ける）
- `--pdf` で 16:9 の **PDF** も出せる
- 依存パッケージなし

## 使い方

```sh
npx ippon-slides init                    # サンプルの slide.md を作る
npx ippon-slides build slide.md --html -w # 保存するたびに slide.html を作り直す
npx ippon-slides build slide.md --pdf     # slide.pdf
```

グローバルに入れると `ippon` コマンドとして使えます。

```sh
npm i -g ippon-slides
ippon build slide.md --html --pdf -o dist/
```

### オプション

| オプション | |
|---|---|
| `--html` | HTML を出力する（`--pdf` がなければデフォルト） |
| `--pdf` | PDF を出力する（Chrome / Chromium / Edge が必要） |
| `-o, --output <path>` | 出力先。ディレクトリを指定するとその中に `<input>.html` / `.pdf` を作る。`--html --pdf` を両方指定したときは拡張子だけ差し替える |
| `-w, --watch` | Markdown と `--css` の変更を監視して再ビルドする |
| `--css <file>` | 追加の CSS（色やフォントの上書きなど） |
| `--browser-path <path>` | PDF に使うブラウザ。環境変数 `CHROME_PATH` でも指定できる |

`ippon slide.md` は `ippon build slide.md` の省略形です。

## 書き方

````md
---
title: タイトル
author: 名前
---

::title::

# タイトル

サブタイトル

名前 ・ 日付

---

::center::

1 枚に

1 メッセージ

---

::center size=2 bg=blue::

**大きく**

-# 小さい注釈

---

## 見出しと箇条書き

- **太字** はアクセントカラー
  - ネストもできる

::right::

```ts
const app = new Hono()
!! app.get('/', (c) => c.text('Hello!'))
```
````

| 記法 | |
|---|---|
| `---` | スライドの区切り |
| `::center::` | 1 枚 1 メッセージ（中央寄せの大きな文字） |
| `::title::` | 表紙。最後の段落はページ下に寄る |
| `::wide::` | 左右の余白を詰める（スクリーンショット向け） |
| `::bg=blue::` | 背景色。`blue` / `orange` / `purple` / `red` / `green` / `black` / `white`、または `#rrggbb` |
| `::size=1.5::` | 文字サイズの倍率 |
| `::right::` | ここから右カラム。先頭の見出しはカラムの上に出る |
| `-# 注釈` | 小さい注釈 |
| ` ```hcl ` | コード。`hcl` / `console` / `sh` / `json` / `js` / `ts` をハイライト |
| `!! ` | コードの行頭に付けるとその行を強調 |

指示は `::center bg=blue size=2::` のようにまとめて書けます。
`console` のコードは `$ ` で始まる行をコマンド、`Error` を含む行をエラーとして色分けします。

## 発表中の操作

| キー | |
|---|---|
| `→` / `Space` / 画面右側クリック | 次へ |
| `←` / 画面左側クリック | 前へ |
| `Home` / `End` | 最初 / 最後 |
| `f` | フルスクリーン |
| `o` / `Esc` | スライド一覧 |

表紙から進むと右下でタイマーが動き、表紙に戻るとリセットされます。
URL の `#12` で 12 枚目から開けます。

## 見た目を変える

`--css` で CSS 変数を上書きできます。

```css
:root {
  --slide-accent: #7b42bc;   /* 進捗バー */
  --slide-accent-2: #ff6a00; /* 太字・強調 */
  --slide-display-font: 'Hiragino Sans', sans-serif;
}
```

## ライブラリとして使う

```js
import { render, toPdf } from 'ippon-slides'

const { html } = render(markdown, { baseDir: '.', outDir: 'dist' })
```

型定義（`.d.ts`）も同梱しています。

## 開発

TypeScript で書いています。`src/` が Node 側、`src/client/deck.ts` がブラウザで動くナビゲーションです。

```sh
npm install
npm run build      # dist/ と assets/deck.js を作る
npm run typecheck
npm test           # ビルドしてからテスト（テストの実行には Node 22.18+ が必要）
```

## License

MIT
