"""Member registry pages; statistics are rendered by the same JS in Node and browser."""
import json
import subprocess
from html import escape as esc

def grade_badge(person, compact=False):
    grade = person.get('grade') or 'Grade non renseigné'
    # Only the validated grade receives this artwork; unknown grades keep their text.
    if grade.casefold().strip() == 'rat de passage':
        size = 96 if compact else 144
        return f'<img class="grade-portrait" src="../images/badges/rat-de-passage-{size}.webp" srcset="../images/badges/rat-de-passage-{size*2}.webp 2x" decoding="async" alt="Badge Rat de Passage : jeune rat avec une tétine" width="{size}" height="{size}">'
    return ''

def people_for(data):
    people = {m['id']:dict(m) for m in data.get('members', [])}
    for s in sorted(data['sessions'], key=lambda s:(s['date'],s['id'])):
        for m in s['participants']:
            people[m['id']] = {**people.get(m['id'], {}), **m}
    for m in data.get('members', []):
        if m.get('grade_updated_at'):
            people[m['id']] = {**people.get(m['id'], {}), **m}
    return people

GRADES = [
    ("Rat de Passage", 0, 0, 0),
    ("Rat homologué", 3, 0, 0),
    ("Rat notable", 12, 6, 6),
    ("Rat vénérable", 30, 15, 18),
    ("Grand Rat", 60, 30, 36),
]
DISTINCTIONS = [
    ("poumon-bronze", "Poumon de Bronze", "10 fiches homologuées", "auto"),
    ("collectionneur-vitoles", "Collectionneur de Vitoles", "10 références de cigares distinctes", "auto"),
    ("cendre-longue", "Ordre de la Cendre Longue", "Record actuel de cendre mesurée", "record"),
    ("coupeur-emerite", "Coupeur émérite", "Trois techniques de coupe réglementaires documentées", "auto"),
    ("rat-metronome", "Rat Métronome", "Cinq séances consécutives documentées", "auto"),
    ("rat-centenaire", "Rat Centenaire", "100 fiches homologuées", "auto"),
    ("quatre-saisons", "Rat des Quatre Saisons", "Une fiche par saison sur une même année", "auto"),
    ("rat-encyclopedique", "Rat Encyclopédique", "20 références distinctes", "auto"),
    ("rat-de-fer", "Rat de Fer", "20 séances documentées", "auto"),
    ("rat-au-repos", "Rat au Repos", "Record homologué de repos du cigare", "record"),
    ("sous-surveillance", "Rat sous surveillance", "Enquête officielle du Comité", "committee"),
    ("tres-administratif", "Mention Très Administratif", "Observation exceptionnellement détaillée", "committee"),
    ("palmes-coupe-cigare", "Palmes du Coupe-Cigare", "Service exceptionnel rendu au Club", "committee"),
    ("silence-observateur", "Médaille du Silence Observateur", "Séance sans avis exploitable", "committee"),
    ("rat-emerite", "Rat émérite", "Distinction honorifique exceptionnelle", "committee"),
]
def facts_for(person, sessions):
    sheets=[(s,f) for s in sessions for f in s['sheets'] if f['member_id']==person['id']]
    attendance=[s for s in sessions if any(p['id']==person['id'] for p in s['participants'])]
    refs=set(str(f.get('reference_exact') or f.get('cigar') or '').strip().casefold() for _,f in sheets)
    refs.discard('')
    cuts=set(str(f.get('technique') or '').strip().casefold() for _,f in sheets)
    cuts.discard('')
    validashes=[(float(f['ash_max_cm']),s,f) for s,f in sheets if isinstance(f.get('ash_max_cm'),(int,float)) and f['ash_max_cm']>0]
    validminutes=[(float(f['duration_minutes']),s,f) for s,f in sheets if isinstance(f.get('duration_minutes'),(int,float)) and f['duration_minutes']>0]
    seasons={}
    for sess,_ in sheets:
        y=int(sess['date'][:4]);month=int(sess['date'][5:7]);season=(month%12)//3
        seasons.setdefault(y,set()).add(season)
    automatic=set()
    if len(sheets)>=10:automatic.add('poumon-bronze')
    if len(refs)>=10:automatic.add('collectionneur-vitoles')
    if len(refs)>=20:automatic.add('rat-encyclopedique')
    if len(sheets)>=100:automatic.add('rat-centenaire')
    if len(attendance)>=20:automatic.add('rat-de-fer')
    if len(cuts)>=3:automatic.add('coupeur-emerite')
    if any(len(v)==4 for v in seasons.values()):automatic.add('quatre-saisons')
    # A record or five consecutive club-wide sessions is established separately.
    return {'sheets':sheets,'attendance':attendance,'refs':refs,'cuts':cuts,'ashes':validashes,'minutes':validminutes,'auto':automatic}

