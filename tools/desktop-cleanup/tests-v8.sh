#!/bin/bash
# Reproducible v8 safety tests. Portable to macOS (BSD) and Linux (GNU).
# All fixtures under a validated mktemp -d root; no relative rm.
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
set_old(){ touch -t "$(date -v-9M '+%Y%m%d%H%M' 2>/dev/null)" "$@" 2>/dev/null || touch -d '9 minutes ago' "$@" 2>/dev/null || touch "$@"; }
set_days(){ local n="$1"; shift; touch -t "$(date -v-"${n}"d '+%Y%m%d%H%M' 2>/dev/null)" "$@" 2>/dev/null || touch -d "${n} days ago" "$@" 2>/dev/null || touch "$@"; }
dev_of(){ stat -f %d "$1" 2>/dev/null || stat -c %d "$1" 2>/dev/null; }
backdate(){ local sf="$1" s="$2"; [ -f "$sf" ] || return 0; awk -v s="$s" '{$3=$3-s; print}' "$sf" > "$sf.bd" && mv "$sf.bd" "$sf"; }
R(){ HOME="$1" bash "$ENG" >/dev/null 2>&1; }

echo "### 1. TIME STABILITY: run1=no, immediate run2=no (B1), after 13h=yes (B2) ###"
h=$(H A); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/ok.png"; set_old "$h/Desktop/ok.png"
R "$h"; a1=no; [ -e "$h/Desktop/Images/ok.png" ] && a1=yes
R "$h"; a2=no; [ -e "$h/Desktop/Images/ok.png" ] && a2=yes
backdate "$h/.cleanup/seen_desktop.state" 46800
R "$h"; a3=no; [ -e "$h/Desktop/Images/ok.png" ] && a3=yes
{ [ "$a1" = no ] && [ "$a2" = no ] && [ "$a3" = yes ]; } && ok "time-based stability (run1=$a1 run2=$a2 aged=$a3)" || no "time stability ($a1/$a2/$a3)"

echo "### 2. CHANGED before stable: identity reset, not moved ###"
h=$(H B); mkdir -p "$h/.cleanup" "$h/Desktop"; printf 'a' > "$h/Desktop/d.txt"; set_old "$h/Desktop/d.txt"
R "$h"; backdate "$h/.cleanup/seen_desktop.state" 46800; printf 'zzzz' >> "$h/Desktop/d.txt"; set_old "$h/Desktop/d.txt"; R "$h"
{ [ -e "$h/Desktop/d.txt" ] && [ ! -e "$h/Desktop/Documents/d.txt" ]; } && ok "changed-before-stable not moved" || no "changed not moved"

echo "### 3. FRESH + in-progress suffix never moved ###"
h=$(H C); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/fresh.png"; : > "$h/Desktop/m.mp4.part"; set_old "$h/Desktop/m.mp4.part"
R "$h"; backdate "$h/.cleanup/seen_desktop.state" 46800; R "$h"
{ [ -e "$h/Desktop/fresh.png" ] && [ -e "$h/Desktop/m.mp4.part" ]; } && ok "fresh + .part never moved" || no "fresh/suffix"

echo "### 4. COLLISION preserves both copies ###"
h=$(H D); mkdir -p "$h/.cleanup" "$h/Downloads/Documents"; echo ORIG > "$h/Downloads/Documents/r.pdf"; echo NEW > "$h/Downloads/r.pdf"; set_old "$h/Downloads/r.pdf"
R "$h"; backdate "$h/.cleanup/seen_downloads.state" 46800; R "$h"
{ [ "$(cat "$h/Downloads/Documents/r.pdf")" = ORIG ] && [ -e "$h/Downloads/r.pdf" ]; } && ok "collision safe" || no "collision"

