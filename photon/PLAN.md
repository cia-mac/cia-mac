# Photon to Phenomenology — Interactive Pieces: Build & Launch Plan (v1)

*2026-06-11. Companion to the Notion page "Photon: Vision Science Explainer Series"
(Control Plane). This plan covers the **interactive** lane of the series — the
GRAPH pieces from the concept→tool chart — plus website publishing and
LinkedIn/X distribution.*

> **Note on repo location:** this lives in `cia-mac/cia-mac` (the Starving
> Artist app) only because that's the repo this session was scoped to. The
> pieces sit in `public/photon/` so the Vercel preview serves them at
> `/photon/` for phone testing and sharing. The canonical home is
> `ciamac-gallery-stage/experiments/photon-to-phenomenology/` — move
> `public/photon/` + this file there when merging (or don't merge this PR at
> all and treat it as a staging area).

---

## 0. Naming (settled)

The term **ITD** is retired for this work — you already made that call on the
Notion page (2026-06-05). ITD stays as the **B2B business concept**
(productized diagrams for clients like IDT); the book project is
**Photon to Phenomenology** ("Photon" for short), and its units are **pieces**
(films, interactive graphs, statics). The interactive pieces double as ITD
portfolio proof — one body of work, two uses.

## 1. What to build — six interactive pieces, one per week

From the chart's "strongest interactive graphs" shortlist, ordered by
build-cost vs. share-ability. Format: **single-file HTML, zero dependencies**
(the proven ITD pattern), in the @ciamac register (near-black `#0c0b09`, cream
`#e8e0d0`, no glow, anti-decorative; colour only where the concept *is* colour).

| # | Piece | Palmer | Why this order |
|---|-------|--------|----------------|
| 01 | **Trichromatic mixing** — 3 light sliders → one percept, cone-response readout | §3.2 | Cheapest, pillar 3 of the 3-pillar gate. **Built — v1 in this folder.** |
| 02 | **Opponent afterimage** — fixate 20 s, image swaps, you see the opponent colour | §3.2 | The viral one. "Stare at this" is the oldest share mechanic on the internet. **Built — v1.** |
| 03 | **Necker flip** — click to commit an interpretation + measure your own flip rate | §6.5 | Trivial build, demonstrates "construction is mandatory" most directly. **Built — v1.** |
| 04 | **Receptive field** — drag a stimulus across a center-surround field, watch it fire | §4.1 | First "real neuroscience" piece; the audience-quality filter. **Built — v1.** |
| 05 | **Gestalt grouping** — sliders set proximity against similarity | §6.1 | Designers will share this one; bridges to the design audience. **Built — v1.** |
| 06 | **Contrast sensitivity** — Campbell–Robson chart, overall-contrast slider | §4.2 | Personal: each viewer literally sees their own visual system's envelope. **Built — v1.** |
| 07 | **Illusory contours (bonus)** — Kanizsa triangle, slider dissolves the inducers | §6.4 | Striking and shareable; same parameter-play register as 01. **Built — v1.** |

Per-piece spec (keep every piece honest to this):
- **One concept, one interaction, ≤90 seconds** of self-experience.
- A closing line that ties back to the thesis: *vision is construction, not recording.*
- Citation footer: Palmer section + series mark.
- Works on a phone (most social traffic is mobile).
- ~1 build-day each max. If it wants more, it's a FILM or it's scope creep.

## 2. Where to publish — website

- **URL:** `ciamac.com/photon` — index page listing pieces; each piece at
  `/photon/<slug>` as its own standalone page (deep-linkable, embeddable).
- **Repo:** promote `experiments/photon-to-phenomenology/` in
  `ciamac-gallery-stage` to a first-class `/photon` section.
- **Per piece:** an OG/Twitter-card image (interactivity is invisible in link
  previews — the static card must carry the hook) and a 10–20 s screen-capture
  MP4 for social.
- **Analytics:** lightweight (Plausible or Vercel Analytics). The question to
  answer after 6 weeks: which concepts pull traffic → that picks season 2 and
  the platform decision (Substack vs. standalone site vs. course companion)
  that's currently open on the Notion page.
- The two shipped Blender films (color constancy, Mach bands lesson) get
  entries on the same index — the index is the series home, not just the
  interactive lane.

## 3. Distribution — LinkedIn + X, one piece per week

**The mechanic (both platforms):** never post a bare link. Post the 10–20 s
screen capture of the interaction as native video, hook in the first line,
link to the live piece.

**X:**
- Native video in the tweet; **link in the first reply** (links in the post
  body are algorithmically suppressed).
- Hook = the surprising fact, stated flat: *"There is no yellow light on your
  screen. Your eyes are making it up."*
- The afterimage piece (02) is the lottery ticket — illusions are the most
  reliably viral genre on X. Pin whichever piece travels.

**LinkedIn:**
- Same video, different register: frame each piece around the thesis and,
  every 2–3 weeks, a build-in-public angle ("how I make these single-file
  interactives") — that second angle is the ITD-business funnel, reaching the
  B2B buyers who'd pay for this format.
- One post per week, same day each week (a "season" reads as a commitment).

**Cadence:** 6 pieces → 6 weeks → that's **season 1**. Batch-build 2–3 ahead
so a busy week doesn't break the streak. After week 6: read the analytics,
decide the platform, scope season 2 (or switch energy to the flagship film).

## 4. What this does *not* change

- The **flagship film** (vision as the inverse problem) stays the flagship.
  Interactives are the cheap, weekly, audience-building lane; films are the
  rare, expensive, identity-defining lane. Don't gate the weekly lane on the
  film.
- The old IDT-branded HTML ITDs stay separate (open decision on Notion page —
  recommendation: keep them separate; they're client work, different register).

## 5. Next actions

1. Review `trichromatic-mixing.html` (piece 01, v1) — open it in a browser.
2. Move this folder to `ciamac-gallery-stage`, wire up `/photon` on ciamac.com.
3. Build piece 02 (afterimage) — it should launch the social season because
   it's the strongest hook.
4. Record the first screen captures + OG cards.
5. First post: LinkedIn + X, same week, link to `/photon`.
