# ciamac · style guide (v2.1 · small-studio lock)

> **Agent notice.** This file is a **draft of the next canonical version**, written ahead of both the repo (`~/Developer/ciamac-brand/STYLEGUIDE.md`, last known at v2.0, commit `991b95c`) and the Notion mirror (v1.4). It was drafted from the v1.4 mirror plus the 2026-04-24 session log; the v2.0 repo text was not at hand. **On merge into `~/Developer/ciamac-brand`, diff against v2.0 before replacing it**, then resync the Notion mirror. Until that merge, the repo remains the source of truth for production work.

**Version:** v2.1 · 2026-06-11 · Los Angeles
**Canonical destination:** `~/Developer/ciamac-brand/STYLEGUIDE.md`
**Status:** wordmark **locked** (Option B — uppercase barless CIAMAC everywhere). Register walked back from v2.0 institutional to **small-studio practice**.

---

**For agents.** One document. Everything an agent needs to understand, apply, or retrofit the ciamac brand. Self-contained. Do not read other files first; other files exist for humans. If this document disagrees with any specific surface, this document wins.

- **Version.** v2.1 · 2026-06-11 · Los Angeles
- **Canonical assets.** `tokens.css` · `semantic.css` · `wordmark/wordmark-v2.svg` (to be cut — see § 02.6) · `favicon.svg` (to be re-cut — see § 02.6)
- **Owner.** Ciamac Parhizi

---

## Quick start for agents

If you just arrived with a task like "apply the ciamac style guide to this page," do these in order:

