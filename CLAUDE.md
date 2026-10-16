# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ippon-slides is a CLI (`ippon`) that turns Markdown into "one message per slide" decks. It outputs a single self-contained HTML file (CSS and JS inlined) and, optionally, a 16:9 PDF. It has **zero runtime dependencies**; only `typescript` and `@types/node` are devDependencies. Keep it that way: PDF output drives a locally installed Chrome directly instead of using puppeteer.

## Commands

```sh
npm run build       # tsc -p tsconfig.build.json (src → dist/) && tsc -p src/client (→ assets/deck.js)
npm run typecheck   # tsc (src + test, noEmit) && tsc -p src/client --noEmit
npm test            # build, then node --test test/*.test.ts
node --test --test-name-pattern="frontmatter" test/markdown.test.ts   # single test
node bin/ippon.js build slide.md --html   # run the CLI (needs a prior build)
```

- Tests are `.ts` files that Node runs directly through native type stripping, so running them needs Node 22.18+. The published package targets Node ≥18.17.
- `test/cli.test.ts` spawns `bin/ippon.js`, which imports `dist/`. Run a build first or those tests will exercise stale code. `test/markdown.test.ts` imports `src/` directly and doesn't need a build.
- The `build --pdf` test is skipped when no Chrome, Chromium, or Edge is found. `CHROME_PATH` overrides the lookup.

## TypeScript setup

- Relative imports use the **`.ts` extension** (`import { esc } from './highlight.ts'`). `rewriteRelativeImportExtensions` turns them into `.js` in `dist/`. Code must stay type-strip compatible because `erasableSyntaxOnly` is on: no enums, no parameter properties, no namespaces.
- `strict` and `noUncheckedIndexedAccess` are on. Regex match groups and array indexing return `T | undefined`, and the code uses `!` where a match guarantees presence.
- `src/client/deck.ts` is a **browser script**, not a module (`moduleDetection: "legacy"`, DOM lib). It is excluded from the main tsconfig and has its own `src/client/tsconfig.json`. It compiles to `assets/deck.js`, which is gitignored and generated. Don't add imports or exports to it.
- `dist/` and `assets/deck.js` are build outputs. `prepack` runs the build before publishing.

## Architecture

Pipeline: `cli.ts` → `render.ts` → `markdown.ts` → `highlight.ts`, plus `pdf.ts` for PDF output.

- **`markdown.ts`** is a hand-written, line-based Markdown subset parser. `parse()` reads the frontmatter (a simple `key: value` subset of YAML). It then splits the body into slides on `---` (ignoring `---` inside code fences) and renders each slide into a `<section class="slide ...">`. It also handles the slide-specific syntax:
  - A first line like `::center bg=blue size=2::` is a directive line. It only counts when every token matches `DIRECTIVES`; otherwise it's a normal paragraph.
  - `::right::` splits the slide into two columns. A leading heading is lifted above the columns.
  - `-# ` marks a small note.
  - `!! ` at the start of a line inside a code block highlights that line.
- **`highlight.ts`** is a per-line regex tokenizer. Each language is a `Rule[]` table and `LANGS` maps aliases to tables. Tokens never span lines. `console` has its own handling: `$ ` lines are commands, `Error` lines are errors. Add a language by adding a rule table and its aliases.
- **`render.ts`** wraps the sections in the HTML template. At runtime it reads `assets/style.css` and `assets/deck.js` via `../assets` relative to the module, a path that works from both `src/` and `dist/`. It also rewrites relative `<img src>` paths:
  - With `outDir` given (HTML output), paths become relative to the output directory.
  - Without `outDir` (PDF output), paths become absolute `file://` URLs, because the PDF is printed from a temporary HTML file.
- **`pdf.ts`** finds a browser in this order: `--browser-path`, then `CHROME_PATH`, then per-platform candidates. It runs `--headless=new --print-to-pdf` with a temporary profile and `--virtual-time-budget` so web fonts have time to load.
- **`cli.ts`** has its own argument parser (`FLAGS` for booleans, `VALUES` for options that take a value) and the output path rules in `outputs()`, covered by tests:
  - An `-o` value ending in `/` or naming an existing directory means "put `<input>.html` / `<input>.pdf` in that directory".
  - With both `--html` and `--pdf`, only the extension of `-o` is replaced.
  - `ippon slide.md` is shorthand for `ippon build slide.md`.
  - `init` writes the `SAMPLE` deck. The CLI test expects it to produce exactly 9 slides, so update the test if you change the sample.
  - Watch mode watches the parent directories, not the files, because some editors save by replacing the file.
- **`assets/style.css`** holds the deck's look. Users override its CSS variables (`--slide-accent`, `--slide-accent-2`, `--slide-display-font`, `--slide-size`) through `--css`. `deck.ts` handles keyboard, click, and swipe navigation, the `#N` URL hash, the overview grid (`o`), and the timer, which starts after leaving the title slide.

## Conventions

- User-facing messages, help text, code comments, and commit messages are in **Japanese**. Match the existing tone, e.g. `✗ ${message}` / `✓ N slides → path`.
- Commit messages start with an Angular-style type prefix: `<type>: <Japanese summary>`. For example: `feat: 表の右寄せに対応`, `fix: frontmatter の BOM を正しく取り除く`.
  - `feat`: new feature
  - `fix`: bug fix
  - `refactor`: change that doesn't alter behaviour
  - `style`: look of the slides (`assets/style.css`) or code formatting
  - `test`: tests only
  - `docs`: README, CLAUDE.md, comments
  - `chore`: dependencies, build and config
  - `perf`: performance
- Make **one commit per type**: don't mix a refactor or a fix into a `feat` commit. Before review, squash or fix up throwaway commits (e.g. 「とりあえず」, "WIP") with `git rebase`.
- When you change Markdown syntax or CLI options, update the tables in README.md and the `HELP` text in `cli.ts` too.