echo "### 5. HIDDEN left alone; visible moves after stability ###"
h=$(H E); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/.env"; : > "$h/Desktop/v.txt"; set_old "$h/Desktop/.env" "$h/Desktop/v.txt"
R "$h"; backdate "$h/.cleanup/seen_desktop.state" 46800; R "$h"
{ [ -e "$h/Desktop/.env" ] && [ -e "$h/Desktop/Documents/v.txt" ]; } && ok "dotfiles" || no "dotfiles"

echo "### 6. _cc_done_* only (single run) ###"
h=$(H F); mkdir -p "$h/.cleanup" "$h/Developer/_cc_active" "$h/Developer/_cc_done_x"; : > "$h/Developer/_cc_loose.py"; R "$h"
{ [ -e "$h/Developer/_cc_active" ] && [ -e "$h/Developer/_cc_loose.py" ] && [ -e "$h/Developer/_archive_scratch"/*/_cc_done_x ]; } && ok "developer marker" || no "developer marker"

echo "### 7. ARCHIVE >30d; intermediate _Archive SYMLINK refused ###"
h=$(H G); mkdir -p "$h/.cleanup" "$h/Downloads/Documents" "$h/outside"; ln -s "$h/outside" "$h/Downloads/_Archive"; : > "$h/Downloads/Documents/old.pdf"; set_days 40 "$h/Downloads/Documents/old.pdf"; R "$h"
{ [ -e "$h/Downloads/Documents/old.pdf" ] && [ -z "$(ls -A "$h/outside")" ] && grep -q 'symlink' "$h/.cleanup/housekeeper.log"; } && ok "intermediate symlink refused" || no "intermediate symlink"

echo "### 8. LOCK symlink rejected; target NOT deleted ###"
h=$(H I); mkdir -p "$h/.cleanup" "$h/elsewhere"; : > "$h/elsewhere/pid"; ln -s "$h/elsewhere" "$h/.cleanup/.lock"; R "$h"
{ [ -e "$h/elsewhere/pid" ] && grep -q 'lock is symlink' "$h/.cleanup/housekeeper.log"; } && ok "lock symlink rejected" || no "lock symlink"

echo "### 9. PREFLIGHT symlinked root aborts whole run ###"
h=$(H J); mkdir -p "$h/.cleanup" "$h/realdesk" "$h/Downloads"; ln -s "$h/realdesk" "$h/Desktop"; : > "$h/Downloads/x.pdf"; set_old "$h/Downloads/x.pdf"; R "$h"
{ grep -q 'PREFLIGHT ABORT: symlink root' "$h/.cleanup/housekeeper.log" && [ -e "$h/Downloads/x.pdf" ]; } && ok "preflight whole-run abort" || no "preflight"

echo "### 10. CROSS-FS refused (if distinct fs) ###"
alt=""; for c in /dev/shm "${TMPDIR:-/tmp}"; do [ -d "$c" ] && [ "$(dev_of "$c")" != "$(dev_of "$TEST_ROOT")" ] && { alt="$c"; break; }; done
if [ -n "$alt" ]; then
  h=$(H X); mkdir -p "$h/.cleanup"; dst="$alt/hk_dst.$$"; mkdir -p "$dst"; echo d > "$h/src.txt"
  HK_NO_RUN=1 HOME="$h" bash -c "source '$ENG'; safe_move '$h/src.txt' '$dst' '$alt'" >/dev/null 2>&1
  { [ -e "$h/src.txt" ] && [ -z "$(ls -A "$dst")" ] && grep -q 'cross-filesystem' "$h/.cleanup/housekeeper.log"; } && ok "cross-fs refused" || no "cross-fs"
  rm -rf "$dst"
else echo "  SKIP: no distinct fs"; fi

echo "### 11. REPORT atomic on du failure ###"
h=$(H P); mkdir -p "$h/.cleanup" "$h/Developer/_backups" "$h/bin"; printf '#!/bin/bash\nexit 3\n' > "$h/bin/du"; chmod +x "$h/bin/du"
( PATH="$h/bin:$PATH" HK_NO_RUN=1 HOME="$h" bash -c "source '$ENG'; report_backups" ) >/dev/null 2>&1
{ ! ls "$h"/.cleanup/backups_report_*.txt >/dev/null 2>&1 && ! ls "$h"/.cleanup/.backups_report.partial.* >/dev/null 2>&1 && grep -q 'FAIL report' "$h/.cleanup/housekeeper.log"; } && ok "report atomic" || no "report atomic"

echo "### 12. PID lock dead reclaimed / live respected / reuse reclaimed ###"
h=$(H L); mkdir -p "$h/.cleanup/.lock"; printf '999999\n' > "$h/.cleanup/.lock/pid"; R "$h"; grep -q 'run end' "$h/.cleanup/housekeeper.log" && ok "dead reclaimed" || no "dead reclaim"
h=$(H L2); mkdir -p "$h/.cleanup/.lock"; printf '%s\n' "$$" > "$h/.cleanup/.lock/pid"; R "$h"; grep -q 'another instance running' "$h/.cleanup/housekeeper.log" && ok "live respected" || no "live respect"
h=$(H L3); mkdir -p "$h/.cleanup/.lock"; printf '%s\nBOGUS\n' "$$" > "$h/.cleanup/.lock/pid"; R "$h"; { grep -q 'reused PID' "$h/.cleanup/housekeeper.log" && grep -q 'run end' "$h/.cleanup/housekeeper.log"; } && ok "pid-reuse reclaimed" || no "pid-reuse"

echo "### 13. STATE is whitespace-safe (path with spaces) ###"
h=$(H S); mkdir -p "$h/.cleanup" "$h/Desktop"; : > "$h/Desktop/my report.png"; set_old "$h/Desktop/my report.png"
R "$h"; backdate "$h/.cleanup/seen_desktop.state" 46800; R "$h"
[ -e "$h/Desktop/Images/my report.png" ] && ok "path with spaces handled" || no "spaces"

echo "### 14. INSTALLER refuses overwrite ###"
if [ -n "$INSTALLER" ]; then
  h=$(H N); mkdir -p "$h/.cleanup"; printf 'PRECIOUS\n' > "$h/.cleanup/housekeeper.sh"
  out=$(HOME="$h" bash "$INSTALLER" </dev/null 2>&1); rc=$?
  { [ "$rc" -ne 0 ] && [ "$(cat "$h/.cleanup/housekeeper.sh")" = PRECIOUS ] && printf '%s' "$out" | grep -q 'already exists'; } && ok "installer refuses overwrite" || no "installer overwrite ($rc)"
else echo "  SKIP"; fi

echo "### 15. INSTALLER rejects symlinked \$HOME/Library (B3) ###"
if [ -n "$INSTALLER" ]; then
  h=$(H Y); mkdir -p "$h/realLib" "$h/Desktop"; ln -s "$h/realLib" "$h/Library"
  out=$(HOME="$h" bash "$INSTALLER" </dev/null 2>&1); rc=$?
  { [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q 'Library is a symlink' && [ ! -e "$h/realLib/LaunchAgents" ]; } && ok "installer rejects symlinked Library" || no "library symlink ($rc)"
else echo "  SKIP"; fi

echo "### 16. INSTALLER happy path: installs, verifies inode, first run ok ###"
if [ -n "$INSTALLER" ]; then
  h=$(H M); mkdir -p "$h/Desktop"; : > "$h/Desktop/pic.png"; set_old "$h/Desktop/pic.png"
  out=$(HOME="$h" bash "$INSTALLER" </dev/null 2>&1); rc=$?
  { [ "$rc" -eq 0 ] && [ -f "$h/.cleanup/housekeeper.sh" ] && [ ! -L "$h/.cleanup/housekeeper.sh" ] && [ -f "$h/Library/LaunchAgents/com.ciamac.housekeeper.plist" ]; } && ok "installer happy path" || no "installer happy ($rc)"
else echo "  SKIP"; fi

echo
echo "SUMMARY: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