def awards_for(person,facts):
    manual=set(person.get('distinctions') or [])
    allowed={d[0] for d in DISTINCTIONS if d[3]=='committee'}
    return facts['auto'] | (manual & allowed)

def grade_progress(person,facts):
    count=len(facts['sheets']);n=len(facts['attendance'])
    first=facts['attendance'][0]['date'] if facts['attendance'] else ''
    eligible=[]
    from datetime import date
    months=((date.today().year-int(first[:4]))*12+date.today().month-int(first[5:7])) if first else 0
    for label,req,meet,age in GRADES:
        if count>=req and n>=meet and months>=age:eligible.append(label)
    return eligible[-1] if eligible else GRADES[0][0]

def medal_html(person,facts):
    earned=awards_for(person,facts)
    return ('<section class="card"><h2>Distinctions du membre</h2><p class="archive-meta">'
            'Distinctions automatiques calculées à partir des archives et distinctions honorifiques décidées par le Comité.</p>'
            +(''.join('<span class="badge" title="'+esc(desc)+'">✦ '+esc(name)+'</span> '
                      for key,name,desc,kind in DISTINCTIONS if key in earned) if earned else
              '<p>Aucune distinction encore attribuée. Les dossiers sont suivis.</p>')
            +'</section>')

def record_html(people,sessions,archive):
    metrics=[('Cendre la plus longue','ashes','cm'),('Dégustation la plus longue','minutes','minutes'),
             ('Plus grand nombre de fiches','sheets','fiches'),('Plus grande variété de références','refs','références')]
    facts={key:facts_for(person,sessions) for key,person in people.items() if not person.get('classified_profile')}
    rows=[]
    for label,key,unit in metrics:
        candidates=[]
        for member_id,v in facts.items():
            value=(max((item[0] for item in v[key]),default=None) if key in ('ashes','minutes') else len(v[key]))
            if value is not None and value>0:candidates.append((value,member_id))
        if not candidates:
            rows.append('<tr><th>'+esc(label)+'</th><td>Non homologué — données insuffisantes</td></tr>')
            continue
        best=max(value for value,_ in candidates)
        holders=[(mid,people[mid]) for value,mid in candidates if value==best]
        rendered=' / '.join('<a href="'+archive.member_url(p)+'">'+esc(p['name'])+'</a>' for _,p in holders)
        rows.append('<tr><th>'+esc(label)+'</th><td><strong>'+esc(str(int(best) if float(best).is_integer() else best))+' '+unit+'</strong> — '+rendered+'</td></tr>')
    return '<section class="card"><h2>Registre des records homologables</h2><p class="archive-meta">Calculé uniquement à partir des informations archivées ; les mesures absentes ne sont pas estimées.</p><div class="table-scroll"><table><tbody>'+''.join(rows)+'</tbody></table></div></section>'

