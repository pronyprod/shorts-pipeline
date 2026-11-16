#!/usr/bin/env bash
# Copies the three channel projects and the shared files from the laptop folders into this repo,
# leaving the laptop folders untouched. Run it from Git Bash on the laptop:
#     bash tools/sync-from-laptop.sh
# What it does NOT copy: node_modules, renders, voice takes, whisper, music (music goes in
# encrypted, see tools/pack-music.sh), old episodes' audio, laptop-only settings.
# It redacts personal details and Drive/Sheet IDs, then runs the secrets scan (tools/scan.sh).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO="${STUDIO:-/c/Users/HP VICTUS/remotion-studio}"
SHARED_SRC="${SHARED_SRC:-/c/Users/HP VICTUS/claude video}"

# After the switch the cloud makes the episodes and this repo is the master copy.
# Syncing from the laptop then would wipe the cloud episodes, so it is refused.
if [ -f "$REPO/CLOUD_IS_MASTER" ]; then
  echo "REFUSED: CLOUD_IS_MASTER exists. The repo is the master now; do not sync from the laptop."
  exit 1
fi

copy_project() {
  local p="$1"; shift
  rm -rf "${REPO:?}/$p"
  mkdir -p "$REPO/$p"
  tar -C "$STUDIO/$p" \
    --exclude=./node_modules --exclude=./.git --exclude=./.agents --exclude=./dist --exclude=./out \
    --exclude=./renders --exclude=./tts-out --exclude=./whisper --exclude=./whisper.cpp \
    --exclude=./recordings --exclude=./public/music --exclude=./public/voice --exclude=./public/voices \
    --exclude=./data/tts --exclude='./data/*-16k.wav' --exclude=./tests/offline_run \
    --exclude='./tests/*.wav' --exclude='./tests/*.mp3' --exclude='./tests/*.mp4' \
    --exclude=./.claude/skills --exclude=./skills-lock.json --exclude=./.claude/settings.json --exclude=./.claude/settings.local.json --exclude=./.claude/launch.json \
    --exclude='*.log' --exclude=./.env --exclude='./.env.*' \
    -cf - . | tar -C "$REPO/$p" -xf -
}

# Only the newest episode's voice files travel (enough for the environment check render);
# finished episodes live as MP4s in Releases, and work in progress is kept in the Actions cache.
copy_latest_voice() {
  local p="$1" dir="$2"
  local latest
  latest="$(ls "$STUDIO/$p/public/$dir" | grep -E '^ep[0-9]+$' | sort | tail -1)"
  mkdir -p "$REPO/$p/public/$dir"
  cp -r "$STUDIO/$p/public/$dir/$latest" "$REPO/$p/public/$dir/"
  [ -f "$STUDIO/$p/public/$dir/$latest.wav" ] && cp "$STUDIO/$p/public/$dir/$latest.wav" "$REPO/$p/public/$dir/"
  echo "$p: voice of $latest copied"
}

for p in countryballs-video whatif-video fakta-video; do copy_project "$p"; done
copy_latest_voice countryballs-video voices
copy_latest_voice whatif-video voices
copy_latest_voice fakta-video voice

mkdir -p "$REPO/shared"
for f in PROJECT_LOG.md FLAG_PAIR_BANK.md WHATIF_BANK.md FAKTA_BANK.md; do cp "$SHARED_SRC/$f" "$REPO/shared/$f"; done

node "$REPO/tools/redact.mjs"
bash "$REPO/tools/scan.sh"
echo "Sync done."
