#!/bin/bash
set -euo pipefail

CLEAN="$HOME/.tidymac"
if [ -L "$CLEAN" ]; then printf 'refusing: %s is a symlink\n' "$CLEAN" >&2; exit 1; fi
mkdir -p "$CLEAN"
if ! chmod 700 "$CLEAN"; then printf 'cannot secure %s\n' "$CLEAN" >&2; exit 1; fi
LOG="$CLEAN/tidymac.log"
log(){ printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG"; }

file_mtime(){ local m; if m=$(stat -f %m "$1" 2>/dev/null); then printf '%s' "$m"; return 0; fi; if m=$(stat -c %Y "$1" 2>/dev/null); then printf '%s' "$m"; return 0; fi; return 1; }
file_dev(){   local d; if d=$(stat -f %d "$1" 2>/dev/null); then printf '%s' "$d"; return 0; fi; if d=$(stat -c %d "$1" 2>/dev/null); then printf '%s' "$d"; return 0; fi; return 1; }
file_ident(){ local s; if s=$(stat -f '%d:%i:%z:%m' "$1" 2>/dev/null); then printf '%s' "$s"; return 0; fi; if s=$(stat -c '%d:%i:%s:%Y' "$1" 2>/dev/null); then printf '%s' "$s"; return 0; fi; return 1; }
file_devino(){ local s; if s=$(stat -f '%d:%i' "$1" 2>/dev/null); then printf '%s' "$s"; return 0; fi; if s=$(stat -c '%d:%i' "$1" 2>/dev/null); then printf '%s' "$s"; return 0; fi; return 1; }
proc_start(){ ps -o lstart= -p "$1" 2>/dev/null | tr -s ' ' | sed 's/^ *//;s/ *$//'; }
_sha256(){ if command -v shasum >/dev/null 2>&1; then shasum -a 256; elif command -v sha256sum >/dev/null 2>&1; then sha256sum; else cksum; fi; }
# collision-resistant, whitespace/newline-safe key for a path (SHA-256 hex)
path_key(){ printf '%s' "$1" | _sha256 | awk '{print $1}'; }
now_epoch(){ date +%s; }
SETTLE=120           # mtime floor (seconds) before a file is even considered
STABLE_SECS=43200    # identity must hold this long (12h) before moving

ensure_dir_no_symlink(){
  local root="$1" dir="$2" rel cur comp rc=0
  if [ -L "$root" ] || [ ! -d "$root" ]; then log "ABORT root invalid: $root"; return 1; fi
  case "$dir" in
    "$root") return 0 ;;
    "$root"/*) rel="${dir#"$root"/}" ;;
    *) log "ABORT dir not under root: $dir"; return 1 ;;
  esac
  cur="$root"
  local IFS=/
  set -f
  for comp in $rel; do
    if [ -z "$comp" ]; then continue; fi
    if [ "$comp" = "." ] || [ "$comp" = ".." ]; then log "ABORT bad component: $dir"; rc=1; break; fi
    cur="$cur/$comp"
    if [ -L "$cur" ]; then log "ABORT symlink component: $cur"; rc=1; break; fi
    if [ -e "$cur" ]; then
      if [ ! -d "$cur" ]; then log "ABORT non-dir component: $cur"; rc=1; break; fi
    else
      if ! mkdir "$cur" 2>/dev/null; then log "FAIL mkdir: $cur"; rc=1; break; fi
      if [ -L "$cur" ]; then log "ABORT symlink after mkdir: $cur"; rc=1; break; fi
    fi
  done
  set +f
  return $rc
}

LOCK="$CLEAN/.lock"
write_lock_owner(){ { printf '%s\n' "$$"; proc_start "$$"; } > "$LOCK/pid"; }
acquire_lock(){
  if [ -L "$LOCK" ]; then log "ABORT lock is symlink: $LOCK"; return 2; fi
  if [ -e "$LOCK" ] && [ ! -d "$LOCK" ]; then log "ABORT lock not a dir: $LOCK"; return 2; fi
  if mkdir "$LOCK" 2>/dev/null; then write_lock_owner; return 0; fi
  if [ -L "$LOCK" ]; then log "ABORT lock is symlink: $LOCK"; return 2; fi
  if [ -L "$LOCK/pid" ]; then log "ABORT lock/pid is symlink"; return 2; fi
  local pid sstart nstart
  pid=$(sed -n '1p' "$LOCK/pid" 2>/dev/null || true)
  sstart=$(sed -n '2p' "$LOCK/pid" 2>/dev/null || true)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    nstart=$(proc_start "$pid")
    if [ -z "$sstart" ] || [ -z "$nstart" ] || [ "$sstart" = "$nstart" ]; then return 1; fi
    log "lock held by reused PID $pid (start mismatch); reclaiming"
  fi
  if [ -L "$LOCK/pid" ]; then log "ABORT lock/pid is symlink"; return 2; fi
  rm -f "$LOCK/pid" 2>/dev/null || true; rmdir "$LOCK" 2>/dev/null || true
  if [ -L "$LOCK" ]; then log "ABORT lock is symlink: $LOCK"; return 2; fi
  if mkdir "$LOCK" 2>/dev/null; then write_lock_owner; return 0; fi
  return 1
}
release_lock(){
  [ -L "$LOCK" ] && return 0
  [ -L "$LOCK/pid" ] && return 0
  local pid; pid=$(sed -n '1p' "$LOCK/pid" 2>/dev/null || true)
  [ "$pid" = "$$" ] && { rm -f "$LOCK/pid" 2>/dev/null || true; rmdir "$LOCK" 2>/dev/null || true; }
}

safe_move(){
  local src="$1" destdir="$2" root="$3" base target sdev ddev sdi tdi
  base=$(basename "$src")
  if [ -L "$src" ];  then log "SKIP symlink source: $src"; return 1; fi
  if [ ! -e "$src" ]; then log "SKIP vanished: $src"; return 1; fi
  if ! sdi=$(file_devino "$src"); then log "FAIL stat devino src: $src"; return 1; fi
  if [ -e "$destdir" ] && [ ! -d "$destdir" ]; then log "ABORT dest not a dir: $destdir"; return 1; fi
  if ! ensure_dir_no_symlink "$root" "$destdir"; then log "ABORT unsafe destdir: $destdir"; return 1; fi
  if ! sdev=$(file_dev "$src");     then log "FAIL stat dev: $src"; return 1; fi
  if ! ddev=$(file_dev "$destdir"); then log "FAIL stat dev: $destdir"; return 1; fi
  if [ "$sdev" != "$ddev" ]; then log "ABORT cross-filesystem: $src -> $destdir"; return 1; fi
  target="$destdir/$base"
  if [ -e "$target" ] || [ -L "$target" ]; then log "SKIP collision: $target"; return 1; fi
  if ! mv -n "$src" "$target"; then log "FAIL mv: $src -> $target"; return 1; fi
  # post-move verification (works for files and _cc_done_* directories):
  # source fully gone (incl. symlink), dest present and not a symlink, and dest
  # is the SAME device:inode captured from the source before the move.
  if [ -e "$src" ] || [ -L "$src" ]; then log "FAIL src still present: $src"; return 1; fi
  if [ ! -e "$target" ] || [ -L "$target" ]; then log "FAIL dest missing/symlink: $target"; return 1; fi
  if ! tdi=$(file_devino "$target"); then log "FAIL stat devino dest: $target"; return 1; fi
  if [ "$tdi" != "$sdi" ]; then log "FAIL inode mismatch: $src ($sdi) -> $target ($tdi)"; return 1; fi
  log "MOVED $src -> $target"; return 0
}

bucket(){
  case "$(printf '%s' "${1##*.}" | tr '[:upper:]' '[:lower:]')" in
    png|jpg|jpeg|gif|heic|webp|bmp|tiff|svg) echo Images ;;
    mov|mp4|m4v|avi|mkv|webm)                echo Video ;;
    mp3|wav|aac|flac|m4a)                    echo Audio ;;
    pdf|doc|docx|pages|txt|rtf|md|csv|xls|xlsx|ppt|pptx|key|numbers) echo Documents ;;
    zip|tar|gz|tgz|rar|7z)                   echo Archives ;;
    dmg|pkg)                                 echo Installers ;;
    py|js|ts|sh|json|html|css|ipynb)         echo Code ;;
    *)                                       echo Other ;;
  esac
}

preflight(){
  local d
  for d in "$HOME/Desktop" "$HOME/Downloads" "$HOME/Developer"; do
    [ -e "$d" ] || continue
    [ -L "$d" ] && { log "PREFLIGHT ABORT: symlink root $d"; return 1; }
    [ -d "$d" ] || { log "PREFLIGHT ABORT: not a dir $d"; return 1; }
    [ -r "$d" ] || { log "PREFLIGHT ABORT: unreadable $d"; return 1; }
    [ -w "$d" ] || { log "PREFLIGHT ABORT: unwritable $d"; return 1; }
    ls "$d" >/dev/null 2>&1 || { log "PREFLIGHT ABORT: cannot enumerate $d (permission/TCC?)"; return 1; }
  done
  for d in "$HOME/Downloads/_Archive" "$HOME/Developer/_archive_scratch"; do
    [ -e "$d" ] || continue
    [ -L "$d" ] && { log "PREFLIGHT ABORT: symlink archive $d"; return 1; }
    [ -d "$d" ] || { log "PREFLIGHT ABORT: archive not a dir $d"; return 1; }
    [ -w "$d" ] || { log "PREFLIGHT ABORT: archive unwritable $d"; return 1; }
  done
  return 0
}

# state line format (whitespace-safe): "KEY IDENT FIRST_SEEN"
state_lookup(){ local sf="$1" key="$2" k id fs; [ -f "$sf" ] || return 0; while read -r k id fs; do [ "$k" = "$key" ] && { printf '%s %s' "$id" "$fs"; return 0; }; done < "$sf"; return 0; }

# Time-based stability: move a file only once its dev:inode:size:mtime has been
# observed UNCHANGED for at least STABLE_SECS. Records first_seen on first sight.
sort_dir(){
  local SRC="$1" tag="$2" now f b ident mt key prev pid_ pfs d STATE NEW
  [ -d "$SRC" ] || return 0
  STATE="$CLEAN/seen_${tag}.state"
  if [ -L "$STATE" ]; then log "ABORT state is symlink: $STATE"; return 1; fi
  NEW=$(mktemp "$CLEAN/.seen.XXXXXX") || { log "FAIL mktemp state"; return 1; }
  if [ ! -f "$NEW" ] || [ -L "$NEW" ]; then log "FAIL insecure state temp"; rm -f "$NEW"; return 1; fi
  now=$(now_epoch); shopt -s nullglob
  for f in "$SRC"/*; do
    [ -d "$f" ] && continue
    [ -L "$f" ] && { log "SKIP symlink: $f"; continue; }
    b=$(basename "$f"); case "$b" in .*) continue ;; esac
    case "$b" in *.crdownload|*.part|*.download|*.partial|*.tmp|*.opdownload) log "SKIP in-progress: $f"; continue ;; esac
    if ! ident=$(file_ident "$f"); then log "FAIL stat (skip): $f"; continue; fi
    key=$(path_key "$f"); mt=${ident##*:}
    if [ $(( now - mt )) -lt "$SETTLE" ]; then printf '%s %s %s\n' "$key" "$ident" "$now" >> "$NEW"; log "SKIP settling: $f"; continue; fi
    prev=$(state_lookup "$STATE" "$key")
    if [ -z "$prev" ]; then printf '%s %s %s\n' "$key" "$ident" "$now" >> "$NEW"; log "OBSERVE new: $f"; continue; fi
    pid_=${prev% *}; pfs=${prev##* }
    if [ "$pid_" != "$ident" ]; then printf '%s %s %s\n' "$key" "$ident" "$now" >> "$NEW"; log "OBSERVE changed (reset): $f"; continue; fi
    if [ $(( now - pfs )) -lt "$STABLE_SECS" ]; then printf '%s %s %s\n' "$key" "$ident" "$pfs" >> "$NEW"; log "OBSERVE stabilizing: $f"; continue; fi
    d=$(bucket "$b")
    if ! safe_move "$f" "$SRC/$d" "$SRC"; then printf '%s %s %s\n' "$key" "$ident" "$pfs" >> "$NEW"; fi
  done
  if [ -L "$STATE" ]; then log "ABORT state is symlink: $STATE"; rm -f "$NEW"; return 1; fi
  if [ -e "$STATE" ] && [ ! -f "$STATE" ]; then log "ABORT state not regular: $STATE"; rm -f "$NEW"; return 1; fi
  mv -f "$NEW" "$STATE" || { log "FAIL state update: $STATE"; rm -f "$NEW"; return 1; }
}

archive_old(){
  local SRC="$HOME/Downloads" MONTH DEST now sub d f mt age thresh
  [ -d "$SRC" ] || return 0
  [ -L "$SRC" ] && { log "ABORT Downloads is symlink"; return 1; }
  MONTH=$(date '+%Y-%m'); DEST="$SRC/_Archive/$MONTH"; now=$(now_epoch); shopt -s nullglob
  for sub in Documents Images Video Audio Archives Code Other Installers; do
    d="$SRC/$sub"; [ -d "$d" ] || continue
    [ -L "$d" ] && { log "SKIP symlinked subdir: $d"; continue; }
    thresh=30; [ "$sub" = Installers ] && thresh=7
    for f in "$d"/*; do
      [ -d "$f" ] && continue
      [ -L "$f" ] && { log "SKIP symlink: $f"; continue; }
      if ! mt=$(file_mtime "$f"); then log "FAIL stat (skip): $f"; continue; fi
      age=$(( (now - mt) / 86400 ))
      [ "$age" -ge "$thresh" ] && { safe_move "$f" "$DEST/$sub" "$SRC" || true; }
    done
  done
}

clean_developer(){
  local DEV="$HOME/Developer" MONTH DEST item
  [ -d "$DEV" ] || return 0
  [ -L "$DEV" ] && { log "ABORT Developer is symlink"; return 1; }
  MONTH=$(date '+%Y-%m'); DEST="$DEV/_archive_scratch/$MONTH"; shopt -s nullglob
  for item in "$DEV"/_cc_done_*; do
    [ -e "$item" ] || continue
    [ -L "$item" ] && { log "SKIP symlink: $item"; continue; }
    safe_move "$item" "$DEST" "$DEV" || true
  done
}

report_backups(){
  local BK="$HOME/Developer/_backups" REP TMP newest r m
  [ -d "$BK" ] || return 0
  [ -L "$BK" ] && { log "SKIP _backups is symlink"; return 0; }
  newest=0; shopt -s nullglob
  for r in "$CLEAN"/backups_report_*.txt; do
    if m=$(file_mtime "$r"); then [ "$m" -gt "$newest" ] && newest="$m"; fi
  done
  [ "$newest" -gt 0 ] && [ $(( $(now_epoch) - newest )) -lt 43200 ] && return 0
  local entries=( "$BK"/* )
  TMP=$(mktemp "$CLEAN/.backups_report.partial.XXXXXX") || { log "FAIL report mktemp"; return 1; }
  if [ ! -f "$TMP" ] || [ -L "$TMP" ]; then log "FAIL insecure report temp"; rm -f "$TMP"; return 1; fi
  {
    printf '=== _backups size report (%s) ===\n' "$(date '+%Y-%m-%d %H:%M')" &&
    printf 'Total:\n' && du -sh "$BK" && printf 'Largest entries (MB):\n'
  } > "$TMP" || { log "FAIL report (header/du)"; rm -f "$TMP"; return 1; }
  if [ "${#entries[@]}" -gt 0 ]; then
    if ! du -sk "${entries[@]}" | sort -rn | sed -n '1,20p' \
         | awk '{size=$1; $1=""; sub(/^[ \t]+/,""); printf "%10.1f  %s\n", size/1024, $0}' >> "$TMP"; then
      log "FAIL report (entries)"; rm -f "$TMP"; return 1
    fi
  else
    printf 'No visible entries.\n' >> "$TMP" || { log "FAIL report (write)"; rm -f "$TMP"; return 1; }
  fi
  REP="$CLEAN/backups_report_$(date '+%Y%m%d_%H%M%S').txt"
  if [ -e "$REP" ] || [ -L "$REP" ]; then log "ABORT report exists: $REP"; rm -f "$TMP"; return 1; fi
  local rdi ndi
  if ! rdi=$(file_devino "$TMP"); then log "FAIL devino report tmp"; rm -f "$TMP"; return 1; fi
  if ! mv -n "$TMP" "$REP"; then log "FAIL report rename"; rm -f "$TMP"; return 1; fi
  if [ -e "$TMP" ] || [ -L "$TMP" ]; then log "FAIL report tmp still present"; return 1; fi
  if [ ! -e "$REP" ] || [ -L "$REP" ]; then log "FAIL report dest missing/symlink"; return 1; fi
  if ! ndi=$(file_devino "$REP"); then log "FAIL devino report dest"; return 1; fi
  if [ "$ndi" != "$rdi" ]; then log "FAIL report inode mismatch"; return 1; fi
  log "REPORT wrote $REP"; return 0
}

if [ "${HK_NO_RUN:-}" != "1" ]; then
  if acquire_lock; then :; else
    lrc=$?
    if [ "$lrc" -eq 1 ]; then log "another instance running; exit"; exit 0; fi
    log "lock error; abort"; exit 1
  fi
  trap release_lock EXIT
  log "=== run start ==="
  if ! preflight; then log "=== aborted: preflight failed ==="; exit 1; fi
  sort_dir "$HOME/Desktop"   desktop   || true
  sort_dir "$HOME/Downloads" downloads || true
  archive_old                          || true
  clean_developer                      || true
  report_backups                       || log "report step failed (see launchd.err)"
  log "=== run end ==="
fi
