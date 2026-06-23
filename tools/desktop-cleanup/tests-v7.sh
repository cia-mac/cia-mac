#!/bin/bash
# Reproducible v7 safety tests. Portable to macOS (BSD) and Linux (GNU).
# All fixtures under a single validated mktemp -d root; no relative rm.
set -u
ENG="${ENG:?set ENG=/abs/path/to/housekeeper.sh}"; case "$ENG" in /*) ;; *) ENG="$PWD/$ENG" ;; esac
INSTALLER="${INSTALLER:-}"; [ -n "$INSTALLER" ] && case "$INSTALLER" in /*) ;; *) INSTALLER="$PWD/$INSTALLER" ;; esac

TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/housekeeper-tests.XXXXXX") || exit 1
case "$TEST_ROOT" in
  "${TMPDIR:-/tmp}"/housekeeper-tests.*|/tmp/housekeeper-tests.*|/var/folders/*/housekeeper-tests.*) ;;
  *) echo "unsafe test root: $TEST_ROOT" >&2; exit 1 ;;
esac
cleanup(){ case "$TEST_ROOT" in /tmp/housekeeper-tests.*|"${TMPDIR:-/tmp}"/housekeeper-tests.*|/var/folders/*/housekeeper-tests.*) rm -rf "$TEST_ROOT" ;; esac; }
trap cleanup EXIT

pass=0; fail=0
ok(){ echo "  PASS: $1"; pass=$((pass+1)); }
no(){ echo "  FAIL: $1"; fail=$((fail+1)); }
H(){ printf '%s/%s' "$TEST_ROOT" "$1"; }
run1(){ HOME="$1" bash "$ENG" >/dev/null 2>&1; }
run2(){ HOME="$1" bash "$ENG" >/dev/null 2>&1; HOME="$1" bash "$ENG" >/dev/null 2>&1; }
set_old(){ touch -t "$(date -v-9M '+%Y%m%d%H%M' 2>/dev/null)" "$@" 2>/dev/null || touch -d '9 minutes ago' "$@" 2>/dev/null || touch "$@"; }
set_days(){ local n="$1"; shift; touch -t "$(date -v-"${n}"d '+%Y%m%d%H%M' 2>/dev/null)" "$@" 2>/dev/null || touch -d "${n} days ago" "$@" 2>/dev/null || touch "$@"; }
dev_of(){ stat -f %d "$1" 2>/dev/null || stat -c %d "$1" 2>/dev/null; }

echo "### 1. TWO-RUN STABILITY: not moved on run 1, moved on run 2 (B2) ###"
h=$(H A); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/ok.png"; set_old "$h/Desktop/ok.png"
run1 "$h"; m1=no; [ -e "$h/Desktop/Images/ok.png" ] && m1=yes
run1 "$h"; m2=no; [ -e "$h/Desktop/Images/ok.png" ] && m2=yes
{ [ "$m1" = no ] && [ "$m2" = yes ]; } && ok "stable file moves only on 2nd run" || no "two-run stability (run1=$m1 run2=$m2)"

echo "### 2. CHANGED-between-runs is NOT moved (B2) ###"
h=$(H A3); mkdir -p "$h/.cleanup" "$h/Desktop"; printf 'a' > "$h/Desktop/doc.txt"; set_old "$h/Desktop/doc.txt"
run1 "$h"; printf 'bbbb' >> "$h/Desktop/doc.txt"; set_old "$h/Desktop/doc.txt"; run1 "$h"
{ [ -e "$h/Desktop/doc.txt" ] && [ ! -e "$h/Desktop/Documents/doc.txt" ]; } && ok "changed file not moved" || no "changed not moved"

echo "### 3. FRESH + in-progress suffix never moved (even after 2 runs) ###"
h=$(H A2); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/fresh.png"; : > "$h/Desktop/movie.mp4.part"; set_old "$h/Desktop/movie.mp4.part"
run2 "$h"
{ [ -e "$h/Desktop/fresh.png" ] && [ -e "$h/Desktop/movie.mp4.part" ]; } && ok "fresh + .part never moved" || no "fresh/suffix"

echo "### 4. COLLISION preserves both copies ###"
h=$(H B); mkdir -p "$h/.cleanup" "$h/Downloads/Documents"; echo ORIG > "$h/Downloads/Documents/r.pdf"; echo NEW > "$h/Downloads/r.pdf"; set_old "$h/Downloads/r.pdf"
run2 "$h"
{ [ "$(cat "$h/Downloads/Documents/r.pdf")" = ORIG ] && [ -e "$h/Downloads/r.pdf" ]; } && ok "collision safe" || no "collision"

echo "### 5. HIDDEN files left alone; visible moved on 2nd run ###"
h=$(H C); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/.env"; : > "$h/Desktop/v.txt"; set_old "$h/Desktop/.env" "$h/Desktop/v.txt"
run2 "$h"
{ [ -e "$h/Desktop/.env" ] && [ -e "$h/Desktop/Documents/v.txt" ]; } && ok "dotfiles" || no "dotfiles"

echo "### 6. _cc_done_* only (single run); active _cc_* untouched ###"
h=$(H D); mkdir -p "$h/.cleanup" "$h/Developer/_cc_active" "$h/Developer/_cc_done_x"; : > "$h/Developer/_cc_loose.py"
run1 "$h"
{ [ -e "$h/Developer/_cc_active" ] && [ -e "$h/Developer/_cc_loose.py" ] && [ -e "$h/Developer/_archive_scratch"/*/_cc_done_x ]; } && ok "developer marker" || no "developer marker"

