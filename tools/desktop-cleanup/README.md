# Desktop / Downloads / Developer Housekeeper

A self-running macOS cleanup agent that keeps `~/Desktop`, `~/Downloads`, and
scratch in `~/Developer` tidy automatically. It **never deletes user content,
never overwrites, and never loses a file.** (It removes only its own
agent-owned lock directory and incomplete-report temp files.)

## What it does

Runs daily at noon and at login (via a `launchd` LaunchAgent), and:

- **Sorts** loose files in `~/Desktop` and `~/Downloads` into category folders:
  `Images / Video / Audio / Documents / Archives / Installers / Code / Other`.
  A file is moved **only after it has been observed unchanged across two
  separate runs** (two-run stability), so a file still being written — even one
  paused mid-write for minutes — is never moved.
- **Archives** `~/Downloads` files older than 30 days (installers: 7 days) into
  `~/Downloads/_Archive/YYYY-MM/`.
- **Sweeps Developer scratch** — but *only* items you explicitly rename to start
  with `_cc_done_` — into `~/Developer/_archive_scratch/YYYY-MM/`. Real projects
  and un-marked `_cc_*` work are never touched.
- **Reports** the size of `~/Developer/_backups` (read-only) to
  `~/.cleanup/backups_report_<timestamp>.txt`.

Every action is logged to `~/.cleanup/housekeeper.log`. **No user content is
ever deleted** — old files move to an `_Archive` you empty yourself.

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
- never follows a symlinked path component — destination directories are built
  one component at a time from a trusted root (`ensure_dir_no_symlink`), so an
  intermediate symlink such as `Downloads/_Archive -> /elsewhere` is refused,
  not traversed
- verifies the source is gone **and** the destination exists before logging
  success; logs `FAIL` otherwise

Additional protections:

- **PID-based single-instance lock** (`kill -0`) — never age-expired, so a long
  run is never interrupted by a second invocation; the lock is released only by
  its owner. A symlinked `.lock` (or `.lock/pid`) is rejected before any read or
  removal.
- **Preflight** probes every existing root for readability/enumeration/writability
  and aborts the entire run on any permission/TCC/symlink failure (never treats a
  denied directory as "empty").
- **Installer** refuses to overwrite an existing engine/plist, creates its temp
  artifacts with `mktemp` (fresh `O_EXCL` files, no predictable `$$` paths, no
  symlink following) and verifies they are regular non-symlink files, validates
  with `bash -n` and `plutil -lint` **before** installing, installs atomically,
  then runs once and reports a failed first run honestly (no false "Done").
  `chmod 700` on `~/.cleanup` fails closed. (If the plist path races in after the
  engine is written, the installer rolls back *its own* just-written engine —
  never user content.)
- **Two-run stability** for Desktop/Downloads: the engine records each loose
  file's `dev:inode:size:mtime` in an agent-owned state file and only moves it on
  a later run if every value is unchanged. The report partial file is also created
  with `mktemp`.
- **Lock** stores the owner PID *and* its process start time, so a reused PID
  after a crash is detected and the stale lock reclaimed.
- The launchd job runs with an explicit `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`).
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

Independently audited four times (external review). Round 1: 8 issues.
Round 2: 4 blockers + hardening. Round 3: 6 blockers (installer overwrite,
intermediate-symlink traversal, symlinked-lock deletion, unsafe test cleanup,
hidden install failure, install-before-validate) + hardening. Round 4: 2 blockers
(predictable `$$` temp paths → `mktemp`; age-only settle → two-run stability) plus
PID-reuse hardening — all addressed here. The portable test suite (`tests-v7.sh`)
runs every fixture under a validated `mktemp -d` root (16 assertions).

**Still required before trusting the daily schedule:** run on a real Mac and
confirm `/bin/bash --version` (3.2), `bash -n housekeeper.sh`, `plutil -lint`
the generated plist, and `bash tests-v6.sh` all pass under BSD tools. Then do
one manual run and review `~/.cleanup/housekeeper.log`.
