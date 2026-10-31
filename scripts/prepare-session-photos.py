#!/usr/bin/env python3
"""Create WebP derivatives; print photo metadata for the reviewed D1 session."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def prepare(session_id, sources, output_root=ROOT):
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', session_id):
        raise ValueError('Invalid session ID')
    directory = Path(output_root) / 'images' / 'seances' / session_id
    directory.mkdir(parents=True, exist_ok=True)
    photos, seen = [], set()
    for source in sources:
        source = Path(source)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:20]
        if digest in seen:
            continue
        seen.add(digest)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            # Re-create pixels to drop EXIF/GPS and other source metadata.
            clean = Image.new('RGB', image.size)
            clean.paste(image)
        clean.thumbnail((1920, 1920))
        clean.save(directory / f'{digest}.webp', 'WEBP', quality=85, method=6)
        thumb = clean.copy()
        thumb.thumbnail((640, 640))
        thumb.save(directory / f'{digest}-640.webp', 'WEBP', quality=78, method=6)
        prefix = f'images/seances/{session_id}/{digest}'
        photos.append({'src': prefix + '.webp', 'thumbnail': prefix + '-640.webp',
                       'width': thumb.width, 'height': thumb.height,
                       'alt': f'Photo {len(photos) + 1} de la séance', 'caption': ''})
    return photos

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('session_id')
    parser.add_argument('images', nargs='+', type=Path)
    args = parser.parse_args()
    print(json.dumps(prepare(args.session_id, args.images), ensure_ascii=False, indent=2))
