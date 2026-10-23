#!/usr/bin/env python3
"""Generate static tasting archives. Run from any directory with Python 3."""
import json
import re
from datetime import date
from html import escape as esc
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://kvalium.github.io/Cruising-Rats-Cigar-Club/'
MONTHS = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

def long_date(value):
    d = date.fromisoformat(value)
    return f'{d.day} {MONTHS[d.month]} {d.year}'

def validate(data):
    sessions, sheets, member_numbers = set(), set(), set()
    for s in data['sessions']:
        assert re.fullmatch(r'[a-z0-9-]+', s['id']) and s['id'] not in sessions, 'Invalid/duplicate session id'
        sessions.add(s['id'])
        date.fromisoformat(s['date'])
        members = {m['id']: m for m in s['participants']}
        assert len(members) == len(s['participants']) and members, 'Invalid participants'
        assert s['sheets'], 'A published session needs at least one sheet'
        if s.get('minutes_pdf'):
            assert (ROOT / s['minutes_pdf']).is_file(), 'Missing minutes PDF'
        for f in s['sheets']:
            assert re.fullmatch(r'[a-z0-9-]+', f['id']) and f['id'] not in sheets, 'Invalid/duplicate sheet id'
            sheets.add(f['id'])
            assert f['member_id'] in members, 'Sheet member absent from session'
            number = (f['member_id'], f['number'])
            assert isinstance(f['number'], int) and f['number'] > 0 and number not in member_numbers, 'Duplicate member sheet number'
            member_numbers.add(number)
            for field in ('pdf', 'report'):
                p = (ROOT / f[field]).resolve()
                assert p.is_relative_to(ROOT) and p.is_file(), f'Missing/invalid {field}'
            for field in ('published', 'revised'):
                date.fromisoformat(f[field])
            assert f['revised'] >= f['published'], 'Revision precedes publication'
            assert sum(c['max'] for c in f['criteria']) == 100, 'Criteria must total 100'
            assert all(0 <= c['score'] <= c['max'] for c in f['criteria']), 'Invalid committee score'
            assert f['cigar_score'] is None or 0 <= f['cigar_score'] <= 10, 'Invalid cigar score'
            assert f['evaluation_basis'], 'Evaluation basis required'
            if s.get('minutes_pdf'):
                assert f.get('minutes_contribution'), 'Explain individual use (or non-use) of shared minutes'

def score(f):
    return sum(c['score'] for c in f['criteria'])

def member(s, f):
    return next(m for m in s['participants'] if m['id'] == f['member_id'])

def title(s, f):
    return f"{member(s, f)['name']} - Fiche {f['number']} - {f['title']} - {long_date(s['date'])}"

def sheet_url(f):
    return f"fiche-{f['id']}.html"

def session_url(s):
    return f"seance-{s['id']}.html"

def pdf_links(path, label):
    return f'<a class="download" href="../{esc(path)}" target="_blank" rel="noopener">Consulter {label} (PDF, nouvel onglet)</a><a href="../{esc(path)}" download>Télécharger {label} (PDF)</a>'

def shell(title_text, path, body, script=False):
    nav = re.search(r'<nav class="site-nav".*?</nav>', (ROOT / 'index.html').read_text(), re.S).group()
    nav = re.sub(r' aria-current="page"', '', nav)
    nav = nav.replace('href="', 'href="../')
    return f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title_text)} — CRCC</title><meta name="description" content="{esc(title_text)} : archives, documents sources et appréciation du Comité du Cruising Rats Cigar Club.">
