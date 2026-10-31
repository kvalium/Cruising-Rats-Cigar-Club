"""Exercise preparation, validation, D1 preservation and production asset rewriting."""
import copy
import importlib.util
import json
import sqlite3
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

builder = module('photo_builder', 'build-degustations.py')
prepare = module('photo_prepare', 'prepare-session-photos.py').prepare
site = module('photo_site', 'build-site.py')
seed = module('photo_seed', 'seed-d1.py')
data = json.loads((ROOT / 'data/degustations.json').read_text())
assert builder.session_photos(data['sessions'][0]) == ''
with tempfile.TemporaryDirectory() as temporary:
    temporary = Path(temporary)
    source = temporary / 'source.jpg'
    exif = Image.Exif()
    exif[270] = 'Private source metadata'
    Image.new('RGB', (2400, 1600), 'brown').save(source, exif=exif)
    photos = prepare(data['sessions'][0]['id'], [source, source], temporary)
    assert len(photos) == 1
    for key, limit in (('src', 1920), ('thumbnail', 640)):
        with Image.open(temporary / photos[0][key]) as image:
            assert max(image.size) <= limit and not image.getexif()
    builder.ROOT = temporary
    builder.validate_photos(photos)
    photos[0]['alt'] = 'Cigare et verre <sans extrapolation>'
    photos[0]['caption'] = '<script>alert(1)</script>'
    session = copy.deepcopy(data['sessions'][0])
    session['photos'] = photos
    html = builder.session_photos(session)
    assert 'loading="lazy"' in html and 'data-session-photo' in html
    assert '&lt;script&gt;' in html and '<script>alert(1)' not in html
    assert f'src="../{photos[0]["thumbnail"]}"' in html
    for field, bad in [('src', 'javascript:alert(1)'), ('thumbnail', '//example.com/a.webp'),
                       ('src', 'images/seances/../../secret.jpg'), ('width', 0), ('alt', '')]:
        invalid = copy.deepcopy(photos)
        invalid[0][field] = bad
        try:
            builder.validate_photos(invalid)
        except AssertionError:
            pass
        else:
            raise AssertionError(f'Accepted invalid {field}')
    try:
        builder.validate_photos(photos + photos)
    except AssertionError:
        pass
    else:
        raise AssertionError('Accepted duplicate photo')
    fixture = copy.deepcopy(data)
    fixture['sessions'][0] = session
    db = sqlite3.connect(':memory:')
    seed.seed(db, fixture)
    stored = json.loads(db.execute('SELECT payload FROM sessions WHERE id=?', (session['id'],)).fetchone()[0])
    assert stored['photos'] == photos
    # Production photos must be rewritten even when they exist only in D1/S3.
    site.DIST = temporary
    site.S3 = 'https://assets.example.com'
    (temporary / 'data').mkdir()
    fetched = copy.deepcopy(fixture)
    fetched['reports'] = {f['id']: (ROOT / f['report']).read_text() for s in fixture['sessions'] for f in s['sheets']}
    site.prepare_data(fetched)
    published = json.loads((temporary / 'data/degustations.json').read_text())
    assert published['sessions'][0]['photos'][0]['src'] == site.S3 + '/' + photos[0]['src']
print('Session photos: optimized assets, metadata removal, validation, escaping, D1 and production URLs verified.')
