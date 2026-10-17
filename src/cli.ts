import { existsSync, mkdirSync, readFileSync, statSync, watch, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toPdf } from './pdf.ts'
import { render } from './render.ts'

const pkg: { version: string } = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'))

const HELP = `ippon v${pkg.version} — 1 枚 1 メッセージのスライドを Markdown から作る

使い方:
  ippon build <input.md> [options]   スライドをビルドする
  ippon <input.md> [options]         build の省略形
  ippon init [file]                  サンプルの Markdown を作る（デフォルト: slide.md）

build のオプション:
      --html                 HTML を出力する（--pdf がなければデフォルト）
      --pdf                  PDF を出力する（Chrome / Chromium / Edge が必要）
  -o, --output <path>        出力先。--html と --pdf を両方指定したときは拡張子だけ差し替える
                             ディレクトリを指定するとその中に <input>.html / .pdf を作る
  -w, --watch                Markdown と --css の変更を監視して再ビルドする
      --css <file>           追加の CSS（色やフォントの上書きなど）
      --browser-path <path>  PDF に使うブラウザ（環境変数 CHROME_PATH でも可）

  -h, --help                 ヘルプ
  -v, --version              バージョン

例:
  ippon build slide.md --html
  ippon build slide.md --pdf -o dist/
  ippon build slide.md --html --pdf -o dist/talk
  ippon build slide.md --html -w
`

// ---------------------------------------------------------------
// args
// ---------------------------------------------------------------

export interface Options {
  /** 位置引数 */
  _: string[]
  html?: boolean
  pdf?: boolean
  watch?: boolean
  help?: boolean
  version?: boolean
  output?: string
  css?: string
  browserPath?: string
}

type Flag = 'html' | 'pdf' | 'watch' | 'help' | 'version'
type Value = 'output' | 'css' | 'browserPath'

const FLAGS: Record<string, Flag> = { '--html': 'html', '--pdf': 'pdf', '-w': 'watch', '--watch': 'watch', '-h': 'help', '--help': 'help', '-v': 'version', '--version': 'version' }
const VALUES: Record<string, Value> = { '-o': 'output', '--output': 'output', '--css': 'css', '--browser-path': 'browserPath' }

export function parseArgs(argv: string[]): Options {
  const opts: Options = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i]!
    let v: string | undefined
    const eq = a.match(/^(--[^=]+)=(.*)$/)
    if (eq) [, a, v] = eq as [string, string, string]
    const flag = FLAGS[a]
    const value = VALUES[a]
    if (flag) opts[flag] = true
    else if (value) {
      if (v === undefined) v = argv[++i]
      if (v === undefined) throw new Error(`${a} には値が必要です`)
      opts[value] = v
    } else if (a.startsWith('-') && a !== '-') throw new Error(`不明なオプション: ${a}`)
    else opts._.push(a)
  }
  return opts
}

/** 出力先を決める */
export type Format = 'html' | 'pdf'

export function outputs(
  input: string,
  { html, pdf, output }: Pick<Options, 'html' | 'pdf' | 'output'>
): { format: Format; path: string }[] {
  const formats: Format[] = []
  if (html || !pdf) formats.push('html')
  if (pdf) formats.push('pdf')

  const name = basename(input, extname(input))
  let base = '' // 拡張子なしのパス
  let exact: string | null = null // 1 形式だけのときに -o をそのまま使う

  if (!output) base = join(dirname(input), name)
  else if (output.endsWith('/') || output.endsWith('\\') || (existsSync(output) && statSync(output).isDirectory()))
    base = join(output, name)
  else if (formats.length === 1 && extname(output)) exact = output
  else base = extname(output) ? output.slice(0, -extname(output).length) : output

  return formats.map((f) => ({ format: f, path: resolve(exact || `${base}.${f}`) }))
}

// ---------------------------------------------------------------
// build
// ---------------------------------------------------------------

const time = () => new Date().toLocaleTimeString()

async function build(input: string, opts: Options): Promise<void> {
  const md = readFileSync(input, 'utf8')
  const css = opts.css ? readFileSync(opts.css, 'utf8') : ''
  const baseDir = dirname(resolve(input))

  for (const { format, path } of outputs(input, opts)) {
    mkdirSync(dirname(path), { recursive: true })
    if (format === 'html') {
      const { html, count } = render(md, { baseDir, outDir: dirname(path), css })
      writeFileSync(path, html)
      console.log(`${time()} ✓ ${count} slides → ${path}`)
    } else {
      const { html, count } = render(md, { baseDir, css })
      await toPdf(html, path, { browserPath: opts.browserPath })
      console.log(`${time()} ✓ ${count} slides → ${path}`)
    }
  }
}

function watchBuild(input: string, opts: Options): void {
  let timer: NodeJS.Timeout | undefined
  let running = Promise.resolve()
  const rebuild = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      running = running.then(() => build(input, opts)).catch((e: Error) => console.error(`${time()} ✗ ${e.message}`))
    }, 80)
  }
  // エディタによってはファイルを置き換えて保存するので、ディレクトリごと監視する
  const files = [input, opts.css].filter((f) => f !== undefined).map((f) => resolve(f))
  for (const dir of new Set(files.map(dirname))) {
    watch(dir, (_, file) => {
      if (file && files.includes(join(dir, file.toString()))) rebuild()
    })
  }
  console.log(`watching ${files.join(', ')} ...`)
}

// ---------------------------------------------------------------
// init
// ---------------------------------------------------------------

const SAMPLE = `---
title: はじめての ippon
author: あなたの名前
---

::title::

# はじめての ippon

サブタイトル

あなたの名前 ・ 2026-01-01

---

::center::

1 枚に

1 メッセージ

---

::center size=2::

**大きく**

---

::center bg=blue::

背景色も変えられる

-# blue / orange / purple / red / green / black / white、または #rrggbb

---

::center size=1.5 bg=white::

セクション

---

## 箇条書き

- **太字** はアクセントカラーになる
- \`inline code\` も書ける
  - ネストもできる
- 矢印 → は少し薄くなる

---

## 2 カラム

- 左に説明
- 右にコード

::right::

\`\`\`ts
const app = new Hono()
!! app.get('/', (c) => c.text('Hello!'))
\`\`\`

-# 行頭に "!! " を付けるとその行が強調される

---

\`\`\`console
$ npx ippon-slides build slide.md --html --pdf
✓ 9 slides → slide.html
✓ 9 slides → slide.pdf
\`\`\`

---

::title::

# ありがとうございました

あなたの名前
`

function init(file = 'slide.md'): void {
  if (existsSync(file)) throw new Error(`${file} はすでにあります`)
  writeFileSync(file, SAMPLE)
  console.log(`✓ ${file} を作りました → ippon build ${file} --html -w`)
}

// ---------------------------------------------------------------
// main
// ---------------------------------------------------------------

export async function main(argv: string[]): Promise<void> {
  const opts = parseArgs(argv)
  if (opts.version) return console.log(pkg.version)
  const [cmd, ...args] = opts._
  if (opts.help || cmd === undefined) return console.log(HELP)

  let rest = args
  if (cmd === 'init') return init(rest[0])
  if (cmd !== 'build') rest = [cmd, ...rest] // `ippon slide.md` は build の省略形

  const input = rest[0]
  if (!input) throw new Error('入力の Markdown を指定してください（例: ippon build slide.md --html）')
  if (rest.length > 1) throw new Error(`入力は 1 つだけ指定してください: ${rest.join(' ')}`)
  if (!existsSync(input)) throw new Error(`${input} が見つかりません`)

  await build(input, opts)
  if (opts.watch) watchBuild(input, opts)
}
