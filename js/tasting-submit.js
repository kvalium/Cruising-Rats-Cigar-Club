import {api,API,esc,uuid,sessionFields,memberFields,wireMember,readSubmissionForm,documentPdf,optimizePhoto,attachmentsHtml} from './tasting-common.js';
const $=id=>document.getElementById(id),form=$('tasting-form');
let roster=[],states={},current=null,index=0,busy=false,clientId=uuid(),photoUrls=[],photoUploads=new Map();
const message=(text,error=false)=>{$('tasting-message').textContent=text;$('tasting-message').dataset.error=error;};
const progress=text=>$('tasting-progress').textContent=text;
function lock(value){busy=value;form.querySelectorAll('button').forEach(b=>b.disabled=value);$('new-submission').disabled=value;}
function render(data={members:[{has_sheet:true}]}) {
  photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];
  photoUploads.clear();
  $('session-fields').innerHTML=sessionFields(data,true);$('member-fields').innerHTML='';index=0;
  for(const m of data.members||[])addMember(m);
  $('photos').value='';$('minutes').value='';$('photo-captions').innerHTML='';
  $('existing-files').innerHTML=attachmentsHtml(current?.files||[],current?.id,['draft','needs_info'].includes(current?.status));
  $('draft-reference').textContent=current?`Dossier ${current.id.slice(0,8).toUpperCase()} · ${states[current.status]||current.status}`:'Nouveau dossier';
  $('committee-feedback').textContent=current?.feedback||'';
  const editable=!current||['draft','needs_info'].includes(current.status);
  form.querySelectorAll('input,select,textarea,button').forEach(node=>node.disabled=!editable);
  $('tasting-actions').hidden=!editable;
  $('existing-files').querySelectorAll('[data-remove-file]').forEach(button=>button.onclick=()=>removeFile(button.dataset.removeFile));
}
function addMember(m={has_sheet:true}) {
  if($('member-fields').children.length>=20){message('Vingt membres maximum.',true);return;}
  const holder=document.createElement('div');holder.innerHTML=memberFields(m,roster,index++);
  const section=holder.firstElementChild;$('member-fields').append(section);wireMember(section,roster);
}
async function loadMine(){const r=await api('/mine');$('my-submissions').innerHTML=r.submissions.length?r.submissions.map(s=>`<article><span class="tasting-badge">${esc(states[s.status]||s.status)}</span><h3>${esc(s.payload.title)}</h3><p>${esc(s.payload.date)} · ${s.payload.members.map(m=>esc(m.name)).join(', ')}</p><button class="secondary" type="button" data-open="${esc(s.id)}">Ouvrir le dossier</button></article>`).join(''):'<p>Aucune dégustation déposée depuis ce navigateur.</p>';$('my-submissions').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>loadDraft(b.dataset.open).catch(e=>message(e.message,true)));}
async function loadDraft(id){if(busy)return;current=await api('/draft/'+id);sessionStorage.setItem('crcc-tasting-draft',id);render(current.payload);message('');form.scrollIntoView({behavior:'smooth'});}
async function save() {
  if(!form.reportValidity())throw Error('Compléter les champs obligatoires.');
  const data=readSubmissionForm(form,roster,current?.payload||{});
  if(current){const r=await api('/draft/'+current.id,'PUT',{data,version:current.version});current={...current,payload:data,version:r.version};}
  else{current=await api('/draft','POST',{data,client_id:clientId});sessionStorage.setItem('crcc-tasting-draft',current.id);}
  $('draft-reference').textContent=`Dossier ${current.id.slice(0,8).toUpperCase()} · Brouillon`;return data;
}
async function upload(blob,metadata) {
  const record=await api('/draft/'+current.id+'/files','POST',metadata);
  const r=await fetch(API+'/draft/'+current.id+'/files/'+record.id,{method:'PUT',body:blob,credentials:'same-origin'});
  const payload=await r.json();if(!r.ok)throw Error(payload.error||'Le transfert a échoué.');
}
async function uploadSelected(data) {
  for(const section of form.querySelectorAll('[data-member-index]')) {
    const id=section.dataset.memberId,input=section.querySelector('.sheet-file');
    if(!section.querySelector('[name=has_sheet]').checked||!input?.files.length)continue;
    const name=data.members.find(m=>m.id===id)?.name||id;progress('Préparation et transfert de la fiche de '+name+'…');
    await upload(await documentPdf(input.files),{kind:'sheet',member_id:id,name:`Fiche de ${name}.pdf`});input.value='';
  }
  if($('minutes').files.length){progress('Préparation et transfert des minutes…');await upload(await documentPdf($('minutes').files),{kind:'minutes',name:'Minutes de la séance.pdf'});$('minutes').value='';}
  const existing=await api('/draft/'+current.id),used=new Set(existing.files.filter(f=>f.kind==='photo').map(f=>f.slot)),photos=[...$('photos').files];
  if(used.size+photos.filter((_,i)=>!photoUploads.has(i)).length>10)throw Error('La séance ne peut pas dépasser dix photos. Retirer une photo existante avant d’en ajouter.');
  for(let i=0;i<photos.length;i++) {
    if(photoUploads.get(i)?.done)continue;
    progress(`Optimisation et transfert de la photo ${i+1}/${photos.length}…`);
    const optimized=await optimizePhoto(photos[i]);let n=1;while(used.has(`photo-${n}`))n++;const slot=photoUploads.get(i)?.slot||`photo-${n}`;n=Number(slot.split('-')[1]);used.add(slot);photoUploads.set(i,{slot,done:false});
    const alt=`Photo ${n} de la séance du ${data.date}`,caption='';
    await upload(optimized.full,{kind:'photo',slot,name:`Photo ${n}.webp`,alt,caption});
    await upload(optimized.thumbnail,{kind:'thumbnail',slot:slot+'-thumb',name:`Miniature ${n}.webp`});
    photoUploads.set(i,{slot,done:true});
  }
  $('photos').value='';$('photo-captions').innerHTML='';photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];
  photoUploads.clear();
  current=await api('/draft/'+current.id);
  $('existing-files').innerHTML=attachmentsHtml(current.files,current.id,true);
  $('existing-files').querySelectorAll('[data-remove-file]').forEach(button=>button.onclick=()=>removeFile(button.dataset.removeFile));
}
async function removeFile(id) {
  if(busy)return;lock(true);
  try{const f=current.files.find(f=>f.id===id),group=f.kind==='photo'?current.files.filter(v=>v.slot===f.slot||v.slot===f.slot+'-thumb'):[f];for(const item of group)await api(`/draft/${current.id}/files/${item.id}`,'DELETE');current=await api('/draft/'+current.id);$('existing-files').innerHTML=attachmentsHtml(current.files,current.id,true);$('existing-files').querySelectorAll('[data-remove-file]').forEach(b=>b.onclick=()=>removeFile(b.dataset.removeFile));message('Pièce retirée du dossier.');}catch(e){message(e.message,true);}finally{lock(false);}
}
async function process(submit) {
  if(busy)return;message('');lock(true);
  try{const data=await save();await uploadSelected(data);
    if(submit){progress('Transmission au Comité…');await api('/draft/'+current.id+'/submit','POST',{version:current.version});current=await api('/draft/'+current.id);render(current.payload);message(`Dégustation transmise au Comité. Référence : ${current.id.slice(0,8).toUpperCase()}. Elle apparaîtra dans les archives après validation.`);sessionStorage.removeItem('crcc-tasting-draft');}
    else message('Brouillon et pièces enregistrés. Le dossier reste modifiable avant sa transmission.');
    await loadMine();progress('');
  }catch(e){message(e.message,true);progress('Les pièces déjà reçues sont conservées. Vous pouvez reprendre le dépôt.');if(current){const fresh=await api('/draft/'+current.id).catch(()=>null);if(fresh)current=fresh;}}
  finally{lock(false);if(current&&!['draft','needs_info'].includes(current.status))form.querySelectorAll('input,select,textarea,button').forEach(n=>n.disabled=true);}
}
$('add-member').onclick=()=>addMember();$('save-draft').onclick=()=>process(false);form.onsubmit=e=>{e.preventDefault();process(true);};
$('new-submission').onclick=()=>{if(busy)return;current=null;clientId=uuid();sessionStorage.removeItem('crcc-tasting-draft');render();message('');};
$('photos').onchange=()=>{
  photoUploads.clear();
  photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];const photos=[...$('photos').files];
  if(photos.length+(current?.files||[]).filter(f=>f.kind==='photo').length>10){$('photos').value='';$('photo-captions').innerHTML='';message('Dix photos maximum par séance.',true);return;}
  $('photo-captions').innerHTML=photos.map((f,i)=>{const url=URL.createObjectURL(f);photoUrls.push(url);return `<figure><img src="${url}" alt="Aperçu de la photo ${i+1}"><figcaption>Photo ${i+1}</figcaption></figure>`;}).join('');
};
(async()=>{try{const catalog=await api('/catalog');roster=catalog.members;states=catalog.states;render();if(!catalog.storage_ready)message('Le stockage des pièces est en cours de configuration. La saisie du brouillon reste disponible.');await loadMine();const saved=sessionStorage.getItem('crcc-tasting-draft');if(saved)await loadDraft(saved);}catch(e){message(e.message,true);}})();
