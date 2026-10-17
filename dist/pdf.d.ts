/** --browser-path → CHROME_PATH → よくある場所 の順に探す */
export declare function findBrowser(explicit?: string): string | null;
export interface PdfOptions {
    /** 使うブラウザ。省略すると CHROME_PATH → よくある場所 の順に探す */
    browserPath?: string;
}
/**
 * @param html file:// URL の画像で組み立てた HTML
 * @param out  出力する PDF のパス
 */
export declare function toPdf(html: string, out: string, { browserPath }?: PdfOptions): Promise<void>;
