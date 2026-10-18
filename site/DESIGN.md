# DESIGN.md — ippon site

Design rules for `site/`. Read this before changing the landing page or docs site.
The goal is an on-brand, restrained, editorial page that matches the product (the deck):
**black, one orange, big type, nothing decorative.**

## First principles

- **One message per slide → one idea per screen.** The page mirrors the product's
  philosophy: subtraction over decoration. When in doubt, remove.
- **Spend boldness once.** The hero headline and the single orange primary action are the
  memorable things. Everything else stays quiet (white/grey on black, hairline rules).
- **Structure must inform, not decorate.** Borders, numbers and dividers are allowed only
  when they encode meaning (e.g. the Quick start steps are a real sequence → numbered).
- **No emoji. No decorative icons.** Hierarchy comes from type and space, not pictographs.
- **Hierarchy from type and space**, not from boxes, shadows or color fills.

## Palette (do not introduce new colors)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Page background (true brand black — not a tinted near-black). |
| `--fg` | `#ffffff` | Headings, key text. |
| `--fg-dim` | `#c9c9c9` | Body copy. |
| `--muted` | `#8a8a8a` | Secondary text, captions, nav. |
| `--accent` | `#ff6a00` | The one bold color. Primary button, brand dot, step numbers, the pull-quote rule, link-hover underline. Nothing else. |
| `--line` / `--line-soft` | white @ 14% / 7% | Hairline borders and separators. |

Do **not** use: tinted near-blacks (`#0b0b0d`, `#111`), extra accent colors, gradients, glows,
or filled "card" surfaces.

## Typography

- One family: the system sans (`--font`), with Noto Sans JP for Japanese. Mono (`--mono`)
  for code only.
- Scale is fluid via `clamp()`. Hero `~2.75–5.25rem/800`, H2 `~1.6–2.4rem/700`, body `17px/1.7`.
- Headings use negative letter-spacing (`-0.02em`…`-0.04em`) and `text-wrap: balance`.
- Keep line length under ~68ch (`p { max-width: 68ch }`, ledes narrower).
- Avoid: all-caps labels, eyebrows, and coloring single words. Emphasis is plain bold, sparingly.

## Spacing & layout

- Section rhythm: `clamp(56px, 9vw, 104px)` vertical padding; sections separated by a single
  `--line-soft` top border.
- Content max width `--maxw` (1040px); gutters via `--pad`.
- Two-column blocks use `.cols` and collapse to one column under 760px.

## Motion & accessibility

- Motion only answers an action (hover on buttons/links). No entrance animations, no glows.
- `scroll-behavior: smooth` is gated behind `prefers-reduced-motion: no-preference`.
- Visible `:focus-visible` outline in `--accent`. Maintain contrast (white/#c9c9c9 on black).

## Copy

- Sentence case, active voice, plain verbs, no filler or hype.
- Be concrete and honest (e.g. name the real limitation: "same Wi-Fi", "subject to CORS").

## Domain move (later)

Internal links are relative. When a custom domain is attached, update the absolute URLs only
(`canonical`, `og:url`, `hreflang`, `sitemap.xml`, `robots.txt`) and add `site/CNAME`.
