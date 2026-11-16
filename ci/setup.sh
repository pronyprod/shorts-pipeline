#!/usr/bin/env bash
# Prepares an ubuntu runner for one channel:  bash ci/setup.sh <countryballs|whatif|fakta>
# Slow parts (whisper build + models, Chrome, the Kokoro model, npm downloads) are restored from the
# Actions cache by the workflow before this runs; this script only builds what is missing.
#
# The channel scripts were written on Windows and call "main.exe" and Remotion's Windows ffmpeg by path.
# Instead of editing them (the laptop copies must stay identical), this script puts Linux programs at
# those exact paths. On Linux a file name ending in .exe is just a name.
set -euo pipefail
CHANNEL="${1:?channel}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$ROOT/.cache"
WHISPER_VERSION="1.5.5" # same version as the laptop (scripts/setup-whisper.mjs, make-captions.mts)

case "$CHANNEL" in
  countryballs) PROJECT=countryballs-video ;;
  whatif) PROJECT=whatif-video ;;
  fakta) PROJECT=fakta-video ;;
  *) echo "unknown channel $CHANNEL"; exit 1 ;;
esac

echo "::group::system packages"
sudo apt-get update -qq
# ffmpeg + what headless Chrome needs + fonts (emoji and wide language coverage for fallback glyphs)
sudo apt-get install -y -qq --no-install-recommends \
  ffmpeg build-essential \
  libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxrandr2 libxkbcommon0 libxfixes3 \
  libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 libdrm2 libegl1 libgl1 libgles2 \
  fonts-liberation fonts-noto-core fonts-noto-color-emoji
sudo apt-get install -y -qq --no-install-recommends libasound2t64 || sudo apt-get install -y -qq --no-install-recommends libasound2
ffmpeg -version | head -1
echo "::endgroup::"

echo "::group::whisper.cpp $WHISPER_VERSION"
mkdir -p "$CACHE/whisper"
if [ ! -x "$CACHE/whisper/main" ]; then
  rm -rf "$CACHE/whisper-src"
  git clone --quiet --depth 1 --branch "v$WHISPER_VERSION" https://github.com/ggerganov/whisper.cpp "$CACHE/whisper-src"
  make -C "$CACHE/whisper-src" -j"$(nproc)" main >/dev/null
  cp "$CACHE/whisper-src/main" "$CACHE/whisper/main"
  rm -rf "$CACHE/whisper-src"
fi
model() { # model name -> file in the cache
  local f="$CACHE/whisper/ggml-$1.bin"
  [ -s "$f" ] || curl -fsSL --retry 3 -o "$f" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$1.bin"
}
place() { # target dir, model name
  mkdir -p "$1"
  cp "$CACHE/whisper/main" "$1/main"
  cp "$CACHE/whisper/main" "$1/main.exe"
  ln -sf "$CACHE/whisper/ggml-$2.bin" "$1/ggml-$2.bin"
}
if [ "$CHANNEL" = countryballs ]; then
  model base.en
  place "$ROOT/countryballs-video/whisper.cpp" base.en
else
  # What If uses Fakta's whisper folder (../fakta-video/whisper), so both get the same place
  model small
  place "$ROOT/fakta-video/whisper" small
fi
echo "::endgroup::"

# node_modules is installed by the workflow (npm ci) before this script runs.
cd "$ROOT/$PROJECT"
[ -d node_modules ] || { echo "node_modules missing: run npm ci in $PROJECT first"; exit 1; }

echo "::group::ffmpeg at the Windows path the scripts expect"
SHIM="$ROOT/$PROJECT/node_modules/@remotion/compositor-win32-x64-msvc"
mkdir -p "$SHIM"
ln -sf "$(command -v ffmpeg)" "$SHIM/ffmpeg.exe"
ln -sf "$(command -v ffprobe)" "$SHIM/ffprobe.exe"
ls -l "$SHIM"
echo "::endgroup::"

echo "::group::Chrome for Remotion"
npx remotion browser ensure
echo "::endgroup::"

echo "::group::music (encrypted in the repo; licensed tracks are never stored in the clear)"
if [ -n "${ASSETS_KEY:-}" ]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:ASSETS_KEY -in "$ROOT/assets/$PROJECT-music.tar.enc" | tar -x -C "$ROOT/$PROJECT/public"
  echo "music: $(find "$ROOT/$PROJECT/public/music" -type f | wc -l) files"
else
  echo "::warning::ASSETS_KEY is not set: no music, so full renders are skipped"
fi
echo "::endgroup::"
