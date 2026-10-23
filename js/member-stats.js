/* Shared static/browser renderer: no dependencies, no tracking, no guessed values. */
(function () {
  'use strict';
  const h = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const fmt = value => Number(value.toFixed(1)).toLocaleString('fr-FR');
  const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
  const dateLabel = date => new Date(date+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const gradeDate = date => new Date(date+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const countBy = values => [...values.reduce((counts,value)=>counts.set(value,(counts.get(value)||0)+1),new Map())].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],'fr'));
  const validValues = (rows,key) => rows.map(r=>r[key]).filter(finite);
  const note = text => `<p class="archive-meta">${h(text)}</p>`;

  function stats(rows) {
    const ordered=[...rows].sort((a,b)=>a.date.localeCompare(b.date)||a.number-b.number||a.id.localeCompare(b.id));
    const sessions=[...new Map(ordered.map(r=>[r.session_id,r])).values()];
    const committee=validValues(ordered,'committee_score'), cigar=validValues(ordered,'cigar_score'), duration=validValues(ordered,'duration_minutes');
    const rubrics=new Set(ordered.map(r=>r.rubric_id));
    return {ordered,sessions,rubrics,committee,cigar,duration,committeeMean:mean(committee),cigarMean:mean(cigar),durationMean:mean(duration),collective:sessions.filter(r=>r.participant_count>1).length};
  }

  function bars(items, maximum, unit='') {
    if(!items.length) return note('Aucune donnée renseignée pour cette sélection.');
    return `<ul class="stat-bars">${items.map(([label,value])=>`<li><div><span>${h(label)}</span><strong>${fmt(value)}${h(unit)}</strong></div><div class="bar-track" aria-hidden="true"><span style="width:${Math.min(100,Math.max(0,value/maximum*100))}%"></span></div></li>`).join('')}</ul>`;
  }

  function timeline(rows,key,max,label,unit='') {
    const points=rows.filter(r=>finite(r[key]));
    if(!points.length)return note('Aucune note renseignée.');
    // Full fixed scale: a change of one point never looks like a collapse of the institution.
    const w=660, top=24, bottom=210, left=45, right=630;
    const dates=points.map(r=>Date.parse(r.date));
    const lo=Math.min(...dates), hi=Math.max(...dates);
    const positions=points.map((r,i)=>({r,x:hi===lo?(points.length===1?(left+right)/2:left+i*(right-left)/(points.length-1)):left+(dates[i]-lo)/(hi-lo)*(right-left),y:bottom-r[key]/max*(bottom-top)}));
    const ticks=[0,max/2,max].map(t=>`<line x1="${left}" x2="${right}" y1="${bottom-t/max*(bottom-top)}" y2="${bottom-t/max*(bottom-top)}" stroke="#c9c1b4"/><text x="35" y="${bottom-t/max*(bottom-top)+4}" text-anchor="end">${t}</text>`).join('');
    const line=positions.length>1?`<polyline points="${positions.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#743c36" stroke-width="2"/>`:'';
    const valueLabel=value=>fmt(value)+(unit?' '+unit:'/'+max);
    // Keep labels inside the chart and stagger nearby values to prevent overlap.
    const placed=[];
    const nodes=positions.map(({r,x,y})=>{
      const text=valueLabel(r[key]), width=text.length*7+8;
      const labelX=Math.max(left+width/2,Math.min(right-width/2,x));
      const offsets=[-15,23,-32,40,-49,57];
      const candidates=offsets.map(offset=>({x:labelX,y:Math.max(15,Math.min(220,y+offset)),width}));
      const overlaps=box=>placed.filter(other=>Math.abs(box.x-other.x)<(box.width+other.width)/2+5 && Math.abs(box.y-other.y)<17).length;
      candidates.sort((a,b)=>overlaps(a)-overlaps(b));
      const box=candidates[0];placed.push(box);
      return `<a href="${h(r.url)}" aria-label="Fiche ${r.number}, ${dateLabel(r.date)}, ${text}"><circle cx="${x}" cy="${y}" r="6" fill="#743c36"><title>${h(dateLabel(r.date))} — Fiche ${r.number} : ${text}</title></circle><text class="point-value" data-point-value x="${box.x}" y="${box.y}" text-anchor="middle" aria-hidden="true">${h(text)}</text></a>`;
    }).join('');
    const datesText=hi===lo?`<text x="${(left+right)/2}" y="239" text-anchor="middle">${h(dateLabel(points[0].date))}</text>`:`<text x="${left}" y="239">${h(dateLabel(points[0].date))}</text><text x="${right}" y="239" text-anchor="end">${h(dateLabel(points[points.length-1].date))}</text>`;
    return `<svg class="timeline" viewBox="0 0 ${w} 255" role="img" aria-label="${h(label)}. ${points.length} observation(s), échelle de 0 à ${max} ${h(unit)}."><title>${h(label)}</title>${ticks}${line}${nodes}${datesText}</svg>${note(`${points.length} observation(s) renseignée(s). Chaque point ouvre la fiche correspondante.`)}<details><summary>Voir les valeurs du graphique</summary><ul>${points.map(r=>`<li><a href="${h(r.url)}">${h(dateLabel(r.date))} — Fiche ${r.number}</a> : ${valueLabel(r[key])}</li>`).join('')}</ul></details>`;
  }

  function criterionKey(c){return c.label+'|'+c.max;}
  function criteria(rows) {
    const map=new Map();
    rows.forEach(r=>r.criteria.forEach(c=>{
      const key=criterionKey(c);
      if(!map.has(key))map.set(key,{label:c.label,max:c.max,values:[]});
      map.get(key).values.push(c.score);
    }));
    return [...map.values()];
  }

  function dashboard(rows) {
    const s=stats(rows);
    if(!rows.length)return '<p class="card" role="status">Aucune fiche ne correspond à ces critères. Les archives n’inventeront rien pour meubler.</p>';
    const first=s.ordered[0],last=s.ordered[s.ordered.length-1];
    const comparable=s.rubrics.size===1;
    const counter=(label,value,detail='')=>`<div class="stat-counter"><strong>${h(value)}</strong><span>${h(label)}</span>${detail?`<small>${h(detail)}</small>`:''}</div>`;
    let html='<section aria-label="Repères du parcours"><div class="stat-counters">';
    html+=counter('Fiches archivées',rows.length)+counter('Séances documentées',s.sessions.length)+counter('Séances collectives',s.collective)+counter('Marques explorées',new Set(rows.map(r=>r.brand)).size);
    html+=counter('Moyenne du Comité',comparable?fmt(s.committeeMean)+'/100':'Par barème',comparable?`${s.committee.length} évaluation(s)`:'Barèmes différents : moyennes séparées ci-dessous');
    html+=counter('Moyenne des cigares',s.cigarMean===null?'Non renseignée':fmt(s.cigarMean)+'/10',`${s.cigar.length} note(s) renseignée(s)`);
    html+='</div>'+note(`Première dégustation documentée : ${gradeDate(first.date)}. Dernière : ${gradeDate(last.date)}. Les chiffres décrivent la sélection affichée.`)+'</section>';
    if(rows.length===1)html+='<p class="status-history">Historique en cours de constitution : une fiche, un premier repère. Le Comité attend encore une tendance.</p>';
    html+='<section class="stat-section"><h2>Évolution des évaluations du Comité</h2><p>Qualité et précision du dossier, sur 100.</p>';
    const groups=new Map(); s.ordered.forEach(r=>{if(!groups.has(r.rubric_id))groups.set(r.rubric_id,[]);groups.get(r.rubric_id).push(r);});
    if(!comparable)html+=note('Plusieurs barèmes sont présents : les courbes et les moyennes sont séparées pour éviter une comparaison trompeuse.');
    for(const [rubric,group] of groups){
      const values=validValues(group,'committee_score');
      html+=`<h3>${h(group[0].rubric_label || "Barème du compte rendu")}</h3>`+note(`Moyenne : ${fmt(mean(values))}/100 · Meilleure note : ${fmt(Math.max(...values))}/100 · ${values.length} évaluation(s).`)+timeline(group,'committee_score',100,'Notes du Comité');
    }
    html+='</section><section class="stat-section"><h2>Appréciation personnelle des cigares</h2><p>Le plaisir du dégustateur, sur 10. Cette note est indépendante de celle du Comité.</p>'+timeline(s.ordered,'cigar_score',10,'Notes personnelles des cigares');
    const ranking=s.ordered.filter(r=>finite(r.cigar_score)).sort((a,b)=>b.cigar_score-a.cigar_score).slice(0,5);
    if(ranking.length)html+='<h3>Les cigares les mieux appréciés</h3><ol>'+ranking.map(r=>`<li><a href="${h(r.url)}">${h(r.cigar)}</a> — ${fmt(r.cigar_score)}/10</li>`).join('')+'</ol>';
    html+='</section><section class="stat-section"><h2>Qualité des observations</h2><p>Résultats moyens par critère. Les barres sont ramenées à 100 % pour comparer des critères de poids différents ; elles ne représentent pas une nouvelle note.</p>';
    for(const [rubric,group] of groups){
      html+=`<h3>${h(group[0].rubric_label || "Barème du compte rendu")}</h3>`+bars(criteria(group).map(c=>[`${c.label} — ${fmt(mean(c.values))}/${c.max}, ${c.values.length} fiche(s)`,mean(c.values)/c.max*100]),100,' %');
    }
    html+='<h3>Première et dernière fiche de la sélection</h3>';
    if(rows.length===1)html+=note('Une deuxième fiche est nécessaire pour établir une comparaison.');
    else if(first.rubric_id!==last.rubric_id)html+=note('Les deux fiches utilisent des barèmes différents ; aucune variation chiffrée n’est calculée.');
    else{
      const change=last.committee_score-first.committee_score;
      html+=`<p><a href="${h(first.url)}">Fiche ${first.number}</a> : ${fmt(first.committee_score)}/100 → <a href="${h(last.url)}">Fiche ${last.number}</a> : ${fmt(last.committee_score)}/100. Écart : ${change>0?'+':''}${fmt(change)} point(s).</p>`;
      html+='<div class="table-scroll"><table><caption>Comparaison des critères communs</caption><thead><tr><th>Critère</th><th>Première</th><th>Dernière</th></tr></thead><tbody>'+first.criteria.map(c=>{
        const end=last.criteria.find(x=>criterionKey(x)===criterionKey(c));
        return end?`<tr><th scope="row">${h(c.label)}</th><td>${fmt(c.score)}/${c.max}</td><td>${fmt(end.score)}/${end.max}</td></tr>`:'';
      }).join('')+'</tbody></table></div>';
    }
    html+='</section><section class="stat-section"><h2>Activité documentaire</h2><p>Nombre de séances documentées par mois. Une séance regroupant plusieurs fiches compte une seule fois.</p>';
    const years=[...new Set(s.sessions.map(r=>r.date.slice(0,4)))].sort().reverse();
    for(const year of years){html+=`<h3>${year}</h3><ol class="activity-calendar">`;
      for(let month=1;month<=12;month++){
        const key=year+'-'+String(month).padStart(2,'0'), n=s.sessions.filter(r=>r.date.startsWith(key)).length;
        const monthLabel=new Date(`${key}-01T12:00:00Z`).toLocaleDateString('fr-FR',{month:'short',timeZone:'UTC'});
        html+=`<li class="${n?'has-activity':''}"><span>${h(monthLabel)}</span><strong>${n}</strong><small>séance${n>1?'s':''}</small></li>`;
      }html+='</ol>';
    }
    html+='</section><section class="stat-section"><h2>Territoires explorés</h2><div class="stat-grid">';
    for(const [key,label] of [['brand','Marques'],['origin','Origines déclarées'],['module','Modules déclarés']]){
      const values=rows.map(r=>r[key]).filter(Boolean),counts=countBy(values);
      html+=`<div><h3>${label}</h3>`+bars(counts,Math.max(1,...counts.map(x=>x[1])))+note(`${values.length}/${rows.length} fiche(s) renseignée(s). Comptage par fiche.`)+'</div>';
    }
    const refs=rows.map(r=>r.reference_exact).filter(Boolean);
    html+='</div>'+note(`${new Set(refs).size} référence(s) commerciale(s) exacte(s) identifiée(s) ; ${rows.length-refs.length} fiche(s) sans référence exacte.`)+'</section>';
    html+='<section class="stat-section"><h2>Profil aromatique déclaré</h2><p>Nombre de fiches mentionnant chaque descripteur. Un arôme répété dans plusieurs tiers ne compte qu’une fois par fiche.</p>';
    const aromaRows=rows.filter(r=>Array.isArray(r.aromas)), aromas=countBy(aromaRows.flatMap(r=>[...new Set(r.aromas)]));
    html+=bars(aromas,Math.max(1,...aromas.map(x=>x[1])))+note(`${aromaRows.length}/${rows.length} fiche(s) avec arômes relevés. Les chiffres ne décrivent pas des préférences.`)+'</section>';
    html+='<section class="stat-section"><h2>Durée et accompagnements</h2><div class="stat-counters">';
    html+=counter('Durée moyenne',s.durationMean===null?'Non renseignée':fmt(s.durationMean)+' min',`${s.duration.length} fiche(s) renseignée(s)`);
    html+=counter('Temps cumulé documenté',s.duration.length?fmt(s.duration.reduce((a,b)=>a+b,0))+' min':'Non renseigné',"Somme des durées de fiches ; pas un total horaire de séances.");
    html+='</div>';
    if(s.duration.length)html+=timeline(s.ordered,'duration_minutes',Math.max(60,...s.duration),'Durées de dégustation en minutes','min');
    const pairings=countBy(rows.flatMap(r=>[...new Set((Array.isArray(r.pairings)?r.pairings:[r.pairing]).filter(Boolean))]));
    html+='<h3>Accompagnements déclarés</h3>'+bars(pairings,Math.max(1,...pairings.map(x=>x[1])))+note('Chaque accompagnement compte une fois par fiche, y compris lorsque plusieurs boissons ont été servies au cours de la même séance.')+'</section>';
    const draw=countBy(rows.map(r=>r.technique?.draw).filter(Boolean)), relights=rows.map(r=>r.technique?.relights).filter(finite), touchups=rows.map(r=>r.technique?.touchups).filter(finite), ash=validValues(rows,'ash_max_cm');
    html+='<section class="stat-section"><h2>Suivi technique et archives de la cendre</h2>';
    if(!draw.length&&!relights.length&&!touchups.length&&!ash.length)html+=note('Tirage, retouches, rallumages et longueur maximale de cendre : aucune donnée renseignée. Les graphiques correspondants apparaîtront dès les premières mesures.');
    if(draw.length)html+='<h3>Tirage</h3>'+bars(draw,Math.max(...draw.map(x=>x[1])));
    if(relights.length)html+=note(`Rallumages : moyenne ${fmt(mean(relights))}, sur ${relights.length} fiche(s) renseignée(s).`);
    if(touchups.length)html+=note(`Retouches : moyenne ${fmt(mean(touchups))}, sur ${touchups.length} fiche(s) renseignée(s).`);
    if(ash.length)html+='<h3>Longueur maximale de cendre</h3>'+note(`Record : ${fmt(Math.max(...ash))} cm. Moyenne : ${fmt(mean(ash))} cm, sur ${ash.length} mesure(s).`)+timeline(s.ordered,'ash_max_cm',Math.max(5,...ash),'Longueur maximale de cendre en centimètres','cm');
    html+='</section><section class="stat-section"><h2>Repères documentaires</h2><ul>';
    if(rows.some(r=>r.first))html+='<li>Première fiche déposée et archivée.</li>';
    if(ash.length)html+='<li>Première mesure de cendre documentée.</li>';
    if(rows.length>=10)html+='<li>Dix fiches documentées dans cette sélection.</li>';
    html+='</ul>'+note('Ces constats documentaires ne constituent ni une distinction officielle ni un changement de grade.')+'</section>';
    html+='<section class="stat-section"><h2>Séances de la sélection</h2><ul class="member-session-list">';
    const bySession=new Map();[...s.ordered].reverse().forEach(r=>{if(!bySession.has(r.session_id))bySession.set(r.session_id,[]);bySession.get(r.session_id).push(r);});
    for(const group of bySession.values())html+=`<li><time datetime="${h(group[0].date)}">${h(dateLabel(group[0].date))}</time><a href="${h(group[0].session_url)}">${h(group[0].session_title)}</a></li>`;
    return html+'</ul></section>';
  }

  function mount() {
    const source=document.getElementById('member-data');
    if(!source)return;
    const payload=JSON.parse(source.textContent), form=document.querySelector('[data-member-filters]'), target=document.querySelector('[data-member-dashboard]');
    form.hidden=false;
    const update=()=>{
      const start=form.elements.start.value,end=form.elements.end.value;
      if(start&&end&&start>end){form.elements.end.setCustomValidity('La date de fin doit suivre la date de début.');form.reportValidity();return;}
      form.elements.end.setCustomValidity('');
      const rows=payload.rows.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)&&(!form.elements.brand.value||r.brand===form.elements.brand.value)&&(!form.elements.module.value||r.module===form.elements.module.value));
      target.innerHTML=dashboard(rows);
      document.querySelector('[data-member-count]').textContent=`${rows.length} fiche(s) dans la sélection`;
    };
    form.addEventListener('change',update);
    form.addEventListener('submit',event=>event.preventDefault());
    form.addEventListener('reset',()=>setTimeout(update,0));
  }
  if(typeof module!=='undefined'&&module.exports){
    module.exports={stats,dashboard};
    if(require.main===module){let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',part=>input+=part);process.stdin.on('end',()=>process.stdout.write(dashboard(JSON.parse(input))));}
  }else mount();
})();
