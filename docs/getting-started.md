# はじめに

## インストール

インストール不要で使えます。

```sh
npx ippon-slides init          # サンプルの slide.md を作る
npx ippon-slides build slide.md --html
```

グローバルに入れる場合:

```sh
npm install -g ippon-slides
ippon init
ippon build slide.md --html
```

- 実行には Node.js **18.17 以上**が必要です。
- PDF 出力には Chrome / Chromium / Edge のいずれかが必要です。

## 基本の流れ

1. `ippon init` でサンプルを作る（または好きな Markdown を用意する）。
2. `---` でスライドを区切り、1 枚に 1 メッセージを書く。
3. `ippon build slide.md --html` で `slide.html` を作る。ブラウザで開けばそのまま発表できる。

```sh
ippon build slide.md --html          # slide.html
ippon build slide.md --pdf           # slide.pdf（要 Chrome）
ippon build slide.md --html --pdf -o dist/talk
ippon build slide.md --html -w       # 保存するたびに作り直す
ippon serve slide.md                 # 配信してスマホをリモコンにする
```

`ippon slide.md` は `ippon build slide.md` の省略形です。

## 次に読む

- 書き方の全体像 → [Markdown 記法](syntax.md)
- 発表中の操作 → [発表者ビューと操作](presenter.md)
- コマンドの詳細 → [CLI リファレンス](cli.md)
