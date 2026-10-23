"""Member registry pages; statistics are rendered by the same JS in Node and browser."""
import json
import subprocess
from html import escape as esc

def grade_badge(person):
    grade = person.get('grade') or 'Grade non renseigné'
    # Only the validated grade receives this artwork; unknown grades keep their text.
    if grade.casefold().strip() == 'rat de passage':
        return '<img class="grade-portrait" src="../images/badges/rat-de-passage.png" alt="Badge Rat de Passage : jeune rat avec une tétine" width="144" height="144">'
    return ''

def people_for(data):
    people = {m['id']:dict(m) for m in data.get('members', [])}
    for s in sorted(data['sessions'], key=lambda s:(s['date'],s['id'])):
        for m in s['participants']:
            people[m['id']] = {**people.get(m['id'], {}), **m}
    return people

def build_members(archive, data):
    root = archive.ROOT
    sessions = sorted(data['sessions'], key=lambda s:(s['date'],s['id']))
    people = people_for(data)
    pages=[]
    for member_id, person in people.items():
        rows=[]
        for s in sessions:
            for f in s['sheets']:
                if f['member_id'] != member_id:
                    continue
                row = {key:f.get(key) for key in ('id','number','first','brand','cigar','module','origin','reference_exact','aromas','duration_minutes','ash_max_cm','technique','pairing','pairings','cigar_score','criteria','rubric_label')}
                # Unknown schemas are isolated per fiche, never assumed comparable.
                row.update(date=s['date'], session_id=s['id'], session_title=s['title'], session_url=archive.session_url(s), participant_count=len(s['participants']), committee_score=archive.score(f), rubric_id=f.get('rubric_id') or 'Barème non identifié — '+f['id'], url=archive.sheet_url(f), full_title=archive.title(s,f))
                rows.append(row)
        page=archive.member_url(person)
        pages.append(page)
        body=f'<p class="breadcrumbs"><a href="registre-membres.html">Registre des membres</a> / {esc(person["name"])}</p><section class="member-identity">{grade_badge(person)}<div><p class="member-grade">{esc(person.get("grade") or "Grade non renseigné")}</p><p class="archive-meta">Dernier grade documenté.</p><p>Un palais, des observations, un dossier qui s’épaissit. Le Comité suit les pièces ; les courbes font le reste.</p></div></section>'
        if rows:
            last_session,last_fiche=max(((s,f) for s in sessions for f in s['sheets'] if f['member_id']==member_id),key=lambda pair:(pair[0]['date'],pair[1]['number']))
            body+='<section class="card accent"><h2>Dernière appréciation du Comité</h2>'
            body+=f'<p class="archive-meta">Dégustation du {archive.long_date(last_session["date"])} · <a href="{archive.sheet_url(last_fiche)}">Fiche {last_fiche["number"]}</a></p><blockquote>{esc(last_fiche["mention"])}</blockquote>'
            if last_fiche['appreciation']:
                body+='<p>'+esc(last_fiche['appreciation'][0])+'</p>'
            if last_fiche.get('next_steps'):
                body+='<h3>Prochains axes de progression</h3><ul>'+''.join(f'<li>{esc(p)}</li>' for p in last_fiche['next_steps'])+'</ul>'
            body+='</section>'
        options=lambda values:''.join(f'<option value="{esc(v)}">{esc(v)}</option>' for v in sorted({v for v in values if v}))
        body+=f'''<form class="archive-filters member-filters" data-member-filters hidden><label>À partir du<input type="date" name="start"></label><label>Jusqu’au<input type="date" name="end"></label><label>Marque<select name="brand"><option value="">Toutes les marques</option>{options(r['brand'] for r in rows)}</select></label><label>Module<select name="module"><option value="">Tous les modules</option>{options(r['module'] for r in rows)}</select></label><button type="reset">Réinitialiser les filtres</button></form><p class="archive-meta" data-member-count aria-live="polite">{len(rows)} fiche(s) dans la sélection</p><noscript><p>Les statistiques complètes restent consultables. Activez JavaScript pour utiliser les filtres.</p></noscript>'''
        result=subprocess.run(['node',str(root/'js/member-stats.js'),'--render'],input=json.dumps(rows),capture_output=True,text=True,check=True)
        body+='<div data-member-dashboard>'+result.stdout+'</div>'
        body+='''<details class="card"><summary>Lire ces statistiques avec mesure</summary><p>Les statistiques portent sur les fiches archivées, sans déduire les dégustations non documentées. Une donnée absente reste non renseignée, jamais zéro. Chaque moyenne indique son effectif.</p><p>Les arômes sont relevés dans les observations attribuées au membre ; les remarques collectives des minutes ne sont pas attribuées automatiquement. Leurs fréquences décrivent les fiches, sans mesurer des goûts ou une expertise.</p><p>Les origines, modules et références sont conservés avec leurs réserves. Les notes du Comité sont comparées seulement au sein d’un même barème identifié. Les critères proposés n’ont pas valeur de règlement préexistant.</p><p>Les filtres portent sur les statistiques et la liste des fiches. La dernière appréciation du Comité reste celle du dossier complet.</p></details>'''
        body+='<p class="archive-footer"><a href="registre-membres.html">← Registre des membres</a> · <a href="index.html">Toutes les séances de dégustation</a></p>'
        # Escape the script terminator even when future member input contains HTML.
        payload=json.dumps({'rows':rows},ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
        body+=f'<script type="application/json" id="member-data">{payload}</script><script src="../js/member-stats.js" defer></script>'
        (root/'fiches-degustation'/page).write_text(archive.shell(f'{person["name"]} — Registre du membre',page,body).replace('</head>', '<link rel="stylesheet" href="../css/members.css"></head>'))
    directory = '<p class="breadcrumbs"><a href="index.html">Dégustations</a> / Registre des membres</p><p class="lead">Les membres, leurs contributions et les pièces qui les accompagnent. Chaque nom ouvre un dossier personnel ; le Comité n’égare personne volontairement.</p><p>Retrouvez les profils enregistrés, leurs fiches et leurs statistiques de dégustation. Les membres sont classés par ordre alphabétique.</p>'
    directory += f'<p class="archive-meta">{len(people)} profil' + ('s enregistrés' if len(people)>1 else ' enregistré') + '.</p><ul class="member-directory">'
    for person in sorted(people.values(), key=lambda m:(m['name'].casefold(),m['id'])):
        attended = [s for s in sessions if any(m['id']==person['id'] for m in s['participants'])]
        sheets = [f for s in sessions for f in s['sheets'] if f['member_id']==person['id']]
        first = f'Première séance archivée : {archive.long_date(attended[0]["date"])}' if attended else 'Aucune séance archivée pour le moment.'
        directory += f'<li class="card member-directory-card">{grade_badge(person)}<div class="directory-details"><div class="directory-heading"><h2><a href="{archive.member_url(person)}">{esc(person["name"])}</a></h2><span class="badge">{esc(person.get("grade") or "Grade non renseigné")}</span></div><p class="archive-meta">{len(attended)} séance' + ('s' if len(attended)>1 else '') + f' · {len(sheets)} fiche' + ('s' if len(sheets)>1 else '') + f'<br>{first}</p><a class="directory-profile" href="{archive.member_url(person)}" aria-label="Consulter le profil de {esc(person["name"])}">Profil et statistiques →</a></div></li>'
    directory += '</ul><p class="archive-meta">Les grades affichés correspondent aux dernières informations documentées. Les statistiques portent sur les contributions archivées.</p><p class="archive-footer"><a href="index.html">← Toutes les séances de dégustation</a></p>'
    (root/'fiches-degustation/registre-membres.html').write_text(archive.shell('Registre des membres','registre-membres.html',directory))
    return pages + ['registre-membres.html']
