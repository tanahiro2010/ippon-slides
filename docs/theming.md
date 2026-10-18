# 見た目を変える

`--css` で追加の CSS を渡し、CSS 変数を上書きできます。

```sh
ippon build slide.md --html --css theme.css
```

```css
/* theme.css */
:root {
  --slide-accent: #ff6a00;   /* 進捗バー・一覧の枠 */
  --slide-accent-2: #ff6a00; /* 太字・強調 */
  --slide-display-font: 'Hiragino Sans', sans-serif;
  --slide-size: 1;           /* 文字サイズの倍率 */
}
```

## 主な CSS 変数

| 変数 | 用途 |
|---|---|
| `--slide-accent` | 進捗バー、一覧の選択枠などのアクセント |
| `--slide-accent-2` | 太字・強調のアクセント |
| `--slide-display-font` | 見出しのフォント |
| `--slide-size` | 文字サイズの倍率 |

- 見出しは `--slide-display-font`（既定で凸版文久見出しゴシック。未インストール環境では
  本文フォントに落ちる）、本文は Noto Sans JP（Web フォントを読み込み）で表示されます。
- スライドごとの背景色・文字サイズは [`::bg=...::` / `::size=...::` ディレクティブ](syntax.md#ディレクティブ)でも
  指定できます。

`--css` は `ippon serve` でも使えます。
