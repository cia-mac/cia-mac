# Console v0 · local-first

**Status:** ratified 2026-05-24 (`09 · Path A local-first Console brief` + `09 · ChatGPT Path A recommendation · local-first Console`)

## The decision

**Console v0 is a local-first Artifact Workbench that runs on Ciamac's Mac at `http://localhost:8801`.**

`pipeline.ciamac.com` is **not** a v0 target. It is not deferred-for-later; it is removed from v0 scope. If a public surface ever becomes necessary, that is a separate v1+ product question with its own architecture decision — likely a read-only status surface, not a remoted Workbench.

The original brief (One Portal project context) described Console as a public URL operator surface. The synthesis reframe redescribed the *interaction* (grid → fullscreen workspace → bottom command bar) but was silent on deployment topology, and both Claude and ChatGPT initially missed the gap. Gemini's `07` review caught it. This document closes the gap.

## Why local-first is correct, not a downgrade

Console v0's action layer is built around macOS shell commands:

- `open <path>` to surface a folder in Finder
- `open <url>` to surface a page in Safari
- `pbcopy` to put a Resume Claude prompt on the clipboard
- `git rev-parse` / `git status` / `git log` / `git diff` for Audit Build

These are *correct* for a local surface. A remote deployment would have to either reimplement them as server-side no-ops, route them through a local daemon, or split the UI from the action layer entirely. All three add architectural complexity that gates the actual value of the Workbench (re-entry on local artifacts).

Local-first also resolves several open questions automatically:

- **Auth.** Single-user Mac is the auth.
- **Store unification.** No remote sync. The filesystem is the source of truth. Sidecars (`.portal.json`) are the registry.
- **Latency.** Sub-millisecond reads against `~/Developer/`. No network in the action path.
- **Privacy.** Nothing leaves the Mac unless an action explicitly involves an external service.

## What stays in scope for v0

- Grid view of artifacts as tiles (sidecar-discovered)
- Click → fullscreen workspace
- Six-button command bar (Open Preview, Open Folder, Resume Claude, Audit Build, Exit Ritual, Save for Later)
- INFO panel with editable re-entry fields
- Sidecar validation
- Iranshahr spelling and user-facing Console naming (already shipped on the branch)

## What is explicitly OUT of v0 scope

- Remote deployment (`pipeline.ciamac.com` or otherwise)
- Auth gate
- Vercel Blob / Supabase / cross-store sync
- Today recommendation card, Pieces matrix, COMMIT+DEPLOY
- Autonomous Claude controller, multi-agent loop
- True Ally absorption (currently iframe-as-tile; real merge is post-v0 work)
- Consult ChatGPT MCP automation
- Gemini bridge
- Review Room board / status panel / status field
- Tabs, filters, group-by, search, Cmd+K palette
- Notification dots, top-bar inbox, drawers
- Usage tracking (parked, per ChatGPT's `09`)
- Phase B mechanical rename (package name, env var, file extension, CSS class)

## How Console relates to the four-console consolidation problem

The original brief identified four console-shaped repos competing for one job: `ciamac-portal` (now Console), `ai-dashboard` (Ally), `rearview-dashboard`, `ciamac-essays-console`. The Surface Audit verdicts were KEEP / ABSORB / ARCHIVE / DEFER respectively.

Under Path A, those verdicts still hold, but absorption happens differently than originally planned:

- **Console** (`ciamac-portal`) keeps as the single Mac-local Workbench.
- **Ally** (`ai-dashboard`) is currently surfaced as an iframe-tile, which is containment, not absorption. Real absorption requires a workflow audit — identify Ally's daily-driver workflows, extract them into Console as first-class artifact actions, then retire Ally's standalone surface. This is post-v0 work.
- **rearview-dashboard** and **ciamac-essays-console** also need workflow audits before any absorption decision. Both are currently un-represented in Console.

Until those workflow audits happen, Ally remains the daily-driver surface. Console competes for that role; the success criterion is whether Ciamac opens Console first for re-entry tasks.

## Path A test criteria

Adapted from ChatGPT's `09 · ChatGPT Path A recommendation`. After v0.6 sits running locally for a personal-use trial period:

**Success signals:**

- Ciamac opens Console instead of `ai-dashboard` for artifact re-entry tasks.
- At least three real artifacts (not fixtures) get used through the workflow end-to-end.
- Resume Claude saves re-explanation time on at least one re-entry.
- Exit Ritual produces a useful return point that gets reused.
- Audit Build answers Ciamac's standard questions ("what works, what is fake, what is broken, rate it") in his own voice rather than as a technical diff.
- Sidecars do not feel like manual paperwork.

**Failure signals:**

- Ciamac keeps returning directly to `ai-dashboard`.
- Sidecars rot — the grid drifts out of sync with reality and Ciamac stops trusting it.
- Console feels like a museum of artifacts rather than a working surface.
- The Ally iframe-tile becomes a permanent substitute for real absorption.

If failure signals dominate the trial, the next decision is between (i) fixing the friction inside Path A, (ii) revisiting Path C (kill Console, expand Ally), or (iii) considering a different surface entirely (Raycast suite, Swift menu bar).

## Related Notion pages

- `Console v0.6 · Build Audit Packet` — what was built
- `07 · Gemini review · Console v0.6` — the critique that caught the topology gap
- `08 · Claude reconciliation · Console v0.6` — three paths laid out
- `09 · Path A local-first Console brief` — Claude's formal brief locking Path A
- `09 · ChatGPT Path A recommendation · local-first Console` — ChatGPT's concurring recommendation

## Status

Build is paused until Ciamac ratifies the path and chooses the priority order for the next set of work. The branch `claude/portal-synthesis-lsUou` remains a draft PR. The two correctness commits already pushed (Iranshahr fix, Phase A rename) are safe under Path A.
