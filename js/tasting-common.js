export const API='/fiches-degustation/api/degustations';
export const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const split=s=>[...new Set(String(s||'').split('\n').map(v=>v.trim()).filter(Boolean))];
export async function api(path,method='GET',data,secret='') {
  const headers={'Accept':'application/json'};
  if(secret)headers['X-Committee-Password']=secret;
  if(data!==undefined)headers['Content-Type']='application/json';
  const r=await fetch(API+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
  let value;try{value=await r.json();}catch{throw Error('Le serveur n’a pas retourné de réponse lisible.');}
  if(!r.ok)throw Error(value.error||'Le traitement a échoué.');
  return value;
}
export function field(label,name,value='',options={}) {
  const id=options.id||`field-${name.replace(/[^a-z0-9-]/gi,'-')}`;
  const attrs=`id="${id}" name="${esc(name)}" ${options.required?'required':''} ${options.type==='number'?'min="0" step="'+(options.integer?'1':'any')+'"':''} ${options.max!=null?'max="'+options.max+'"':''} ${options.readonly?'readonly':''}`;
  return `<label class="tasting-field ${options.wide?'wide':''}" for="${id}"><span>${esc(label)}${options.required?' *':''}</span>${options.area?`<textarea ${attrs} rows="${options.rows||3}" maxlength="${options.limit||10000}">${esc(value)}</textarea>`:`<input ${attrs} type="${options.type||'text'}" value="${esc(value)}" maxlength="${options.limit||500}">`}${options.hint?`<small>${esc(options.hint)}</small>`:''}</label>`;
}
export function sessionFields(data={},compact=false) {
  return `<section class="card"><p class="office-eyebrow">01 · La séance</p><h2>Repères communs</h2><div class="tasting-grid">`+
    field('Date de dégustation','date',data.date,{type:'date',required:true})+(compact?'':field('Titre de la séance','title',data.title,{required:true,limit:180})+field('Lieu','place',data.place)+field('Fond sonore','music',data.music))+field('Heure de début','start_time',data.start_time,{type:'time'})+field('Heure de fin','end_time',data.end_time,{type:'time'})+
    field('Contexte de la dégustation','context',data.context,{area:true,wide:true,limit:4000})+
    field('Invités présents','prospects',data.prospects,{area:true,wide:true,limit:1000,hint:'Une personne par ligne. Utiliser les initiales souhaitées pour les archives.'})+
    field('Notes complémentaires sur la séance','notes',data.notes,{area:true,wide:true,limit:10000,hint:'Événements, météo, ambiance, précisions absentes des fiches. Attribuer les propos et les mesures à leur auteur.'})+'</div></section>';
}
const numbers=[['Note personnelle du cigare /10','cigar_score',10],['Durée de dégustation (min)','duration_minutes',1440,true],['Cendre maximale (cm)','ash_max_cm',60],['Rallumages','relights',100,true],['Retouches','touchups',100,true],['Puissance ressentie /10','strength_score',10],['Richesse ressentie /10','richness_score',10],['Longueur mesurée (mm)','length_mm',1000],['Calibre / cepo','ring_gauge',200],['Humidité de conservation (%)','humidity',100],['Température de conservation (°C)','temperature',80]];
export function memberFields(m,roster,index,admin=false) {
  const prefix=`m-${index}-`,known=roster.some(p=>p.id===m.id),options=roster.map(p=>`<option value="${esc(p.id)}" ${p.id===m.id?'selected':''}>${esc(p.name)}</option>`).join('');
  const opening=`<section class="card tasting-member" data-member-index="${index}" data-member-id="${esc(m.id||'')}"><div class="tasting-heading"><div><p class="office-eyebrow">Participant ${index+1}</p><h3>${esc(m.name||'Membre présent')}</h3></div>${admin?'':`<button class="secondary remove-member" type="button">Retirer</button>`}</div><div class="tasting-grid">`;
  const select=`<label class="tasting-field"><span>Membre *</span><select name="member-select" ${admin?'disabled':''}><option value="">Sélectionner un membre</option>${options}</select></label>`;
  const hasSheet=`<label class="tasting-check"><input name="has_sheet" type="checkbox" ${m.has_sheet===false?'':'checked'}> Une fiche est jointe pour ce membre</label>`;
  if(!admin)return opening+select+hasSheet+'</div><div class="member-details" '+(m.has_sheet===false?'hidden':'')+'><label class="tasting-field"><span>Fiche de dégustation</span><input class="sheet-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple><small>Un PDF ou plusieurs scans (15 Mo maximum pour le PDF final).</small></label></div></section>';
  return opening+select+
    field('Nom du membre',prefix+'name',m.name,{readonly:known||admin})+
    field('Grade lors de la séance',prefix+'grade',m.grade,{hint:admin?'À confirmer au vu des pièces. Aucun changement automatique de grade.':'Grade historique, à confirmer par le Comité.'})+
    `<label class="tasting-check"><input name="has_sheet" type="checkbox" ${m.has_sheet===false?'':'checked'}> Une fiche est jointe pour ce membre</label></div>`+
    `<div class="member-details" ${m.has_sheet===false?'hidden':''}><div class="tasting-grid">`+
    [['Marque','brand'],['Cigare / gamme','cigar'],['Référence exacte','reference_exact'],['Module','module'],['Origine déclarée','origin'],['Titre souhaité pour la fiche','sheet_title'],['Type de coupe','cut'],['Tirage','draw'],['Conservation / ancienneté','storage'],['Raison de l’arrêt','stop_reason'],['Prix payé (avec devise)','price']].map(([label,key])=>field(label,prefix+key,m[key])).join('')+
    numbers.map(([label,key,max,integer])=>field(label,prefix+key,m[key],{type:'number',max,integer})).join('')+
    field('Arômes relevés',prefix+'aromas',(m.aromas||[]).join('\n'),{area:true,hint:'Un descripteur par ligne. Les répétitions entre tiers ne comptent qu’une fois.'})+
    field('Accompagnements',prefix+'pairings',(m.pairings||[]).join('\n'),{area:true,hint:'Une boisson ou un accompagnement distinct par ligne.'})+
    field('Notes individuelles complémentaires',prefix+'notes',m.notes,{area:true,wide:true,limit:6000})+
    (admin?'':`<label class="tasting-field wide"><span>Fiche de ${esc(m.name||'ce membre')} *</span><input class="sheet-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple><small>Un PDF ou plusieurs scans JPG, PNG ou WebP (15 Mo maximum pour le PDF final).</small></label>`)+
    '</div></div></section>';
}
export function readForm(form) {
  const fd=new FormData(form),data={};
  for(const key of ['date','title','place','start_time','end_time','context','notes','prospects','music'])data[key]=String(fd.get(key)||'').trim();
  data.members=[...form.querySelectorAll('[data-member-index]')].map(section=>{
    const index=section.dataset.memberIndex,prefix=`m-${index}-`,val=k=>String(fd.get(prefix+k)||'').trim();
    const id=section.dataset.memberId;
    if(!id)throw Error('Sélectionner chaque membre présent dans le registre.');
    const m={id,name:val('name'),grade:val('grade'),has_sheet:section.querySelector('[name=has_sheet]').checked};
    for(const key of ['brand','cigar','reference_exact','module','origin','sheet_title','cut','draw','storage','stop_reason','price','notes'])m[key]=val(key);
    for(const [,key]of numbers)m[key]=val(key)===''?null:Number(val(key));
    m.aromas=split(val('aromas'));m.pairings=split(val('pairings'));
    return m;
  });
  return data;
}
export function wireMember(section,roster) {
  const select=section.querySelector('select');
  select.addEventListener('change',()=>{
    const p=roster.find(p=>p.id===select.value);
    section.dataset.memberId=p?.id||'';
    section.querySelector('h3').textContent=p?.name||'Membre présent';
  });
  section.querySelector('[name=has_sheet]').addEventListener('change',event=>{section.querySelector('.member-details').hidden=!event.target.checked;});
  section.querySelector('.remove-member')?.addEventListener('click',()=>section.remove());
}
export function readSubmissionForm(form,roster,previous={}) {
  const fd=new FormData(form),data={...previous};
  for(const key of ['date','start_time','end_time','context','prospects','notes'])data[key]=String(fd.get(key)||'').trim();
  data.title=/^Dégustation du \d{2}\/\d{2}\/\d{4}$/.test(previous.title||'')?'':previous.title||'';
  data.members=[...form.querySelectorAll('[data-member-index]')].map(section=>{
    const person=roster.find(p=>p.id===section.dataset.memberId);
    if(!person)throw Error('Sélectionner chaque membre présent dans le registre.');
    const old=previous.members?.find(m=>m.id===person.id)||{};
    return {...old,id:person.id,name:person.name,grade:old.grade||person.grade||'',has_sheet:section.querySelector('[name=has_sheet]').checked};
  });
  return data;
}
export async function imageCanvas(file,max) {
  if(file.size>25*1024*1024)throw Error('Image trop volumineuse : 25 Mo maximum par original.');
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  if(bitmap.width*bitmap.height>60000000){bitmap.close();throw Error('Image trop grande : 60 mégapixels maximum.');}
  const ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
}
const blob=(canvas,type,quality)=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Conversion de l’image impossible.')),type,quality));
export async function optimizePhoto(file) {
  const fullCanvas=await imageCanvas(file,1920),full=await blob(fullCanvas,'image/webp',.82);
  const canvas=document.createElement('canvas'),ratio=Math.min(1,640/Math.max(fullCanvas.width,fullCanvas.height));
  canvas.width=Math.round(fullCanvas.width*ratio);canvas.height=Math.round(fullCanvas.height*ratio);canvas.getContext('2d').drawImage(fullCanvas,0,0,canvas.width,canvas.height);
  const thumbnail=await blob(canvas,'image/webp',.75);
  if(full.type!=='image/webp'||thumbnail.type!=='image/webp')throw Error('La conversion WebP n’est pas disponible dans ce navigateur.');
  if(full.size>2500000||thumbnail.size>350000)throw Error('Cette photo reste trop volumineuse après optimisation.');
  return {full,thumbnail};
}
// Minimal image-only PDF encoder: scans are flattened, not embedded as active HTML.
export async function documentPdf(files) {
  files=[...files];if(!files.length)return null;
  if(files.some(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name))){if(files.length!==1)throw Error('Choisir un seul PDF ou plusieurs images, sans les mélanger.');if(files[0].size>15*1024*1024)throw Error('PDF trop volumineux (15 Mo maximum).');return files[0];}
  if(files.length>12)throw Error('Douze pages numérisées maximum par document.');
  const encode=s=>new TextEncoder().encode(s),parts=[],offsets=[0];let size=0;
  const add=value=>{const b=typeof value==='string'?encode(value):value;parts.push(b);size+=b.length;};
  const object=(id,head,bytes)=>{offsets[id]=size;add(`${id} 0 obj\n${head}`);if(bytes){add('\nstream\n');add(bytes);add('\nendstream');}add('\nendobj\n');};
  add('%PDF-1.4\n');
  const pages=[];for(let i=0;i<files.length;i++)pages.push(3+i*3);
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map(n=>`${n} 0 R`).join(' ')}] >>`);
  for(let i=0;i<files.length;i++){
    const canvas=await imageCanvas(files[i],1800),jpeg=new Uint8Array(await (await blob(canvas,'image/jpeg',.88)).arrayBuffer()),page=pages[i],w=595,h=Math.round(w*canvas.height/canvas.width),content=encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`);
    object(page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${page+1} 0 R >> >> /Contents ${page+2} 0 R >>`);
    object(page+1,`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
    object(page+2,`<< /Length ${content.length} >>`,content);
  }
  const xref=size;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result=new Blob(parts,{type:'application/pdf'});if(result.size>15*1024*1024)throw Error('Le document converti dépasse 15 Mo.');return result;
}
export function attachmentsHtml(files,id,editable=false) {
  return files.length?'<ul class="tasting-attachments">'+files.filter(f=>f.kind!=='thumbnail').map(f=>`<li><a href="${API}/files/${esc(f.id)}" target="_blank" rel="noopener">${esc(f.name)}</a> <small>${esc(f.kind==='sheet'?'Fiche · '+f.member_id:f.kind==='minutes'?'Minutes':'Photo')} · ${f.state==='uploaded'?'reçu':'transfert à reprendre'}</small>${editable?` <button type="button" class="secondary" data-remove-file="${esc(f.id)}" data-submission="${esc(id)}">Retirer</button>`:''}</li>`).join('')+'</ul>':'<p class="archive-meta">Aucune pièce transmise pour le moment.</p>';
}
