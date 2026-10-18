import type { Server } from 'node:http';
export interface ServeOptions {
    port?: number;
    css?: string;
    host?: string;
}
export interface ServeResult {
    server: Server;
    port: number;
    token: string;
    /** 発表者がこの PC で開く URL（トークン付き） */
    deckUrl: string;
    /** スマホで開くリモコン URL（LAN IP ごと、トークン付き） */
    remoteUrls: string[];
    /** 先頭のリモコン URL を表す QR の SVG */
    qrSvg: string;
}
export declare function serve(input: string, opts?: ServeOptions): Promise<ServeResult>;
