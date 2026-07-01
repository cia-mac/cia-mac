# audio-tools

Toolkit for pulling source audio and splitting it into **vocal** + **instrumental**
stems for the Pol / Googoosh techno remix.

## Why this lives in the repo
The remote cloud environment is ephemeral: `/tmp` and the venv at
`/home/user/audio-venv` are wiped when the container restarts, but this repo
persists. So the scripts that matter live here and can be rebuilt in minutes.

## Setup (fresh container)
```bash
bash music/audio-tools/rebuild.sh
```
Installs ffmpeg, yt-dlp, and Demucs (htdemucs) into `/home/user/audio-venv`.

## Usage
```bash
# 1. download source audio  (requires YouTube reachable in the network egress policy)
/home/user/audio-venv/bin/yt-dlp --no-playlist -x --audio-format mp3 \
    -o '/tmp/pol.%(ext)s' '<YOUTUBE_URL>'

# 2. split into stems
/home/user/audio-venv/bin/python music/audio-tools/separate.py /tmp/pol.mp3 /tmp/sep
# -> /tmp/sep/pol-vocal.wav  +  /tmp/sep/pol-instrumental.wav
```

## Network note
yt-dlp needs these hosts allowed in the environment's network egress settings:
`youtube.com`, `www.youtube.com`, `m.youtube.com`, `*.googlevideo.com`, `i.ytimg.com`.
If the source audio is already in Google Drive, skip yt-dlp — Drive is reachable
and you can pull the file directly, then run step 2.