def hierarchy_html():
    return '<section class="card"><h2>Ordre des grades</h2><ol>'+''.join(
        '<li><strong>'+esc(label)+'</strong> — '+str(fiches)+' fiches'+
        (' · '+str(sessions)+' séances minimum' if sessions else '')+
        (' · '+str(months)+' mois minimum' if months else '')+'</li>'
        for label,fiches,sessions,months in GRADES)+'</ol><p>Les seuils ouvrent un droit à examen, jamais une promotion automatique. Le Comité valide chaque changement de grade. Le Président demeure hors hiérarchie.</p></section>'

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
        introduction = 'Un palais, des observations, un dossier qui s’épaissit. Le Comité suit les pièces ; les courbes font le reste.' if rows else 'Un membre inscrit, un dossier ouvert. Le Comité attend la première fiche.'
        body=f'<p class="breadcrumbs"><a href="registre-membres.html">Registre des membres</a> / {esc(person["name"])}</p><section class="member-identity">{grade_badge(person)}<div><p class="member-grade">{esc(person.get("grade") or "Grade non renseigné")}</p><p class="archive-meta">Dernier grade documenté.</p><p>{introduction}</p></div></section>'
        facts=facts_for(person,sessions)
        if not person.get('classified_profile'):
            body+=hierarchy_html()
            body+='<section class="card"><h2>Progression</h2><p><strong>Grade attribué : '+esc(person.get('grade') or 'Non renseigné')+'</strong></p><p>'+str(len(facts['sheets']))+' fiches · '+str(len(facts['attendance']))+' séances · Éligibilité documentaire estimée : '+esc(grade_progress(person,facts))+'. Une décision du Comité reste nécessaire.</p></section>'
            body+=medal_html(person,facts)
        classified = person.get('classified_profile')
        if classified:
            # The dossier text comes from the private D1 snapshot at build time.
            # Keep the generator in the public repository free of dossier content.
            body = (f'<p class="breadcrumbs"><a href="registre-membres.html">Registre des membres</a> / {esc(person["name"])}</p>'
                    f'<section class="card accent"><p class="member-grade">SECRET DÉFENSE · DOSSIER RÉSERVÉ</p>'
                    f'<h2>{esc(person["name"])}</h2><p>{esc(classified["role"])}</p>'
                    f'<p>{esc(classified["summary"])}</p></section>'
                    '<section class="card"><h2>Observations autorisées</h2><ul>'
                    + ''.join(f'<li>{esc(item)}</li>' for item in classified['observations'])
                    + '</ul></section><section class="card"><h2>Réserve du Comité</h2>'
                    f'<p>{esc(classified["reserve"])}</p></section>'
                    '<p class="archive-footer"><a href="registre-membres.html">← Registre des membres</a></p>')
            (root/'fiches-degustation'/page).write_text(archive.shell(f'{person["name"]} — Dossier classifié',page,body).replace('</head>', '<link rel="stylesheet" href="../css/members.css"></head>'))
            continue
        if not rows:
            body += '<section class="card"><h2>Première dégustation à venir</h2><p>Aucune dégustation ni fiche n’est encore enregistrée pour ce membre. Son historique et ses statistiques apparaîtront après sa première contribution.</p></section><p class="archive-footer"><a href="registre-membres.html">← Registre des membres</a> · <a href="index.html">Toutes les séances de dégustation</a></p>'
            (root/'fiches-degustation'/page).write_text(archive.shell(f'{person["name"]} — Registre du membre',page,body).replace('</head>', '<link rel="stylesheet" href="../css/members.css"></head>'))
            continue
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
        if person.get('classified_profile'):
            directory += (f'<li class="card member-directory-card"><div class="directory-details"><div class="directory-heading">'
                          f'<h2><a href="{archive.member_url(person)}">{esc(person["name"])}</a></h2>'
                          '<span class="badge">Secret défense</span></div>'
                          '<p class="archive-meta">Dossier réservé · Consultation après identification.</p>'
                          f'<a class="directory-profile" href="{archive.member_url(person)}">Consulter le dossier →</a></div></li>')
            continue
        directory += f'<li class="card member-directory-card">{grade_badge(person, compact=True)}<div class="directory-details"><div class="directory-heading"><h2><a href="{archive.member_url(person)}">{esc(person["name"])}</a></h2><span class="badge">{esc(person.get("grade") or "Grade non renseigné")}</span></div><p class="archive-meta">{len(attended)} séance' + ('s' if len(attended)>1 else '') + f' · {len(sheets)} fiche' + ('s' if len(sheets)>1 else '') + f'<br>{first}</p><a class="directory-profile" href="{archive.member_url(person)}" aria-label="Consulter le profil de {esc(person["name"])}">Profil et statistiques →</a></div></li>'
    directory += '</ul>'+hierarchy_html()+record_html(people,sessions,archive)
    directory += '<section class="card"><h2>Répertoire des distinctions</h2><ul>'+''.join('<li><strong>'+esc(name)+'</strong> — '+esc(desc)+' <small>('+ ('Comité' if kind=='committee' else 'record' if kind=='record' else 'statistiques')+')</small></li>' for _,name,desc,kind in DISTINCTIONS)+'</ul></section>'
    directory += '<p class="archive-meta">Les grades affichés correspondent aux dernières informations documentées. Les statistiques portent sur les contributions archivées.</p><p class="archive-footer"><a href="index.html">← Toutes les séances de dégustation</a></p>'
    (root/'fiches-degustation/registre-membres.html').write_text(archive.shell('Registre des membres','registre-membres.html',directory))
    return pages + ['registre-membres.html']
