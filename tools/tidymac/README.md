# TidyMac — Desktop / Downloads / Developer cleanup

A macOS cleanup tool that keeps `~/Desktop`, `~/Downloads`, and scratch in
`~/Developer` tidy. Run it on demand (e.g. from a "TidyMac" Shortcut / dashboard
button) or install it as a daily LaunchAgent. It **never deletes user content,
never overwrites, and never loses a file.** (It removes only its own
agent-owned lock directory and incomplete-report temp files.)

## What it does

Runs daily at noon and at login (via a `launchd` LaunchAgent), and:

- **Sorts** loose files in `~/Desktop` and `~/Downloads` into category folders:
  `Images / Video / Audio / Documents / Archives / Installers / Code / Other`.
  A file is moved **only after its identity (`dev:inode:size:mtime`) has stayed
  unchanged for at least 12 hours** (time-based stability), recorded in an
  agent-owned state file. So a file still being written — even one paused
  mid-write, and even across the install's immediate second run — is never moved.
- **Flags likely clutter** into a **`To Be Deleted/`** review folder in
  `~/Desktop` and `~/Downloads` (created automatically). Only files classified as
  *likely disposable* by name/type/size — **never by age** — are moved there, and
  each move is logged with its reason. **TidyMac never empties, purges, archives,
  or deletes anything inside `To Be Deleted/`** — it only ever moves files *in*,
  for you to review and delete by hand. Name collisions keep both files (never
  overwritten). See "What goes to To Be Deleted" below.
- **Archives** `~/Downloads` files older than 30 days (installers: 7 days) into
  `~/Downloads/_Archive/YYYY-MM/`.
- **Sweeps Developer scratch** — but *only* items you explicitly rename to start
  with `_cc_done_` — into `~/Developer/_archive_scratch/YYYY-MM/`. Real projects
  and un-marked `_cc_*` work are never touched.
- **Reports** the size of `~/Developer/_backups` (read-only) to
  `~/.tidymac/backups_report_<timestamp>.txt`.

Every action is logged to `~/.tidymac/tidymac.log`. **No user content is
ever deleted** — old files move to an `_Archive` you empty yourself, and likely
clutter moves to `To Be Deleted/` which you empty yourself.

## What goes to To Be Deleted

A loose file in `~/Desktop` or `~/Downloads` is moved to that folder's
`To Be Deleted/` **only** if it matches one of these — all based on name, type,
or size, **never on age alone**:

| Signal | Reason logged | Examples |
|---|---|---|
| Empty file (0 bytes) | `empty file (0 bytes)` | a 0-byte `notes.txt` |
| Scratch/backup extension | `temp/scratch file (.ext)` | `.bak .old .dmp .swp .swo .cache` |
| Editor backup suffix | `editor backup (~)` | `report.txt~` |
| Known OS junk file | `OS junk file` | `Thumbs.db`, `desktop.ini` |
| Duplicate "copy" name | `duplicate copy` | `report copy.pdf`, `notes copy 2.txt` |
| macOS numbered duplicate | `duplicate copy (numbered)` | `photo (1).jpg`, `file (2).pdf` |
| Placeholder name | `placeholder name (untitled)` | `Untitled.rtf`, `untitled 3` |

Deliberately **not** clutter: anything judged only by age; in-progress downloads
(`.crdownload .part .download .partial .tmp .opdownload` are left in place);
hidden/dotfiles (left untouched); names like `Invoice (2024).pdf` (4-digit
"(year)" is not treated as a numbered duplicate). Because `To Be Deleted/` is a
**review** folder you empty yourself, a wrong guess is harmless — you just move
the file back out.

## Use it (manual button — recommended)

This is the default: a "TidyMac" Shortcut you trigger yourself (e.g. from a
dashboard launcher). **No LaunchAgent, no schedule** — it only runs when you click.

```sh
# 1. Check the engine on your Mac (installs nothing, loads nothing):
/bin/bash run-macos-tests.sh        # expect: SUMMARY: 16 passed, 0 failed

# 2. Place the engine:
mkdir -p ~/.tidymac && chmod 700 ~/.tidymac
cp ./tidymac.sh ~/.tidymac/tidymac.sh && chmod 700 ~/.tidymac/tidymac.sh
```

3. **Make the Shortcut** (Shortcuts.app → ＋ → name it exactly `TidyMac` → add a
   **Run Shell Script** action, Shell `/bin/bash`, body:
   `/bin/bash "$HOME/.tidymac/tidymac.sh"; /usr/bin/tail -n 25 "$HOME/.tidymac/tidymac.log"`).
4. **Dashboard button** → set the launcher URL to `shortcuts://run-shortcut?name=TidyMac`.

Verify: `shortcuts run TidyMac` (or click the button) then `tail -n 5 ~/.tidymac/tidymac.log`.

