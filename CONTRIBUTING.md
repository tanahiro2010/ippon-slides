# コントリビューションガイド

ippon-slides への貢献を歓迎します 🎉
バグ報告・機能提案・ドキュメント修正・プルリクエスト、どれも大歓迎です。

このドキュメントは開発の流れと守ってほしいルールをまとめたものです。

## 心がけていること

- **ランタイム依存ゼロ**。`typescript` と `@types/node` 以外の依存は追加しません。PDF 出力はローカルの Chrome を直接叩くことで puppeteer を避けています。この方針を崩す変更は原則マージしません。
- **出力は単一 HTML ファイル**（CSS / JS はすべてインライン）。配布しやすさが売りです。
- ユーザー向けのメッセージ・ヘルプ・コメント・コミットメッセージは **日本語** で書きます。

## 開発環境

- Node.js **22.18 以上**（テストは `.ts` ファイルを Node のネイティブ型ストリップで直接実行するため）。
  - 公開パッケージ自体は Node ≥18.17 を対象にしています。
- パッケージマネージャは npm。

```sh
git clone https://github.com/under18dev/ippon-slides.git
cd ippon-slides
npm install
```

## よく使うコマンド

```sh
npm run build       # tsc で src → dist/、src/client → assets/deck.js・remote.js
npm run typecheck   # 型チェックのみ（src + test、および src/client）
npm test            # ビルドしてから node --test test/*.test.ts
node bin/ippon.js build slide.md --html   # CLI を動かす（事前に build が必要）

# 単一テストを名前で絞る
node --test --test-name-pattern="frontmatter" test/markdown.test.ts
```

- `test/cli.test.ts` は `bin/ippon.js`（= `dist/` を import）を起動します。**先に `npm run build` しないと古いコードをテストします**。`test/markdown.test.ts` は `src/` を直接 import するのでビルド不要です。
- `build --pdf` のテストは Chrome / Chromium / Edge が見つからないときスキップされます。`CHROME_PATH` で明示できます。

## 変更を送るまでの流れ

1. Issue を立てる（大きめの変更や方針が絡むものは、着手前に相談してもらえると安心です）。
2. `main` からブランチを切る。
3. 変更して、`npm run typecheck` と `npm test` が通ることを確認する。
4. 必要ならテストを追加・更新する。
5. [Conventional Commits](#コミットメッセージ) に沿ってコミットする。
6. プルリクエストを出す。CI（`typecheck` + `test`、Node 22 / 24）が緑になることを確認してください。

## コーディング規約

TypeScript 周りには少しクセがあります。

- 相対 import は **`.ts` 拡張子** を付けます（例: `import { esc } from './highlight.ts'`）。`rewriteRelativeImportExtensions` が `dist/` で `.js` に書き換えます。
- `erasableSyntaxOnly` が有効なので、型ストリップで消せない構文は使えません（**enum・パラメータプロパティ・namespace は不可**）。
- `strict` と `noUncheckedIndexedAccess` が有効です。正規表現のキャプチャや配列アクセスは `T | undefined` になるため、マッチが保証される箇所では `!` を使います。
- `src/client/deck.ts` と `src/client/remote.ts` は **モジュールではなくブラウザ用スクリプト** です（`moduleDetection: "legacy"`、DOM lib）。`src/client/tsconfig.json` を使い、`assets/deck.js` / `assets/remote.js`（gitignore 済み・生成物）にコンパイルされます。**import / export を足さないでください。**
- `dist/` と `assets/deck.js`・`assets/remote.js` はビルド生成物です。コミットしません。

アーキテクチャの全体像は [`CLAUDE.md`](CLAUDE.md) にまとまっています。パイプラインは
`cli.ts` → `render.ts` → `markdown.ts` → `highlight.ts`、加えて `http.ts` / `pdf.ts` / `serve.ts`（+ `qr.ts`）です。

## コミットメッセージ

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/ja/v1.0.0/) に従います。
`<type>: <日本語の要約>`（任意で scope、破壊的変更は `!`）。

例: `feat: 表の右寄せに対応`、`fix: frontmatter の BOM を正しく取り除く`

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | 挙動を変えない変更 |
| `style` | スライドの見た目（`assets/style.css`）やコード整形 |
| `test` | テストのみ |
| `docs` | README・CLAUDE.md・コメント |
| `chore` | 依存・ビルド・設定 |
| `perf` | パフォーマンス |

- **type ごとに 1 コミット** にします。refactor や fix を feat コミットに混ぜないでください。
- レビュー前に「とりあえず」「WIP」のようなコミットは `git rebase` で squash / fixup してください。
- コミットメッセージや PR に **co-author・generated-with などのトレーラーは付けません**。

## ドキュメントの更新

Markdown 記法や CLI オプションを変えたら、あわせて次も更新してください。

- [`README.md`](README.md) のオプション表・記法表
- [`docs/`](docs/README.md) の該当ページ（[記法](docs/syntax.md) / [CLI](docs/cli.md) など）
- `src/cli.ts` の `HELP` テキスト

`init` が書き出すサンプルデッキ（`cli.ts` の `SAMPLE`）を変えると、CLI テストが期待するスライド枚数（現在 9 枚）がずれます。サンプルを変えたらテストも更新してください。

## リリース（メンテナ向け）

リリースは `v*` タグの push で走ります（`.github/workflows/release.yml`）。

1. `package.json` の version を上げる
2. コミットする
3. `vX.Y.Z` のタグを打つ
4. タグを push する

ワークフローは **タグと `package.json` の version が一致するか検証** し、typecheck → test → `npm publish` → GitHub Release を行います。publish は **Trusted Publishing（OIDC）** を使うためトークン不要ですが、npm 11.5.1 以上が必要です（ワークフローが自前で npm を更新します）。

## ライセンス

貢献いただいたコードは、本プロジェクトの [MIT ライセンス](LICENSE) の下で公開されます。
