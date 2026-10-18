import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from '../src/markdown.ts'

test('--- でスライドを分ける（コードブロック内の --- は無視）', () => {
  const { sections } = parse('# a\n\n---\n\n```sh\n---\n```\n\n---\n\nc\n')
  assert.equal(sections.length, 3)
  assert.match(sections[1]!, /<pre data-lang="sh"><code>---<\/code><\/pre>/)
})

test('frontmatter を読む', () => {
  const { meta, sections } = parse('---\ntitle: "タイトル"\nauthor: me\n---\n\n# x\n')
  assert.deepEqual(meta, { title: 'タイトル', author: 'me' })
  assert.equal(sections.length, 1)
})

test('::center bg=blue size=2:: をスライドの指示にする', () => {
  const [s = ''] = parse('::center bg=blue size=2::\n\nhello\n').sections
  assert.match(s, /^<section class="slide center" style="background:#0d76bc;--slide-size:2;">/)
  assert.doesNotMatch(s, /::/)
})

test('bg=white は light クラスも付ける', () => {
  const [s = ''] = parse('::center bg=white::\n\nx\n').sections
  assert.match(s, /class="slide center light"/)
})

test('知らない指示はただの段落', () => {
  const [s = ''] = parse('::nope::\n\nx\n').sections
  assert.match(s, /<p>::nope::<\/p>/)
})

test('::right:: で 2 カラム、先頭の見出しはカラムの外', () => {
  const [s = ''] = parse('## 見出し\n\n- a\n\n::right::\n\nb\n').sections
  assert.match(s, /^<section class="slide"><h2>見出し<\/h2><div class="cols"><div><ul><li>a<\/li><\/ul><\/div><div><p>b<\/p><\/div><\/div>/)
})

test('-# は注釈', () => {
  const [s = ''] = parse('-# small\n').sections
  assert.match(s, /<p class="note">small<\/p>/)
})

test('::note:: 以降は発表者ノート（本番には出ない）', () => {
  const [s = ''] = parse('hello\n\n::note::\n\nメモ\n').sections
  assert.match(s, /<p>hello<\/p><aside class="notes"><p>メモ<\/p><\/aside><\/section>$/)
  assert.doesNotMatch(s, /::/)
})

test('::note:: と ::right:: は共存できる', () => {
  const [s = ''] = parse('- a\n\n::right::\n\nb\n\n::note::\n\nメモ\n').sections
  assert.match(s, /<div class="cols">/)
  assert.match(s, /<aside class="notes"><p>メモ<\/p><\/aside><\/section>$/)
  assert.doesNotMatch(s, /::/)
})

test('入れ子のリスト', () => {
  const [s = ''] = parse('- a\n  - b\n- c\n').sections
  assert.match(s, /<ul><li>a<ul><li>b<\/li><\/ul><\/li><li>c<\/li><\/ul>/)
})

test('表: \\| はセル内の文字、:-- の右寄せ', () => {
  const [s = ''] = parse('| k | v |\n|---|---:|\n| `a\\|b` | 1 |\n').sections
  assert.match(s, /<td><code>a\|b<\/code><\/td><td class="num">1<\/td>/)
})

test('インライン: 太字・コード・リンク・矢印・HTML エスケープ', () => {
  const [s = ''] = parse('**強** `<x>` [l](https://e.x) → <b>\n').sections
  assert.match(s, /<strong>強<\/strong>/)
  assert.match(s, /<code>&lt;x&gt;<\/code>/)
  assert.match(s, /<a href="https:\/\/e.x" target="_blank" rel="noopener">l<\/a>/)
  assert.match(s, /<span class="arrow">→<\/span>/)
  assert.match(s, /&lt;b&gt;/)
})

test('コード: ハイライトと !! 行の強調', () => {
  const [s = ''] = parse('```hcl\nvariable "x" {}\n!! output "y" {}\n```\n').sections
  assert.match(s, /<span class="hl-k">variable<\/span> <span class="hl-s">&quot;x&quot;<\/span>/)
  assert.match(s, /<span class="hl-mark"><span class="hl-k">output<\/span>/)
  assert.doesNotMatch(s, /!!/)
})

test('console: プロンプトとエラー', () => {
  const [s = ''] = parse('```console\n$ terraform apply\nError: boom\n```\n').sections
  assert.match(s, /<span class="hl-prompt">\$ <\/span><span class="hl-cmd">terraform apply<\/span>/)
  assert.match(s, /<span class="hl-err">Error: boom<\/span>/)
  assert.doesNotMatch(s, /data-lang/)
})
