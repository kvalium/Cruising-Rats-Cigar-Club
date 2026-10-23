#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for size in 36 72 96 144 192 288; do
  convert "$project_root/images/badges/rat-de-passage.png" -resize "${size}x${size}" -strip -quality 86 "$project_root/images/badges/rat-de-passage-${size}.webp"
done
