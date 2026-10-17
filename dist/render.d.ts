export interface RenderOptions {
    /** 画像の相対パスの基準（= Markdown のあるディレクトリ） */
    baseDir: string;
    /** 出力先ディレクトリ。省略すると画像は file:// URL になる */
    outDir?: string;
    /** 追加の CSS（--css） */
    css?: string;
}
export interface RenderResult {
    html: string;
    /** スライドの枚数 */
    count: number;
}
export declare function render(md: string, { baseDir, outDir, css }: RenderOptions): RenderResult;
