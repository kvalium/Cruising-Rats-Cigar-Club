import {esc} from './tasting-common.js';

const EVENTS={
  'draft.saved':['Brouillon enregistré','draft'],
  submitted:['Dossier transmis au Comité','review'],
  'review.saved':['Examen enregistré','review'],
  analysis_prepared:['Examen préparé','review'],
  'evidence.photo.added':['Photographie ajoutée','review'],
  approved:['Dégustation validée','success'],
  published:['Publication vérifiée','success'],
  needs_info:['Compléments demandés','warning'],
  rejected:['Dossier refusé','warning'],
  'processing.recovered':['Dossier rouvert après interruption','warning'],
  'publication.editorial.updated':['Présentation mise à jour','review'],
  'publication.title.updated':['Titre de la dégustation modifié','review'],
  'record.ash.confirmed':['Record de cendre enregistré','success'],
};
const STATES={valide:'VALIDÉ','valide-avec-reserves':'VALIDÉ AVEC RÉSERVES','a-regulariser':'À RÉGULARISER'};
const dateFormat=new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Paris'});
function date(value) {
  const raw=String(value||'').trim();
  const iso=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)?raw.replace(' ','T')+'Z':raw;
  const milliseconds=Date.parse(iso);
  return Number.isFinite(milliseconds)?{milliseconds,iso:new Date(milliseconds).toISOString(),label:dateFormat.format(milliseconds)}:{milliseconds:0,iso:'',label:'Date non renseignée'};
}
function detailsFor(event,members) {
  const raw=String(event.details||'');let data;
  try{data=JSON.parse(raw);}catch{}
  if(!data||typeof data!=='object'||Array.isArray(data))return {summary:raw.length>280?raw.slice(0,277)+'…':raw,facts:[],technical:raw.length>280?raw:''};
  const facts=[],name=id=>members.find(m=>m.id===id)?.name||id;
  if(Number.isInteger(data.source_version)&&Number.isInteger(data.draft_version))facts.push(['Version',`${data.source_version} → ${data.draft_version}`]);
  if(data.proposed_status)facts.push(['Avis proposé',STATES[data.proposed_status]||'À examiner']);
  for(const [id,score] of Object.entries(data.proposed_committee_scores||{}))if(typeof score==='number')facts.push([`Note proposée · ${name(id)}`,`${score}/100`]);
  if(typeof data.photo_count_added==='number')facts.push(['Photographies ajoutées',String(data.photo_count_added)]);
  if(typeof data.length_mm==='number')facts.push(['Cendre retenue',`${data.length_mm} mm`]);
  const record=data.record_proposal;
  if(typeof record?.estimated_length_cm==='number')facts.push(['Candidature au record',`${record.estimated_length_cm.toLocaleString('fr-FR')} cm · mesure à confirmer`]);
  if(data.title)facts.push(['Titre de séance',String(data.title)]);
  let summary=String(data.reason||'');
  if(event.event==='analysis_prepared')summary='Le compte rendu et les propositions de notes sont prêts pour l’examen du Comité.';
  if(event.event==='evidence.photo.added')summary='Une photographie complémentaire a été jointe au dossier. Sa miniature est conservée avec elle.';
  if(event.event==='record.ash.confirmed')summary='La mesure est retenue pour le registre des records, avec sa photographie justificative.';
  if(!summary)summary='Les informations du dossier ont été mises à jour.';
  return {summary,facts,technical:JSON.stringify({event:event.event,...data},null,2)};
}
export function historyHtml(events=[],members=[]) {
  if(!events.length)return '<p class="archive-meta">Aucun événement enregistré pour ce dossier.</p>';
  const ordered=events.map((event,index)=>({event,index,date:date(event.created_at)})).sort((a,b)=>b.date.milliseconds-a.date.milliseconds||b.index-a.index);
  return '<p class="history-caption">'+events.length+' événement'+(events.length>1?'s':'')+' · Du plus récent au plus ancien · Heure de Paris</p><ol class="tasting-history">'+ordered.map(({event,date})=>{
    const [title,tone]=EVENTS[event.event]||['Événement du dossier','draft'];
    const details=detailsFor(event,members);
    return '<li class="history-item" data-tone="'+tone+'"><div class="history-heading"><h3>'+esc(title)+'</h3><time'+(date.iso?' datetime="'+esc(date.iso)+'"':'')+'>'+esc(date.label)+'</time></div>'+
      (details.summary?'<p class="history-summary">'+esc(details.summary)+'</p>':'')+
      (details.facts.length?'<dl class="history-facts">'+details.facts.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>':'')+
      (details.technical?'<details class="history-technical"><summary>Détails techniques</summary><pre>'+esc(details.technical)+'</pre></details>':'')+'</li>';
  }).join('')+'</ol>';
}
