import type { HttpMap, HttpSpec } from './markdown.ts';
/** 同じ method+url は 1 回だけ叩き、結果を key → result のマップで返す */
export declare function fetchAll(specs: HttpSpec[]): Promise<HttpMap>;
