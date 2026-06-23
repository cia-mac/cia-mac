#!/bin/bash
# ==========================================================================
#  Housekeeper installer (v5, post second audit). Double-click ONCE.
#  Guarantees: never deletes, never overwrites, never follows symlinks,
#  never moves across filesystems, verifies every move, single-instance
#  (PID) lock, fails the whole run safely on any permission/enumeration error.
# ==========================================================================
set -euo pipefail
CLEAN_DIR="$HOME/.cleanup"
ENGINE="$CLEAN_DIR/housekeeper.sh"
PLIST="$HOME/Library/LaunchAgents/com.ciamac.housekeeper.plist"
LABEL="com.ciamac.housekeeper"
echo "Installing Housekeeper..."
if [ -L "$CLEAN_DIR" ]; then echo "refusing: $CLEAN_DIR is a symlink" >&2; exit 1; fi
mkdir -p "$CLEAN_DIR" "$HOME/Library/LaunchAgents"
chmod 700 "$CLEAN_DIR" 2>/dev/null || true

cat > "$ENGINE" <<'ENGINE_EOF'
#!/bin/bash
set -euo pipefail

CLEAN="$HOME/.cleanup"
if [ -L "$CLEAN" ]; then printf 'refusing: %s is a symlink\n' "$CLEAN" >&2; exit 1; fi
mkdir -p "$CLEAN"; chmod 700 "$CLEAN" 2>/dev/null || true
LOG="$CLEAN/housekeeper.log"
log(){ printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG"; }

# Portable stat helpers (BSD first, GNU fallback); nonzero exit on failure.
file_mtime(){ local m; if m=$(stat -f %m "$1" 2>/dev/null); then printf '%s' "$m"; return 0; fi; if m=$(stat -c %Y "$1" 2>/dev/null); then printf '%s' "$m"; return 0; fi; return 1; }
file_dev(){   local d; if d=$(stat -f %d "$1" 2>/dev/null); then printf '%s' "$d"; return 0; fi; if d=$(stat -c %d "$1" 2>/dev/null); then printf '%s' "$d"; return 0; fi; return 1; }
now_epoch(){ date +%s; }
SETTLE=120

# ---- single-instance lock: PID-based, never age-expired ----
LOCK="$CLEAN/.lock"
acquire_lock(){
  if mkdir "$LOCK" 2>/dev/null; then printf '%s' "$$" > "$LOCK/pid"; return 0; fi
  local pid=""; [ -f "$LOCK/pid" ] && pid=$(cat "$LOCK/pid" 2>/dev/null || true)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then return 1; fi   # live owner
  rm -f "$LOCK/pid" 2>/dev/null || true; rmdir "$LOCK" 2>/dev/null || true
  if mkdir "$LOCK" 2>/dev/null; then printf '%s' "$$" > "$LOCK/pid"; return 0; fi
  return 1
}
release_lock(){
  local pid=""; [ -f "$LOCK/pid" ] && pid=$(cat "$LOCK/pid" 2>/dev/null || true)
  [ "$pid" = "$$" ] && { rm -f "$LOCK/pid" 2>/dev/null || true; rmdir "$LOCK" 2>/dev/null || true; }
}

# ---- the ONLY mover ----
safe_move(){
  local src="$1" destdir="$2" base target sdev ddev
  base=$(basename "$src")
  if [ -L "$src" ];  then log "SKIP symlink source: $src"; return 1; fi
  if [ ! -e "$src" ]; then log "SKIP vanished: $src"; return 1; fi
  if [ -L "$destdir" ]; then log "ABORT dest is symlink: $destdir"; return 1; fi
  if [ -e "$destdir" ] && [ ! -d "$destdir" ]; then log "ABORT dest not a dir: $destdir"; return 1; fi
  if ! mkdir -p "$destdir"; then log "FAIL mkdir: $destdir"; return 1; fi
  if [ -L "$destdir" ]; then log "ABORT dest became symlink: $destdir"; return 1; fi
  if ! sdev=$(file_dev "$src");     then log "FAIL stat dev: $src"; return 1; fi
  if ! ddev=$(file_dev "$destdir"); then log "FAIL stat dev: $destdir"; return 1; fi
  if [ "$sdev" != "$ddev" ]; then log "ABORT cross-filesystem: $src -> $destdir"; return 1; fi
  target="$destdir/$base"
  if [ -e "$target" ] || [ -L "$target" ]; then log "SKIP collision: $target"; return 1; fi
  if ! mv -n "$src" "$target"; then log "FAIL mv: $src -> $target"; return 1; fi
  if [ -e "$src" ] || [ ! -e "$target" ]; then log "FAIL verify: $src -> $target"; return 1; fi
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

# Probe every existing root up front; abort the WHOLE run if any fails.
preflight(){
  local d
  for d in "$HOME/Desktop" "$HOME/Downloads" "$HOME/Developer"; do
    [ -e "$d" ] || continue
    if [ -L "$d" ];   then log "PREFLIGHT ABORT: symlink root $d"; return 1; fi
    if [ ! -d "$d" ]; then log "PREFLIGHT ABORT: not a dir $d"; return 1; fi
    if [ ! -r "$d" ]; then log "PREFLIGHT ABORT: unreadable $d"; return 1; fi
    if ! ls "$d" >/dev/null 2>&1; then log "PREFLIGHT ABORT: cannot enumerate $d (permission/TCC?)"; return 1; fi
  done
  return 0
}

sort_dir(){
  local SRC="$1" now f b mt d
  [ -d "$SRC" ] || return 0
  now=$(now_epoch); shopt -s nullglob
  for f in "$SRC"/*; do
    [ -d "$f" ] && continue
    [ -L "$f" ] && { log "SKIP symlink: $f"; continue; }
    b=$(basename "$f"); case "$b" in .*) continue ;; esac
    case "$b" in *.crdownload|*.part|*.download|*.partial|*.tmp|*.opdownload) log "SKIP in-progress: $f"; continue ;; esac
    if ! mt=$(file_mtime "$f"); then log "FAIL stat (skip): $f"; continue; fi
    [ $(( now - mt )) -lt "$SETTLE" ] && { log "SKIP settling: $f"; continue; }
    d=$(bucket "$b"); safe_move "$f" "$SRC/$d" || true
  done
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
      [ "$age" -ge "$thresh" ] && { safe_move "$f" "$DEST/$sub" || true; }
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
    safe_move "$item" "$DEST" || true
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
  TMP="$CLEAN/.backups_report.partial.$$"; rm -f "$TMP" 2>/dev/null || true
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
  if ! mv -n "$TMP" "$REP"; then log "FAIL report rename"; rm -f "$TMP"; return 1; fi
  log "REPORT wrote $REP"; return 0
}

# Test hook: when HK_NO_RUN=1 the file can be sourced without auto-running.
if [ "${HK_NO_RUN:-}" != "1" ]; then
  if ! acquire_lock; then log "another instance running; exit"; exit 0; fi
  trap release_lock EXIT
  log "=== run start ==="
  if ! preflight; then log "=== aborted: preflight failed ==="; exit 1; fi
  sort_dir "$HOME/Desktop"   || true
  sort_dir "$HOME/Downloads" || true
  archive_old                || true
  clean_developer            || true
  report_backups             || log "report step failed (see launchd.err)"
  log "=== run end ==="
fi
ENGINE_EOF
chmod +x "$ENGINE"

cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$ENGINE</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>12</integer><key>Minute</key><integer>0</integer></dict>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>$HOME/.cleanup/launchd.err</string>
  <key>StandardOutPath</key><string>$HOME/.cleanup/launchd.out</string>
</dict>
</plist>
PLIST_EOF

if command -v launchctl >/dev/null 2>&1; then
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST" && echo "agent loaded."
else
  echo "(not macOS - skipping launchctl load.)"
fi
/bin/bash "$ENGINE" || true
echo "Done. Log: ~/.cleanup/housekeeper.log"
echo "Press any key to close."; read -n 1 -s 2>/dev/null || true
