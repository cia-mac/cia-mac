# Desktop / Downloads / Developer Housekeeper

A self-running macOS cleanup agent that keeps `~/Desktop`, `~/Downloads`, and
scratch in `~/Developer` tidy automatically — **without ever deleting,
overwriting, or losing a file.**

## What it does

Runs daily at noon and at login (via a `launchd` LaunchAgent), and:

- **Sorts** loose files in `~/Desktop` and `~/Downloads` into category folders:
  `Images / Video / Audio / Documents / Archives / Installers / Code / Other`.
- **Archives** `~/Downloads` files older than 30 days (installers: 7 days) into
  `~/Downloads/_Archive/YYYY-MM/`.
- **Sweeps Developer scratch** — but *only* items you explicitly rename to start
  with `_cc_done_` — into `~/Developer/_archive_scratch/YYYY-MM/`. Real projects
  and un-marked `_cc_*` work are never touched.
- **Reports** the size of `~/Developer/_backups` (read-only) to
  `~/.cleanup/backups_report_<timestamp>.txt`.

Every action is logged to `~/.cleanup/housekeeper.log`. **Nothing is ever
deleted** — old files move to an `_Archive` you empty yourself.

## Install

```sh
# one time, on the Mac:
open tools/desktop-cleanup/install-auto-cleanup.command   # or double-click it
```

macOS will likely prompt to grant the agent access to Desktop/Downloads
(TCC / Full Disk Access). Approve it once.

## Archive Developer scratch

The agent will not guess. To archive finished scratch, rename it:

```sh
mv _cc_fix3.py _cc_done_fix3.py        # file
mv _cc_eval    _cc_done_eval           # or a whole folder
```

On the next run, anything matching `_cc_done_*` is moved into
`_archive_scratch/YYYY-MM/`.

## Manage

```sh
launchctl unload ~/Library/LaunchAgents/com.ciamac.housekeeper.plist   # pause
launchctl load   ~/Library/LaunchAgents/com.ciamac.housekeeper.plist   # resume
cat ~/.cleanup/housekeeper.log                                         # what it did
cat ~/.cleanup/backups_report_*.txt                                    # _backups sizes
```

## Safety model

The single mover, `safe_move()`, refuses to act unless it is safe, and verifies
afterward:

- never overwrites (`mv -n` + explicit pre-check for existing file *or* symlink)
- never follows symlinks (source, destination dir, and target all checked)
- never crosses filesystems (compares device IDs; refuses if they differ, since
  a cross-fs `mv` is a non-atomic copy+delete)
- verifies the source is gone **and** the destination exists before logging
  success; logs `FAIL` otherwise

Additional protections:

- **PID-based single-instance lock** (`kill -0`) — never age-expired, so a long
  run is never interrupted by a second invocation; the lock is released only by
  its owner.
- **Preflight** probes every existing root for readability/enumeration and
  aborts the entire run on any permission/TCC failure (never treats a denied
  directory as "empty").
- **Settle time**: files modified in the last 120s, and known in-progress
  download suffixes (`.crdownload`, `.part`, `.download`, `.partial`, `.tmp`,
  `.opdownload`), are skipped so partial downloads are never moved.
- **Hidden files** (dotfiles like `.env`) are left alone.
- `~/.cleanup` is symlink-rejected and `chmod 700`.
- **No `find`**; portable `stat`/`du`/`sort` usage compatible with macOS
  `/bin/bash` 3.2 and BSD coreutils.
- The `_backups` report is built in a non-matching `.partial.$$` temp file and
  renamed into place only after every step succeeds, so a failed scan never
  leaves a partial report or blocks the next attempt.

## Review status

Independently audited twice (external review). Round 1 found 8 issues, round 2
found 4 blockers + several hardening items — all addressed in this version.
Recommended rollout: a dry run, then one manual real run with the log reviewed,
before relying on the daily schedule.
