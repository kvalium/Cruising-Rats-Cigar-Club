#!/usr/bin/env python3
"""Generate static tasting archives. Run from any directory with Python 3."""
import json
import importlib.util
from types import SimpleNamespace
import re
import os
from datetime import date
from html import escape as esc
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('CRCC_SITE_URL', 'https://cruising-rats-cigar-club.fr/').rstrip('/') + '/'
MONTHS = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

def long_date(value):
    d = date.fromisoformat(value)
    return f'{d.day} {MONTHS[d.month]} {d.year}'

def validate(data):
    sessions, sheets, member_numbers = set(), set(), set()
    rubrics = {}
    roster_ids = [m['id'] for m in data.get('members', [])]
    assert len(set(roster_ids)) == len(roster_ids), 'Duplicate member in roster'
    assert all(re.fullmatch(r'[a-z0-9-]+', m['id']) and m['name'].strip() for m in data.get('members', [])), 'Invalid roster member'
    for s in data['sessions']:
        assert re.fullmatch(r'[a-z0-9-]+', s['id']) and s['id'] not in sessions, 'Invalid/duplicate session id'
        sessions.add(s['id'])
        date.fromisoformat(s['date'])
        assert all(re.fullmatch(r'[a-z0-9-]+', m['id']) for m in s['participants']), 'Invalid member id'
        members = {m['id']: m for m in s['participants']}
        assert len(members) == len(s['participants']) and members, 'Invalid participants'
        assert s['sheets'], 'A published session needs at least one sheet'
        if s.get('minutes_pdf') and not s['minutes_pdf'].startswith('https://'):
            assert (ROOT / s['minutes_pdf']).is_file(), 'Missing minutes PDF'
        for f in s['sheets']:
            assert re.fullmatch(r'[a-z0-9-]+', f['id']) and f['id'] not in sheets, 'Invalid/duplicate sheet id'
            sheets.add(f['id'])
            assert f['member_id'] in members, 'Sheet member absent from session'
            number = (f['member_id'], f['number'])
            assert isinstance(f['number'], int) and f['number'] > 0 and number not in member_numbers, 'Duplicate member sheet number'
            member_numbers.add(number)
            for field in ('pdf', 'report'):
                if field == 'pdf' and f[field].startswith('https://'):
                    continue
                p = (ROOT / f[field]).resolve()
                assert p.is_relative_to(ROOT) and p.is_file(), f'Missing/invalid {field}'
            for field in ('published', 'revised'):
                date.fromisoformat(f[field])
            assert f['revised'] >= f['published'], 'Revision precedes publication'
            assert sum(c['max'] for c in f['criteria']) == 100, 'Criteria must total 100'
            assert all(0 <= c['score'] <= c['max'] for c in f['criteria']), 'Invalid committee score'
            if f.get('rubric_id'):
                signature = sorted((c['label'], c['max']) for c in f['criteria'])
                assert f['rubric_id'] not in rubrics or rubrics[f['rubric_id']] == signature, 'Changed criteria require a distinct rubric id'
                rubrics[f['rubric_id']] = signature
            assert f['cigar_score'] is None or 0 <= f['cigar_score'] <= 10, 'Invalid cigar score'
            assert f['evaluation_basis'], 'Evaluation basis required'
            if f.get('pairings') is not None:
                assert isinstance(f['pairings'], list) and all(isinstance(v, str) and v.strip() for v in f['pairings']), 'Invalid accompaniments'
            for key in ('duration_minutes', 'ash_max_cm'):
                value = f.get(key)
                assert value is None or (isinstance(value, (int,float)) and not isinstance(value,bool) and 0 <= value < float('inf')), 'Invalid measurement'
            assert f.get('aromas') is None or all(isinstance(a,str) and a for a in f['aromas']), 'Invalid aromas'
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

def member_url(m):
    return f"membre-{m['id']}.html"

def member_link(m):
    return f'<a href="{member_url(m)}">{esc(m["name"])}</a>'

def member_with_badge(m):
    grade = m.get('grade', '')
    if grade.casefold().strip() == 'rat de passage':
        badge = '<img class="inline-grade" src="../images/badges/rat-de-passage-36.webp" srcset="../images/badges/rat-de-passage-72.webp 2x" decoding="async" alt="Rat de Passage" title="Rat de Passage" width="36" height="36">'
    else:
        badge = f'<span class="badge">{esc(grade)}</span>' if grade else ''
    return '<span class="member-with-badge">' + member_link(m) + badge + '</span>'

