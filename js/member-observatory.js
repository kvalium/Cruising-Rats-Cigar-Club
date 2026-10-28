/* Observatoire statistique CRCC. Les graphiques utilisent exclusivement les archives attribuées. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const avg=a=>a.length?a.reduce((p,c)=>p+c,0)/a.length:null;
const fmt=(n,p=1)=>valid(n)?Number(n.toFixed(p)).toLocaleString('fr-FR'):'—';
const uniq=a=>[...new Set(a.filter(Boolean))];
const tally=a=>[...a.reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map())].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0]),'fr'));
const arr=a=>Array.isArray(a)?a:[];
const familyName=a=>({bois:'Boisé',cedre:'Boisé',foin:'Végétal',the:'Végétal',mate:'Végétal',poivre:'Épicé',epices:'Épicé',cacao:'Gourmand',noisette:'Gourmand','marron chaud':'Gourmand','pomme caramelisee':'Gourmand',cuir:'Animal',mousse:'Terreux',terre:'Terreux',mineral:'Minéral',floral:'Floral'}[String(a||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()]||'Autres');
function render(rows){
const a=[...rows].sort((x,y)=>x.date.localeCompare(y.date)||x.number-y.number),plots=[];
const chart=(id,title,subtitle,type,labels,data,foot,extra={})=>{
 if(!labels.length)return '<article class="ob-card"><h4>'+esc(title)+'</h4><p>'+esc(subtitle)+'</p><div class="ob-empty">Aucune mesure exploitable dans les fiches actuelles.</div></article>';
 plots.push({id,type,labels,data,...extra});
 const list=labels.slice(0,12).map((n,i)=>'<li>'+esc(n)+' : <strong>'+esc(typeof data[i]==='object'&&data[i]?'('+data[i].x+' min ; '+data[i].y+'/10)':fmt(data[i]))+'</strong></li>').join('');
 return '<article class="ob-card"><header><div><h4>'+esc(title)+'</h4><p>'+esc(subtitle)+'</p></div><span>'+esc(type)+'</span></header><div class="ob-canvas"><canvas id="ob-'+esc(id)+'" aria-label="'+esc(title)+'" role="img"></canvas></div><div class="ob-values"><strong>Valeurs des archives</strong><ol>'+list+'</ol></div><footer>◈ Données documentées <em>'+esc(foot)+'</em></footer></article>';
};
const kpis=items=>'<div class="ob-kpis">'+items.map(([label,n,sub])=>'<div class="ob-kpi"><span>✦</span><small>'+esc(label)+'</small><strong>'+esc(n)+'</strong><p>'+esc(sub)+'</p></div>').join('')+'</div>';
const section=(code,title,desc,contents)=>'<div class="ob-heading"><div><span>'+esc(code)+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></div><small>Archives du CRCC · valeurs non estimées</small></div>'+contents;
const grid=cards=>'<div class="ob-grid">'+cards.join('')+'</div>';
const scores=a.filter(r=>valid(r.cigar_score)),comm=a.filter(r=>valid(r.committee_score));
const aromas=a.flatMap(r=>uniq(arr(r.aromas).map(String))),arc=tally(aromas);
const refs=uniq(a.map(r=>r.reference_exact).filter(Boolean));
const origins=tally(a.map(r=>String(r.origin||'').replace(/\s*\(.*$/,'')).filter(Boolean));
const brands=tally(a.map(r=>r.brand).filter(Boolean));
const seasons=uniq(a.map(r=>r.session_id)),durations=a.filter(r=>valid(r.duration_minutes));
const relights=a.filter(r=>valid(r.technique?.relights)),ashes=a.filter(r=>valid(r.ash_max_cm));
const drinks=a.flatMap(r=>arr(r.pairings).length?r.pairings:r.pairing?String(r.pairing).split(/\s+puis\s+/i):[]).filter(Boolean);
const meetings=a.filter(r=>r.minutes_pdf);
const contributions=a.filter(r=>typeof r.minutes_contribution==='string'&&r.minutes_contribution.trim());
const rubrics=uniq(a.map(r=>r.rubric_id));
const gradeRubric=rubrics[0];
const criterionMap=new Map();
for(const r of a.filter(x=>x.rubric_id===gradeRubric))for(const c of arr(r.criteria)){
 if(!valid(c.score)||!valid(c.max)||c.max<=0)continue;
 let key=c.label+'|'+c.max;
 if(!criterionMap.has(key))criterionMap.set(key,{label:c.label,max:c.max,scores:[]});
 criterionMap.get(key).scores.push(c.score);
}
const radar=[...criterionMap.values()].map(c=>[c.label,avg(c.scores)/c.max*100]);
const month=tally(a.map(r=>r.date.slice(0,7)));
const scatter=a.filter(r=>valid(r.duration_minutes)&&valid(r.cigar_score));
const prices=a.map(r=>{const v=String(r.price||'').match(/^\s*(\d+(?:[,.]\d+)?)\s*€/);return v?[r.number,Number(v[1].replace(',','.'))]:null}).filter(Boolean);
const short=r=>'F'+r.number;
const tabs=[['synthese','Tableau de bord'],['palais','Palais & arômes'],['technique','Technique'],['vie','Vie du Club'],['minutes','Bureau des minutes']];
let pages={};
pages.synthese=section('01 · Synthèse individuelle','Le dossier en chiffres','Activité personnelle et appréciations. Les comparatifs entre membres restent sur les pages de séance.',
 kpis([['Fiches archivées',String(a.length),seasons.length+' séance(s)'],['Note personnelle',fmt(avg(scores.map(r=>r.cigar_score))),scores.length+' notation(s) /10'],['Comité',fmt(avg(comm.map(r=>r.committee_score))),comm.length+' dossier(s) /100'],['Arômes distincts',String(uniq(aromas).length),aromas.length+' mention(s)']])+
 grid([chart('notes','Évolution des notes personnelles','Ressenti du membre sur 10','line',scores.map(short),scores.map(r=>r.cigar_score),'Notes individuelles',{max:10}),
 chart('committee','Évolution des évaluations du Comité','Qualité documentaire sur 100','line',comm.map(short),comm.map(r=>r.committee_score),'Barème documentaire',{max:100}),
 chart('radar','Profil du dossier selon le Comité','Critères normalisés en %','radar',radar.map(x=>x[0]),radar.map(x=>x[1]),rubrics.length>1?'Un seul barème à la fois':'Barème unique',{max:100}),
 chart('aromas','Vocabulaire aromatique dominant','Une mention par fiche et par arôme','bar',arc.slice(0,10).map(x=>x[0]),arc.slice(0,10).map(x=>x[1]),'Descripteurs relevés',{horizontal:true})])
 );
const fam=tally(aromas.map(familyName)),richness=a.filter(r=>valid(r.richness_score)),strength=a.filter(r=>valid(r.strength_score));
pages.palais=section('02 · Observatoire sensoriel','Palais & arômes','Les descripteurs sont relevés, sans en déduire des préférences.',
 kpis([['Descripteurs différents',String(uniq(aromas).length),'Arômes recensés'],['Mentions aromatiques',String(aromas.length),'Total documenté'],['Meilleure note',fmt(scores.length?Math.max(...scores.map(r=>r.cigar_score)):null),'Sur 10'],['Richesse connue',richness.length+'/'+a.length,'Fiches renseignées']])+
 grid([chart('palmares','Palmarès personnel des cigares','Notes personnelles /10','bar',scores.map(r=>r.brand||short(r)),scores.map(r=>r.cigar_score),'Une note par fiche',{horizontal:true,max:10}),
 chart('families','Familles aromatiques','Regroupement éditorial à partir des mots exacts','polarArea',fam.map(x=>x[0]),fam.map(x=>x[1]),'Classification indicative'),
 chart('strength','Puissance déclarée','Seules les fiches renseignées','line',strength.map(short),strength.map(r=>r.strength_score),'Échelle de la fiche'),
 chart('richness','Richesse aromatique déclarée','Valeurs disponibles dans les fiches','line',richness.map(short),richness.map(r=>r.richness_score),'Aucune interpolation')])
 );
pages.technique=section('03 · Section technique','Coupe, combustion et durée','Aucun incident collectif n’est imputé automatiquement à un membre.',
 kpis([['Rallumages',relights.length?String(relights.reduce((x,r)=>x+r.technique.relights,0)):'—',relights.length+' fiche(s) renseignée(s)'],['Durée moyenne',durations.length?fmt(avg(durations.map(r=>r.duration_minutes)),0)+' min':'—',durations.length+' mesure(s)'],['Durée maximale',durations.length?fmt(Math.max(...durations.map(r=>r.duration_minutes)),0)+' min':'—','Durée individuelle'],['Cendres mesurées',String(ashes.length),'Mesures en cm']])+
 grid([chart('relights','Journal des rallumages','Déclarations par fiche','bar',relights.map(short),relights.map(r=>r.technique.relights),'Nombres connus'),
 chart('duration','Durée de dégustation','Minutes individuelles déclarées','line',durations.map(short),durations.map(r=>r.duration_minutes),'Ne pas confondre avec durée de séance'),
 chart('scatter','Durée et plaisir','Durée déclarée × note personnelle','scatter',scatter.map(short),scatter.map(r=>({x:r.duration_minutes,y:r.cigar_score})),'Observations documentées',{max:10})])
 );
pages.vie=section('04 · Archives de participation','Vie du Club','Fiches, marques, territoires et accompagnements déclarés.',
 kpis([['Séances distinctes',String(seasons.length),'Dans le dossier'],['Marques',String(brands.length),'Différentes'],['Références exactes',String(refs.length),'Identifications certaines'],['Accompagnements',String(drinks.length),'Boissons dénombrées']])+
 grid([chart('activity','Production mensuelle','Nombre de fiches archivées','bar',month.map(x=>x[0]),month.map(x=>x[1]),'Fiches par mois'),
 chart('origins','Territoires déclarés','Pays déclarés, sous réserve','doughnut',origins.map(x=>x[0]),origins.map(x=>x[1]),'Origines documentées'),
 chart('drinks','Accompagnements','Les boissons successives sont séparées','bar',tally(drinks).map(x=>x[0]),tally(drinks).map(x=>x[1]),'Accompagnements déclarés',{horizontal:true}),
 chart('brands','Marques explorées','Répartition des fiches','doughnut',brands.map(x=>x[0]),brands.map(x=>x[1]),'Fiches par marque'),
 chart('prices','Prix des cigares','Prix déclarés, non dépenses prouvées','bar',prices.map(x=>'F'+x[0]),prices.map(x=>x[1]),'Euros déclarés')])
 );
pages.minutes=section('05 · Brigade des procès-verbaux','Bureau des minutes','Les événements collectifs ne sont pas transformés en fautes individuelles.',
 kpis([['Séances avec minutes',String(uniq(meetings.map(r=>r.session_id)).length),'Minutes rattachées'],['Fiches enrichies',String(contributions.length),'Mentions nominatives vérifiées'],['Séances du dossier',String(seasons.length),'Participations archivées'],['Incidents imputés','—','Classification indisponible']])+
 '<div class="ob-minutes"><h4>Observations du procès-verbal</h4><p>Éléments attribués au membre dans les archives. Ce ne sont pas des comptages de prises de parole.</p>'+
 (contributions.length?contributions.map(r=>'<article><small>FICHE '+esc(r.number)+' · '+esc(r.date)+'</small><h5>'+esc(r.session_title)+'</h5><p>'+esc(r.minutes_contribution)+'</p><a href="'+esc(r.url)+'">Consulter la fiche source</a></article>').join(''):'<p class="ob-empty">Aucune contribution nominative n’est encore structurée.</p>')+'</div>'
 );
if(!a.length)return {html:'<section class="ob-root" data-observatory><div class="ob-cover"><small>SERVICE DES ARCHIVES ORGANOLEPTIQUES</small><h2>L’Observatoire du Rat</h2><p>Statistiques individuelles du CRCC</p></div><div class="ob-wait"><span>✦</span><h3>Le Comité attend les premières pièces.</h3><p>Aucune fiche de dégustation n’est encore archivée pour ce membre. Aucun chiffre fictif ne sera affiché.</p></div></section>',plots:[]};
const nav='<nav class="ob-tabs" role="tablist" aria-label="Rubriques de l’observatoire">'+tabs.map(([id,label],i)=>'<button type="button" role="tab" aria-selected="'+(!i)+'" aria-controls="ob-panel-'+id+'" id="ob-tab-'+id+'" tabindex="'+(i?'-1':'0')+'" data-ob-tab="'+id+'">'+esc(label)+'</button>').join('')+'</nav>';
const panels=tabs.map(([id],i)=>'<section role="tabpanel" aria-labelledby="ob-tab-'+id+'" id="ob-panel-'+id+'" data-ob-panel="'+id+'"'+(i?' hidden':'')+'>'+pages[id]+'</section>').join('');
const sess=uniq(a.map(r=>r.session_id)).map(id=>a.find(r=>r.session_id===id));
const sessions='<section class="ob-sessions"><h3>Séances du membre</h3><ol>'+sess.map(r=>'<li><time>'+esc(r.date)+'</time><a href="'+esc(r.session_url)+'">'+esc(r.session_title)+'</a></li>').join('')+'</ol></section>';
return {html:'<section class="ob-root" data-observatory><div class="ob-cover"><small>SERVICE DES ARCHIVES ORGANOLEPTIQUES · DOSSIER INDIVIDUEL</small><h2>L’Observatoire du Rat</h2><p>Statistiques issues des fiches et des minutes documentées.</p></div>'+nav+panels+sessions+'<p class="ob-disclaimer">Réserve du Comité : une donnée manquante ne vaut jamais zéro et une observation collective ne saurait être imputée sans preuve nominative.</p></section>',plots};
}
function hydrate(){
const root=document.querySelector('[data-observatory]'),data=document.getElementById('member-data');if(!root||!data)return;
const rows=JSON.parse(data.textContent).rows||[],model=render(rows);
const chartObjects=[];
const chartColor=['#743c36','#b69866','#879683','#ab8574','#536a68','#c9b4a4','#735f57','#d7c9b5'];
function graphs(){
 while(chartObjects.length)chartObjects.pop().destroy();
 if(typeof window.Chart!=='function')return;
 for(const p of model.plots){
  const canvas=document.getElementById('ob-'+p.id);if(!canvas||canvas.closest('[data-ob-panel]')?.hidden)continue;
  try{
   const polar=['doughnut','polarArea'].includes(p.type),radar=p.type==='radar',scatter=p.type==='scatter';
   const scales=radar?{r:{beginAtZero:true,max:100,grid:{color:'#e5d9cb'},pointLabels:{font:{size:11}}}}
    :polar?{}:scatter?{x:{beginAtZero:true,title:{display:true,text:'Minutes'},grid:{color:'#efe6d9'}},y:{beginAtZero:true,max:10,title:{display:true,text:'Note /10'},grid:{color:'#efe6d9'}}}
    :p.horizontal?{x:{beginAtZero:true,max:p.max,grid:{color:'#efe6d9'},ticks:{precision:0}},y:{grid:{display:false}}}
    :{x:{grid:{display:false}},y:{beginAtZero:true,max:p.max,grid:{color:'#efe6d9'},ticks:{precision:0}}};
   const c=new window.Chart(canvas,{type:p.type,data:{labels:p.labels,datasets:[{label:'Valeur',data:p.data,backgroundColor:polar?p.data.map((_,i)=>chartColor[i%chartColor.length]):'rgba(116,60,54,.55)',borderColor:polar?p.data.map((_,i)=>chartColor[i%chartColor.length]):'#743c36',borderWidth:2,tension:.3,fill:p.type==='line',pointRadius:4,maxBarThickness:36}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:p.horizontal?'y':'x',plugins:{legend:{display:polar,position:'bottom',labels:{boxWidth:11}}},scales}});
   chartObjects.push(c);canvas.closest('.ob-card').classList.add('ob-rendered');
  }catch(e){canvas.setAttribute('aria-label','Graphique indisponible : valeurs affichées en dessous');}
 }
}
const tabs=[...root.querySelectorAll('[data-ob-tab]')];
function activate(id,focus){tabs.forEach(tab=>{const selected=tab.dataset.obTab===id;tab.setAttribute('aria-selected',selected?'true':'false');tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus();});root.querySelectorAll('[data-ob-panel]').forEach(panel=>panel.hidden=panel.dataset.obPanel!==id);graphs();}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab.dataset.obTab,false));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activate(tabs[next].dataset.obTab,true);});});
activate('synthese',false);
}
if(typeof module!=='undefined'&&module.exports){
module.exports={render};
if(require.main===module){let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>process.stdout.write(render(JSON.parse(s)).html));}
}else if(typeof document!=='undefined'){
const init=()=>{try{hydrate();}catch(e){const x=document.querySelector('[data-observatory]');if(x)x.dataset.error='true';}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}
})();