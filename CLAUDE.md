# Working principles (read me first)

How to work in this repo. The owner cares about these specifically.

## Solve the root problem, not the next request
- Lead with the **simplest solution that addresses the actual need**, and say so.
  Prefer fewer moving parts over more.
- When a request is drifting toward over-engineering (a background agent, a state
  machine, layers of hardening for a small job), **stop and name it.** Offer the
  right-sized alternative before building the heavy one.
- Don't stack patches. If repeated fixes signal the design is the wrong shape,
  say "back up — this is the wrong size" instead of adding another layer.
- No hollow, feel-good gestures. If something can't actually be done, say that
  plainly rather than faking progress.

## Be honest about boundaries
- This session runs in a Linux cloud sandbox. It **cannot reach the owner's Mac**
  and **cannot message ChatGPT** — those relays are manual. State that directly
  instead of pretending otherwise.

## tools/tidymac
On-demand macOS cleanup tool (formerly "Housekeeper"). Audited six rounds; code
audit passed. Default use is **manual-only** (a "TidyMac" Shortcut / dashboard
button running `~/.tidymac/tidymac.sh`), with no LaunchAgent loaded. The
installer + LaunchAgent path exists but is opt-in. Rename/behavior changes to the
engine should keep the audited safety properties intact (see tools/tidymac/README.md).
