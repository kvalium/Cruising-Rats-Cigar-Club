"""Check the actual archive model, including shared minutes and multiple members."""
import copy
import importlib.util
import json
import tempfile
import shutil
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

spec = importlib.util.spec_from_file_location('archives', Path(__file__).with_name('build-degustations.py'))
archives = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archives)
data = json.loads((archives.ROOT / 'data/degustations.json').read_text())
archives.validate(data)
assert archives.score(data['sessions'][0]['sheets'][0]) == 70

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
    assert '(PDF, nouvel onglet)' not in text, 'Document button labels must stay concise'
    assert ' download' not in text and 'Télécharger la fiche' not in text and 'Télécharger les minutes' not in text, 'No separate download links'
    assert 'Fiches de dégustation' not in nav, 'Archive accidentally added to main menu'
    if p.name in ('fiche-louis-fiche-1.html','seance-2026-08-12-un-classique-sous-observation.html'):
        assert 'Consulter les minutes' not in text, 'August session has no minutes'
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

for name in ('seance-2026-08-12-un-classique-sous-observation.html', 'fiche-louis-fiche-1.html'):
    text = (archives.ROOT / 'fiches-degustation' / name).read_text()
    assert '<a href="membre-louis.html">Louis</a>' in text, 'Member name must link to registry'
registry = (archives.ROOT / 'fiches-degustation/membre-louis.html').read_text()
assert '70/100' in registry and '6,7/10' in registry
assert 'fiche-louis-fiche-2.html' in registry
assert 'contexte commun uniquement' not in registry
directory = (archives.ROOT / 'fiches-degustation/registre-membres.html').read_text()
assert '<a href="membre-louis.html">Louis</a>' in directory
assert '4 profils enregistrés' in directory
assert 'membre-julien.html' in directory
assert 'membre-l-monchany' not in directory and 'membre-s-hoummadi' not in directory, 'Prospects must not become members'
october = next(s for s in data['sessions'] if s['date']=='2026-10-19')
assert len(october['participants'])==2 and len(october['prospects'])==2
assert archives.session_assessment(october)['status']=='valide-avec-reserves'
october_page = (archives.ROOT / 'fiches-degustation/seance-2026-10-19-cao-gold-robusto.html').read_text()
assert '<dl class="session-facts">' in october_page
assert 'Clôture des fiches' in october_page
assert 'https://www.caocigars.com/cigars/gold/' in october_page
assert '127 mm' in october_page and 'Connecticut d’Équateur' in october_page
assert 'Le cigare à l’épreuve des pièces' not in october_page
assert october_page.index('Minutes de la séance') < october_page.index('Fiches et comptes rendus') < october_page.index('Appréciation générale du Comité')
assert '<table' not in october_page
first_page = (archives.ROOT / 'fiches-degustation/fiche-louis-fiche-1.html').read_text()
assert '78/100 est ramenée' in first_page and '70/100' in first_page
assert '124 mm' in first_page and 'pas une identification' in first_page
for filename in ('fiche-julien-fiche-1.html','fiche-louis-fiche-2.html'):
    page = (archives.ROOT / 'fiches-degustation' / filename).read_text()
    assert 'Le cigare à l’épreuve des pièces' in page
    assert 'https://www.caocigars.com/cigars/gold/' in page
