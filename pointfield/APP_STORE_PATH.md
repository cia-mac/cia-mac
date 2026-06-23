# Pointfield → App Store: Audit & Path to Publishing

*Drafted 2026-06-23. Pointfield is the interactive "opener" served at
`ciamac.com/pointfield`. It is a **web app today**. This doc is the path to
getting it onto the Apple App Store.*

> **Source-access caveat.** Pointfield's code lives in `cia-mac/ciamac-site`,
> not in this repo, and the session that produced this doc could only read
> `cia-mac/cia-mac`. The technical specifics below are written for a
> **single-file / zero-dependency canvas-or-WebGL interactive in the @ciamac
> register** — the same pattern as the `/photon` pieces in this repo. Confirm
> the three "Verify in the code" items in §1 against the real source, then the
> rest of the plan holds as written.

---

## 0. TL;DR

- You **cannot** submit a website. Apple Review **Guideline 4.2 (Minimum
  Functionality)** rejects "apps that are little more than a web page bundled
  into an app." A bare `WKWebView` wrapper around `/pointfield` gets rejected.
- **Recommended path:** wrap the existing web build with **Capacitor** *and add
  genuine native value* (device-motion driving the visual, haptics, offline,
  share-your-frame). This reuses your code and clears 4.2. ~1–2 focused weeks.
- **If App Store presence isn't actually the goal:** ship a **PWA / Add to
  Home Screen** instead — zero review, instant updates, no $99/yr. Decide this
  first (§2); it changes everything downstream.
- **Gate zero** for any native path: **Apple Developer Program, $99/yr**, plus
  a Mac with Xcode (or cloud Mac CI).

---

## 1. What pointfield is (audit)

**Verify in the `ciamac-site` code (3 things that drive every decision below):**

1. **Engine** — vanilla `<canvas>` 2D, WebGL/Three.js, or a framework (React)?
   A point/particle field is almost certainly canvas or WebGL. This sets how
   well it performs inside a wrapper and whether a native rebuild is cheap.
2. **State & backend** — is it fully client-side (just renders), or does it
   call an API / store anything / require login? A pure client-side visual is
   the easy case: nothing to port, no server dependency at launch.
3. **Input** — pointer/touch only, or does it already read device sensors
   (`deviceorientation`, `devicemotion`)? Sensor input is the cheapest way to
   add the "native value" 4.2 wants.

**Assumed profile (typical for an @ciamac opener):** a single self-contained
page, client-side only, no auth, no payment, mobile-friendly, pointer-driven.
That profile is the *best* case for App Store — nothing to re-architect — but
also the *most exposed* to 4.2, because "self-contained interactive page" is
exactly what Apple means by "a web page bundled into an app" unless you add
native capability.

---

## 2. Decision you must make first: do you even need the App Store?

| | **PWA / Add to Home Screen** | **App Store (native wrapper or rebuild)** |
|---|---|---|
| Cost | $0 | $99/yr + dev time |
| Review | None | Yes; expect a 4.2 round-trip |
| Updates | Instant (it's the website) | Each update re-reviewed |
| Discovery | None (you share the link) | App Store search/listing |
| Effort | Hours (manifest + icons + service worker) | Weeks |
| Offline | Yes (service worker) | Yes |
| Risk | Low | Medium (rejection) |

If the goal is *"people can keep pointfield on their phone like an app"*, the
PWA delivers that today. Pursue the App Store only if you specifically want the
**store listing, discovery, or a paid/native presence**. Everything below
assumes you do.

---

## 3. The three native paths

### Path A — Capacitor wrapper + native value  ⭐ recommended
Reuse the existing web build; ship it inside a native shell that adds real
device capability so it isn't a "thin wrapper."

- Tooling: [Capacitor](https://capacitorjs.com) (`@capacitor/ios`).
- **Native value to clear 4.2 (pick 2–3, all natural for a point field):**
  - **Device motion** (`@capacitor/motion`) — gyro/accelerometer parallax or
    flow on the field. This alone is the strongest 4.2 defense.
  - **Haptics** (`@capacitor/haptics`) on interaction.
  - **Offline** — bundle assets locally; works with no network.
  - **Share** (`@capacitor/share`) — export/share a rendered frame.
  - Optional: **push** (`@capacitor/push-notifications`), native settings,
    home-screen widget.
- Effort: **~1–2 weeks**. Lowest-cost path to a *publishable* (not just
  technically-submittable) app.

### Path B — thin SwiftUI + WKWebView
A SwiftUI shell hosting the web view, with native chrome (motion, share,
settings) bolted on. Similar 4.2 exposure to A; choose A unless you want a
Swift codebase. You already have Swift repos (`Cyril`, `ciafx-app`), so the
toolchain exists.

### Path C — full native rebuild (SwiftUI + Metal / SpriteKit)
Reimplement the point field natively. A particle field maps cleanly onto
**Metal** (or SpriteKit for simpler cases) with `CMMotionManager` input.
Highest quality, lowest rejection risk, **highest effort (weeks+)**. Justified
only if pointfield becomes a flagship product rather than a site opener.

---

## 4. Mechanical checklist (Paths A–C)

**Accounts & machines**
- [ ] Enroll in **Apple Developer Program** — $99/yr (individual or org).
- [ ] **Mac + Xcode** to archive/upload, *or* cloud Mac CI (Xcode Cloud,
      Codemagic, EAS Build). No Mac = no submission.

**Project setup**
- [ ] Bundle identifier (e.g. `com.ciamac.pointfield`) + App ID in the portal.
- [ ] App icons (full set) and launch screen.
- [ ] (Path A) `npx cap add ios`, build web → `npx cap sync` → open in Xcode.

**App Store Connect listing**
- [ ] App name + subtitle + keywords (note: "Pointfield" name availability).
- [ ] Description and promotional text.
- [ ] **Screenshots** for each required device size (6.7"/6.5" iPhone, etc.).
- [ ] **Privacy policy URL** (required — even a one-pager).
- [ ] **Privacy "nutrition label"** — declare data collection. If pointfield
      collects nothing, declare exactly that (simplest case). If you add
      analytics/push, disclose it.
- [ ] Age rating questionnaire, support URL, copyright.

**Ship**
- [ ] Archive in Xcode → upload to App Store Connect (or Transporter/fastlane).
- [ ] **TestFlight** internal/external beta first.
- [ ] Submit for review.
- [ ] Be ready for a **4.2 rejection round-trip**: if it bounces, the fix is
      "add more native capability," not "argue." §3 Path A list is your
      ammunition.

---

## 5. Recommended sequence

1. **Decide §2** — App Store vs PWA. If PWA, stop here and do the manifest +
   service worker + icons in `ciamac-site`.
2. Confirm the §1 "Verify in the code" items in `ciamac-site`.
3. Enroll in the Apple Developer Program (long-pole; start it early).
4. Path A: add Capacitor, wire **device-motion + haptics + offline + share**.
5. Icons, screenshots, privacy policy, App Store Connect listing.
6. TestFlight → submit → handle the 4.2 round-trip with the native-value list.

---

## 6. Cost & effort summary

| Item | Cost | Time |
|---|---|---|
| Apple Developer Program | $99/yr | enroll early |
| Path A (Capacitor + native value) | dev time | ~1–2 weeks |
| Path C (full native rebuild) | dev time | weeks+ |
| PWA alternative | $0 | hours |

**Bottom line:** pointfield is a strong App Store candidate *if reframed as an
interactive experience* — add motion, haptics, and share, and it clears 4.2
easily. Submitted as a bare web wrapper, it gets rejected. If the only goal is
"app-like on a phone," ship the PWA and skip the store.