1. **Find the tokens.** The canonical CSS lives at `~/Developer/ciamac-brand/tokens.css` and `~/Developer/ciamac-brand/semantic.css`. Either `@import` them (adjust path for your deploy), copy their values into the target project's token system, or translate them for the target framework (see § 00.2). Never invent alternate token values.
2. **Ignore the live site.** Do **not** reference the currently deployed CSS at ciamac.com, ciamac-site, or any other live surface as a source of truth. The live site predates this spec and contains deprecated values (the killed yellow `#ffd94d`, the old green `#6a9a8a` as brand accent, the pre-lift Caspian `#556f9e`, inline sizes that don't match this scale, and — as of v2.1 — the lowercase wordmark in site chrome). **This document always overrides the live site.** If you see any of those values in the target page, replace them per § 12.4.
3. **Classify the task.** If the task is "retrofit an existing page," go to § 12. If it is "build a new page," copy `~/Developer/ciamac-brand/page-template.html` and fill the `[[ BRACKETED_SLOTS ]]`. Either way, report per § 12.11.
4. **Ask before inventing.** If you need a value (color, size, spacing, component) not in this document, stop and ask. Do not guess.

## 00.2 For framework-based projects

This spec is written for plain HTML and CSS. When the target project uses a framework, translate rather than force.

**CSS custom properties → any tokens layer.** Every hex, size, and spacing value here is canonical. Map them to the target framework's idiom:

- **React + CSS modules / plain CSS:** `@import 'tokens.css'` works directly.
- **Next.js:** import `tokens.css` in `app/layout.tsx` (or `pages/_app.tsx`) as a global stylesheet.
- **Tailwind:** extend `tailwind.config.js` `theme.extend.colors`, `fontFamily`, `fontSize`, `spacing` with the tokens below. Map to our hex values. Do not use Tailwind's default palette.
- **styled-components / emotion / CSS-in-JS:** define a theme object with our token values; use the provider.
- **Vue / Svelte:** use `<style>` with CSS variables or the framework's scoped CSS pattern.

**HTML structure → framework components.** The component CSS in § 08 is prose-agnostic. Translate:

- `<button class="btn btn-solid">` → `<Button variant="solid">` (React) with the same final CSS.
- `.card` block → `<Card>` component, same styles applied.
- Grid classes → reusable layout primitives (`<Container>`, `<Measure>`, `<Wide>`, `<FullBleed>`).

**What never translates:** the token values themselves. `--accent` is always `#6a83ad`. `--size-body` is always `18px`. `--measure` is always `680px`. These are not up for negotiation.

**Dev server path resolution.** Put `tokens.css` and `semantic.css` in the project's public assets directory (e.g., `/public/brand/`, `/static/brand/`) so paths like `/brand/tokens.css` resolve. Or add them to the project's CSS bundle.

---

## 00 · The practice, in one paragraph

Ciamac Parhizi is a filmmaker based in Los Angeles. Persian-American. His work spans narrative film, commercial creative direction, and image-capture technology (he builds camera products, timelapse systems, Gaussian splat pipelines). One brand covers all of it. Do not split his identity into three crafts. The site ciamac.com is the public shelf of a working studio of one: a **curated personal archive with functional utility** — the work, the tools, and a way to reach him. It is not a portfolio, not a product, not an art piece, not a funnel, and not an institution. Write in first person where it fits; the voice is one person who makes things, not a brand speaking about itself.

---

## 01 · Philosophy · seven principles

Every design decision must serve at least one of these. If none of them apply, the decision is out of scope.

The register is **small-studio practice**: the rigor of a design system, carried in the voice of one person. The closest external analog is Studio Feixen (studiofeixen.ch) — strict systems holding playful, human work — not a museum, not a startup, not a manifesto. v2.0's institutional register ("technical authority") overcorrected; v2.1 keeps its systematic discipline and returns the warmth.

### 01.1 A practice, not a persona

The site documents a working practice. First person where it fits. No corporate "we". No services menu. No self-mythologizing either: the work carries the authority, the prose stays plain. Visitors are guests of the studio, not leads and not an audience.

### 01.2 Systematic, not ornamental

Every visual decision traces to a token, a tier, or a rule in this document. Nothing decorates. If an element can be removed without losing meaning, remove it. The system is what lets one person ship many surfaces without drift.

### 01.3 Every page is a room in the archive

Work is shown, not sold, and is returned to over time. Each piece gets air around it. No thumbnail grids cramming ten things into a viewport. The archive grows; the rooms stay quiet.

### 01.4 The door is always open

Contact is prominent, honest, human. `i@ciamac.com`. No form gating, no captcha, no "let's talk" button in hype tone. A small studio answers its own door.

### 01.5 Quiet, not empty

Negative space carries meaning. Pages reward slowing down. Criterion masthead, not Product Hunt tile. No rollover animations that beg attention.

### 01.6 Film grammar in the web medium

Cuts, dissolves, titles, credits. Pages open and close like shots. Footer is an end card. Nav is a table of contents.

### 01.7 LA light, not Silicon Valley gradient

Dark ink base, warm bone highlights, accents from dusk and photographic paper. No neon. No tech gradients. No saturated startup colors.

### 01.8 What it is not

Not a portfolio. Not a product. Not an art piece. Not a startup. Not a landing page. Not a funnel. Not an institution. Not three crafts in a trenchcoat.

> **Note — the hand.** "The hand is present" was a v1.x principle. It is now a use-case, not a principle: the handwritten signature lives on paper and film only (§ 02.5). The web surfaces carry the typeset mark.

---

## 02 · Wordmark

**Locked 2026-06-11 — Option B.** The mark is uppercase, everywhere, with a barless A. The lowercase-primary direction (v1.x) and the dual-mark system (v2.0) are both retired.

### 02.1 The primary wordmark

```
CIAMAC
```

- Typeface: **Helvetica Neue**
- Weight: **Light (200)**, uniform across all letters
- Case: **UPPERCASE always**
- The two **A**s are **barless** — crossbar removed, counter left open. Historical precedent: the NASA worm (1975). This is the only glyph modification in the mark.
- Letter-spacing: **0.08em** ⚠ *provisional — confirm optically when `wordmark-v2.svg` is cut, then update this line and remove the flag*
- Color: **currentColor**, inheriting from parent

### 02.2 Rules

- One line. Never stack or break.
- Uniform weight. No letter emphasis. No PIVOT, no weighted M.
- The barless A appears only inside the wordmark. Never use it in running text, headings, or labels.
- currentColor only. No arbitrary fills.
- Outline to paths for production deployment.
- Minimum screen size: **48px** rendered height for the display mark; site chrome may run smaller but never below **20px**.
- Minimum print size: **12mm** height.
- Clear space around the wordmark: equivalent to the height of the "C", on all four sides.
- No separator characters, no interpunct. That direction is dead (§ 11.3).

### 02.3 There is no monogram

There is no single-letter mark, no standalone barless-A symbol, no "CIA" nickname mark, no compressed variant. The wordmark is the mark at every size. At 16px favicon, `CIAMAC` compresses hard — roughly 5px per letter. **This is accepted.** Option B trades favicon legibility for a single uncompromised mark. Do not "help" by inventing a symbol.

### 02.4 Case in prose

The uppercase mark is chrome, not language. In running text, the site and domain remain lowercase: "ciamac.com", "the ciamac brand". For formal attribution, legal contexts, and credits: `Ciamac Parhizi` (with capitals). Never set the long form as a wordmark on screen chrome, and never write CIAMAC mid-sentence.

### 02.5 Signature (paper and film only)

The handwritten signature reads `Ciamac Parhizi`. Used on business cards, letterhead, printed editions, film end credits, artist stamps. **NEVER appears on any web surface.** If an agent is working on a web file, do not implement cursive or handwritten rendering.

### 02.6 Source files

- `wordmark/wordmark-v2.svg` — **to be cut.** Uppercase, barless A, currentColor, Helvetica Neue Light 200, uniform weight, outlined to paths. Until it exists, do not ship the old lowercase `wordmark/wordmark.svg` to new surfaces; set the mark live as text with the § 02.1 spec.
- `favicon.svg` — **to be re-cut** from the new mark. 32×32 master, full wordmark scaled, bone on ink.
- `wordmark/wordmark.svg` (lowercase) — deprecated. Move to `archive/` on merge.

---

## 03 · Palette

### 03.1 Core tokens · `tokens.css`

| Token | Hex | Role |
| --- | --- | --- |
| `--ink` | `#0b0b0c` | base background |
| `--ink-2` | `#141419` | elevated surface |
| `--bone` | `#f4f1ea` | primary text, wordmark |
| `--bone-2` | `#bcb8ad` | secondary text, body |
| `--rule` | `#1a1a1d` | dividers, 1px borders |
| `--accent` | `#6a83ad` | Caspian — primary accent |

### 03.2 Reactive token

| Token | Hex | Role |
| --- | --- | --- |
| `--accent-glow` | `#78b4ff` | hover, focus, highlight only. NEVER static |

Sampled from the homepage particle renderer. Caspian is the identity; glow is what Caspian looks like when attention hits it.

### 03.3 Secondary tokens · `semantic.css`

Import only when the page contains forms, status indicators, or tertiary muted text.

| Token | Hex | Role |
| --- | --- | --- |
| `--bone-3` | `#7d8697` | tertiary text |
| `--ok` | `#8fa0b8` | form success |
| `--bad` | `#8a7090` | form error |

**Killed. Do not reintroduce:** `--accent-2`, `--warn`, all earth-tones (eucalyptus, terracotta, rust).

### 03.4 Caspian rationale

Caspian Blue `#6a83ad` is a 1962 Ford Falcon paint code (originally `#556f9e`, lifted to meet WCAG AA at 5.2:1 on `--ink`). The name resonates with the Persian sea honoring Ciamac's heritage. Not a tech blue. Not replaceable.

### 03.5 Contrast table (against `--ink`)

| Foreground | Ratio | WCAG |
| --- | --- | --- |
| `--bone` | 15.8 : 1 | AAA |
| `--bone-2` | 9.7 : 1 | AAA |
| `--bone-3` | 5.4 : 1 | AA |
| `--accent` | 5.2 : 1 | AA |
| `--ok` | 7.1 : 1 | AA |
| `--bad` | 5.3 : 1 | AA |

### 03.6 Forbidden colors

Kill on sight: `#ffd94d` and any bright yellow · tech blues (`#0066ff`, `#4a90e2`, `#3b82f6`) · `#556f9e` (pre-lift Caspian) · neon · gradient fills · rainbow anything.

---

## 04 · Typography

### 04.1 Typefaces · `tokens.css`

| Variable | Stack | Use |
| --- | --- | --- |
| `--face-text` | `'Helvetica Neue', Helvetica, Arial, sans-serif` | primary |
| `--face-mono` | `'SF Mono', ui-monospace, monospace` | labels, metadata |
| `--face-serif` | `'Spectral', 'EB Garamond', Georgia, serif` | book-mode only |
| `--face-hand` | `'Italianno', cursive` | **NEVER for web** |

### 04.2 Type scale · five tiers

| Token | Size | Weight | LH | LS | Role |
| --- | --- | --- | --- | --- | --- |
| `--size-display` | `clamp(72px, 10vw, 144px)` | 100 | 1.0 | -0.04em | hero, film title |
| `--size-h1` | `clamp(40px, 6vw, 88px)` | 200 | 1.05 | -0.025em | page title |
| `--size-h2` | `clamp(26px, 2.8vw, 34px)` | 400 | 1.15 | -0.01em | section |
| `--size-body` | `18px` | 400 | 1.65 | 0 | prose |
| `--size-sm` | `15px` | 400 | 1.6 | 0 | captions, mono labels |

### 04.3 Weight rules

- Display and H1: Thin (100) and Light (200). Never Bold.
- H2: Regular (400). Never Bold.
- Body: Regular (400) default. Medium (500) only for inline emphasis.
- No weight above 500 anywhere in the system.

### 04.4 Mono labels

Mono is a face, not a size tier. At `--size-sm`, letter-spacing 0.12em (0.16em for accent kickers), uppercase. Use for kickers, metadata, timestamps, file paths.

### 04.5 Book mode

Long-form reading: wrap in `<div class="book">`. Swaps to `--face-serif` (Spectral). Body becomes 19px, line-height 1.75.

### 04.6 Text alignment

**Default: flush-left.** Every title, heading, paragraph, caption, metadata block, list, and label aligns to the left edge of its container.

**Never center:** body paragraphs, figure captions, credits, metadata rows, lists, kickers, hero titles on content pages.

**Never justify:** web justification without hyphenation causes rivers.

**Centering is permitted only for:** formal title cards on a dedicated splash page (rare); the homepage particle renderer (exempt anyway); nothing else.

If you inherited a centered layout, reach for `text-align: left` first.

---

## 05 · Grid

### 05.1 Tokens

| Token | Value | Meaning |
| --- | --- | --- |
| `--u` | `8px` | baseline unit |
| `--gutter` | `24px` | column gutter |
| `--measure` | `680px` | body text reading cap |
| `--container` | `1680px` | default page container |
| `--container-wide` | `2400px` | wide modules |
| `--pad-side` | `40px` | desktop side padding |
| `--pad-side-m` | `24px` | mobile side padding |

### 05.2 Container tiers

| Class | Max width | Use for |
| --- | --- | --- |
| `.measure` | 680px | body paragraphs (always) |
| `.container` | 1680px | default page chrome, UI |
| `.container-wide` | 2400px | timelines, media grids, data modules |
| `.full-bleed` | 100vw | hero video, immersive modules |

Body paragraphs always use `.measure` even when nested in wider containers. Nav and end-card always use `.container`. Film hero: `.full-bleed` for video, `.container` for title/metadata.

### 05.3 Above the fold

Every page must answer **"what is this?"** within the first visible viewport (≥900px desktop, ≥667px mobile).

**Subject block:**

1. **Kicker** — `.kicker` class · 1–4 words · names page type.
2. **Title** — H1 · the page's literal name.
3. **Lead** — body, 1–2 sentences. Wrapped in `.measure`.
4. **Minimum meta** — mono, only when essential. 3–4 items max.

**Not above the fold:** site wordmark chrome, secondary nav, long body, credits, related works, "scroll down" prompts.

**Hero media.** Above the title only if the media IS the subject. Otherwise title first, media below.

**3-second test.** A visitor on a 900px viewport must identify the page in 3 seconds.

| Failure | Fix |
| --- | --- |
| Site mark or nav takes 40%+ of first viewport | Shrink nav padding |
| Decorative hero image precedes title | Move below title, or remove |
| Title buried under filter chrome | Move filters below the fold |
| Kicker missing | Add 1–4 word page-type label |
| Lead is long prose | Collapse to 1–2 sentences |

### 05.4 Spacing scale

| Token | Value |
| --- | --- |
| `--space-1` | 8px |
| `--space-2` | 16px |
| `--space-3` | 24px |
| `--space-5` | 40px |
| `--space-8` | 64px |
| `--space-12` | 96px |
| `--space-18` | 144px |

### 05.5 Layout rules

- Desktop (≥820px): 12 columns, 24px gutters, column width scales with container.
- Mobile (<820px): 4 columns, 24px side padding.
- All container tiers collapse to mobile width under 820px.

---

## 06 · Motion

Film grammar. All durations pair with `--ease: cubic-bezier(0.4, 0, 0.2, 1)`.

### 06.1 Tokens

| Token | Duration | Use |
| --- | --- | --- |
| `--cut` | 0ms | instant state swap |
| `--dissolve` | 160ms | link hover, focus, color |
| `--crossfade` | 240ms | panel swap, tab change |
| `--reveal` | 400ms | page title entrance |

**No bounce. No spring. No stagger. No parallax.**

### 06.2 Reduced motion

`tokens.css` ships with a `@media (prefers-reduced-motion: reduce)` override that collapses every motion duration to 0ms.

Component-level requirements:

- **Autoplay video** must check `matchMedia('(prefers-reduced-motion: reduce)').matches` and stay paused for those users.
- **The homepage particle renderer** must honor the preference (render a static frame).
- **Scroll-triggered effects** are banned regardless; no exemptions.

---

## 07 · Accessibility

Accessibility is required, not optional.

### 07.1 Contrast

Covered in § 03.5. All body text at `--bone` on `--ink` is AAA. All interactive text passes AA.

### 07.2 Focus states

Every interactive element requires a visible focus state. `tokens.css` provides universal `:focus-visible` rules:

- Width: 2px
- Color: `--accent-glow` (`#78b4ff`)
- Offset: 2px
- Applied to: `a`, `button`, `[role="button"]`, `input`, `textarea`, `select`, `[tabindex]`

**Never remove the focus outline without replacing it.** `outline: none` on its own is a defect.

### 07.3 Keyboard navigation

- **Tab order follows DOM order.**
- **Skip link required** on every page. Use `.skip-link` utility. First element inside `<body>`.
- **Modal dialogs:** focus trap when open; restore focus to trigger on close.
- **Dropdown menus:** arrow keys; Escape closes.
- **Every button reachable via Tab** and activatable with Enter or Space.

```html
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <header>...</header>
  <main id="main" tabindex="-1">...</main>
</body>
```

### 07.4 Semantic HTML

- `<button>` for buttons. Never `<div onclick>`.
- `<a href>` only with a real destination. Otherwise `<button>`.
- Use `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`, `<figure>`, `<figcaption>`.
- Headings in order: one `<h1>` per page; `<h2>` for sections; `<h3>` for subsections. Never skip levels for styling.

### 07.5 Images and media

- Every `<img>` requires an `alt` attribute. Decorative: `alt=""`.
- Figures: `<figure><img alt="..."><figcaption>...</figcaption></figure>`.
- SVG icons: `role="img"` + `aria-label` if meaningful; `aria-hidden="true"` if decorative.
- Video with dialogue requires `.vtt` captions.
- Autoplay videos muted, looped, respect reduced motion.

### 07.6 ARIA

Prefer semantic HTML first. Use ARIA only where semantics fail:

- `aria-label` on icon-only buttons.
- `aria-current="page"` on the active nav link.
- `aria-live="polite"` on form-error containers.
- `aria-expanded` on disclosure triggers.
- Never use ARIA to reinvent behavior a real element already provides.

### 07.7 Reading ergonomics

- Body text at 18px `--bone` on `--ink` (AAA contrast).
- Line length capped at `.measure` (680px).
- Flush-left only. No justification.
- Line-height 1.65 on body.

### 07.8 Screen reader-only

Use `.sr-only` for text that must be available to AT but hidden visually.

---

## 08 · Components (reference CSS)

### 08.1 Link

Shipped with `tokens.css`. Never re-declare the `a` rule.

### 08.2 Button

```css
.btn {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  font-family: var(--face-text);
  font-size: var(--size-sm);
  font-weight: 400;
  letter-spacing: 0.04em;
  line-height: 1;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--bone);
  transition: color var(--dissolve) var(--ease),
              background-color var(--dissolve) var(--ease),
              border-color var(--dissolve) var(--ease);
}
.btn:hover { border-color: var(--accent-glow); color: var(--accent-glow); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

.btn-solid { background: var(--accent); color: var(--ink); border-color: var(--accent); }
.btn-solid:hover { background: var(--accent-glow); border-color: var(--accent-glow); color: var(--ink); }

.btn-ghost { border-color: var(--rule); color: var(--bone-2); }
.btn-ghost:hover { border-color: var(--bone-2); color: var(--bone); }
```

### 08.3 Card

```css
.card {
  background: var(--ink-2);
  border: 1px solid var(--rule);
  padding: var(--space-5);
}
.card-emphasis {
  border-left: 2px solid var(--accent);
  padding-left: calc(var(--space-5) - 2px);
}
.card .kicker { font-family: var(--face-mono); font-size: var(--size-sm); letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: var(--space-2); }
.card h3 { font-size: 17px; font-weight: 500; color: var(--bone); margin-bottom: var(--space-2); }
.card p { font-size: var(--size-sm); color: var(--bone-2); line-height: 1.6; }
```

### 08.4 Divider

```css
hr { border: 0; border-top: 1px solid var(--rule); }
.divider-labeled { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-8) 0 var(--space-5); }
.divider-labeled .lbl { font-family: var(--face-mono); font-size: var(--size-sm); letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }
.divider-labeled .line { flex: 1; height: 1px; background: var(--rule); }
```

### 08.5 Back link

```css
.back-link {
  color: var(--bone-2);
  text-decoration: none;
  font-size: var(--size-sm);
  transition: color var(--dissolve) var(--ease);
}
.back-link:hover { color: var(--bone); }
```

No underline. Back is restrained; forward gets the emphasis.

### 08.6 Kicker

```css
.kicker {
  font-family: var(--face-mono);
  font-size: var(--size-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: var(--space-2);
}
```

### 08.7 Gallery tile

```css
.tile { display: block; color: inherit; text-decoration: none; background: var(--ink-2); border: 1px solid var(--rule); transition: transform var(--dissolve) var(--ease); }
.tile:hover { transform: translateY(-2px); }
.tile:hover h3 { color: var(--accent-glow); }
.tile-thumb { aspect-ratio: 16 / 9; background: var(--ink); overflow: hidden; }
.tile-thumb img, .tile-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
.tile-meta { padding: var(--space-3); }
.tile-meta h3 { font-size: 18px; font-weight: 400; color: var(--bone); transition: color var(--dissolve) var(--ease); letter-spacing: -0.01em; line-height: 1.3; }
```

Variants by content: film (video thumb), technical writeup (still image), blog (no thumb, accent-left border).

### 08.8 Top bar nav

```css
.top-bar { padding: var(--space-3) 0; border-bottom: 1px solid var(--rule); position: sticky; top: 0; z-index: 10; background: rgba(11, 11, 12, 0.92); backdrop-filter: blur(10px); }
.top-bar .inner { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: var(--gutter); align-items: baseline; }
.top-bar .nav-links a { font-family: var(--face-mono); font-size: var(--size-sm); letter-spacing: 0.12em; text-transform: uppercase; color: var(--bone-2); text-decoration: none; }
.top-bar .nav-links a:hover, .top-bar .nav-links a[aria-current="page"] { color: var(--accent); }
```

The wordmark in the top bar is the uppercase mark per § 02. It sits flush-left in the grid, rendered as text (or `wordmark-v2.svg` once cut), `--bone` at rest.

---

## 09 · Patterns

### 09.1 Forms

Semantic structure with always-visible labels and live-region errors.

```html
<form class="form" novalidate>
  <div class="field">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required autocomplete="email">
    <div class="field-error" id="email-error" aria-live="polite"></div>
  </div>
  <div class="field">
    <label for="message">Message</label>
    <textarea id="message" name="message" rows="6" required></textarea>
  </div>
  <button type="submit" class="btn btn-solid">send</button>
</form>
```

```css
.form { max-width: var(--measure); }
.field { margin-bottom: var(--space-3); }
.field label { display: block; font-family: var(--face-mono); font-size: var(--size-sm); color: var(--bone-2); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: var(--space-1); }
.field input, .field textarea, .field select { display: block; width: 100%; background: var(--ink-2); border: 1px solid var(--rule); color: var(--bone); padding: var(--space-2); font-family: var(--face-text); font-size: var(--size-body); line-height: 1.5; transition: border-color var(--dissolve) var(--ease); }
.field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--accent-glow); box-shadow: 0 0 0 3px rgba(120, 180, 255, 0.15); }
.field input:invalid:not(:placeholder-shown) { border-color: var(--bad); }
.field-error { font-size: var(--size-sm); color: var(--bad); margin-top: var(--space-1); min-height: 1.5em; }
```

Always-visible label (no placeholder-only labels). Submit button uses `.btn-solid`. Error text uses `aria-live="polite"`.

### 09.2 Images

- `alt` attribute on every `<img>`. Decorative: `alt=""`.
- `width`/`height` attributes or `aspect-ratio` wrapper to prevent CLS.
- `loading="lazy"` below the fold, `loading="eager"` above.
- `fetchpriority="high"` on LCP candidate.

Formats: AVIF primary with WebP fallback and JPEG baseline via `<picture>`. SVG for icons and diagrams. PNG only when alpha required. No GIF.

Aspect ratios: 16:9 for video thumbnails and stills; 3:2 for photography; 1:1 for portraits (rare). Let content dictate.

### 09.3 Video

- Explicit `width`, `height`, `poster`.
- Background/hero: `muted autoplay loop playsinline`. Always muted.
- Respect `prefers-reduced-motion`: pause autoplay.
- `.vtt` captions for any video with dialogue.

### 09.4 States

**Loading.** No spinners. No bouncing dots. No shimmer. Static skeleton blocks (`--ink-2`) or linear progress bar. Prefer making pages fast enough that loading states are rare.

**Empty.** Name the empty state. Do not fake content.

**404.**

```
kicker   404 · NOT FOUND
title    This isn't the way.
lead     The page you're looking for moved or never existed.
action   back to /
```

**500.**

```
kicker   500 · SOMETHING BROKE
title    Give it a moment.
lead     Something on our end hiccuped. Try again.
action   retry · mailto:i@ciamac.com
```

**Offline (PWA).**

```
kicker   OFFLINE
title    No signal.
lead     You're not connected.
```

All error pages use the default template. No illustrations. No humor that ages badly. Contact email visible.

### 09.5 Credits

Multi-author attribution:

```html
<div class="credits">
  <div class="credits-primary">Ciamac Parhizi</div>
  <div class="credits-secondary">with Donald · SnakePharm</div>
  <div class="credits-secondary">for Luiz · IDT</div>
</div>
```

```css
.credits { max-width: var(--measure); margin-top: var(--space-12); padding-top: var(--space-5); border-top: 1px solid var(--rule); }
.credits-primary { font-size: var(--size-body); color: var(--bone); margin-bottom: 6px; }
.credits-secondary { font-size: var(--size-sm); color: var(--bone-2); line-height: 1.8; }
```

---

## 10 · Operational

### 10.1 Performance budget

- **LCP** < 2.0s on simulated 3G
- **FID / INP** < 100ms
- **CLS** < 0.1
- **TTFB** < 600ms
- **JS bundle** (initial) < 80KB compressed
- **CSS** (tokens + semantic + page) < 30KB compressed
- **Images** AVIF-compressed, no image > 500KB

Homepage particle renderer exempt from JS budget; defer non-critical work via `requestIdleCallback`.

### 10.2 SEO and social metadata

Every page `<head>` requires:

```html
<title>[Page title] · ciamac</title>
<meta name="description" content="[140-155 char summary]">
<link rel="canonical" href="https://ciamac.com/[path]">
<meta property="og:title" content="[Page title]">
<meta property="og:description" content="[Summary]">
<meta property="og:image" content="https://ciamac.com/og/[page].jpg">
<meta property="og:url" content="https://ciamac.com/[path]">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Page title]">
<meta name="twitter:description" content="[Summary]">
<meta name="twitter:image" content="https://ciamac.com/og/[page].jpg">
```

The `<title>` suffix stays lowercase `· ciamac` — it is prose, not the mark (§ 02.4).

**OG image:** 1200×630. Dark (`--ink`) background. Uppercase wordmark top-left at ~100px. Page title in H1 scale, flush-left. Kicker above title. No decoration. JPEG 85%.

### 10.3 Print stylesheet

```css
@media print {
  * { background: white !important; color: black !important; }
  body { font-size: 11pt; line-height: 1.55; }
  .top-bar, .end-card, nav, .full-bleed video, .skip-link, .no-print { display: none !important; }
  a { color: black !important; text-decoration: underline; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #444; }
  h1, h2, h3 { page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  .measure, .container, .container-wide { max-width: 100% !important; padding: 0 !important; }
  figure, img, table { page-break-inside: avoid; }
}
```

Printed output inverts identity: ink on paper. Handwritten signature is the only cursive allowed, applied physically after printing.

### 10.4 Internationalization

Current state: **English-only, LTR-only.**

Persian heritage is structural (Spectral serif for book-mode) not linguistic.

Future (when Farsi/Arabic content exists):

- `<html lang="fa" dir="rtl">`
- Swap `--face-serif` to Spectral's Arabic sibling
- Convert to logical properties (`margin-inline-start`, etc.)
- Mirror layout

Do not ship bilingual toggles speculatively.

### 10.5 Typeface licensing

**Helvetica Neue is proprietary.** Without a web font license, production falls back: `Helvetica → Arial → sans-serif`. The brand accepts this as an intentional downgrade on non-Mac devices.

Strict-compliance paths:

1. Buy Monotype web font license (~$35/month).
2. Swap to open-source Helvetica alternate — **Inter** (recommended), Work Sans, or paid-but-closer Söhne.

When traffic becomes real, evaluate Inter as production primary.

Note for the v2.1 mark: the barless A is cut at the SVG level (outlined paths), so the wordmark asset is license-independent. Only running text depends on the fallback stack.

### 10.6 Analytics and privacy

No cookie banners (no cookies requiring consent). If analytics added later, use server-side cookieless tool (Plausible, Fathom, Simple Analytics). Never Google Analytics or Facebook Pixel.

---

## 11 · Heritage

Five identity moves in `heritage.md`.

### 11.1 Persian, structurally

`--face-serif` (Spectral) on long-form via `.book`. Structural acknowledgment of Persian modernism (Reza Abedini, Morteza Momayez), not linguistic.

### 11.2 Homepage feeds the system

Particle renderer's `rgba(120, 180, 255)` became `--accent-glow #78b4ff`. Caspian is identity; glow is reactive attention.

### 11.3 The negative brief

The 34 prior uppercase `CIAMAC` iterations with **interpunct separators** and the rejected **PIVOT weighted-m** direction are dead. Archived in `archive/`. The v2.1 uppercase mark is not their revival: no separators, uniform weight, and the barless A. What died was the ornamentation, not the case. Also dead: the v1.x lowercase-primary mark and the v2.0 dual-mark system (uppercase display + lowercase operational) — superseded by the single mark, § 02.

### 11.4 The barless A

NASA worm (1975) is the precedent: remove a stroke the eye can supply, and the mark becomes proprietary without becoming decorated. One modification, applied twice, in one mark. Studio Feixen (studiofeixen.ch) is the register analog — systematic discipline carrying personal work — not a visual source.

### 11.5 Credits pattern

See § 09.5.

---

## 12 · Retrofit rules for agents

### 12.1 Input

A file path or directory.

### 12.2 Output

A new versioned file. Never overwrite. `file_v4.html → file_v5.html`. No suffix: `file.html → file_v2.html`. Plus a report (§ 12.11).

### 12.3 The rule of three

1. If the transformation is in the tables below, apply it.
2. If not in the tables, **flag for review**. Do not guess.
3. If file is in do-not-touch list (§ 14), skip and report.

### 12.4 Color hex → token map

**Core:**

| Old hex | New |
| --- | --- |
| `#000`, `#000000`, `#0a0a0a`, `#0b0b0c`, `#0d0d0d`, `#111` | `var(--ink)` |
| `#1a1a1a`, `#141414`, `#141419`, `#181818` | `var(--ink-2)` |
| `#fff`, `#ffffff`, `#f5f5f5`, `#f0f0f0`, `#f4f1ea` | `var(--bone)` |
| `#d4d4d4`, `#bcbcbc`, `#bcb8ad`, `#c8c8c8` | `var(--bone-2)` |
| `#1a1a1d`, `#222`, `#2a2a2e`, `#333` (as border) | `var(--rule)` |

**Accent:**

| Old hex | Role | New |
| --- | --- | --- |
| `#ffd94d` | killed yellow | `var(--accent)` |
| `#6a9a8a` as brand accent | Cyril primary | `var(--accent)` |
| `#6a9a8a` as success | semantic | keep in Cyril; new work uses `var(--ok)` |
| Tech blues (`#0066ff`, `#4a90e2`, `#3b82f6`) | tech | `var(--accent)` |
| `#556f9e` | pre-lift Caspian | `var(--accent)` |

**Tertiary (requires `semantic.css`):**

| Old hex | New |
| --- | --- |
| `#6a6a66`, `#8a867d`, `#888`, `#999`, `#9a968c` | `var(--bone-3)` |

### 12.5 Font stack → token map

| Old | New |
| --- | --- |
| `-apple-system, BlinkMacSystemFont, 'SF Pro', ...` | `var(--face-text)` |
| `'Helvetica Neue', ...` | `var(--face-text)` |
| `'SF Mono', monospace` / Menlo / Monaco / Courier | `var(--face-mono)` |
| Georgia / Times (as body) | **flag** — may be book-mode |
| Roboto / Open Sans / Lato / Montserrat | `var(--face-text)` • remove Google Font import |

Preserve Google Font imports only for **Spectral** and **Italianno**.

### 12.6 Type scale → token map

| Old | New |
| --- | --- |
| Hero (>3em, >56px) | `var(--size-display)` |
| Page title (2.2–3em) | `var(--size-h1)` |
| Section heading (1.4–1.8em) | `var(--size-h2)` |
| Body (1em, 16–18px) | `var(--size-body)` |
| Caption (0.85–0.95em) | `var(--size-sm)` |
| Kicker (uppercase tracked) | `.kicker` class |

**Weight during retrofit:** 700+ on hero → 200 (H1) or 100 (display). 500–700 on H2 → 400. Body 500+ → 400 unless inline emphasis.

### 12.6b Wordmark during retrofit

Any lowercase `ciamac` rendered as **site chrome** (top bar, footer end-card, splash) converts to the uppercase mark per § 02. Lowercase occurrences in running prose, URLs, and `<title>` suffixes stay lowercase (§ 02.4). The barless A only enters via the cut SVG — never fake it with CSS or font tricks; until `wordmark-v2.svg` exists, set chrome as plain uppercase text and **flag** it in the report.

### 12.7 Spacing → token map

| Old px | New |
| --- | --- |
| 4–8 | `var(--space-1)` |
| 12–18 | `var(--space-2)` |
| 20–28 | `var(--space-3)` |
| 32–48 | `var(--space-5)` |
| 56–72 | `var(--space-8)` |
| 88–112 | `var(--space-12)` |
| 128+ | `var(--space-18)` |

### 12.8 Container tier assignment

| Legacy | New |
| --- | --- |
| Page wrapper | `.container` |
| Body paragraph blocks | wrap in `.measure` |
| Gallery grid / timeline / data module | `.container-wide` |
| Hero video / full-width media | `.full-bleed` |

### 12.9 Structural checks

- Flag `text-align: center` on anything except formal title cards (§ 04.6).
- Flag missing `alt` on images.
- Flag missing focus-visible styles on custom interactive elements.
- Flag missing skip link.
- Flag autoplay videos that don't respect `prefers-reduced-motion`.
- Add `@import url('tokens.css')` if missing. Add `@import url('semantic.css')` if tertiary tokens used.

### 12.9b Do not reference the live site

Agents working on retrofits sometimes open `ciamac.com`, `/work.html`, or other deployed surfaces and use their CSS as a source of truth. **This is wrong.** The live site predates this spec and is queued for migration itself. If a value on the live site conflicts with this document, the live site is wrong. Replace it.

Specific deprecated values commonly found in legacy pages (all must be replaced — see § 12.4):

- `#ffd94d` (the killed yellow)
- `#6a9a8a` used as brand accent (was Cyril's primary; in new work use `var(--accent)`)
- `#556f9e` (pre-lift Caspian, failed AA)
- `max-width: 720px` or `800px` as page wrapper (use `.container` `1680px` or `.measure` `680px` depending on role)
- Inline `font-size: 32px` etc. (use the scale in § 04.2)
- `letter-spacing: 4px uppercase` on H2 (use mono kickers instead, or H2 with letter-spacing -0.01em)
- lowercase `ciamac` wordmark in site chrome (convert per § 12.6b)

### 12.11 Output report format

```
MIGRATION REPORT · <original path>

TRANSFORMATIONS APPLIED
- <n> color replacements
- <n> font-family replacements
- <n> type-scale replacements
- <n> spacing replacements
- <n> container tier assignments
- <n> accessibility additions (focus, skip link, alt text, ARIA)
- <n> structural updates

AMBIGUITIES FLAGGED (require human review)
- line <n>: <description>

PRESERVED
- <brief note on structural elements kept>

OUTPUT
<new file path>
```

If zero ambiguities: `AMBIGUITIES FLAGGED: none`.

---

## 13 · Verification checklist

Open original and migrated files side-by-side. Confirm:

1. Layout intact. No collapsed sections. No overflow.
2. Accent reads as Caspian blue `#6a83ad`.
3. Body text comfortable at 18px bone on ink.
4. Body text sits in `.measure` even on wide monitors.
5. Wide modules use viewport width appropriately.
6. Links underline; hover goes to `--accent-glow`.
7. Tab through page: every interactive element shows focus ring.
8. Skip link appears when tabbing from the top.
9. Set `prefers-reduced-motion: reduce`: transitions drop to 0ms, autoplay pauses.
10. Mobile viewport reflows to 4-column grid.
11. Printed preview: top bar, nav, decorative media hidden; black on white.
12. No saturated tech colors, no gradients, no neon.
13. Site chrome carries the uppercase mark; no lowercase wordmark, no faked barless A.

---

## 14 · Do not touch

1. **Homepage particle renderer.** `~/Developer/ciamac-site/particle-app/`.
2. **Content text.** Headlines, body copy. Flag, do not rewrite.
3. **Inline SVG path data.**
4. **JS behavior.** Event handlers, state logic.
5. **Images and media.** Source assets.
6. **Utility framework classes** (Tailwind, Bootstrap). Flag and ask.
7. **Build artifacts.** `node_modules/`, `dist/`, `build/`, `.git/`.
8. **Human-authored docs.** `STYLEGUIDE.md`, `BRAND.md`, `README.md`, `AGENT.md`.

---

## 15 · How to invoke

> Load the ciamac style guide v2.1 (repo `~/Developer/ciamac-brand/STYLEGUIDE.md` once merged, or the Notion mirror once resynced). Migrate the following file(s) per that spec: `<file paths>`. Do not consult any other brand document. Produce a versioned new file per § 12.2 and a report per § 12.11.

Example:

> Load the ciamac styleguide. Migrate `~/Developer/Cyril/docs/how-cyril-works_v4.html` to v5 per that spec.

---

## 16 · Priority retrofit order

0. **Cut `wordmark/wordmark-v2.svg` and re-cut `favicon.svg`** — blocks all chrome conversions (§ 02.6)
1. `~/Developer/Cyril/docs/how-cyril-works_v4.html` — first page blocker
2. Rest of Cyril documentation
3. ciamac-site non-homepage pages (excluding `particle-app/` and `desktop-next/`)
4. ciamac-gallery
5. alaia-site (defer to Alaia)
6. splatplayer, splat-desktop (tooling, lower priority)

---

## 17 · Changelog

- **v2.1** · 2026-06-11 · Small-studio lock. Register walked back from v2.0 institutional to **small-studio practice** (Studio Feixen analog): philosophy rewritten — "A practice, not a persona" replaces both v1's "Personal, not promotional" and v2.0's "Technical authority"; "Systematic, not ornamental" kept from v2.0; warmth principles ("The door is always open", "Quiet, not empty") restored from v1.x; "the hand" stays demoted to paper/film use-case. **Wordmark locked: Option B** — uppercase barless-A `CIAMAC` everywhere, single mark, no monogram, favicon compression accepted; lowercase mark and v2.0 dual-mark system retired. New § 02.4 case-in-prose rule, § 12.6b wordmark retrofit rule, § 11.4 barless-A heritage note. Letter-spacing 0.08em provisional pending `wordmark-v2.svg` cut. *Drafted from the v1.4 Notion mirror + 2026-04-24 session log; diff against repo v2.0 (commit `991b95c`) on merge.*
- **v2.0** · 2026-04-24 · (repo only, superseded) Institutional pivot. "Systematic, not ornamental"; "Technical authority"; dual mark (uppercase barless CIAMAC display + lowercase operational); site reframed as "practice publication"; NASA worm precedent added. Committed as `991b95c`; never synced to the mirror.
- **v1.5** · 2026-04-24 · (repo only) Incremental polish during the brand-lock marathon; never synced to the mirror.
- **v1.4** · 2026-04-23 · Friction pass. Added top-of-doc Quick start for agents and § 00.2 Framework translation. Added § 12.9b "Do not reference the live site". Rewrote § 15 into explicit prompts. Renumbered § 12.10 → § 12.11.
- **v1.3** · 2026-04-23 · Accessibility pass. New § 07 Accessibility, § 04.6 Text alignment, § 06.2 Reduced motion, § 08 reference CSS, § 09 Patterns, § 10 Operational.
- **v1.2** · 2026-04-23 · Added Above the fold rule.
- **v1.1** · 2026-04-23 · Container tiering. Four tiers replacing single 1320 cap.
- **v1** · 2026-04-22 · Locked after Swiss audit. Wordmark uniform Helvetica Light lowercase. Caspian Blue `#6a83ad` primary. Secondary palette Caspian-family Quiet variant.
