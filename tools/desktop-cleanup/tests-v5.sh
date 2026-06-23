#!/bin/bash
# Reproducible v5 safety tests. Run from the dir containing eng5.sh (the engine,
# identical to tools/desktop-cleanup/housekeeper.sh). Linux/GNU or macOS/BSD.
set -u
ENG="${ENG:-./eng5.sh}"
pass=0; fail=0
ok(){ echo "  PASS: $1"; pass=$((pass+1)); }
no(){ echo "  FAIL: $1"; fail=$((fail+1)); }

echo "### 1. CROSS-FILESYSTEM move must ABORT (src preserved, dest empty) ###"
if [ -d /dev/shm ] && [ "$(stat -c %d . 2>/dev/null)" != "$(stat -c %d /dev/shm 2>/dev/null)" ]; then
  rm -rf X && mkdir -p X/.cleanup; SHM=/dev/shm/hk_$$; rm -rf "$SHM"; mkdir -p "$SHM/dest"; echo d > X/src.txt
  HK_NO_RUN=1 HOME="$PWD/X" bash -c "source $ENG; safe_move '$PWD/X/src.txt' '$SHM/dest'" >/dev/null 2>&1
  { [ -e X/src.txt ] && [ -z "$(ls -A "$SHM/dest")" ] && grep -q 'ABORT cross-filesystem' X/.cleanup/housekeeper.log; } && ok "cross-fs aborted" || no "cross-fs"
  rm -rf "$SHM"
else echo "  SKIP: no distinct fs available for this test"; fi

echo "### 2. SAME-FS move still works ###"
rm -rf Y && mkdir -p Y/.cleanup; echo d > Y/a.txt
HK_NO_RUN=1 HOME="$PWD/Y" bash -c "source $ENG; safe_move '$PWD/Y/a.txt' '$PWD/Y/Documents'" >/dev/null 2>&1
[ -e Y/Documents/a.txt ] && ok "same-fs move" || no "same-fs move"

echo "### 3. PID LOCK: dead owner reclaimed, live owner respected ###"
rm -rf Z && mkdir -p Z/.cleanup/.lock; echo 999999 > Z/.cleanup/.lock/pid
HOME="$PWD/Z" bash "$ENG" >/dev/null 2>&1
grep -q 'run end' Z/.cleanup/housekeeper.log && ok "dead-owner reclaimed" || no "dead-owner reclaim"
rm -rf Z2 && mkdir -p Z2/.cleanup/.lock; echo $$ > Z2/.cleanup/.lock/pid
HOME="$PWD/Z2" bash "$ENG" >/dev/null 2>&1
grep -q 'another instance running' Z2/.cleanup/housekeeper.log && ok "live-owner respected" || no "live-owner respect"

echo "### 4. REPORT ATOMIC: failing du leaves no committed report, no partial ###"
rm -rf P && mkdir -p P/.cleanup P/Developer/_backups P/bin
printf '#!/bin/bash\nexit 3\n' > P/bin/du; chmod +x P/bin/du
( export PATH="$PWD/P/bin:$PATH"; HK_NO_RUN=1 HOME="$PWD/P" bash -c "source $ENG; report_backups" ) >/dev/null 2>&1
{ ! ls P/.cleanup/backups_report_*.txt >/dev/null 2>&1 && ! ls P/.cleanup/.backups_report.partial.* >/dev/null 2>&1 \
  && grep -q 'FAIL report' P/.cleanup/housekeeper.log; } && ok "report atomic on failure" || no "report atomic"

echo "### 5. EMPTY _backups: no bare du; prints 'No visible entries.' ###"
rm -rf E && mkdir -p E/.cleanup E/Developer/_backups
HK_NO_RUN=1 HOME="$PWD/E" bash -c "source $ENG; report_backups" >/dev/null 2>&1
grep -q 'No visible entries' E/.cleanup/backups_report_*.txt && ok "empty backups handled" || no "empty backups"

echo "### 6. SETTLE: in-progress suffix + fresh files skipped; old file sorted ###"
rm -rf I && mkdir -p I/.cleanup I/Desktop
( cd I/Desktop && : > movie.mp4.part && : > fresh.png && : > ok.png && touch -d '5 minutes ago' movie.mp4.part ok.png )
HOME="$PWD/I" bash "$ENG" >/dev/null 2>&1
{ [ -e I/Desktop/movie.mp4.part ] && [ -e I/Desktop/fresh.png ] && [ -e I/Desktop/Images/ok.png ]; } && ok "settle + suffix" || no "settle + suffix"

echo "### 7. PREFLIGHT: a symlinked root aborts the WHOLE run ###"
rm -rf Q && mkdir -p Q/.cleanup Q/realdesk Q/Downloads; ln -s "$PWD/Q/realdesk" Q/Desktop
( cd Q/Downloads && : > x.pdf && touch -d '5 minutes ago' x.pdf )
HOME="$PWD/Q" bash "$ENG" >/dev/null 2>&1
{ grep -q 'PREFLIGHT ABORT: symlink root' Q/.cleanup/housekeeper.log && [ -e Q/Downloads/x.pdf ]; } && ok "preflight aborts whole run" || no "preflight"

echo "### 8. COLLISION: existing target preserved, incoming not lost ###"
rm -rf C && mkdir -p C/.cleanup C/Downloads/Documents
echo ORIGINAL > C/Downloads/Documents/r.pdf; echo INCOMING > C/Downloads/r.pdf
( cd C/Downloads && touch -d '5 minutes ago' r.pdf )
HOME="$PWD/C" bash "$ENG" >/dev/null 2>&1
{ [ "$(cat C/Downloads/Documents/r.pdf)" = ORIGINAL ] && [ -e C/Downloads/r.pdf ]; } && ok "collision safe" || no "collision"

echo "### 9. HIDDEN files left alone ###"
rm -rf H && mkdir -p H/.cleanup H/Desktop
( cd H/Desktop && : > .env && : > vis.txt && touch -d '5 minutes ago' .env vis.txt )
HOME="$PWD/H" bash "$ENG" >/dev/null 2>&1
{ [ -e H/Desktop/.env ] && [ -e H/Desktop/Documents/vis.txt ]; } && ok "dotfiles protected" || no "dotfiles"

echo
echo "SUMMARY: $pass passed, $fail failed"
