// ::http:: のレスポンスをビルド時に取得して焼き込む。
// Node 側（CORS 無し）で叩くので、ブラウザのライブ再送信と違いどんな API でも取得できる。
import { httpKey } from './markdown.js';
const TIMEOUT = 10_000;
const MAX_BODY = 20_000;
async function fetchOne(spec) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    const t0 = performance.now();
    try {
        const res = await fetch(spec.url, { method: spec.method, signal: ctrl.signal, redirect: 'follow' });
        const text = await res.text();
        const ms = Math.round(performance.now() - t0);
        const headers = [];
        res.headers.forEach((v, k) => headers.push([k, v]));
        return {
            status: res.status,
            statusText: res.statusText,
            ms,
            headers,
            contentType: res.headers.get('content-type') || '',
            body: text.length > MAX_BODY ? text.slice(0, MAX_BODY) : text,
            truncated: text.length > MAX_BODY,
        };
    }
    catch (e) {
        const err = e instanceof Error ? (e.name === 'AbortError' ? `タイムアウト（${TIMEOUT / 1000}s）` : e.message) : String(e);
        return { error: err };
    }
    finally {
        clearTimeout(timer);
    }
}
/** 同じ method+url は 1 回だけ叩き、結果を key → result のマップで返す */
export async function fetchAll(specs) {
    const uniq = new Map();
    for (const s of specs)
        uniq.set(httpKey(s), s);
    const map = new Map();
    await Promise.all([...uniq].map(async ([key, spec]) => {
        map.set(key, await fetchOne(spec));
    }));
    return map;
}