## Optional: scheduled install (opt-in, loads a LaunchAgent)

If you'd rather it run daily/at login instead of on demand:

```sh
open install-tidymac.command   # validates, installs the engine + LaunchAgent
```

macOS will prompt to grant access to Desktop/Downloads (TCC / Full Disk Access).

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
launchctl unload ~/Library/LaunchAgents/com.ciamac.tidymac.plist   # pause
launchctl load   ~/Library/LaunchAgents/com.ciamac.tidymac.plist   # resume
cat ~/.tidymac/tidymac.log                                         # what it did
cat ~/.tidymac/backups_report_*.txt                                    # _backups sizes
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
- verifies after `mv -n` that the **source is gone (including symlink), the
  destination is a non-symlink, and the destination's `device:inode` equals the
  source's captured `device:inode`** before logging success; logs `FAIL`
  otherwise. This closes the gap where a destination appearing between the
  collision check and the move could be mistaken for success. The same inode
  verification is applied to the `_backups` report write. Works for both regular
  files and `_cc_done_*` directories.

Additional protections:

- **PID-based single-instance lock** (`kill -0`) — never age-expired, so a long
  run is never interrupted by a second invocation; the lock is released only by
  its owner. A symlinked `.lock` (or `.lock/pid`) is rejected before any read or
  removal.
- **Preflight** probes every existing root for readability/enumeration/writability
  and aborts the entire run on any permission/TCC/symlink failure (never treats a
  denied directory as "empty").
- **Installer** refuses to overwrite an existing engine/plist; creates its temp
  artifacts with `mktemp` (fresh `O_EXCL` files, no predictable `$$` paths, no
  symlink following); validates with `bash -n` and `plutil -lint` **before**
  installing; and after each `mv -n` **verifies the install by device:inode**
  (the temp is gone and the destination is the same regular non-symlink inode),
  so a destination appearing mid-window can't be mistaken for success. It creates
  `$HOME/Library` and `$HOME/Library/LaunchAgents` **component-by-component**,
  rejecting a symlink at any level. It then runs once and reports a failed first
  run honestly (no false "Done"). `chmod 700` on `~/.tidymac` fails closed. (If
  the plist races in after the engine is written, the installer rolls back *its
  own* just-written engine — verified by inode — never user content.)
- **Time-based stability** for Desktop/Downloads: the engine records each loose
  file's `dev:inode:size:mtime` plus a `first_seen` timestamp in an agent-owned
  state file (whitespace-safe, keyed by a SHA-256 of the path) and only moves the
  file once that identity has held for ≥12 hours. The report partial file is also
  created with `mktemp`.
- **Lock** stores the owner PID *and* its process start time, so a reused PID
  after a crash is detected and the stale lock reclaimed.
- The launchd job runs with an explicit `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`).
- **Settle time**: files modified in the last 120s, and known in-progress
  download suffixes (`.crdownload`, `.part`, `.download`, `.partial`, `.tmp`,
  `.opdownload`), are skipped so partial downloads are never moved.
- **Hidden files** (dotfiles like `.env`) are left alone.
- `~/.tidymac` is symlink-rejected and `chmod 700`.
- **No `find`**; portable `stat`/`du`/`sort` usage compatible with macOS
  `/bin/bash` 3.2 and BSD coreutils.
- The `_backups` report is built in a non-matching `.partial.$$` temp file and
  renamed into place only after every step succeeds, so a failed scan never
  leaves a partial report or blocks the next attempt.

## Review status

Independently audited six times (external review). Round 1: 8 issues.
Round 2: 4 blockers + hardening. Round 3: 6 blockers (installer overwrite,
intermediate-symlink traversal, symlinked-lock deletion, unsafe test cleanup,
hidden install failure, install-before-validate) + hardening. Round 4: 2 blockers
(predictable `$$` temp paths → `mktemp`; age-only settle → two-run stability) plus
PID-reuse hardening. Round 5: 3 blockers (seconds-fast stability under RunAtLoad
→ 12h time-based stability; unverified installer `mv -n` → device:inode
verification; symlinked `~/Library` → component-by-component creation) plus a
whitespace-safe state format. Round 6: 1 blocker (safe_move/report mv now verify
the destination is the same device:inode as the source) plus SHA-256 state keys —
all addressed here. The portable suite (`tidymac-tests.sh`) runs every fixture under a
validated `mktemp -d` root (19 assertions).

**Still required before trusting the daily schedule:** run on a real Mac and
confirm `/bin/bash --version` (3.2), `bash -n tidymac.sh`, `plutil -lint`
the generated plist, and `ENG="$PWD/tidymac.sh" bash tidymac-tests.sh` all pass
under BSD tools. Then do one manual run and review `~/.tidymac/tidymac.log`.