<link rel="canonical" href="{BASE}fiches-degustation/{esc(path)}"><link rel="stylesheet" href="../css/style.css"><link rel="stylesheet" href="../css/archives.css">
<link rel="icon" href="https://cruising-rats-cigar-club.s3.eu-west-3.amazonaws.com/logo_transparent.png" type="image/png">
</head><body><div class="site-shell"><header class="site-header"><img class="logo" src="https://cruising-rats-cigar-club.s3.eu-west-3.amazonaws.com/logo_transparent.png" alt="Logo du Cruising Rats Cigar Club" width="155" height="155"><div class="kicker">CRUISING RATS CIGAR CLUB</div><h1 class="site-title">{esc(title_text)}</h1><div class="reference">SERVICE DES ARCHIVES ORGANOLEPTIQUES</div></header>
{nav}<div class="banner">LES RATS DÉGUSTENT • LE COMITÉ EXAMINE • LES ARCHIVES CONSERVENT</div><main>{body}</main>
<footer>CRUISING RATS CIGAR CLUB<br>COMITÉ EXÉCUTIF • SERVICE DE DÉGUSTATION ET D’ARCHIVAGE<br>On pipe rien, mais on a des fiches.<br><a href="index.html">Fiches de dégustation</a></footer></div>{'<script src="../js/archives.js" defer></script>' if script else ''}</body></html>'''

RULES = '''<details class="card"><summary>Comprendre la note du Comité et le rôle des minutes</summary>
<p>La note du Comité sur 100 évalue la précision, la cohérence et la qualité des observations du membre, à partir des pièces disponibles. La note du cigare sur 10 exprime le jugement personnel du dégustateur.</p>
<p>Les minutes appartiennent à la séance. Elles peuvent compléter le contexte commun et les faits techniques ; seules les observations explicitement attribuées à un membre enrichissent son évaluation personnelle. Une remarque sans auteur reste un élément de contexte.</p>
<p>L’absence de minutes ne retire aucun point. Leur présence seule n’en ajoute aucun. Chaque compte rendu indique les pièces utilisées et, lorsqu’il existe des minutes, leur apport individuel à l’évaluation. La note est réexaminée dans les critères concernés, avec une date de révision.</p>
<p>Le barème présenté avec la première fiche est un barème d’analyse proposé ; il ne constitue pas un règlement préexistant du Club. Une note ne vaut pas changement de grade.</p></details>'''

def sheet_list(s, filter_rows=False):
    rows = []
    for f in s['sheets']:
        attrs = f' data-entry data-member="{esc(f["member_id"])}" data-brand="{esc(f["brand"])}"' if filter_rows else ''
        rows.append(f'<li{attrs}><a href="{sheet_url(f)}">{esc(title(s, f))}</a><br><span class="archive-meta">{esc(member(s, f)["grade"])} · {esc(f["cigar"])}<br>Note du Comité : <strong>{score(f)}/100</strong></span>{" <span class=badge>Première fiche</span>" if f.get("first") else ""}</li>')
    return '<ul>' + ''.join(rows) + '</ul>'

def build(data):
    validate(data)
    out = ROOT / 'fiches-degustation'
    out.mkdir(exist_ok=True)
    sessions = sorted(data['sessions'], key=lambda s: (s['date'], s['id']), reverse=True)
    people = {m['id']: m['name'] for s in sessions for m in s['participants']}
    brands = sorted({f['brand'] for s in sessions for f in s['sheets']})
    options = lambda values: ''.join(f'<option value="{esc(k)}">{esc(v)}</option>' for k,v in values)
    body = '''<div class="archive-intro"><p class="lead">Les Rats dégustent. Le Comité examine. Les archives conservent.</p><p>Retrouvez les séances de dégustation, les fiches des membres et leur compte rendu. Les sensations sont personnelles ; leur classement est une affaire sérieuse.</p><p>Les séances sont classées par date de dégustation, de la plus récente à la plus ancienne. Les minutes communes, lorsqu’elles existent, sont conservées une seule fois et reliées aux fiches individuelles.</p></div>'''
    body += f'''<form class="archive-filters" data-archive-filters hidden><label>Membre<select name="member"><option value="">Tous les membres</option>{options(sorted(people.items(), key=lambda p:p[1]))}</select></label><label>Marque<select name="brand"><option value="">Toutes les marques</option>{options((b,b) for b in brands)}</select></label></form><p class="archive-meta" data-result-count aria-live="polite">{len(sessions)} séance archivée</p><p data-empty hidden>Aucune fiche ne correspond à ces critères.</p>'''
    for s in sessions:
        n, count = len(s['participants']), len(s['sheets'])
        body += f'<article class="card archive-card" data-session><time class="news-date" datetime="{s["date"]}">{long_date(s["date"])}</time><h2><a href="{session_url(s)}">{esc(s["title"])}</a></h2><p class="archive-meta">{n} participant{"s" if n>1 else ""} · {count} fiche{"s" if count>1 else ""}{" · Minutes disponibles" if s.get("minutes_pdf") else ""}</p><p>{esc(" ; ".join(s["cigars"]))}</p>{sheet_list(s, True)}<a href="{session_url(s)}">Consulter le dossier de séance →</a></article>'
    body += RULES
    (out / 'index.html').write_text(shell('Fiches de dégustation', 'index.html', body, True))
    for s in sessions:
        crumbs = '<p class="breadcrumbs"><a href="index.html">Fiches de dégustation</a> / Séance</p>'
        body = crumbs + f'<p class="news-date"><time datetime="{s["date"]}">{long_date(s["date"])}</time></p><p class="lead">{esc(s["context"])}</p><section class="card"><h2>Participants et cigares</h2><ul>'
        body += ''.join(f'<li>{esc(m["name"])} — {esc(m["grade"])} <span class="archive-meta">(grade au moment de la dégustation)</span></li>' for m in s['participants'])
        body += '</ul><ul>' + ''.join(f'<li>{esc(c)}</li>' for c in s['cigars']) + '</ul></section>'
        if s.get('minutes_pdf'):
            body += '<section class="card"><h2>Minutes de la séance</h2><p>Document commun aux participants. Les propos ne sont attribués à un membre que lorsque leur auteur est explicitement identifié.</p><div class="documents">' + pdf_links(s['minutes_pdf'], 'les minutes') + '</div></section>'
        body += '<section class="card archive-card"><h2>Fiches et comptes rendus</h2>' + sheet_list(s) + '</section>' + RULES
        body += '<p class="archive-footer"><a href="index.html">← Toutes les séances</a></p>'
        (out / session_url(s)).write_text(shell(s['title'], session_url(s), body))
        for f in s['sheets']:
            m = member(s,f)
            body = f'<p class="breadcrumbs"><a href="index.html">Fiches de dégustation</a> / <a href="{session_url(s)}">{esc(s["title"])}</a> / {esc(m["name"])} — Fiche {f["number"]}</p>'
            body += f'<p><span class="badge">{esc(m["grade"])}</span>{"<span class=badge>Première fiche</span>" if f.get("first") else ""}</p><p class="archive-meta">Grade au moment de la dégustation · Dégustation du <time datetime="{s["date"]}">{long_date(s["date"])}</time><br>Publié le {long_date(f["published"])} · Dernière révision : {long_date(f["revised"])}</p>'
            body += f'<section class="card"><h2>Identification du dossier</h2><p><strong>Membre :</strong> {esc(m["name"])}<br><strong>Cigare déclaré :</strong> {esc(f["cigar"])}<br><strong>Durée :</strong> {esc(f["duration"])}<br><strong>Accompagnement :</strong> {esc(f["pairing"])}<br><strong>Prix :</strong> {esc(f["price"])}</p><div class="documents">{pdf_links(f["pdf"], "la fiche")}</div>'
            if s.get('minutes_pdf'):
                body += '<div class="documents">' + pdf_links(s['minutes_pdf'], 'les minutes communes') + '</div>'
            body += '</section>'
            cigar_score = 'Non renseignée' if f['cigar_score'] is None else str(f['cigar_score']).replace('.', ',') + '/10'
            body += f'<div class="scores"><div class="score"><span>Note du Comité · qualité du dossier</span><strong>{score(f)}/100</strong></div><div class="score"><span>Note du cigare · avis de {esc(m["name"])}</span><strong>{cigar_score}</strong><span>{esc(f["cigar_score_note"])}</span></div></div>'
            body += f'<p><strong>Base de l’évaluation :</strong> {esc(f["evaluation_basis"])}</p>'
            if s.get('minutes_pdf'):
                body += f'<p><strong>Apport des minutes :</strong> {esc(f["minutes_contribution"])}</p>'
            body += '<article class="report" aria-label="Compte rendu détaillé">' + (ROOT / f['report']).read_text() + '</article>'
            body += '<section><h2>9. Note du Comité</h2><p>Cette note évalue la qualité de la contribution documentaire du membre. La note du cigare demeure son appréciation personnelle.</p><div class="table-scroll"><table><caption>Détail de l’évaluation sur 100</caption><thead><tr><th scope="col">Critère</th><th scope="col">Note</th><th scope="col">Appréciation</th></tr></thead><tbody>'
            body += ''.join(f'<tr><th scope="row">{esc(c["label"])}</th><td>{c["score"]}/{c["max"]}</td><td>{esc(c["comment"])}</td></tr>' for c in f['criteria'])
            body += f'<tr><th scope="row">Total</th><td><strong>{score(f)}/100</strong></td><td>{esc(f["mention"])}</td></tr></tbody></table></div><p class="archive-meta">Barème proposé pour ce compte rendu ; aucun changement de grade n’en découle.</p></section>'
            body += '<section class="card accent"><h2>10. Appréciation du Comité</h2>' + ''.join(f'<p>{esc(p)}</p>' for p in f['appreciation']) + f'<blockquote>{esc(f["mention"])}</blockquote><p><strong>Le Comité exécutif — CRCC</strong><br><em>On pipe rien, mais on a des fiches.</em></p></section>' + RULES
            others = [(other_s,other_f) for other_s in sessions for other_f in other_s['sheets'] if other_f['member_id']==f['member_id'] and other_f['id']!=f['id']]
            body += '<section class="archive-footer"><h2>Le parcours du membre</h2>'
            if others:
                body += '<ul>' + ''.join(f'<li><a href="{sheet_url(of)}">{esc(title(os,of))}</a></li>' for os,of in others) + '</ul>'
            else:
                body += '<p>Il s’agit de la première fiche archivée de ce membre. Le dossier attend la suite.</p>'
            body += f'<p><a href="index.html?membre={esc(f["member_id"])}">Toutes les fiches de {esc(m["name"])} →</a></p><p><a href="{session_url(s)}">← Revenir à la séance</a> · <a href="index.html">Toutes les séances</a></p></section>'
            (out / sheet_url(f)).write_text(shell(title(s,f), sheet_url(f), body))
    # Keep generated pages discoverable and remove only prior archive sitemap entries.
    sitemap = ROOT / 'sitemap.xml'
    text = sitemap.read_text()
    text = re.sub(r'\s*<url><loc>[^<]*/fiches-degustation/[^<]*</loc>.*?</url>', '', text, flags=re.S)
    urls = ['index.html'] + [session_url(s) for s in sessions] + [sheet_url(f) for s in sessions for f in s['sheets']]
    entries = ''.join(f'  <url><loc>{BASE}fiches-degustation/{p}</loc></url>\n' for p in urls)
    sitemap.write_text(text.replace('</urlset>', entries + '</urlset>'))
    ET.parse(sitemap)
    return urls

if __name__ == '__main__':
    urls = build(json.loads((ROOT / 'data/degustations.json').read_text()))
    print(f'{len(urls)} archive pages generated.')
