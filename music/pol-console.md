# pol console

**app:** [`public/pol.html`](../public/pol.html)

---

## what this is

pol console is a browser remix console — a director's instrument, not a
recording studio. you drop in a Googoosh track, tell the machine which few
seconds of her voice to use and which string passage to weave into the
background, pick a mood ("stock"), and turn four knobs until it sounds right
to you. the machine handles everything a musician would — the beat, the
texture, the structure, the dynamics — while you decide taste. when it sounds
like something, you press record and a WAV file lands in your Downloads folder.
that file is a demo take for *Pol*, the remix album.

---

## the 3-minute quickstart

1. open `/pol.html` in a browser (Chrome or Firefox work best).
2. drag a Googoosh audio file — mp3 or wav — onto the waveform area at the top.
   the waveform draws itself.
3. press **play**. the machine starts on the default stock ("man o to") and
   runs through a full arrangement on its own.
4. turn the four **feel knobs** — energy, darkness, space, voice — while it
   plays. you'll hear the character shift in real time.
5. when it feels right, press **record**. let the arrangement run.
6. press **record** again to stop capturing. a file named
   `pol-take-01-man-o-to.wav` (or similar) appears in your Downloads folder.
   that's your take.

---

## the controls, panel by panel

### sample panel

this is where you tell the machine which parts of the recording to use.

- **hook** — the best two or three seconds of her voice: a held phrase, a
  melisma, the moment you keep returning to. drag on the waveform to mark the
  region, then click **assign hook**. this becomes the emotional anchor — the
  part the machine surfaces in breakdowns and calls back to throughout.
- **texture** — a moment where the strings or orchestration breathe without
  much percussion. drag a different region and click **assign texture**. the
  machine uses this as a background wash, a granular cloud, and a filtered
  stab — you won't recognize the source, but you'll feel it.
- **how to drag**: click and hold on the waveform, drag left or right to span
  the region you want, release. a colored band appears. then use the assign
  button below it.
- **pitch** — a semitone slider running −12 to +12. the machine's bass and
  synth engine always plays in F minor; drag the pitch slider until her voice
  stops clashing with the bass and sits comfortably with it. trust your ear —
  there's usually a sweet spot within a few semitones of where she recorded.

### stock panel

a "stock" is a complete sonic personality — tempo, rhythm feel, what the
machine does with her voice. choose one per session.

**man o to** (default) — slow, deep, and organic at around 114 BPM. her voice
plays nearly continuously, looped gently over a heartbeat kick and low rolling
bass. vinyl crackle sits underneath everything like a memory. modeled on the
feeling of NU's "Man O To" and Doctor Rockit's "Café de Flore" — late-night,
warm, intimate. choose this when you want the song to feel like it was always
a deep-house record waiting to be uncovered. it flatters long, sustained vocal
phrases and lets the Cheshmazar strings do their slow work.

**sway** — 120 BPM with a loose swing, playful and a little reckless. this
stock *chops* her voice into stuttering slices — short rhythmic fragments that
repeat and tumble over each other, the way a DJ might edit a vocal to make it
dance. the original melody is still there but refracted. modeled on chopped
edits of Dean Martin's "Sway," which shares that same Latin-lounge swagger.
choose this for the moments in *Pol* where you want levity, or when the vocal
phrase is short and percussive rather than sustained.

**extrawelt** — 128 BPM melodic techno, ported from the makhloogh machine (the
earlier Extrawelt-style device built around *Makhloogh*). her voice appears as
delay throws in the groove and opens up fully, dry and present, in the
breakdown. the engine is the same — detuned saws, granular string texture,
bossa ghost loop — just applied to whatever track you bring in. choose this
when you want the most cinematic, peak-time version of the source, or when
you're working toward the techno end of the *Pol* album arc.

### feel knobs

four knobs that let you shape the mood without touching any specific element:

- **energy** — how busy the drums are; low = sparse kick and hi-hat, high =
  full percussion and rolls.
- **darkness** — how much light is in the sound; low = bright and open,
  high = filters closed down, bass heavy, shadows.
- **space** — how much echo and air surrounds everything; low = dry and close,
  high = long reverb, the room becomes vast.
- **voice** — how present she is; low = her voice recedes into the texture,
  high = she's at the front, exposed.

### transport and record

- **play / stop** — starts and stops the engine. on first load, browsers
  require a click before audio will play; if nothing happens, click play once
  more.
