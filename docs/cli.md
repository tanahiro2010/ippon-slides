# CLI リファレンス

```
ippon build <input.md> [options]   スライドをビルドする
ippon <input.md> [options]         build の省略形
ippon serve <input.md> [options]   ローカルで配信し、スマホをリモコンにする
ippon init [file]                  サンプルの Markdown を作る（既定: slide.md）
ippon --help / --version
```

## `build`

| オプション | 意味 |
|---|---|
| `--html` | HTML を出力する（`--pdf` がなければ既定） |
| `--pdf` | PDF を出力する（Chrome / Chromium / Edge が必要） |
| `-o, --output <path>` | 出力先。ディレクトリ指定でその中に `<input>.html` / `.pdf` を作る。`--html --pdf` 両方指定時は拡張子だけ差し替える |
| `-w, --watch` | Markdown と `--css` の変更を監視して再ビルド |
| `--css <file>` | 追加の CSS（[見た目を変える](theming.md)） |
| `--no-fetch` | [`::http::`](http.md) のレスポンスをビルド時に取得しない |
| `--browser-path <path>` | PDF に使うブラウザ（環境変数 `CHROME_PATH` でも可） |

### 出力先の決まり方

- `-o` の末尾が `/`、または既存ディレクトリ → その中に `<input>.html` / `.pdf`。
- `--html` と `--pdf` の両方 → `-o` の拡張子だけ差し替える。
- 省略時 → 入力と同じ場所に同名で出力。

```sh
ippon build slide.md --html
ippon build slide.md --pdf -o dist/
ippon build slide.md --html --pdf -o dist/talk
ippon build slide.md --html -w
```

## `serve`

| オプション | 意味 |
|---|---|
| `-p, --port <n>` | 待ち受けポート（省略時は空きポートを自動選択） |
| `--css <file>` | 追加の CSS |

詳しくは [スマホをリモコンにする](serve.md) を参照してください。

## `init`

```sh
ippon init            # slide.md を作る
ippon init talk.md    # 名前を指定
```

既存のファイルがある場合は上書きせずエラーにします。

## 環境変数

- `CHROME_PATH` … PDF 出力に使うブラウザのパス（`--browser-path` と同じ）。
