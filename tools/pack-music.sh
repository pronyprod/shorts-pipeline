#!/usr/bin/env bash
# Packs each project's public/music folder into an ENCRYPTED file in assets/.
# Why: the tracks are from the YouTube Audio Library, whose terms forbid sharing the music files on
# their own. A public repo would do exactly that, so only an encrypted copy is committed.
# The password lives outside the repo (KEY_FILE) and in the GitHub secret ASSETS_KEY.
# Run again whenever a music folder changes:  bash tools/pack-music.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO="${STUDIO:-/c/Users/HP VICTUS/remotion-studio}"
KEY_FILE="${KEY_FILE:-/c/Users/HP VICTUS/shorts-pipeline-secrets/ASSETS_KEY.txt}"

if [ ! -s "$KEY_FILE" ]; then
  mkdir -p "$(dirname "$KEY_FILE")"
  openssl rand -hex 32 | tr -d '\r\n' > "$KEY_FILE"
  echo "new password written to $KEY_FILE (never commit or paste it in chat)"
fi
mkdir -p "$REPO/assets"
for p in countryballs-video whatif-video fakta-video; do
  out="$REPO/assets/$p-music.tar.enc"
  tar -C "$STUDIO/$p/public" -cf - music | ASSETS_KEY="$(cat "$KEY_FILE")" openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:ASSETS_KEY > "$out"
  size=$(stat -c %s "$out")
  echo "$p: $((size / 1048576)) MB"
  if [ "$size" -gt 99000000 ]; then echo "ERROR: $out is over GitHub's 100 MB file limit"; exit 1; fi
done