- **BPM** — nudge the tempo up or down from the stock's default. small changes
  (±4 BPM) stay natural; large changes will stretch the feel of the arrangement.
- **auto-arrangement** — when checked (default), the machine runs a full
  programmed structure from intro through breakdown through drop to outro —
  roughly 6:30. it handles everything. uncheck it to go manual (see scenes).
- **record** — click once to start capturing audio, click again to stop. the
  file writes to your Downloads folder as a 16-bit WAV. the take number
  increments each time so you don't overwrite earlier takes.

### scenes (manual mode)

when auto-arrangement is off, keys **1 through 9** on your keyboard trigger
scenes: intro, groove, lift, breakdown, build, drop, strip, last lift, outro.
scenes crossfade into each other so the transitions stay smooth. use this if
you want to perform the arrangement live — hold a breakdown longer, skip
straight to the drop, repeat the groove. it's the DJ approach rather than
the film-score approach.

### mixer

a fader per layer — kick, bass, stab, grain texture, lead synth, hook vocal.
pull a fader to zero to remove that element entirely. if the strings texture
is too prominent, pull the grain fader down. if you want a purely vocal
version of a section, pull everything except hook and space. the faders are
the one place where you're working at element level rather than overall taste
level.

---

## making an album take

the ritual for a keeper take:

1. pick your stock — start with **man o to** if you're not sure.
2. drop the track, set the hook region to her best phrase, set texture to a
   strings moment.
3. drag the pitch slider until her voice sits with the bass.
4. turn on auto-arrangement. set the feel knobs to a starting position —
   energy around noon, darkness a little below noon, space a little above.
5. press play and listen through one full pass without touching anything. just
   watch and hear.
6. press record, let the full arrangement play out (~6:30), then stop recording.
   that's take 1.
7. move the knobs to a different position — maybe darker and more spacious —
   and record take 2 without stopping playback. take 3, change something else.
8. listen back to all three. keep the one that surprised you most or made you
   feel something about the song you hadn't felt before.

---

## a good first session: pol

start with the track *Pol* (مانو با خودت ببر — "take me with you") on the
**man o to** stock. it's the album's title song, and it has a long, unhurried
vocal line that suits the slow deep-house feel.

mark the hook around the moment her voice holds longest — the syllable that
extends. for texture, find a bar where the strings swell without much
percussion underneath.

while it plays, listen for: does the groove feel like it's pulling you forward
slowly, the way good deep house does? does her voice feel cared for — like the
machine is giving it room rather than crowding it? if the bass is clashing,
move the pitch slider a semitone at a time until it resolves.

the first take won't be a master. that's fine. you're learning what the song
wants to be.

---

## quality, honestly

the WAV files the console produces are true 44.1 kHz or 48 kHz, 16-bit — the
same sample rate and bit depth as a CD or streaming file. the audio is not
compressed or degraded by the recording step itself. that said, these are
**demo-grade productions**: the synthesis and processing happening in the browser
is functional but not at the level of a professionally mixed and mastered
release. think of the takes as direction documents — "this is the feel, this is
the arc, this is what the remix is" — rather than finished tracks. getting from
here to release quality means the DAW stage described in the
[blueprint](googoosh-x-extrawelt-blueprint.md): proper mixing, mastering,
possibly re-singing or re-licensing the sample.

---

## rights

nothing is bundled with the console — no Googoosh audio is included, uploaded,
or transmitted anywhere. the file you drop in stays entirely in your browser
session. before any take from this console is shared publicly or commercially,
the sample needs to be cleared with Googoosh's management. the plan for *Pol*
is to use these demo takes as a pitch — to bring her management a finished
artistic direction and ask to license or collaborate. that conversation comes
first. until then, the takes are private creative material.

---

## troubleshooting

- **no sound when i press play** — browsers block audio until the user
  interacts with the page. click play a second time; it should start.
- **file won't load** — use an mp3 or wav file. some m4a/aac files work in
  Chrome but not Firefox. if in doubt, convert to mp3 first.
- **her voice sounds wrong / out of tune** — use the pitch slider in the sample
  panel. drag left or right one semitone at a time while the bass is playing
  until they stop clashing.
- **the recording is silent** — you need to start recording *while the engine is
  playing*. press play first, then press record. if you pressed record before
  play, stop, press play, then record again.
