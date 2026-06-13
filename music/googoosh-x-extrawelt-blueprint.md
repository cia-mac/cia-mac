# Googoosh × Extrawelt — Production Blueprint

> A sampling/arrangement spec for fusing Googoosh's jazz- and bossa-nova–
> influenced pre-1979 recordings with a modern, melodic-organic techno style in
> the spirit of **Extrawelt**, textured with **Kangding Ray**'s granular/dub
> palette. Written to be built in a DAW (Ableton Live / Logic / Bitwig) — not as
> shipped audio.

This is a **DAW blueprint**, not a finished track and not code. It pairs with the
browser-native sound machine in [`cia-mac/la-route`](https://github.com/cia-mac/la-route)
(single-file Web Audio, scenes + crossfade timeline, "homage to kangding ray").
See [feeding it back into la-route](#10-feeding-it-back-into-la-route) at the end.

---

## 1. North star

A 6–7 minute peak-time-but-emotional techno cut where a **chop from Googoosh's
*Makhloogh* (مخلوق) is the recurring "human" signal** threaded through an
Extrawelt-style organic machine. The chop should feel *recognised more than heard* — surfacing in the
breakdown, dissolving into Kangding-Ray grain on the build, fully present only once.

Ethos borrowed from the **Randomly Marvelous** doctrine (Notion): elevate the source,
outclass the official versions, credit the artist generously, and plan for
**rights-holder monetization, not takedown** (see §11). The point is homage, not theft.

---

## 2. References, decoded

| Reference | What we actually take from it |
|---|---|
| **Extrawelt** | Organic, "breathing" techno at ~125–130 BPM. Analog-feeling, constantly-modulating sound design; electro/broken undertow under a four-on-the-floor; warm detuned-saw leads; melodic but never trance-cheesy. Touchstones: *Soopertrack*, *Fang Mich*, *Doch Doch*. |
| **Kangding Ray** | Texture and tension. Granular clouds, dub-techno chord stabs drowned in delay, field-recording grit, microsound transitions. Touchstones: *Solens Arc*, *Pruitt Igoe*. Use for the **bed and the transitions**, not the groove. |
| **Googoosh (pre-1979)** | The melodic/emotional source. The richest jazz/bossa material is the **Varoujan- and Cheshmazar-arranged** era: live rhythm sections, Rhodes, nylon guitar, flute, lush strings, brushed/bossa drums, and Persian modal (dastgāh) vocal lines. |
| **`la-route`** | Your own aesthetic constraint: single-file, scene-based, crossfaded, restrained. Keeps the techno build *patient* rather than EDM-loud. |

---

## 3. Source — Googoosh, *Makhloogh* (مخلوق)

**Locked source track.**

| Field | Value |
|---|---|
| Title | *Makhloogh* (مخلوق — "Creature / Being") |
| Composer | Hassan Shamaeezadeh (حسن شماعی‌زاده) |
| Lyrics | Mansoor Tehrani (منصور تهرانی) |
| Arranger | **Manouchehr Cheshmazar** (منوچهر چشم‌آذر) |
| Era | ~1976 (*Pol* era) |
| Character | Lush Cheshmazar orchestral-pop ballad — dramatic strings, big emotional vocal, mid-tempo. *Not* strict bossa; this is the lounge/orchestral lane, which is **ideal for the Kangding breakdown** (§6, bars 64–96) where the vocal carries the weight. |

> Why it fits: the slow, declamatory vocal and the swelling Cheshmazar strings give
> us a *human* source with built-in drama. We exploit the contrast — keep her
> ballad **half-time and reverent** under a straight 128 techno machine.

### 3a. Confirm-by-ear analysis (do this first)

The blueprint's project key/tempo (§4) are the *target*, not the source. Pull these
from your clean copy of *Makhloogh* before chopping, and fill in:

| Measure | How to get it | Use |
|---|---|---|
| **Original key / mode** | Tuner + ear on the sustained vocal notes; note any koron/microtonal bends | Repitch amount → F-min target |
| **Original tempo** | Tap-tempo the verse; expect a slow ballad (~half-time vs 128) | Warp ratio |
| **Best vocal phrase** (HOOK) | One 1–2 bar melisma, ideally over a held/sparse bar | §5 HOOK slot |
| **Best string/chord swell** (STAB + GRAIN) | A bar where strings sustain with little percussion | §5 STAB + GRAIN BED |
| **Cleanest tail/breath** | Phrase-ends, pre-chorus breaths | §5 GRAIN BED |

> Sibling material if you want a 2nd source layer (same Cheshmazar/Varoujan world):
> *Do Panjereh*, *Gol Bi Goldoon*, *Gharibeye Ashena*, *Pol*. Keep *Makhloogh* the lead.

**What to grab from *Makhloogh* (aim for 3 chop types):**
1. **Vocal melisma** — one breathy 1–2 bar phrase with a modal bend in it. This is the hook.
2. **Harmonic stab** — a Cheshmazar string/orchestral chord you can loop as the dub-techno stab.
3. **Texture / room** — string tails, breaths, tape hiss — fuel for the Kangding grain bed.

---

## 4. Technical spec

| Param | Value | Notes |
|---|---|---|
| **Tempo** | **128 BPM** | Extrawelt pocket. Bossa source feels half-time (≈64) over the 4/4 — lean into that. |
| **Key / mode** | **F minor** project key | Repitch chops to fit. *Preserve the Persian modal inflection* (microtonal bends, koron) rather than hard-quantizing to equal temperament — that tension is the Kangding move. |
| **Time sig** | 4/4 | Bossa clave/sway lives in the *percussion + chop placement*, not the meter. |
| **Swing** | 8–12% on hats/perc only | Keep kick straight; swing the top end for the bossa lilt. |
| **Length** | 6:30 (≈208 bars) | DJ-friendly 16-bar intro/outro. |
| **Session headroom** | mix bus peaks ≤ −6 dBFS | Leave room for master (§9). |

---

## 5. Sample-chop map

| Slot | Source chop | Treatment | Role |
|---|---|---|---|
| **HOOK** | Vocal melisma (1–2 bars) | Repitch to F-min; formant up ~+1 for air; tape-stop tail; print **dry** + a **100% wet** reverb-throw copy | The "human" — full only in breakdown |
| **STAB** | Rhodes/guitar chord | Slice to one hit; gate tight; pitch to root + 5th; run into **dub delay (3/16)** + spring reverb | Kangding dub-techno stab, off-beats |
| **GRAIN BED** | Breaths / strings / hiss | **Granular** (Ableton Granulator II / Portal / Quanta): long grains, high density, pitch-randomized ±200c, slow position scan | Kangding texture under everything |
| **GHOST LOOP** | 1 bar of original bossa drums | High-pass @ 300 Hz, half-time, −18 dB, sidechained hard | Subliminal bossa sway under techno kit |
| **RISER** | Reverse of the HOOK | Reverse + long hall + automated HP sweep | Build transitions |

**Chop hygiene:** work at the source's native pitch first, transient-mark the
phrase, then warp to 128. Use **Complex Pro / élastique** warp for the vocal,
**Repitch** warp for the drum ghost loop (keeps the vintage pitch-wobble charm).

---

## 6. Arrangement (208 bars @ 128 BPM ≈ 6:30)

```
BARS    SECTION          WHAT'S HAPPENING
0–16    INTRO            Kick + GRAIN BED only. HOOK teased once, drowned in delay.
16–48   GROOVE A         Add sub, hats, GHOST LOOP. STAB enters on off-beats.
48–64   LIFT             Open hats, add Extrawelt detuned-saw lead (subtle), GRAIN swells.
64–96   BREAKDOWN        Drop the kick. HOOK plays FULL + dry, over STAB + reverb wash.
                         This is the emotional centre — let Googoosh breathe.
96–112  BUILD            HOOK dissolves into RISER + grain. Snare/clap roll. HP sweep up.
112–160 DROP / PEAK      Full kit, lead at full, STAB + HOOK call-and-response,
                         GHOST LOOP audible. Extrawelt-style modulation never static.
160–176 STRIP            Pull lead, keep groove + STAB. Breathe.
176–192 LAST LIFT        One more HOOK throw, filtered.
192–208 OUTRO            Reduce to kick + GRAIN BED + final HOOK tail. DJ tool tail.
```

**Extrawelt motion rule:** nothing sits still for 8 bars. Slowly automate filter
cutoff, reverb size, grain density, and detune on the lead so the machine feels
*alive*. Modulate, don't just layer.

---

## 7. Sound design per element

- **Kick** — punchy, short, analog (TR-909-ish layered with a synth-sine sub-thump
  tuned to F1). Slight saturation. No long tail — the GRAIN BED owns the low-mid space.
- **Sub / bass** — mono sine/triangle below 100 Hz, sidechained to kick. Add a
  separate mid-bass *offbeat* "rolling" Extrawelt line (detuned saw, ~2-osc, slow
  LP filter env, light overdrive) sitting 100–500 Hz.
- **Hats / perc** — 909 hats + a real **bossa shaker/brush** loop (from the GHOST
  LOOP source if possible) swung 8–12%. Pan-modulate.
- **Lead (the Extrawelt voice)** — 2–3 detuned saws, unison, gentle chorus, BP
  filter with envelope + LFO, into tape saturation + ping-pong delay. Plays a
  *3–4 note motif derived from the Googoosh vocal's interval set* so melody and
  sample share DNA.
- **STAB** — see §5; the dub-techno anchor.
- **Grain bed (Kangding layer)** — granular of breaths/strings, automated density &
  pitch spray, drenched in modulated reverb, high-passed so it floats above the sub.
- **Vocal (HOOK)** — minimal in groove sections (one delay throw), maximal and dry
  in the breakdown. Optional: a parallel **vocoder/talkbox** copy driven by the lead
  synth for a robotic ghost of her voice on the peak.

---

## 8. Suggested processing chains

- **Vocal HOOK:** de-noise → de-ess → EQ (HP 120 Hz, presence +2 @ 6 kHz) →
  tape sat → 3/16 dub delay (feedback ~45%, filtered) → modulated plate (send).
- **STAB:** transient gate → tuned EQ → bit-reduce (subtle) → spring reverb →
  3/16 delay synced.
- **Lead:** unison saws → drive → BP filter (env + LFO) → chorus → ping-pong delay →
  bus comp.
- **Mix bus:** gentle glue comp (2:1, ~1–2 dB GR) → broad EQ tilt → tape/console
  emulation → leave −6 dB headroom for §9.

---

## 9. Mix & master targets

| Target | Value |
|---|---|
| Mix-bus peak | ≤ −6 dBFS before master |
| Club master (integrated) | ≈ **−8 LUFS** |
| Streaming alt master | ≈ **−10 to −12 LUFS** |
| True peak ceiling | **−1.0 dBTP** |
| Low end | mono below ~120 Hz |
| Reference against | an Extrawelt track + a Kangding Ray track, matched-loudness |

Deliver **two masters** (club + streaming) and a **DJ-friendly full-length** plus a
**radio/short edit** if you want it on the homage channel.

---

## 10. Feeding it back into la-route

`la-route` is single-file Web Audio with **scenes + crossfade timeline**. The §6
arrangement maps cleanly onto it:

- Each **section** above → a **la-route scene** (Intro / Groove A / Breakdown / Peak / Outro).
- The **crossfade timeline** = the transitions (the RISER / grain dissolves).
- Load the **STAB** and **GRAIN BED** as the in-browser source buffers; drive the
  techno kit from the existing engine.
- Keep the Googoosh HOOK as a *user-supplied* buffer (you drop your own sample in)
  so the public repo never ships the copyrighted recording — this also sidesteps §11.

This makes the DAW track and the browser machine two renders of the **same scene graph**.

### 10a. la-route scene graph — Phase 3 spec (turnkey)

Concrete mapping of the §6 arrangement onto la-route **scenes + crossfade timeline**
at 128 BPM (1 bar = 1.875 s; 16 bars = 30 s). Build these as 9 scenes; the timeline
crossfades between them at the durations in the last column.

**Source buffers (load once):**
- `KICK`, `SUB`, `MIDBASS` (rolling offbeat), `HATS`, `GHOST` (half-time bossa drum loop)
- `STAB` (Cheshmazar string chord, one hit) · `GRAIN` (texture bed from string tails/breaths)
- `LEAD` (detuned-saw synth voice) · `RISER` (reversed HOOK)
- `HOOK` — **user-supplied** Makhloogh vocal chop (never bundled; see §11)

**Scenes (layer = on/level 0–1; blank = off):**

| # | Scene | Time | Bars | KICK | SUB | MIDBASS | HATS | GHOST | STAB | GRAIN | LEAD | HOOK | →xfade |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | INTRO | 0:00 | 0–16 | 1 | | | | | | .6 | | throw | 1 bar |
| 2 | GROOVE A | 0:30 | 16–48 | 1 | 1 | .7 | .6 | .5 | .6 | .6 | | | 1 bar |
| 3 | LIFT | 1:30 | 48–64 | 1 | 1 | .8 | .9 | .5 | .7 | .8 | .4 | | 2 bar |
| 4 | BREAKDOWN | 2:00 | 64–96 | | | | | | .8 | .9 | | **1 dry** | 4 bar |
| 5 | BUILD | 3:00 | 96–112 | .5↑ | | | roll | | .5 | 1 | | →RISER | 8 bar |
| 6 | DROP / PEAK | 3:30 | 112–160 | 1 | 1 | 1 | 1 | .7 | .9 | .7 | 1 | call/resp | 1 bar |
| 7 | STRIP | 5:00 | 160–176 | 1 | 1 | .8 | .7 | .5 | .9 | .6 | | | 2 bar |
| 8 | LAST LIFT | 5:30 | 176–192 | 1 | 1 | .9 | .9 | .6 | .8 | .8 | .7 | filtered | 2 bar |
| 9 | OUTRO | 6:00 | 192–208 | 1 | .6 | | | | | .6 | | tail | end |

**Per-scene modulation targets** (la-route should interpolate these across each crossfade,
not just gate layers — this is the Extrawelt "always moving" rule, §6):
- `filterCutoff` — low in INTRO/BUILD, opens through LIFT→PEAK.
- `grainDensity` / `grainPitchSpread` — swell on LIFT and BUILD, peak in BREAKDOWN.
- `leadDetune` / `delayFeedback` — creep upward toward PEAK.
- `reverbSize` — large in BREAKDOWN, tight in GROOVE/DROP.

**The two signature transitions** (give these the long crossfades):
- **3→4 (into BREAKDOWN):** drop KICK/SUB, push GRAIN + reverb, HOOK resolves to full & dry. 4-bar fade.
- **5→6 (BUILD→DROP):** HOOK dissolves into RISER + grain, filter sweeps open, kick re-enters on the 1. 8-bar fade.

---

## 11. Rights / Content-ID

Per the Randomly Marvelous doctrine in Notion: assume any recognizable Googoosh
recording will be **Content-ID matched**. Plan accordingly:

- **Don't commit the source audio** to the public `la-route` repo — keep the HOOK
  user-supplied (see §10).
- For any public release, **clear or expect rights-holder monetization, not
  takedown** — and credit Googoosh and the original arranger (Varoujan / Cheshmazar)
  generously in the description.
- Cleanest path to a *commercial* release: license/interpolate, or commission a
  re-sing of the melody so the *composition* is referenced without the master.

---

## 12. Build checklist

- [ ] Source locked: *Makhloogh*. Run §3a confirm-by-ear analysis, then isolate HOOK / STAB / TEXTURE chops (§5)
- [ ] Set 128 BPM / F-min session; warp chops, preserve modal bends (§4)
- [ ] Build kit + sub + rolling bass (§7)
- [ ] Program lead motif from the vocal's intervals (§7)
- [ ] Granular bed from breaths/strings (§5, §7)
- [ ] Lay out the 208-bar arrangement (§6)
- [ ] Automate everything — nothing static 8 bars (§6)
- [ ] Mix to −6 headroom; master club + streaming (§9)
- [ ] Phase 3: build the 9-scene graph in `la-route` (§10a), HOOK as user-supplied buffer
- [ ] Credits + rights plan before any public post (§11)
