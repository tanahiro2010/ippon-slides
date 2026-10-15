// Markdown → スライドの <section> 群
//
//   ---                       スライドの区切り
//   ::center::                1 行目に置くとスライドの指示（center / title / wide / bg=xxx / size=1.5）
//   ::right::                 ここから右カラム
//   -# 注釈                   小さい注釈
//   ```hcl                    コード（hcl / console / sh / json / js / ts）
//   !! 行                     コードの行を強調（行頭の "!! " は消える）

import { esc, highlight } from './highlight.js'

export const BG = {
  blue: '#0d76bc',
  orange: '#ff6a00',
  purple: '#5c2d91',
  red: '#c0392b',
  green: '#188038',
  black: '#000000',
  white: '#fafafa',
}

const DIRECTIVES = /^(center|title|wide|bg=.+|size=.+)$/

// ---------------------------------------------------------------
// inline
// ---------------------------------------------------------------

export function inline(text) {
  const codes = []
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${esc(c)}</code>`)
    return `\u0000${codes.length - 1}\u0000`
  })
  s = esc(s)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, src, title) =>
    `<img src="${src}" alt="${alt}">` + (title ? `<span class="img-caption">${title}</span>` : '')
  )
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
  s = s.replace(/→/g, '<span class="arrow">→</span>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i])
}

// ---------------------------------------------------------------
// block
// ---------------------------------------------------------------

function list(items) {
  const base = items[0].indent
  const tag = items[0].ordered ? 'ol' : 'ul'
  let html = `<${tag}>`
  let i = 0
  while (i < items.length) {
    const item = items[i++]
    const children = []
    while (i < items.length && items[i].indent > base) children.push(items[i++])
    html += `<li>${inline(item.text)}${children.length ? list(children) : ''}</li>`
  }
  return html + `</${tag}>`
}

function table(rows) {
  // `\|` はセルの区切りではなく文字としての |
  const cells = (r) =>
    r
      .trim()
      .replace(/^\||\|$/g, '')
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, '|'))
  const head = cells(rows[0])
  const align = cells(rows[1]).map((c) => (/:$/.test(c) ? ' class="num"' : ''))
  let html = '<table><thead><tr>'
  head.forEach((c, i) => (html += `<th${align[i] || ''}>${inline(c)}</th>`))
  html += '</tr></thead><tbody>'
  for (const r of rows.slice(2)) {
    html += '<tr>'
    cells(r).forEach((c, i) => (html += `<td${align[i] || ''}>${inline(c)}</td>`))
    html += '</tr>'
  }
  return html + '</tbody></table>'
}

const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/

export function blocks(src) {
  const lines = src.split('\n')
  let html = ''
  let para = []

  const flush = () => {
    if (!para.length) return
    const text = para.join('\n')
    para = []
    if (text.startsWith('-# ')) html += `<p class="note">${inline(text.slice(3)).replace(/\n/g, '<br>')}</p>`
    else html += `<p>${inline(text).replace(/\n/g, '<br>')}</p>`
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const fence = line.match(/^```([\w-]*)\s*$/)
    if (fence) {
      flush()
      const lang = fence[1]
      const body = []
      while (++i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i])
      const attr = lang && lang !== 'console' ? ` data-lang="${esc(lang)}"` : ''
      html += `<pre${attr}><code>${highlight(body.join('\n'), lang)}</code></pre>`
      continue
    }

    if (!line.trim()) {
      flush()
      continue
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flush()
      html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`
      continue
    }

    if (LIST_ITEM.test(line) && !line.startsWith('-# ')) {
      flush()
      const items = []
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        const m = lines[i].match(LIST_ITEM)
        items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] })
        i++
      }
      i--
      html += list(items)
      continue
    }

    if (line.startsWith('|') && /^\|?\s*:?-+/.test(lines[i + 1] || '')) {
      flush()
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
      i--
      html += table(rows)
      continue
    }

    if (line.startsWith('> ')) {
      flush()
      const q = []
      while (i < lines.length && lines[i].startsWith('> ')) q.push(lines[i++].slice(2))
      i--
      html += `<blockquote>${blocks(q.join('\n'))}</blockquote>`
      continue
    }

    para.push(line)
  }
  flush()
  return html
}

// ---------------------------------------------------------------
// slide
// ---------------------------------------------------------------

export function splitSlides(md) {
  const slides = []
  let cur = []
  let inFence = false
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence
    if (!inFence && /^---\s*$/.test(line)) {
      slides.push(cur.join('\n'))
      cur = []
    } else cur.push(line)
  }
  slides.push(cur.join('\n'))
  return slides.filter((s) => s.trim())
}

export function slide(src) {
  const classes = ['slide']
  let style = ''
  let body = src.replace(/^\s+/, '')

  const d = body.match(/^::([^:]+)::[ \t]*(\n|$)/)
  const tokens = d ? d[1].trim().split(/\s+/) : []
  if (d && tokens.every((t) => DIRECTIVES.test(t))) {
    for (const tok of tokens) {
      const bg = tok.match(/^bg=(.+)$/)
      const size = tok.match(/^size=(.+)$/)
      if (bg) {
        style += `background:${esc(BG[bg[1]] || bg[1])};`
        if (bg[1] === 'white') classes.push('light')
      } else if (size) style += `--slide-size:${esc(size[1])};`
      else classes.push(tok)
    }
    body = body.slice(d[0].length)
  }

  let html
  const parts = body.split(/^::right::[ \t]*$/m)
  if (parts.length === 2) {
    // 先頭の見出しはカラムの外（上）に出す
    const head = parts[0].match(/^\s*(#{1,3} .*)\n/)
    const left = head ? parts[0].replace(head[0], '') : parts[0]
    html =
      (head ? blocks(head[1]) : '') +
      `<div class="cols"><div>${blocks(left)}</div><div>${blocks(parts[1])}</div></div>`
  } else {
    html = blocks(body)
  }

  return `<section class="${classes.join(' ')}"${style ? ` style="${style}"` : ''}>${html}</section>`
}

export function frontmatter(md) {
  const m = md.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!m) return [{}, md]
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*?)\s*$/)
    if (kv) meta[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, '$2')
  }
  return [meta, md.slice(m[0].length)]
}

/** Markdown 全体 → { meta, sections } */
export function parse(md) {
  const [meta, body] = frontmatter(md.replace(/\r\n/g, '\n'))
  return { meta, sections: splitSlides(body).map(slide) }
}