scores = {f['member_id']:archives.score(f) for f in october['sheets']}
assert scores=={'julien':82,'louis':79}
julien = next(f for f in october['sheets'] if f['member_id']=='julien')
assert julien['cigar_score']==7.3 and julien['duration_minutes'] is None
assert sum(f['member_id']=='louis' for s in data['sessions'] for f in s['sheets'])==3
session_page = (archives.ROOT / 'fiches-degustation/seance-2026-08-12-un-classique-sous-observation.html').read_text()
assert 'Première fiche</span>' not in session_page, 'First-sheet badge must be absent from session cards'
assert 'Consulter la fiche et le compte rendu' in session_page
assert 'VALIDÉ AVEC RÉSERVES' in session_page
assert 'Appréciation générale du Comité' in session_page
assert archives.session_assessment(data['sessions'][0])['status'] == 'valide-avec-reserves'
unreviewed = copy.deepcopy(data['sessions'][0])
unreviewed.pop('committee_review')
assert archives.session_assessment(unreviewed)['status'] == 'en-examen'
new_minutes = copy.deepcopy(data['sessions'][0])
new_minutes['minutes_pdf'] = 'new-minutes.pdf'
assert archives.session_assessment(new_minutes)['status'] == 'a-reexaminer', 'Adding shared minutes must trigger a new overall assessment'

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / 'data').mkdir()
    (root / 'js').mkdir()
    shutil.copy2(archives.ROOT / 'js/member-stats.js', root / 'js/member-stats.js')
    (root / 'data/report.html').write_text('<section><h2>Test report</h2></section>')
    (root / 'sheet.pdf').write_bytes(b'%PDF-1.4')
    (root / 'minutes.pdf').write_bytes(b'%PDF-1.4')
    (root / 'index.html').write_text('<nav class="site-nav"><a href="index.html">ACCUEIL</a></nav>')
    (root / 'sitemap.xml').write_text('<urlset></urlset>')
    fixture = copy.deepcopy(data)
    fixture['sessions'] = [copy.deepcopy(data['sessions'][0])]
    fixture.setdefault('members', []).append({'id':'alpha','name':'Alpha'})
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
    assert (root / 'fiches-degustation/membre-alpha.html').is_file(), 'Roster members need profiles even before their first session'
    directory = (root / 'fiches-degustation/registre-membres.html').read_text()
    assert directory.index('>Alpha</a>') < directory.index('>Louis</a>'), 'Directory must be alphabetical'
    assert 'membre-test-member.html' in directory, 'New participants must automatically enter the directory'
    index = (root / 'fiches-degustation/index.html').read_text()
    assert index.index('2026-08-12') < index.index('2026-01-01'), 'Incorrect descending order'
    assert '2 participants' in index and 'Minutes disponibles' in index
    session_html = (root / ('fiches-degustation/' + archives.session_url(s))).read_text()
    assert 'À RÉEXAMINER' in session_html, 'Adding a sheet must trigger a fresh global review'
    detail = (root / 'fiches-degustation/fiche-louis-fiche-1.html').read_text()
    assert 'Consulter les minutes communes' in detail and 'Précision technique attribuée' in detail
    assert 'fiche-test-sheet.html' in (root / ('fiches-degustation/' + archives.session_url(s))).read_text()
    other = (root / 'fiches-degustation/fiche-test-sheet.html').read_text()
    assert 'contexte commun uniquement' in other
    assert archives.score(f) == 70, 'Minutes must not automatically grant points'
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

new_session = next(s for s in data['sessions'] if s['date']=='2026-10-21')
assert {f['member_id']:archives.score(f) for f in new_session['sheets']} == {'julien':81,'louis':73}
assert {f['member_id']:f['cigar_score'] for f in new_session['sheets']} == {'julien':8.7,'louis':8.2}
assert new_session['sheets'][0]['duration_minutes'] is None
assert new_session['sheets'][1]['duration_minutes'] == 90
assert len(new_session['prospects']) == 2 and len(new_session['participants']) == 2
new_page = (archives.ROOT / 'fiches-degustation' / archives.session_url(new_session)).read_text()
assert new_page.index('Minutes de la séance') < new_page.index('Fiches et comptes rendus')
assert '20 h 17' in new_page and '140 mm' in new_page
assert 'fiche-julien-fiche-2.html' in new_page and 'fiche-louis-fiche-3.html' in new_page
assert 'sous-cape' in (archives.ROOT / 'fiches-degustation/fiche-louis-fiche-3.html').read_text()

for member_id in ('m-crevette','remi'):
    page = (archives.ROOT / f'fiches-degustation/membre-{member_id}.html').read_text()
    assert 'Première dégustation à venir' in page
    assert 'Moyenne du Comité' not in page and 'data-member-filters' not in page
    assert not any(m['id']==member_id for s in data['sessions'] for m in s['participants'])