def session_url(s):
    return f"seance-{s['id']}.html"

def pdf_links(path, label):
    href = path if path.startswith('https://') else '../' + path
    return f'<a class="download" href="{esc(href)}" target="_blank" rel="noopener">Consulter {label}</a>'

def cigar_verification(s, member_id=None):
    verification = s.get('cigar_verification')
    if not verification:
        return ''
    columns = verification['members'] if member_id is None else [m for m in verification['members'] if m['id']==member_id]
    body = '<section class="card cigar-verification"><h2>Le cigare à l’épreuve des pièces</h2><p>Caractéristiques de référence vérifiées, confrontées aux déclarations consignées. Les informations ajoutées par le Comité ne sont pas créditées rétroactivement aux dégustateurs.</p><div class="table-scroll"><table><caption>' + esc(verification.get('title', 'CAO Gold Robusto — comparaison documentaire')) + '</caption><thead><tr><th scope="col">Élément</th><th scope="col">Référence vérifiée</th>'
    body += ''.join(f'<th scope="col">Fiche de {esc(m["name"])}</th>' for m in columns) + '</tr></thead><tbody>'
    for row in verification['comparisons']:
        body += f'<tr><th scope="row">{esc(row["label"])}</th><td>{esc(row["reference"])}</td>' + ''.join(f'<td>{esc(row["declared"][m["id"]])}</td>' for m in columns) + '</tr>'
    body += '</tbody></table></div><p>' + esc(verification['interpretation']) + '</p><p class="archive-meta">Sources consultées le ' + long_date(verification['checked']) + ' : '
    body += ' · '.join(f'<a href="{esc(src["url"])}" target="_blank" rel="noopener">{esc(src["label"])}</a>' for src in verification['sources']) + '.</p></section>'
    return body

def cigar_description(s):
    summary = s.get('cigar_summary')
    if not summary:
        return ''
    body = '<section class="card cigar-summary"><p class="smallcaps">LE CIGARE DE LA SÉANCE</p><h2>' + esc(summary['title']) + '</h2><p>' + esc(summary['description']) + '</p>'
    if summary.get('caution'):
        body += '<p class="archive-meta">' + esc(summary['caution']) + '</p>'
    body += '<p class="archive-meta">' + ' · '.join(f'<a href="{esc(source["url"])}" target="_blank" rel="noopener">{esc(source["label"])}</a>' for source in summary.get('sources', [])) + '</p></section>'
    return body

def session_intro(s):
    intro = s.get('introduction')
    if intro:
        body = f'<section class="session-opening"><p class="lead">{esc(intro["lead"])}</p><dl class="session-facts">'
        for field in intro['facts']:
            body += f'<div><dt>{esc(field["label"])}</dt><dd>{esc(field["value"])}</dd></div>'
        body += '</dl><p class="archive-meta">' + esc(intro['note']) + '</p></section>'
    else:
        body = f'<p class="news-date"><time datetime="{s["date"]}">{long_date(s["date"])}</time></p><p class="lead">{esc(s["context"])}</p>'
    body += '<section class="card session-attendees"><h2>Autour de la table</h2><div class="attendee-grid"><div><h3>Membres dégustateurs</h3><ul>'
    body += ''.join(f'<li>{member_with_badge(m)}</li>' for m in s['participants']) + '</ul><p class="archive-meta">Grades au moment de la séance.</p></div>'
    if s.get('prospects'):
        body += '<div><h3>Prospects présents</h3><ul>' + ''.join(f'<li>{esc(p["name"])}</li>' for p in s['prospects']) + '</ul></div>'
    body += '</div><p><strong>Cigare :</strong> ' + esc(' ; '.join(s['cigars'])) + '</p></section>'
    return body

def tasting_facts(f):
    """Compact quick-reference panel using only documented tasting fields."""
    facts = [
        ('Module déclaré', f.get('module') or 'Non précisé'),
        ('Durée', f.get('duration') or 'Non précisée'),
        ('Accompagnement', f.get('pairing') or 'Non renseigné'),
        ('Arômes notés', ', '.join(f.get('aromas') or []) or 'Non renseignés'),
    ]
    return ('<section class="tasting-at-glance" aria-label="Repères de dégustation">'
            '<h2>Repères de dégustation</h2><dl class="tasting-facts">' +
            ''.join('<div><dt>' + esc(label) + '</dt><dd>' + esc(str(value)) +
                    '</dd></div>' for label,value in facts) + '</dl></section>')

