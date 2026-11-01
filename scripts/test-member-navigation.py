"""Keep the protected home, archive list and member navigation distinct."""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('layout',Path(__file__).with_name('member-layout.py'))
layout=importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)

class Navigation(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_nav=False
        self.links=[]
        self.logos=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        classes=attrs.get('class','').split()
        if tag=='nav' and 'member-nav' in classes:
            self.in_nav=True
        if tag=='a' and self.in_nav:
            self.links.append(attrs)
        if tag=='a' and 'member-logo' in classes:
            self.logos.append(attrs)
    def handle_endtag(self,tag):
        if tag=='nav':
            self.in_nav=False

for path in (ROOT/'fiches-degustation').glob('*.html'):
    html=path.read_text()
    nav=Navigation();nav.feed(html)
    assert [a['href'] for a in nav.links]==['index.html','degustations.html','registre-membres.html','bureaux-commissions.html'],path.name
    assert len([a for a in nav.links if a.get('aria-current')=='page'])==1,path.name
    assert len(nav.logos)==1 and nav.logos[0]['href']=='../index.html',path.name
    assert html==layout.normalize(html,path.name),'Repeated builds must preserve the same shell: '+path.name
    assert 'href="../css/member-area.css"' in html

home=(ROOT/'fiches-degustation/index.html').read_text().split('<main')[1].split('</main>')[0]
listing=(ROOT/'fiches-degustation/degustations.html').read_text()
assert 'Bienvenue dans l’espace membres' in home
assert 'member-overview' in home
assert 'data-session' not in home and 'data-archive-filters' not in home
assert 'Soumettre une dégustation' not in home
assert 'Bureaux et Commissions</h2>' not in home and 'Registre des membres et des records</h2>' not in home
assert 'href="soumettre-degustation.html"' in listing and 'data-archive-filters' in listing
assert 'aria-current="page">Dégustations</a>' in listing
assert 'aria-current="page">Membres</a>' in (ROOT/'fiches-degustation/membre-julien.html').read_text()
assert 'aria-current="page">Bureaux &amp; Commissions</a>' in (ROOT/'fiches-degustation/validation-degustations.html').read_text()
print('Member navigation checks passed: dedicated home, archives, all-page menu, active sections, logo and repeatable builds.')
