# pol sampler

**app:** [`public/sampler.html`](../public/sampler.html) · sister to [pol console](pol-console.md)

built from one piece of feedback: *"i have to be able to see the googoosh
track and sample the bits i like — too automated, too high pitched, i want
more control."* this is the hands-on tool. nothing is automated, nothing is
repitched unless you repitch it.

## the idea

you listen to the song, you find the moments, you put them on pads, you play
them — over a simple beat if you want one. the machine does nothing on its own.

## quickstart

1. open `/sampler.html` and drop your googoosh track on the waveform.
2. **listen:** click anywhere on the big waveform — the original song plays
   from that spot at its true pitch. click elsewhere to jump around. press
   **x** to stop. use the mouse wheel to zoom in close; the strip at the top
   shows where you are in the whole song.
3. **grab a bit:** drag across the part you love → press **▶ play selection**
   to check it → press **assign selection → pad**. it lands on the next free
   pad. repeat — you have 8 pads.
4. **play:** hit the pads with **q w e r / a s d f** (or click them). each pad
   has its own volume and pitch (default 0 = exactly her original pitch), and
   a loop switch for phrases you want running.
5. **beat (optional):** press **space** or the beat toggle. pick a style —
   deep / swing / techno — set the tempo, mute pieces you don't want. the
   beat never starts by itself. drums are key-neutral so nothing clashes;
   add the bass note only if you want it, and choose the note by ear.
6. **record:** press **r**. everything you perform — beat, pads, even
   auditioning the original — is captured to a real WAV in your downloads
   (`sampler-take-01.wav`). press **r** again to stop and save.

## the two tools together

- **pol sampler** (this) — for *finding and performing*: discover the bits,
  build a vocabulary of pads, jam until something feels like a track.
- **pol console** — for *structure*: when you know the hook and the mood,
  the console runs a full arranged take with one of the three stocks.

a good session: find your moments here, note the times, then bring the same
regions into the console for an arranged pass — or just record your live pad
performance here and call that the demo. both are honest takes.

## notes

- her voice plays at original pitch by default everywhere. the per-pad pitch
  slider is there for deliberate choices, not a requirement.
- your audio never leaves the browser; nothing is uploaded or bundled.
- takes are true 16-bit wav, demo-grade production — same honesty as the
  console: direction now, DAW polish later.