def shell(title_text, path, body, script=False):
    nav = re.search(r'<nav class="site-nav".*?</nav>', (ROOT / 'index.html').read_text(), re.S).group()
    nav = re.sub(r' aria-current="page"', '', nav)
    nav = nav.replace('href="', 'href="../')
    return f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title_text)} — CRCC</title><meta name="description" content="{esc(title_text)} : archives, documents sources et appréciation du Comité du Cruising Rats Cigar Club.">
<link rel="canonical" href="{BASE}fiches-degustation/{esc(path)}"><link rel="stylesheet" href="../css/style.css"><link rel="stylesheet" href="../css/archives.css">
<link rel="icon" href="https://assets.cruising-rats-cigar-club.fr/images/crcc-logo-header-155.webp" type="image/webp">
</head><body><div class="site-shell"><header class="site-header"><img class="logo" src="https://assets.cruising-rats-cigar-club.fr/images/crcc-logo-header-155.webp" alt="Logo du Cruising Rats Cigar Club" width="155" height="155"><div class="kicker">CRUISING RATS CIGAR CLUB</div><h1 class="site-title">{esc(title_text)}</h1><div class="reference">SERVICE DES ARCHIVES ORGANOLEPTIQUES</div></header>
{nav}<div class="banner">LES RATS DÉGUSTENT • LE COMITÉ EXAMINE • LES ARCHIVES CONSERVENT</div><main>{body}</main>
<footer>CRUISING RATS CIGAR CLUB<br>COMITÉ EXÉCUTIF • SERVICE DE DÉGUSTATION ET D’ARCHIVAGE<br>On pipe rien, mais on a des fiches.<br><a href="index.html">Dégustations</a> · <a href="registre-membres.html">Registre des membres</a></footer></div>{'<script src="../js/archives.js" defer></script>' if script else ''}</body></html>'''

RULES = '''<details class="card"><summary>Comprendre la note du Comité et le rôle des minutes</summary>
<p>La note du Comité sur 100 évalue la précision, la cohérence et la qualité des observations du membre, à partir des pièces disponibles. La note du cigare sur 10 exprime le jugement personnel du dégustateur.</p>
<p>Les minutes appartiennent à la séance. Elles peuvent compléter le contexte commun et les faits techniques ; seules les observations explicitement attribuées à un membre enrichissent son évaluation personnelle. Une remarque sans auteur reste un élément de contexte.</p>
<p>L’absence de minutes ne retire aucun point. Leur présence seule n’en ajoute aucun. Chaque compte rendu indique les pièces utilisées et, lorsqu’il existe des minutes, leur apport individuel à l’évaluation. La note est réexaminée dans les critères concernés, avec une date de révision.</p>
<p>Le barème présenté avec la première fiche est un barème d’analyse proposé ; il ne constitue pas un règlement préexistant du Club. Une note ne vaut pas changement de grade.</p></details>'''

SESSION_STATES = {
    'en-examen': 'EN EXAMEN',
    'valide': 'VALIDÉ',
    'valide-avec-reserves': 'VALIDÉ AVEC RÉSERVES',
    'a-regulariser': 'À RÉGULARISER',
    'a-reexaminer': 'À RÉEXAMINER',
    'archive': 'ARCHIVÉ',
}

def session_assessment(s):
    review = s.get('committee_review')
    if not review:
        return {'status': 'en-examen', 'appreciation': 'Les pièces de la séance sont archivées. L’appréciation générale du Comité reste à établir.'}
    assert review['status'] in SESSION_STATES, 'Unknown session status'
    date.fromisoformat(review['date'])
    assert review['appreciation'], 'Session appreciation required'
    # New pieces require a fresh global review, even when individual marks already exist.
    if sorted(review['sheet_ids']) != sorted(f['id'] for f in s['sheets']) or review.get('minutes_pdf') != s.get('minutes_pdf'):
        return {'status': 'a-reexaminer', 'appreciation': 'Les pièces de la séance ont évolué depuis le dernier examen. Le Comité doit actualiser son appréciation générale à partir du dossier complet.'}
    return review

def session_verdict(s, compact=False):
    review = session_assessment(s)
    state = f'<span class="session-state state-{review["status"]}">{SESSION_STATES[review["status"]]}</span>'
    if compact:
        return state
    count = len(s['sheets'])
    documents = f'{count} fiche' + ('s' if count > 1 else '')
    documents += ' et minutes communes' if s.get('minutes_pdf') else ' ; aucune minute jointe (document facultatif)'
    dated = f'<span class="archive-meta">Avis du {long_date(review["date"])}</span>' if review.get('date') else ''
    return f'<section class="card session-verdict" aria-labelledby="session-verdict-title"><div class="verdict-heading"><h2 id="session-verdict-title">Appréciation générale du Comité</h2>{state}</div><p>{esc(review["appreciation"])}</p><p class="archive-meta"><strong>Pièces du dossier :</strong> {documents}.</p>{dated}<p class="archive-meta">L’état porte sur le dossier de séance. Les notes des membres restent individuelles.</p></section>'

def session_sheets(s):
    rows = []
    for f in s['sheets']:
        m = member(s, f)
        rows.append(f'''<li class="session-sheet"><div class="sheet-heading"><div><p class="smallcaps">FICHE {f['number']} · {member_with_badge(m)}</p><h3><a href="{sheet_url(f)}">{esc(f['title'])}</a></h3></div><div class="sheet-mark"><strong>{score(f)}/100</strong><span>Note du Comité</span></div></div><p class="archive-meta">{esc(f['cigar'])}<br>Dégustation du {long_date(s['date'])}</p><a class="sheet-read" href="{sheet_url(f)}" aria-label="Consulter la fiche {f['number']} de {esc(m['name'])} et le compte rendu">Consulter la fiche et le compte rendu <span aria-hidden="true">→</span></a></li>''')
    return '<ul class="session-sheets">' + ''.join(rows) + '</ul>'

def sheet_list(s, filter_rows=False):
    rows = []
    for f in s['sheets']:
        m = member(s, f)
        attrs = f' data-entry data-member="{esc(f["member_id"])}" data-brand="{esc(f["brand"])}"' if filter_rows else ''
        rows.append(f'<li{attrs}><span class="archive-contributor">{member_with_badge(m)}<span class="archive-separator" aria-hidden="true">·</span><a class="archive-sheet-link" href="{sheet_url(f)}" aria-label="{esc(f["title"])} — fiche de {esc(m["name"])}">{esc(f["title"])}</a></span><span class="archive-sheet-score"><span>Comité</span> <strong>{score(f)}/100</strong></span></li>')
    return '<ul class="archive-contributions">' + ''.join(rows) + '</ul>'

def build(data):
    validate(data)
    out = ROOT / 'fiches-degustation'
    out.mkdir(exist_ok=True)
    sessions = sorted(data['sessions'], key=lambda s: (s['date'], s['id']), reverse=True)
    people = {m['id']: m['name'] for s in sessions for m in s['participants']}
    brands = sorted({f['brand'] for s in sessions for f in s['sheets']})
    options = lambda values: ''.join(f'<option value="{esc(k)}">{esc(v)}</option>' for k,v in values)
    body = '<div class="archive-intro"><p class="lead">Espace membres du Cruising Rats Cigar Club</p><p>Grades, distinctions, dossiers personnels, séances et records du Club.</p></div><section class="card accent"><h2>Registre des membres et des records</h2><p>Consultez les fiches individuelles, la hiérarchie des cinq grades, les distinctions et le palmarès officiel calculé sur les archives.</p><p><a class="download" href="registre-membres.html">ACCÉDER AUX GRADES, DISTINCTIONS ET RECORDS →</a></p></section><h2>Dernières dégustations</h2>'
    body += f'''<form class="archive-filters" data-archive-filters hidden><label>Membre<select name="member"><option value="">Tous les membres</option>{options(sorted(people.items(), key=lambda p:p[1]))}</select></label><label>Marque<select name="brand"><option value="">Toutes les marques</option>{options((b,b) for b in brands)}</select></label></form><p class="archive-meta" data-result-count aria-live="polite">{len(sessions)} séance{"s" if len(sessions)>1 else ""} archivée{"s" if len(sessions)>1 else ""}</p><p data-empty hidden>Aucune dégustation ne correspond à ces critères.</p>'''
    for s in sessions:
        n, count = len(s['participants']), len(s['sheets'])
        body += f'<article class="archive-card" data-session><time class="news-date" datetime="{s["date"]}">{long_date(s["date"])}</time><h2><a href="{session_url(s)}">{esc(s["title"])}</a></h2><p class="archive-meta">{n} participant{"s" if n>1 else ""} · {count} fiche{"s" if count>1 else ""}{" · Minutes disponibles" if s.get("minutes_pdf") else ""}</p>{sheet_list(s, True)}</article>'
    body += '<p><a href="registre-membres.html">Consulter le registre des membres →</a></p>' + RULES
    (out / 'index.html').write_text(shell('Dégustations', 'index.html', body, True))
    for s in sessions:
        crumbs = '<p class="breadcrumbs"><a href="index.html">Dégustations</a> / Séance</p>'
        body = crumbs + session_intro(s)
        if s.get('minutes_pdf'):
            body += '<section class="card"><h2>Minutes de la séance</h2><p>Document commun aux participants. Les propos ne sont attribués à un membre que lorsque leur auteur est explicitement identifié.</p><div class="documents">' + pdf_links(s['minutes_pdf'], 'les minutes') + '</div></section>'
        body += '<section class="session-records"><h2>Fiches et comptes rendus</h2>' + session_sheets(s) + '</section>'
        body += session_verdict(s) + cigar_description(s) + RULES
        body += '<p class="archive-footer"><a href="index.html">← Toutes les séances</a></p>'
        (out / session_url(s)).write_text(shell(s['title'], session_url(s), body))
        for f in s['sheets']:
            m = member(s,f)
            body = f'<p class="breadcrumbs"><a href="index.html">Dégustations</a> / <a href="{session_url(s)}">{esc(s["title"])}</a> / {member_link(m)} — Fiche {f["number"]}</p>'
            body += f'<p><span class="badge">{esc(m["grade"])}</span>{"<span class=badge>Première fiche</span>" if f.get("first") else ""}</p><p class="archive-meta">Grade au moment de la dégustation · Dégustation du <time datetime="{s["date"]}">{long_date(s["date"])}</time><br>Publié le {long_date(f["published"])} · Dernière révision : {long_date(f["revised"])}</p>'
            body += tasting_facts(f)
            body += f'<section class="card"><h2>Identification du dossier</h2><p><strong>Membre :</strong> {member_link(m)}<br><strong>Cigare déclaré :</strong> {esc(f["cigar"])}<br><strong>Durée :</strong> {esc(f["duration"])}<br><strong>Accompagnement :</strong> {esc(f["pairing"])}<br><strong>Prix :</strong> {esc(f["price"])}</p><div class="documents">{pdf_links(f["pdf"], "la fiche")}</div>'
            if s.get('minutes_pdf'):
                body += '<div class="documents">' + pdf_links(s['minutes_pdf'], 'les minutes communes') + '</div>'
            body += '</section>'
            cigar_score = 'Non renseignée' if f['cigar_score'] is None else str(f['cigar_score']).replace('.', ',') + '/10'
            body += f'<div class="scores"><div class="score"><span>Note du Comité · qualité du dossier</span><strong>{score(f)}/100</strong></div><div class="score"><span>Note du cigare · avis de {esc(m["name"])}</span><strong>{cigar_score}</strong><span>{esc(f["cigar_score_note"])}</span></div></div>'
            body += f'<p><strong>Base de l’évaluation :</strong> {esc(f["evaluation_basis"])}</p>'
            if s.get('minutes_pdf'):
                body += f'<p><strong>Apport des minutes :</strong> {esc(f["minutes_contribution"])}</p>'
            body += cigar_verification(s, f['member_id'])
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
            body += f'<p><a href="{member_url(m)}">Registre et statistiques de {esc(m["name"])} →</a></p><p><a href="{session_url(s)}">← Revenir à la séance</a> · <a href="index.html">Toutes les séances</a></p></section>'
            (out / sheet_url(f)).write_text(shell(title(s,f), sheet_url(f), body))
    spec = importlib.util.spec_from_file_location('member_pages', Path(__file__).with_name('member-pages.py'))
    registry = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(registry)
    member_pages = registry.build_members(SimpleNamespace(ROOT=ROOT, member_url=member_url, session_url=session_url, sheet_url=sheet_url, score=score, title=title, long_date=long_date, shell=shell), data)
    # Keep generated pages discoverable and remove only prior archive sitemap entries.
    sitemap = ROOT / 'sitemap.xml'
    text = sitemap.read_text()
    text = re.sub(r'\s*<url><loc>[^<]*/fiches-degustation/[^<]*</loc>.*?</url>', '', text, flags=re.S)
    urls = ['index.html'] + [session_url(s) for s in sessions] + [sheet_url(f) for s in sessions for f in s['sheets']] + member_pages
    entries = ''.join(f'  <url><loc>{BASE}fiches-degustation/{p}</loc></url>\n' for p in urls)
    sitemap.write_text(text.replace('</urlset>', entries + '</urlset>'))
    ET.parse(sitemap)
    return urls

if __name__ == '__main__':
    urls = build(json.loads((ROOT / 'data/degustations.json').read_text()))
    print(f'{len(urls)} archive pages generated.')
