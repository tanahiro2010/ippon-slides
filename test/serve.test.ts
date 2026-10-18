import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { serve } from '../src/serve.ts'
import type { ServeResult } from '../src/serve.ts'

const dir = mkdtempSync(join(tmpdir(), 'ippon-serve-'))
const md = join(dir, 'd.md')
writeFileSync(md, '# タイトル\n\n本文\n\n::note::\n\nメモA\n\n---\n\n## 2枚目\n\nx\n')

let r: ServeResult
before(async () => {
  r = await serve(md, { port: 0 })
})
after(() => {
  r.server.close()
  rmSync(dir, { recursive: true, force: true })
})

const base = () => `http://localhost:${r.port}`
const get = async (p: string) => {
  const res = await fetch(base() + p)
  return { status: res.status, body: await res.text() }
}

test('トークン無しは 403', async () => {
  assert.equal((await get('/')).status, 403)
  assert.equal((await get('/remote')).status, 403)
  assert.equal((await get('/events')).status, 403)
})

test('/?t= はデッキ HTML に window.__ippon を注入する', async () => {
  const { status, body } = await get('/?t=' + r.token)
  assert.equal(status, 200)
  assert.match(body, /<section class="slide/)
  assert.match(body, /window\.__ippon=/)
  // 注入スクリプトは notes より前（deck.js 実行前）にある
  assert.ok(body.indexOf('window.__ippon=') < body.indexOf('<script id="notes"'))
})

test('/remote?t= はリモコン画面（remote.js + ノート）を返す', async () => {
  const { status, body } = await get('/remote?t=' + r.token)
  assert.equal(status, 200)
  assert.match(body, /__ipponRemote/)
  assert.match(body, /メモA/)
})

test('POST /cmd が SSE 購読者へ配信される', async () => {
  const ac = new AbortController()
  const es = await fetch(base() + '/events?t=' + r.token, { signal: ac.signal })
  const reader = es.body!.getReader()
  const read = (async () => {
    let buf = ''
    for (let i = 0; i < 8; i++) {
      const { value, done } = await reader.read()
      if (done) break
      buf += new TextDecoder().decode(value)
      if (buf.includes('"type":"go"')) break
    }
    return buf
  })()
  await new Promise((res) => setTimeout(res, 50))
  await fetch(base() + '/cmd?t=' + r.token, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'go', n: 1 }),
  })
  const buf = await Promise.race([read, new Promise<string>((res) => setTimeout(() => res(''), 1000))])
  ac.abort()
  assert.match(buf, /"type":"go".*"n":1|"n":1.*"type":"go"/)
})

test('state は保持され、後から繋いだ購読者にも即届く', async () => {
  await fetch(base() + '/cmd?t=' + r.token, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'state', idx: 1, total: 2, elapsed: 5000, running: true }),
  })
  const ac = new AbortController()
  const es = await fetch(base() + '/events?t=' + r.token, { signal: ac.signal })
  const { value } = await es.body!.getReader().read()
  const first = new TextDecoder().decode(value)
  ac.abort()
  assert.match(first, /"idx":1/)
  assert.match(first, /"running":true/)
})
