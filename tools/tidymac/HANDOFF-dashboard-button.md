# Handoff: add the TIDYMAC launcher to the CIAMAC Dashboard

**For:** a Claude Code session opened **on `cia-mac/ciamac-dashboard`** (NOT this
repo). The session that wrote TidyMac (`cia-mac/cia-mac`) is hard-scoped to that
one repo and cannot reach the dashboard, so this last piece must run there.

## The task
In the dashboard's "LAUNCHERS · ONE-CLICK DOORS" row — named launchers
NOW / GALLERY / CIAMAC / STAGE / POINTFIELD / PORTAL / QUEUE / RELEASES, then
empty **SPARE** slots — fill the **first SPARE slot** with:

- **Label:** `TIDYMAC`
- **Action / URL:** `shortcuts://run-shortcut?name=TidyMac`
  (a macOS Shortcuts deep link; the row is "links only" — treat it like the
  other launcher URLs)

## Steps
1. **Locate the launcher definition.** Grep for the existing labels
   (`POINTFIELD`, `RELEASES`, `SPARE`, `ONE-CLICK`, `LAUNCHERS`) to find the
   array/config/component that renders these buttons. Read one launcher object's
   shape (label, url/href, color/variant, key…).
2. **Add TIDYMAC** in the first SPARE position, matching the existing objects'
   exact shape and styling — add it to the same data structure the others come
   from, not hardcoded elsewhere. Give it a distinct tile color like the named
   launchers (not the grey SPARE style). If SPARE is a placeholder object,
   replace the first one; if SPAREs are auto-filled padding, insert TIDYMAC as
   the first real entry after RELEASES.
3. **Build & verify it renders.** Install deps if needed, run build/dev server,
   confirm the TIDYMAC button appears in that slot with the right label and the
   `shortcuts://run-shortcut?name=TidyMac` link. Screenshot or describe it.
4. **Commit & push** on a feature branch (e.g. `claude/tidymac-launcher`), open a
   **draft PR**, and report the **exact commit SHA** + PR URL.

## Constraints
- Only touch the launcher config/component. Do **not** create or modify any
  TidyMac cleanup/engine scripts — TIDYMAC here is just a launcher link.
- The macOS Shortcut named `TidyMac` may not exist yet; that's fine. Don't wait
  for it — the button is only a link.

## Background (why this URL)
TidyMac is a manual macOS cleanup tool (lives in `cia-mac/cia-mac` →
`tools/tidymac/`). The user triggers it by a macOS Shortcut named exactly
`TidyMac`, which runs `~/.tidymac/tidymac.sh`. The dashboard button just fires
`shortcuts://run-shortcut?name=TidyMac` — the same deep link — so clicking the
launcher runs the Shortcut. Nothing about the engine needs to change here.
