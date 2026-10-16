// スライドの HTML を 1 ファイルに組み立てる（CSS / JS も全部埋め込む）

import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { esc } from './highlight.ts'
import { parse } from './markdown.ts'

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i

export interface RenderOptions {
  /** 画像の相対パスの基準（= Markdown のあるディレクトリ） */
  baseDir: string
  /** 出力先ディレクトリ。省略すると画像は file:// URL になる */
  outDir?: string
  /** 追加の CSS（--css） */
  css?: string
}

export interface RenderResult {
  html: string
  /** スライドの枚数 */
  count: number
}

/**
 * 相対パスの画像を、出力先から見たパスに書き換える。
 *   - outDir を渡す → 出力先からの相対パス（HTML 用）
 *   - outDir なし   → file:// の絶対 URL（PDF の一時ファイル用）
 */
function rewriteImages(html: string, baseDir: string, outDir?: string): string {
  return html.replace(/(<img src=")([^"]+)(")/g, (all, pre: string, src: string, post: string) => {
    if (EXTERNAL.test(src) || isAbsolute(src)) return all
    const abs = resolve(baseDir, decodeURI(src))
    const url = outDir ? encodeURI(relative(outDir, abs).split(sep).join('/')) : pathToFileURL(abs).href
    return pre + url + post
  })
}

export function render(md: string, { baseDir, outDir, css = '' }: RenderOptions): RenderResult {
  const { meta, sections } = parse(md)
  const style = readFileSync(join(assets, 'style.css'), 'utf8') + (css ? `\n/* --css */\n${css}` : '')
  const script = readFileSync(join(assets, 'deck.js'), 'utf8')
  const body = rewriteImages(sections.join('\n'), baseDir, outDir)

  const html = `<!doctype html>
<html lang="${esc(meta.lang || 'ja')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title || 'slides')}</title>
${meta.description ? `<meta name="description" content="${esc(meta.description)}">\n` : ''}${meta.author ? `<meta name="author" content="${esc(meta.author)}">\n` : ''}<meta name="generator" content="ippon-slides">
<style>${style}</style>
</head>
<body>
<div id="deck">
${body}
</div>
<div id="overview"></div>
<div id="progress"></div>
<div id="timer"></div>
<div id="counter"></div>
<div id="hint">← → 移動 ・ f フルスクリーン ・ o 一覧</div>
<script>${script}</script>
</body>
</html>
`
  return { html, count: sections.length }
}
