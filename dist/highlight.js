// コードのハイライト。1 行ずつ処理する（複数行にまたがるトークンは扱わない）。
// 行頭の "!! " はその行の強調マーカー。
export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function tokenize(line, rules) {
    let out = '';
    let rest = line;
    outer: while (rest.length) {
        for (const [re, cls] of rules) {
            const m = rest.match(re);
            if (m && m[0].length) {
                out += cls ? `<span class="${cls}">${esc(m[0])}</span>` : esc(m[0]);
                rest = rest.slice(m[0].length);
                continue outer;
            }
        }
        out += esc(rest[0]);
        rest = rest.slice(1);
    }
    return out;
}
const HCL_KEYWORDS = 'resource|data|variable|module|output|locals|terraform|provisioner|lifecycle|precondition|postcondition|backend|for|in|if|for_each|count|depends_on|when';
const HCL = [
    [/^(#|\/\/).*/, 'hl-c'],
    [/^"(?:[^"\\]|\\.)*"/, 'hl-s'],
    [/^<<-?EOT/, 'hl-s'],
    [/^(?:var|local|module|each|self|path|data)(?=\.)/, 'hl-i'],
    [new RegExp(`^(?:${HCL_KEYWORDS})\\b`), 'hl-k'],
    [/^(?:true|false|null)\b/, 'hl-n'],
    [/^\d+(\.\d+)?\b/, 'hl-n'],
    [/^[a-z_][a-z0-9_]*(?=\()/, 'hl-f'],
    [/^[a-z_][a-z0-9_]*(?=\s*=[^=>])/, 'hl-t'],
    [/^[A-Za-z_][A-Za-z0-9_]*/, null],
];
const SH = [
    [/^#.*/, 'hl-c'],
    [/^"(?:[^"\\]|\\.)*"/, 'hl-s'],
    [/^'[^']*'/, 'hl-s'],
    [/^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/, 'hl-i'],
    [/^(?:if|then|else|elif|fi|for|while|do|done|case|esac|set|echo|exit|export)\b/, 'hl-k'],
    [/^--?[a-z][a-z-]*/, 'hl-t'],
    [/^[A-Za-z_][A-Za-z0-9_]*/, null],
];
const JSON_ = [
    [/^"(?:[^"\\]|\\.)*"(?=\s*:)/, 'hl-t'],
    [/^"(?:[^"\\]|\\.)*"/, 'hl-s'],
    [/^(?:true|false|null)\b/, 'hl-n'],
    [/^-?\d+(\.\d+)?/, 'hl-n'],
];
const JS_KEYWORDS = 'const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|throw|type|interface|as';
const JS = [
    [/^\/\/.*/, 'hl-c'],
    [/^"(?:[^"\\]|\\.)*"/, 'hl-s'],
    [/^'(?:[^'\\]|\\.)*'/, 'hl-s'],
    [/^`(?:[^`\\]|\\.)*`/, 'hl-s'],
    [new RegExp(`^(?:${JS_KEYWORDS})\\b`), 'hl-k'],
    [/^(?:true|false|null|undefined)\b/, 'hl-n'],
    [/^\d+(\.\d+)?\b/, 'hl-n'],
    [/^[A-Za-z_$][\w$]*(?=\()/, 'hl-f'],
    [/^[A-Z][\w$]*/, 'hl-t'],
    [/^[A-Za-z_$][\w$]*/, null],
];
const LANGS = {
    hcl: HCL,
    tf: HCL,
    terraform: HCL,
    sh: SH,
    bash: SH,
    shell: SH,
    zsh: SH,
    json: JSON_,
    js: JS,
    javascript: JS,
    ts: JS,
    typescript: JS,
    jsx: JS,
    tsx: JS,
};
function consoleLine(line) {
    const m = line.match(/^(\$ )(.*)$/);
    if (m)
        return `<span class="hl-prompt">$ </span><span class="hl-cmd">${esc(m[2])}</span>`;
    if (/(^|\s)(Error|panic)\b|^make: \*\*\*/.test(line))
        return `<span class="hl-err">${esc(line)}</span>`;
    if (/^(✅|Apply complete|Destroy complete)/.test(line))
        return `<span class="hl-ok">${esc(line)}</span>`;
    return `<span class="hl-out">${esc(line)}</span>`;
}
export function highlight(code, lang = '') {
    const rules = LANGS[lang.toLowerCase()];
    return code
        .split('\n')
        .map((raw) => {
        const marked = raw.startsWith('!! ');
        const line = marked ? raw.slice(3) : raw;
        let html;
        if (lang === 'console')
            html = consoleLine(line);
        else if (rules)
            html = tokenize(line, rules);
        else
            html = esc(line);
        return marked ? `<span class="hl-mark">${html}</span>` : html;
    })
        .join('\n');
}
