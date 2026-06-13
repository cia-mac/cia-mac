# makhloogh machine

Standalone browser device for mixing Googoosh recordings with an
Extrawelt-style techno engine. Sister to
[`cia-mac/la-route`](https://github.com/cia-mac/la-route) — same philosophy:
**one HTML file, Web Audio, scenes + crossfade timeline, no dependencies,
no build step.**

- **App:** [`public/makhloogh.html`](../public/makhloogh.html) — served by this
  deployment at **`/makhloogh.html`**.
- **Spec it implements:** [`googoosh-x-extrawelt-blueprint.md`](googoosh-x-extrawelt-blueprint.md)
  §10a — the 9-scene graph (intro → groove → lift → breakdown → build → drop →
  strip → last lift → outro), per-layer levels, entry crossfades, and the
  modulation targets.

## How to use

1. Open `/makhloogh.html`. Drop in your own Googoosh track (e.g. *Makhloogh*).
   **The audio never leaves the browser** — nothing is uploaded or bundled,
   per the rights plan in the blueprint (§11).
2. Drag on the waveform, then assign: **hook** (a vocal melisma) and
   **texture** (a string/chord passage). Sensible defaults are set on load.
3. Use **pitch** to repitch the sample toward F minor — the synth engine
   (kick at F1, bass F2/Ab2/C3, lead F3–Eb4) always plays in F.
4. Hit **play**. *Auto arrangement* runs the full 208-bar / ~6:30 structure;
   uncheck it and use keys **1–9** to perform scenes live, DJ-style.

## Engine (all synthesized except your sample)

kick · sub drone (F1, sidechained) · rolling offbeat bass · swung hats +
build rolls · ghost (your texture, half-time, HP 300 Hz) · dub stab
(your texture through 3/16 filtered delay) · grain bed (your texture,
granular, ±250 c spray) · detuned-saw lead (motif on F–Ab–C–Eb) · hook
(your vocal: delay throws, dry loop in the breakdown, reversed riser
into the drop).

## Standalone status

This is its own device/project that currently lives in this repo only
because the session was scoped here. To split it out: copy
`public/makhloogh.html` (and this file) into a new repo — it has zero
dependencies on the surrounding app.
