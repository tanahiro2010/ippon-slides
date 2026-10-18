type Grid = number[][];
/** 文字列を QR のモジュール行列（1=暗 / 0=明、quiet zone なし）にする */
export declare function qrMatrix(text: string): Grid;
/** QR を SVG 文字列にする（quiet zone 4 モジュール付き） */
export declare function qrSvg(text: string, scale?: number): string;
/** QR を端末に表示する文字列。1 モジュール = 縦 1 行・横 2 スペース（確実に読めるのを優先） */
export declare function qrTerminal(text: string): string;
export {};
