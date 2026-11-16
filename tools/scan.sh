#!/usr/bin/env bash
# Secrets and personal-info scan over every file git would commit (tracked + new, minus ignored).
# Exits 1 if anything is found. Run before every push; the workflow runs it before each commit.
set -uo pipefail
cd "$(dirname "$0")/.."
LIST="$(mktemp)"
git ls-files -co --exclude-standard | grep -vE '^(tools/|assets/)|package-lock\.json$' > "$LIST"

# 1. keys, tokens, private keys
KEYS='AIza[0-9A-Za-z_-]{30,}|ghp_[0-9A-Za-z]{30,}|gho_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{20,}|sk-ant-[0-9A-Za-z_-]{10,}|sk-[A-Za-z0-9]{32,}|-----BEGIN [A-Z ]*PRIVATE KEY|"private_key"[[:space:]]*:|client_secret|refresh_token|xox[bp]-[0-9A-Za-z-]{10,}|ya29[.][0-9A-Za-z_-]{20,}'
# 2. personal details and private IDs
PERSONAL='joko?klar|@gmail[.]com|gen-lang-client|1jLH-3Ee2c605|HP VICTUS|partner to be given|owner.s friend'
# 3. Google Drive IDs, in prose files only (SVG paths and data look similar)
DRIVE='(^|[^A-Za-z0-9_-])1[A-Za-z0-9_-]{32}([^A-Za-z0-9_-]|$)'

scan() { tr '\n' '\0' < "$1" | xargs -0 -r grep -InE "$2" 2>/dev/null | cut -c1-200; }
A="$(scan "$LIST" "$KEYS")"
B="$(scan "$LIST" "$PERSONAL")"
PROSE="$(mktemp)"; grep -E '[.](md|txt)$' "$LIST" > "$PROSE"
C="$(scan "$PROSE" "$DRIVE")"
D="$(grep -E '(^|/)[.]env($|[.])|[.]pem$|service-account.*[.]json$|sa-key.*[.]json$|ASSETS_KEY|[.]mp3$|(^|/)public/music/' "$LIST")"
rm -f "$LIST" "$PROSE"

if [ -n "$A$B$C$D" ]; then
  echo "SCAN FAILED. Do not push."
  [ -n "$A" ] && echo "-- keys or tokens:" && echo "$A"
  [ -n "$B" ] && echo "-- personal details:" && echo "$B"
  [ -n "$C" ] && echo "-- Drive IDs:" && echo "$C"
  [ -n "$D" ] && echo "-- files that must not be committed:" && echo "$D"
  exit 1
fi
echo "scan: clean"
