import {api,API,esc,field,sessionFields,memberFields,readForm,split,attachmentsHtml} from './tasting-common.js';
const $=id=>document.getElementById(id);let secret='',catalog=null,current=null,poll=null;
const message=(value,error=false)=>{$('review-message').textContent=value;$('review-message').dataset.error=error;};
const call=(path,method='GET',body)=>api('/admin'+path,method,body,secret);
function reviewFields(row) {
  const review=row.review||{},data=row.payload;
  return '<section class="card"><p class="office-eyebrow">Examen du Comité</p><h2>Vérification et avis global</h2><p>Comparer les données des pièces aux sources fiables. Les sensations restent personnelles et les minutes ne complètent un membre que si les faits lui sont attribués.</p><div class="tasting-grid">'+
    field('Descriptif vérifié du cigare','review-description',review.description,{area:true,wide:true,limit:4000})+
    field('Sources de référence (URL HTTPS)','review-sources',(review.sources||[]).join('\n'),{area:true,wide:true,hint:'Une URL par ligne. Signaler les références et variantes incertaines dans les comparaisons individuelles.'})+
    `<label class="tasting-field"><span>État du dossier publié</span><select name="review-status"><option value="valide-avec-reserves" ${review.status==='valide-avec-reserves'?'selected':''}>VALIDÉ AVEC RÉSERVES</option><option value="valide" ${review.status==='valide'?'selected':''}>VALIDÉ</option><option value="a-regulariser" ${review.status==='a-regulariser'?'selected':''}>À RÉGULARISER</option></select></label>`+
    field('Appréciation générale de la séance','review-appreciation',review.appreciation,{area:true,wide:true,limit:8000,hint:'Synthèse de toutes les pièces ; ce n’est pas la moyenne des notes individuelles.'})+'</div></section>'+
    data.members.filter(m=>m.has_sheet).map(m=>{
      const r=review.members?.[m.id]||{},p=`r-${m.id}-`;
      return `<section class="card review-member" data-review-member="${esc(m.id)}"><p class="office-eyebrow">Compte rendu individuel</p><h2>${esc(m.name)}</h2><div class="tasting-grid">`+
        field('Compte rendu détaillé',p+'report',r.report,{area:true,wide:true,limit:12000,rows:7})+
        field('Comparaison avec les caractéristiques vérifiées',p+'comparison',r.comparison,{area:true,wide:true,limit:12000})+
        field('Pièces et base de l’évaluation',p+'evaluation_basis',r.evaluation_basis,{area:true,limit:12000})+
        field('Utilisation individuelle des minutes',p+'minutes_contribution',r.minutes_contribution,{area:true,limit:12000,hint:'Expliquer les faits attribués utilisés, ou l’absence d’apport individuel. Aucune pénalité si les minutes sont absentes.'})+
        field('Mention du Comité',p+'mention',r.mention,{area:true,wide:true,limit:12000})+
        field('Prochains axes de progression',p+'next_steps',(r.next_steps||[]).join('\n'),{area:true,wide:true,hint:'Un axe par ligne.'})+'</div><h3>Qualité documentaire — barème CRCC 2026</h3>'+catalog.rubric.map(([label,max],i)=>`<div class="tasting-criteria"><strong>${esc(label)}</strong><div class="tasting-grid">${field(`Points /${max}`,p+'score-'+i,r.criteria?.[i]?.score,{type:'number',integer:true,max})}${field('Justification',p+'comment-'+i,r.criteria?.[i]?.comment,{area:true,limit:1500})}</div></div>`).join('')+'<p class="tasting-total" aria-live="polite">Total : <span data-total>—</span> /100</p></section>';
    }).join('')+
    '<section class="card"><label class="tasting-check"><input type="checkbox" name="review-confirmed"> Je confirme avoir lu toutes les pièces, vérifié les caractéristiques disponibles et distingué les observations des corrections du Comité.</label></section>';
}
function readReview() {
  const fd=new FormData($('review-form')),get=k=>String(fd.get(k)||'').trim();
  const r={description:get('review-description'),sources:split(get('review-sources')),status:get('review-status'),appreciation:get('review-appreciation'),confirmed:fd.has('review-confirmed'),members:{}};
  for(const m of current.payload.members.filter(m=>m.has_sheet)){const p=`r-${m.id}-`,v={};for(const key of ['report','comparison','evaluation_basis','minutes_contribution','mention'])v[key]=get(p+key);v.next_steps=split(get(p+'next_steps'));v.criteria=catalog.rubric.map(([,max],i)=>({score:get(p+'score-'+i)===''?null:Number(get(p+'score-'+i)),max,comment:get(p+'comment-'+i)}));r.members[m.id]=v;}return r;
}
async function loadQueue() {
  const r=await call('/list');
  $('review-queue').innerHTML=r.submissions.length?r.submissions.map(s=>`<article><div class="tasting-heading"><div><span class="tasting-badge">${esc(catalog.states[s.status]||s.status)}</span><h3>${esc(s.payload.title)}</h3><p>${esc(s.payload.date)} · ${s.payload.members.map(m=>esc(m.name)).join(', ')}</p></div><button type="button" class="secondary" data-open="${esc(s.id)}">Examiner le dossier</button></div></article>`).join(''):'<p>Aucune dégustation en attente d’examen.</p>';
  $('review-queue').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDossier(b.dataset.open).catch(e=>message(e.message,true)));
}
async function openDossier(id) {
  clearInterval(poll);current=await call('/'+id);const row=current,editable=['pending','needs_info'].includes(row.status);
  $('analysis-prompt').value='';$('prompt-output').hidden=true;
  $('review-dossier').hidden=false;$('review-title').textContent=row.payload.title+' · '+(catalog.states[row.status]||row.status);
  $('review-files').innerHTML=attachmentsHtml(row.files,id);
  $('review-files').querySelectorAll('a').forEach(link=>link.onclick=async event=>{
    event.preventDefault();const viewer=window.open('about:blank','_blank');
    try{const r=await fetch(link.href,{headers:{'X-Committee-Password':secret},credentials:'same-origin'});if(!r.ok)throw Error('Pièce inaccessible.');const url=URL.createObjectURL(await r.blob());if(viewer)viewer.location.href=url;else{URL.revokeObjectURL(url);throw Error('Autoriser l’ouverture de la pièce dans un nouvel onglet.');}setTimeout(()=>URL.revokeObjectURL(url),300000);}catch(e){viewer?.close();message(e.message,true);}
  });
  $('original-data').textContent=JSON.stringify(row.submitted_payload||row.payload,null,2);
  $('review-fields').innerHTML=sessionFields(row.payload)+row.payload.members.map((m,i)=>memberFields(m,catalog.members,i,true)).join('')+reviewFields(row);
  $('review-form').querySelectorAll('input,textarea,select').forEach(n=>{if(!editable)n.disabled=true;});
  $('review-form').querySelectorAll('[data-member-index] [name=has_sheet]').forEach(n=>n.disabled=true);
  $('review-actions').hidden=!editable;$('decision-actions').hidden=!editable;
  $('approve').disabled=row.status!=='pending';$('publication-actions').hidden=!['processing','publishing','publish_failed','published'].includes(row.status);
  $('publication-result').textContent=row.status==='published'?'Déploiement vérifié.':'';
  $('published-link').hidden=row.status!=='published';$('published-link').href='/fiches-degustation/seance-'+row.session_id;
  $('review-events').innerHTML=row.events.map(e=>`<li><strong>${esc(e.event)}</strong> · ${esc(e.created_at)}<br>${esc(e.details)}</li>`).join('');
  $('decision-feedback').value=row.feedback||'';
  $('review-form').querySelectorAll('.review-member').forEach(section=>{const update=()=>{const inputs=[...section.querySelectorAll('input[type=number]')];section.querySelector('[data-total]').textContent=inputs.some(n=>n.value==='')?'—':inputs.reduce((a,n)=>a+Number(n.value),0);};section.addEventListener('input',update);update();});
  if(['publishing','publish_failed'].includes(row.status))poll=setInterval(()=>checkPublication().catch(e=>message(e.message,true)),15000);
  $('review-dossier').scrollIntoView({behavior:'smooth'});
}
async function checkPublication(){if(!current)return;const r=await call('/'+current.id+'/check','POST',{});$('publication-result').textContent=r.status==='published'?'Déploiement réussi : la page publiée a été vérifiée.':r.message||catalog.states[r.status];if(r.status==='published'){clearInterval(poll);current.status='published';$('published-link').href=r.url;$('published-link').hidden=false;await loadQueue();}}
async function action(fn){$('review-dossier').querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){message(e.message,true);}finally{$('review-dossier').querySelectorAll('button').forEach(b=>b.disabled=false);if(current?.status!=='pending')$('approve').disabled=true;}}
$('committee-login').onsubmit=async event=>{event.preventDefault();secret=$('committee-password').value;$('connect').disabled=true;try{await call('/list');catalog=await api('/catalog');$('login-panel').hidden=true;$('committee-workspace').hidden=false;$('committee-password').value='';message('');await loadQueue();}catch(e){secret='';message(e.message,true);}finally{$('connect').disabled=false;}};
$('refresh-queue').onclick=()=>loadQueue().catch(e=>message(e.message,true));
$('disconnect').onclick=()=>{secret='';current=null;clearInterval(poll);$('committee-workspace').hidden=true;$('login-panel').hidden=false;$('review-dossier').hidden=true;message('Accréditation fermée.');};
$('save-review').onclick=()=>action(async()=>{const data=readForm($('review-form')),review=readReview(),r=await call('/'+current.id,'PUT',{data,review,version:current.version});current.version=r.version;current.payload=data;current.review=review;message('Examen enregistré. Les données soumises à l’origine sont conservées.');});
$('review-form').onsubmit=event=>{event.preventDefault();action(async()=>{if(!$('review-form').reportValidity())return;const data=readForm($('review-form')),review=readReview();if(!confirm('Valider cette dégustation et publier les comptes rendus, les statistiques et les photos dans les archives membres ?'))return;await call('/'+current.id+'/approve','POST',{data,review,version:current.version});message('Dégustation validée et enregistrée. Vérification du déploiement en cours.');await openDossier(current.id);await loadQueue();});};
for(const [button,status]of [['request-info','needs_info'],['reject','rejected']])$(button).onclick=()=>action(async()=>{const feedback=$('decision-feedback').value.trim();if(!feedback)throw Error('Renseigner le motif ou les compléments attendus.');await call('/'+current.id+'/decision','POST',{status,feedback,version:current.version});message(status==='needs_info'?'Le déposant peut compléter son dossier.':'Dossier refusé ; les pièces et le motif sont conservés.');await openDossier(current.id);await loadQueue();});
$('check-publication').onclick=()=>action(checkPublication);
$('retry-publication').onclick=()=>action(async()=>{await call('/'+current.id+'/retry','POST',{});await openDossier(current.id);message('Publication relancée.');});
$('prepare-prompt').onclick=()=>action(async()=>{
  const result=await call('/'+current.id+'/prompt');$('analysis-prompt').value=result.prompt;$('prompt-output').hidden=false;
  message('Prompt préparé depuis la version enregistrée du dossier. Copiez-le dans la conversation CRCC pour lancer l’analyse.');
});
$('copy-prompt').onclick=async()=>{
  const area=$('analysis-prompt');
  try{await navigator.clipboard.writeText(area.value);message('Prompt copié. Collez-le dans la conversation CRCC.');}
  catch{area.focus();area.select();message('Le prompt est sélectionné. Utilisez la commande Copier de votre navigateur.');}
};
