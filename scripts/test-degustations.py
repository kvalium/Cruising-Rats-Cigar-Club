"""Check the actual archive model, including shared minutes and multiple members."""
import copy
import importlib.util
import json
import tempfile
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

spec = importlib.util.spec_from_file_location('archives', Path(__file__).with_name('build-degustations.py'))
archives = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archives)
data = json.loads((archives.ROOT / 'data/degustations.json').read_text())
archives.validate(data)
assert archives.score(data['sessions'][0]['sheets'][0]) == 78

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])

for p in (archives.ROOT / 'fiches-degustation').glob('*.html'):
    text = p.read_text()
    nav = text.split('<nav class="site-nav"')[1].split('</nav>')[0]
    assert 'Fiches de dégustation' not in nav, 'Archive accidentally added to main menu'
    assert 'Consulter les minutes' not in text, 'No minutes should be linked for Louis'
    links = Links()
    links.feed(text)
    for href in links.links:
        url = urlsplit(href)
        if url.scheme or url.netloc or not url.path:
            continue
        target = (p.parent / unquote(url.path)).resolve()
        # Existing site pages are read from the remote repository, outside this scoped checkout.
        if target.parent == archives.ROOT and target.name not in {'index.html','degustation.html'}:
            continue
        assert target.is_file(), f'Broken local link: {p.name} -> {href}'

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / 'data').mkdir()
    (root / 'data/report.html').write_text('<section><h2>Test report</h2></section>')
    (root / 'sheet.pdf').write_bytes(b'%PDF-1.4')
    (root / 'minutes.pdf').write_bytes(b'%PDF-1.4')
    (root / 'index.html').write_text('<nav class="site-nav"><a href="index.html">ACCUEIL</a></nav>')
    (root / 'sitemap.xml').write_text('<urlset></urlset>')
    fixture = copy.deepcopy(data)
    s = fixture['sessions'][0]
    s['minutes_pdf'] = 'minutes.pdf'
    s['participants'].append({'id':'test-member','name':'Test member','grade':'Grade test'})
    f = s['sheets'][0]
    f.update(pdf='sheet.pdf', report='data/report.html', minutes_contribution='Précision technique attribuée à Louis ; critères réexaminés, note inchangée.')
    second = copy.deepcopy(f)
    second.update(id='test-sheet', member_id='test-member', minutes_contribution='Aucune observation attribuée à ce membre ; contexte commun uniquement.')
    s['sheets'].append(second)
    older = copy.deepcopy(s)
    older.update(id='older-session', date='2026-01-01')
    older['sheets'] = [copy.deepcopy(f)]
    older['sheets'][0].update(id='older-sheet',number=2)
    fixture['sessions'].append(older)
    previous_root = archives.ROOT
    archives.ROOT = root
    archives.build(fixture)
    index = (root / 'fiches-degustation/index.html').read_text()
    assert index.index('2026-08-12') < index.index('2026-01-01'), 'Incorrect descending order'
    assert '2 participants' in index and 'Minutes disponibles' in index
    detail = (root / 'fiches-degustation/fiche-louis-fiche-1.html').read_text()
    assert 'Consulter les minutes communes' in detail and 'Précision technique attribuée' in detail
    assert 'fiche-test-sheet.html' in (root / ('fiches-degustation/' + archives.session_url(s))).read_text()
    other = (root / 'fiches-degustation/fiche-test-sheet.html').read_text()
    assert 'contexte commun uniquement' in other
    assert archives.score(f) == 78, 'Minutes must not automatically grant points'
    assert 'older-sheet' in detail, 'Other sheets of the member missing'
    bad = copy.deepcopy(fixture)
    bad['sessions'][0]['sheets'][0]['minutes_contribution'] = None
    try:
        archives.validate(bad)
    except AssertionError:
        pass
    else:
        raise AssertionError('Shared minutes require an individual evaluation explanation')
    archives.ROOT = previous_root
print('Archive checks passed: links, scores, sorting, multi-member sessions, shared minutes, individual attribution.')