echo "### 7. ARCHIVE >30d; intermediate _Archive SYMLINK refused (B2 v6) ###"
h=$(H E); mkdir -p "$h/.cleanup" "$h/Downloads/Documents" "$h/outside"; ln -s "$h/outside" "$h/Downloads/_Archive"
: > "$h/Downloads/Documents/old.pdf"; set_days 40 "$h/Downloads/Documents/old.pdf"
run1 "$h"
{ [ -e "$h/Downloads/Documents/old.pdf" ] && [ -z "$(ls -A "$h/outside")" ] && grep -q 'symlink' "$h/.cleanup/housekeeper.log"; } && ok "intermediate symlink refused" || no "intermediate symlink"

echo "### 8. LOCK symlink rejected; target NOT deleted ###"
h=$(H F); mkdir -p "$h/.cleanup" "$h/elsewhere"; : > "$h/elsewhere/pid"; ln -s "$h/elsewhere" "$h/.cleanup/.lock"
run1 "$h"
{ [ -e "$h/elsewhere/pid" ] && grep -q 'lock is symlink' "$h/.cleanup/housekeeper.log"; } && ok "lock symlink rejected" || no "lock symlink"

echo "### 9. PREFLIGHT: symlinked root aborts whole run ###"
h=$(H G); mkdir -p "$h/.cleanup" "$h/realdesk" "$h/Downloads"; ln -s "$h/realdesk" "$h/Desktop"; : > "$h/Downloads/x.pdf"; set_old "$h/Downloads/x.pdf"
run1 "$h"
{ grep -q 'PREFLIGHT ABORT: symlink root' "$h/.cleanup/housekeeper.log" && [ -e "$h/Downloads/x.pdf" ]; } && ok "preflight whole-run abort" || no "preflight"

echo "### 10. CROSS-FILESYSTEM refused (if distinct fs available) ###"
alt=""; for c in /dev/shm "${TMPDIR:-/tmp}"; do [ -d "$c" ] && [ "$(dev_of "$c")" != "$(dev_of "$TEST_ROOT")" ] && { alt="$c"; break; }; done
if [ -n "$alt" ]; then
  h=$(H X); mkdir -p "$h/.cleanup"; dst="$alt/hk_dst.$$"; mkdir -p "$dst"; echo d > "$h/src.txt"
  HK_NO_RUN=1 HOME="$h" bash -c "source '$ENG'; safe_move '$h/src.txt' '$dst' '$alt'" >/dev/null 2>&1
  { [ -e "$h/src.txt" ] && [ -z "$(ls -A "$dst")" ] && grep -q 'cross-filesystem' "$h/.cleanup/housekeeper.log"; } && ok "cross-fs refused" || no "cross-fs"
  rm -rf "$dst"
