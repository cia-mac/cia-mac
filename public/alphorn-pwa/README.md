# Alphorn — installable iPhone app (PWA)

A self-contained alphorn instrument + play-along tool, packaged as a
**Progressive Web App** so it installs on an iPhone home screen with its own
icon, runs full-screen, and works offline — no Xcode, no App Store, no Mac.

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The app (Instrument + Play-Along tabs, shared alphorn key) |
| `manifest.webmanifest` | App name, icons, standalone display |
| `sw.js` | Service worker — caches the app shell for offline use |
| `icons/` | App icons (180/192/512 + maskable) |

## Install on iPhone (≈20 seconds)

1. In **Safari**, open this app's URL: `https://<your-site>/alphorn-pwa/`
2. Tap the **Share** button → **Add to Home Screen**.
3. Name it (defaults to "Alphorn") → **Add**.
4. Launch it from the new home-screen icon — it opens full-screen like a
   native app and works without a connection.

> A service worker requires HTTPS, so install from the deployed URL (Vercel
> serves `public/` at the site root). Opening `index.html` from a local file
> works as a normal page but won't register the offline service worker.

## What the app does

- **Instrument tab** — play the alphorn's natural overtone notes (the
  out-of-tune 7/11/13/14 partials are flagged), pick the horn's key, shape the
  tone, play the built-in original tune "Driftwood," and export a ~60s WAV.
- **Play-Along tab** — load any audio file *from your device* (it stays local,
  nothing is uploaded), see its waveform, slow it down with pitch preserved,
  loop a phrase, and watch the live pitch map onto the nearest alphorn note.

## Notes

- All audio is processed locally in the browser; nothing leaves the device.
- "Driftwood" is an original melody, not a copy of any existing track.
- Want a true native build (Swift/SwiftUI for the App Store)? That's a separate
  project that requires a Mac + Xcode; this PWA is the no-build path.
