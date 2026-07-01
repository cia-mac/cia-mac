#!/usr/bin/env bash
# Rebuild the audio toolkit (yt-dlp + ffmpeg + Demucs) in a fresh container.
# The repo persists across restarts; the venv at /home/user/audio-venv does not.
# Run from anywhere:  bash music/audio-tools/rebuild.sh
set -euo pipefail

VENV=/home/user/audio-venv

echo "==> system ffmpeg"
command -v ffmpeg >/dev/null 2>&1 || { sudo apt-get update -y && sudo apt-get install -y ffmpeg; }
ffmpeg -version | head -1

echo "==> python venv at $VENV"
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install --upgrade pip

echo "==> packages (pinned to what produced the Pol stems)"
"$VENV/bin/pip" install \
  "yt-dlp" \
  "demucs==4.0.1" \
  "soundfile" \
  "torch" "torchaudio"

echo "==> sanity"
"$VENV/bin/yt-dlp" --version
"$VENV/bin/python" -c "import demucs,torch,soundfile;print('demucs',demucs.__version__,'torch',torch.__version__)"

echo
echo "Ready. Typical flow:"
echo "  $VENV/bin/yt-dlp --no-playlist -x --audio-format mp3 -o '/tmp/pol.%(ext)s' '<YOUTUBE_URL>'"
echo "  $VENV/bin/python $(dirname "$0")/separate.py /tmp/pol.mp3 /tmp/sep"