else echo "  SKIP: no distinct filesystem available"; fi

echo "### 11. REPORT atomic on du failure ###"
h=$(H P); mkdir -p "$h/.cleanup" "$h/Developer/_backups" "$h/bin"; printf '#!/bin/bash\nexit 3\n' > "$h/bin/du"; chmod +x "$h/bin/du"
( PATH="$h/bin:$PATH" HK_NO_RUN=1 HOME="$h" bash -c "source '$ENG'; report_backups" ) >/dev/null 2>&1
{ ! ls "$h"/.cleanup/backups_report_*.txt >/dev/null 2>&1 && ! ls "$h"/.cleanup/.backups_report.partial.* >/dev/null 2>&1 && grep -q 'FAIL report' "$h/.cleanup/housekeeper.log"; } && ok "report atomic" || no "report atomic"

echo "### 12. PID lock: dead reclaimed; live respected ###"
h=$(H L); mkdir -p "$h/.cleanup/.lock"; printf '999999\n' > "$h/.cleanup/.lock/pid"; run1 "$h"
grep -q 'run end' "$h/.cleanup/housekeeper.log" && ok "dead reclaimed" || no "dead reclaim"
h=$(H L2); mkdir -p "$h/.cleanup/.lock"; printf '%s\n' "$$" > "$h/.cleanup/.lock/pid"; run1 "$h"
grep -q 'another instance running' "$h/.cleanup/housekeeper.log" && ok "live respected" || no "live respect"

echo "### 13. PID-REUSE: live PID with mismatched start time is reclaimed ###"
h=$(H R); mkdir -p "$h/.cleanup/.lock"; printf '%s\nBOGUS_START\n' "$$" > "$h/.cleanup/.lock/pid"; run1 "$h"
{ grep -q 'reused PID' "$h/.cleanup/housekeeper.log" && grep -q 'run end' "$h/.cleanup/housekeeper.log"; } && ok "pid-reuse reclaimed" || no "pid-reuse"

echo "### 14. INSTALLER refuses to overwrite existing engine ###"
if [ -n "$INSTALLER" ]; then
  h=$(H N); mkdir -p "$h/.cleanup"; printf 'PRECIOUS\n' > "$h/.cleanup/housekeeper.sh"
  out=$(HOME="$h" bash "$INSTALLER" </dev/null 2>&1); rc=$?
  { [ "$rc" -ne 0 ] && [ "$(cat "$h/.cleanup/housekeeper.sh")" = PRECIOUS ] && printf '%s' "$out" | grep -q 'already exists'; } && ok "installer refuses overwrite" || no "installer overwrite ($rc)"
else echo "  SKIP: INSTALLER not set"; fi

echo "### 15. INSTALLER happy path: installs + first run succeeds ###"
if [ -n "$INSTALLER" ]; then
  h=$(H M); mkdir -p "$h/Library/LaunchAgents" "$h/Desktop"; : > "$h/Desktop/pic.png"; set_old "$h/Desktop/pic.png"
  out=$(HOME="$h" bash "$INSTALLER" </dev/null 2>&1); rc=$?
  { [ "$rc" -eq 0 ] && [ -x "$h/.cleanup/housekeeper.sh" ] && [ -e "$h/Library/LaunchAgents/com.ciamac.housekeeper.plist" ]; } && ok "installer happy path" || no "installer happy ($rc)"
else echo "  SKIP: INSTALLER not set"; fi

echo
echo "SUMMARY: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
