import assert from 'node:assert/strict'
import { test } from 'node:test'
import { qrMatrix, qrSvg } from '../src/qr.ts'

// jsqr デコーダで round-trip 検証済みの version 1（21x21）ゴールデン。'A' を byte モードで符号化したもの
const GOLDEN_A = [
  '111111101001001111111', '100000101111101000001', '101110100010101011101', '101110101101101011101',
  '101110100111001011101', '100000100101101000001', '111111101010101111111', '000000001101100000000',
  '101101110011101001011', '010110010101111001000', '110011101101000001101', '101101000001001111100',
  '100111100100100100100', '000000001011001001001', '111111101001100101000', '100000101100000110110',
  '101110100110111110001', '101110101111001111110', '101110101010101100000', '100000100010010100101',
  '111111101000010010000',
]

test('QR: ゴールデン一致（A / version 1）', () => {
  const m = qrMatrix('A')
  assert.equal(m.length, 21)
  assert.deepEqual(m.map((r) => r.join('')), GOLDEN_A)
})

test('QR: 文字数でバージョン（サイズ）が上がる', () => {
  assert.equal(qrMatrix('ippon').length, 21) // v1
  assert.equal(qrMatrix('https://example.com/api').length, 25) // v2
  // UUID トークン付きの LAN URL でも version 5（37x37）に収まる
  assert.equal(qrMatrix('http://192.168.1.23:7000/remote?t=3f9a1c2e-1234-5678-9abc-def012345678').length, 37)
})

test('QR: 3 隅のファインダパターンがある', () => {
  const m = qrMatrix('ippon')
  const n = m.length
  const finder = (r0: number, c0: number) =>
    m[r0]![c0] === 1 && m[r0 + 1]![c0 + 1] === 0 && m[r0 + 2]![c0 + 2] === 1 && m[r0 + 3]![c0 + 3] === 1
  assert.ok(finder(0, 0), '左上')
  assert.ok(finder(0, n - 7), '右上')
  assert.ok(finder(n - 7, 0), '左下')
})

test('QR: 同じ入力は毎回同じ行列（マスク選定が決定的）', () => {
  assert.deepEqual(qrMatrix('ippon-slides'), qrMatrix('ippon-slides'))
})

test('QR: 長すぎる入力は例外', () => {
  assert.throws(() => qrMatrix('x'.repeat(300)), /長すぎ/)
})

test('QR: SVG を出力する', () => {
  const svg = qrSvg('ippon')
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.match(svg, /<rect .*fill="#fff"/)
  assert.match(svg, /<path d="M.*" fill="#000"\/>/)
})
