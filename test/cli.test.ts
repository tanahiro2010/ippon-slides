import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { outputs, parseArgs } from '../src/cli.ts'
import { findBrowser } from '../src/pdf.ts'

const bin = fileURLToPath(new URL('../bin/ippon.js', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'ippon-test-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const run = (...args: string[]) => execFileSync(process.execPath, [bin, ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

test('parseArgs', () => {
  assert.deepEqual(parseArgs(['build', 'a.md', '--pdf', '-o', 'out', '--css=x.css']), {
    _: ['build', 'a.md'],
    pdf: true,
    output: 'out',
    css: 'x.css',
  })
  assert.throws(() => parseArgs(['--nope']), /不明なオプション/)
  assert.throws(() => parseArgs(['-o']), /値が必要/)
})

test('outputs: 出力先の決め方', () => {
  const p = (o: Parameters<typeof outputs>[1]) => outputs('talk/slide.md', o).map((x) => x.path)
  assert.deepEqual(p({}), [resolve('talk/slide.html')])
  assert.deepEqual(p({ pdf: true }), [resolve('talk/slide.pdf')])
  assert.deepEqual(p({ html: true, pdf: true }), [resolve('talk/slide.html'), resolve('talk/slide.pdf')])
  assert.deepEqual(p({ html: true, output: 'dist/index.html' }), [resolve('dist/index.html')])
  assert.deepEqual(p({ pdf: true, output: 'dist/' }), [resolve('dist/slide.pdf')])
  assert.deepEqual(p({ html: true, pdf: true, output: 'dist/talk.pdf' }), [
    resolve('dist/talk.html'),
    resolve('dist/talk.pdf'),
  ])
})

test('init → build --html', () => {
  run('init')
  assert.throws(() => run('init'), /すでにあります/)
  const out = run('build', 'slide.md', '--html')
  assert.match(out, /✓ 9 slides → .*slide\.html/)
  const html = readFileSync(join(dir, 'slide.html'), 'utf8')
  assert.match(html, /<title>はじめての ippon<\/title>/)
  assert.equal(html.match(/<section /g)?.length, 9)
})

test('画像の相対パスは出力先から見たパスに書き換える', () => {
  mkdirSync(join(dir, 'img'), { recursive: true })
  writeFileSync(join(dir, 'img/a.png'), '')
  writeFileSync(join(dir, 'img.md'), '![a](img/a.png)\n\n---\n\n![b](https://e.x/b.png)\n')
  run('img.md', '-o', 'dist/')
  const html = readFileSync(join(dir, 'dist/img.html'), 'utf8')
  assert.match(html, /<img src="..\/img\/a.png"/)
  assert.match(html, /<img src="https:\/\/e.x\/b.png"/)
})

test('--css を埋め込む', () => {
  writeFileSync(join(dir, 'x.css'), ':root { --slide-accent: hotpink; }')
  run('build', 'slide.md', '--css', 'x.css', '-o', 'css.html')
  assert.match(readFileSync(join(dir, 'css.html'), 'utf8'), /--slide-accent: hotpink/)
})

test('存在しない入力はエラー', () => {
  assert.throws(() => run('build', 'none.md'), /none\.md が見つかりません/)
})

test('build --pdf', { skip: !findBrowser() && 'Chrome / Chromium / Edge がない' }, () => {
  run('build', 'slide.md', '--html', '--pdf', '-o', 'dist/both')
  assert.ok(existsSync(join(dir, 'dist/both.html')))
  const pdf = readFileSync(join(dir, 'dist/both.pdf'))
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.equal(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length, 9)
})
