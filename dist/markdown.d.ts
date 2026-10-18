export declare const BG: Record<string, string>;
/** frontmatter（`key: value` だけの簡易 YAML） */
export type Meta = Record<string, string>;
export interface Parsed {
    meta: Meta;
    /** スライドごとの `<section>` */
    sections: string[];
    /** スライドごとの発表者ノート（::note:: 以降の HTML。無ければ ''）。sections と同じ並び */
    notes: string[];
}
export declare function inline(text: string): string;
export declare function blocks(src: string): string;
export declare function splitSlides(md: string): string[];
export declare function slide(src: string): {
    section: string;
    note: string;
};
export declare function frontmatter(md: string): [Meta, string];
/** Markdown 全体 → { meta, sections } */
export declare function parse(md: string): Parsed;
