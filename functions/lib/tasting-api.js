import {publish} from '../../cloudflare/worker.mjs';
import {sha256,s3,copyAsset,storageReady} from './tasting-storage.js';
import {cleanSubmission,cleanReview,validateUpload,EDITABLE,STATES,RUBRIC,slug,safe,text,fail} from './tasting-model.js';

const COOKIE='crcc_tasting_owner';
const cookie=value=>`${COOKIE}=${value}; Path=/fiches-degustation/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex,nofollow',...headers}});
const eq=(a,b)=>{if(!a||!b||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;};
const admin=(request,env)=>eq(request.headers.get('X-Committee-Password'),env.CRCC_EXAM_ADMIN_PASSWORD);
const ownerToken=request=>request.headers.get('Cookie')?.match(/(?:^|;\s*)crcc_tasting_owner=([a-f0-9]{64})(?:;|$)/)?.[1]||'';
const newToken=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('');
const nowDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function boundedBody(request,max) {
  if(Number(request.headers.get('Content-Length'))>max)fail('Fichier ou dossier trop volumineux.',413);
  const reader=request.body?.getReader();if(!reader)return new Uint8Array().buffer;
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail('Fichier ou dossier trop volumineux.',413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes.buffer;
}
async function input(request) {try{return JSON.parse(new TextDecoder().decode(await boundedBody(request,150000)));}catch(e){if(e.status)throw e;fail('Données JSON invalides.');}}
const event=(db,id,name,details='')=>db.prepare('INSERT INTO tasting_submission_events (submission_id,event,details) VALUES (?,?,?)').bind(id,name,details);
const archive=(db,row)=>db.prepare('INSERT OR IGNORE INTO tasting_submission_versions (submission_id,version,payload,review,status) VALUES (?,?,?,?,?)').bind(row.id,row.version,row.payload,row.review,row.status);
async function files(db,id){return (await db.prepare("SELECT * FROM tasting_submission_files WHERE submission_id=? AND state<>'removed' ORDER BY slot").bind(id).all()).results.sort((a,b)=>a.slot.localeCompare(b.slot,'fr',{numeric:true}));}
async function getSubmission(db,id,request,env,onlyAdmin=false) {
  if(!/^[a-f0-9-]{36}$/.test(id))fail('Dossier introuvable.',404);
  const row=await db.prepare('SELECT * FROM tasting_submissions WHERE id=?').bind(id).first();
  if(!row)fail('Dossier introuvable.',404);
  if(!admin(request,env)&&(onlyAdmin||!eq(row.owner_hash,await sha256(ownerToken(request)))))fail('Accès au dossier refusé.',403);
  return row;
}
function publicRow(row,attachments=[],events=[]) {
  const {owner_hash,client_id,...rest}=row;
  return {...rest,payload:JSON.parse(row.payload),review:row.review?JSON.parse(row.review):null,
    submitted_payload:row.submitted_payload?JSON.parse(row.submitted_payload):null,
    files:attachments.map(({s3_key,sha256,...f})=>f),events};
}
async function members(db){return (await db.prepare('SELECT id,name,grade FROM members ORDER BY name').all()).results;}
async function validatePeople(db,data) {
  const roster=await members(db);
  for(const m of data.members){
    const existing=roster.find(p=>p.id===m.id);
    if(existing)m.name=existing.name;
    else if(roster.some(p=>slug(p.name)===slug(m.name)))fail('Ce membre existe déjà : sélectionner son profil.');
  }
}
function checkFiles(data,attachments) {
  const ready=attachments.filter(f=>f.state==='uploaded');
  if(attachments.some(f=>f.state!=='uploaded'))fail('Un transfert de pièce est encore incomplet.');
  for(const m of data.members.filter(m=>m.has_sheet)) if(!ready.some(f=>f.kind==='sheet'&&f.member_id===m.id))fail(`Fiche manquante : ${m.name}.`);
  if(ready.some(f=>f.kind==='sheet'&&!data.members.some(m=>m.has_sheet&&m.id===f.member_id)))fail('Une fiche est rattachée à un participant absent : retirer cette pièce.');
  const photos=ready.filter(f=>f.kind==='photo');
  if(photos.length>10)fail('Dix photos maximum.');
  for(const photo of photos)if(!ready.some(f=>f.slot===photo.slot+'-thumb'&&f.kind==='thumbnail'))fail('Miniature photo manquante.');
  if(ready.some(f=>f.kind==='thumbnail'&&!photos.some(p=>f.slot===p.slot+'-thumb')))fail('Photo originale optimisée manquante.');
  return ready;
}
async function trigger(env) {
  if(!env.CRCC_DEGUSTATIONS_DEPLOY_HOOK)fail('La publication Pages n’est pas configurée.',503);
  const response=await fetch(env.CRCC_DEGUSTATIONS_DEPLOY_HOOK,{method:'POST'});
  if(!response.ok)fail('Le dossier est enregistré ; la publication doit être relancée.',502);
}
function assetUrl(env,key){return (env.CRCC_S3_BASE||'https://assets.cruising-rats-cigar-club.fr').replace(/\/$/,'')+'/'+key;}
async function approve(db,row,review,data,attachments,env) {
  if(!storageReady(env)||!env.CRCC_DEGUSTATIONS_DEPLOY_HOOK)fail('Stockage ou publication non configurés.',503);
  if(data.members.some(m=>!m.grade))fail('Confirmer le grade historique de chaque membre.');
  const ready=checkFiles(data,attachments),date=nowDate(),sessionId=row.session_id,marker=crypto.randomUUID();
  const session={id:sessionId,date:data.date,title:data.title,context:data.context||data.title,
    participants:data.members.map(({id,name,grade})=>({id,name,grade})),
    prospects:data.prospects.split('\n').map(s=>s.trim()).filter(Boolean).map(name=>({name})),
    cigars:[...new Set(data.members.filter(m=>m.has_sheet).map(m=>m.cigar||m.reference_exact||m.brand||'Référence non renseignée'))],
    minutes_pdf:null,sheets:[],photos:[],publication_marker:marker,
    introduction:{lead:data.context||data.title,facts:[['Date de séance',data.date],['Lieu',data.place],['Ouverture',data.start_time],['Clôture',data.end_time],['Fond sonore',data.music]].filter(([,v])=>v).map(([label,value])=>({label,value})),note:data.notes},
    cigar_summary:{title:data.title,description:review.description,sources:review.sources.map(url=>({label:new URL(url).hostname,url}))},
    source_confirmations:{submitted_via:'Formulaire membres',submission_id:row.id,verified_on:date},
  };
  const reports={};
  for(const m of data.members.filter(m=>m.has_sheet)) {
    const r=review.members[m.id],last=await db.prepare('SELECT MAX(number) AS n FROM sheets WHERE member_id=?').bind(m.id).first();
    const number=(last?.n||0)+1,id=`${m.id}-fiche-${number}`,source=ready.find(f=>f.kind==='sheet'&&f.member_id===m.id);
    const pdf=`documents/seances/${sessionId}/fiche-${m.id}-${number}.pdf`;
    await copyAsset(env,source.s3_key,pdf,'application/pdf');
    const total=r.criteria.reduce((n,c)=>n+c.score,0);
    session.sheets.push({id,member_id:m.id,number,first:number===1,title:m.sheet_title||m.cigar||data.title,
      brand:m.brand||null,cigar:m.cigar||m.reference_exact||'',module:m.module||null,origin:m.origin||null,reference_exact:m.reference_exact||null,
      duration:m.duration_minutes==null?'Non renseignée':`${m.duration_minutes} min`,duration_minutes:m.duration_minutes,
      pairing:m.pairings.join(' ; ')||'Non renseigné',pairings:m.pairings,price:m.price||'Non renseigné',pdf,report:`data/comptes-rendus/${id}.html`,published:date,revised:date,
      cigar_score:m.cigar_score,cigar_score_note:'Note personnelle déclarée dans le formulaire, sur 10.',
      aromas:m.aromas,ash_max_cm:m.ash_max_cm,technique:{draw:m.draw||null,relights:m.relights,touchups:m.touchups,cut:m.cut||null},
      strength_score:m.strength_score,richness_score:m.richness_score,length_mm:m.length_mm,ring_gauge:m.ring_gauge,humidity:m.humidity,temperature:m.temperature,storage:m.storage,stop_reason:m.stop_reason,
      criteria:r.criteria,rubric_id:'crcc-propose-2026-v1',rubric_label:'Barème proposé du Comité — 2026',evaluation_basis:r.evaluation_basis,
      minutes_contribution:r.minutes_contribution||'Aucune observation individuelle ajoutée depuis les minutes.',mention:r.mention,
      appreciation:[r.report,`Évaluation documentaire : ${total}/100. La note personnelle du cigare reste distincte.`],next_steps:r.next_steps,
      source_provenance:{form:m,reviewed_on:date,comparison:r.comparison},
    });
    reports[id]='<section><h2>Compte rendu du Comité</h2>'+r.report.split(/\n\s*\n/).map(p=>'<p>'+safe(p).replaceAll('\n','<br>')+'</p>').join('')+'<h3>Comparaison avec les références vérifiées</h3><p>'+safe(r.comparison)+'</p>'+(m.notes?'<h3>Notes complémentaires du membre</h3><p>'+safe(m.notes)+'</p>':'')+'</section>';
  }
  const minutes=ready.find(f=>f.kind==='minutes');
  if(minutes){session.minutes_pdf=`documents/seances/${sessionId}/minutes.pdf`;await copyAsset(env,minutes.s3_key,session.minutes_pdf,'application/pdf');}
  for(const f of ready.filter(f=>f.kind==='photo')) {
    const thumb=ready.find(t=>t.slot===f.slot+'-thumb'),src=`images/seances/${sessionId}/${f.id}.webp`,thumbnail=`images/seances/${sessionId}/${f.id}-640.webp`;
    await copyAsset(env,f.s3_key,src,'image/webp');await copyAsset(env,thumb.s3_key,thumbnail,'image/webp');
    session.photos.push({src:assetUrl(env,src),thumbnail:assetUrl(env,thumbnail),width:thumb.width,height:thumb.height,alt:f.alt||`Photo de la séance ${data.title}`,caption:f.caption});
  }
  session.committee_review={status:review.status,date,sheet_ids:session.sheets.map(f=>f.id),minutes_pdf:session.minutes_pdf,appreciation:review.appreciation};
  await publish(db,session,reports,[
    archive(db,row),
    db.prepare("UPDATE tasting_submissions SET status='publishing',publication_marker=?,payload=?,review=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='processing'").bind(marker,JSON.stringify(data),JSON.stringify(review),row.id),
    event(db,row.id,'approved','Dossier validé et enregistré dans les archives D1 ; attente du déploiement.'),
  ]);
}

export async function handleTasting({request,env}) {
 try {
  const url=new URL(request.url),path=url.pathname.split('/api/degustations')[1]||'/',db=env.CRCC_ARCHIVES_DB;
  // Defense in depth: the same member gate is required for the API and its pages.
  if(!eq(request.headers.get('Authorization'),env.CRCC_MEMBERS_PASSWORD?'Basic '+btoa('crcc:'+env.CRCC_MEMBERS_PASSWORD):''))return json({error:'Accès membres requis.'},401);
  if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Origine de la requête refusée.'},403);
  if(!db)return json({error:'Le registre des dégustations est en cours de configuration.'},503);
  if(path.startsWith('/admin')&&!admin(request,env))return json({error:'Accréditation du Comité requise.'},403);
  const token=ownerToken(request),owner=token?await sha256(token):'';
  if(path==='/catalog'&&request.method==='GET')return json({members:await members(db),storage_ready:storageReady(env),states:STATES,rubric:RUBRIC});
  if(path==='/mine'&&request.method==='GET')return json({submissions:owner?(await db.prepare('SELECT id,status,payload,version,feedback,session_id,created_at,updated_at FROM tasting_submissions WHERE owner_hash=? ORDER BY updated_at DESC LIMIT 50').bind(owner).all()).results.map(r=>({...r,payload:JSON.parse(r.payload)})):[]});
  if(path==='/draft'&&request.method==='POST') {
    const body=await input(request),data=cleanSubmission(body.data);await validatePeople(db,data);
    if(!/^[a-f0-9-]{36}$/.test(body.client_id||''))fail('Identifiant de dépôt invalide.');
    const value=token||newToken(),hash=await sha256(value),id=crypto.randomUUID(),sessionId=`${data.date}-${slug(data.title).slice(0,55)||'degustation'}-${id.slice(0,8)}`;
    await db.prepare('INSERT OR IGNORE INTO tasting_submissions (id,owner_hash,client_id,payload,session_id) VALUES (?,?,?,?,?)').bind(id,hash,body.client_id,JSON.stringify(data),sessionId).run();
    const row=await db.prepare('SELECT * FROM tasting_submissions WHERE owner_hash=? AND client_id=?').bind(hash,body.client_id).first();
    return json(publicRow(row,await files(db,row.id)),201,{'Set-Cookie':cookie(value)});
  }
  const fileMatch=/^\/files\/([a-f0-9-]{36})$/.exec(path);
  if(fileMatch&&request.method==='GET') {
    const file=await db.prepare("SELECT * FROM tasting_submission_files WHERE id=? AND state='uploaded'").bind(fileMatch[1]).first();
    if(!file)fail('Pièce introuvable.',404);
    await getSubmission(db,file.submission_id,request,env);
    const r=await s3(env,env.CRCC_S3_SUBMISSIONS_BUCKET,file.s3_key);
    return new Response(r.body,{headers:{'Content-Type':file.type,'Content-Disposition':`inline; filename="${file.kind==='sheet'?'fiche':file.kind==='minutes'?'minutes':'photo'}.${file.type==='application/pdf'?'pdf':'webp'}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; frame-ancestors 'self'",'X-Robots-Tag':'noindex,nofollow'}});
  }
  if(path==='/admin/list'&&request.method==='GET')return json({submissions:(await db.prepare("SELECT id,status,payload,version,feedback,session_id,created_at,updated_at,submitted_at FROM tasting_submissions WHERE status<>'draft' ORDER BY updated_at DESC LIMIT 100").all()).results.map(r=>({...r,payload:JSON.parse(r.payload)}))});
  const match=/^\/(draft|admin)\/([a-f0-9-]{36})(?:\/(files|submit|decision|approve|check|retry)(?:\/([a-f0-9-]{36}))?)?$/.exec(path);
  if(!match)fail('Route inconnue.',404);
  const [,scope,id,action,fileId]=match,row=await getSubmission(db,id,request,env,scope==='admin');
  if(!action&&request.method==='GET')return json(publicRow(row,await files(db,id),(await db.prepare('SELECT event,details,created_at FROM tasting_submission_events WHERE submission_id=? ORDER BY id').bind(id).all()).results));
  if(!action&&request.method==='PUT') {
    if(scope==='admin'?!['pending','needs_info'].includes(row.status):!EDITABLE.has(row.status))fail('Ce dossier n’est plus modifiable.',409);
    const body=await input(request),data=cleanSubmission(body.data);await validatePeople(db,data);
    const review=scope==='admin'?JSON.stringify(body.review||null):row.review;
    const [,result]=await db.batch([archive(db,row),db.prepare('UPDATE tasting_submissions SET payload=?,review=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND status=?').bind(JSON.stringify(data),review,id,body.version,row.status)]);
    if(result.meta.changes!==1)fail('Le dossier a changé. Rechargez-le avant de reprendre.',409);
    await event(db,id,scope==='admin'?'review.saved':'draft.saved','Données mises à jour ; la soumission originale reste conservée.').run();
    return json({ok:true,version:row.version+1});
  }
  if(action==='files'&&scope==='draft') {
    if(!EDITABLE.has(row.status))fail('Les pièces de ce dossier sont verrouillées.',409);
    if(!storageReady(env))fail('Le stockage S3 des soumissions est en cours de configuration.',503);
    if(request.method==='POST'&&!fileId) {
      const body=await input(request),data=JSON.parse(row.payload),kind=body.kind;
      if(!['sheet','minutes','photo','thumbnail'].includes(kind))fail('Type de pièce invalide.');
      const memberId=kind==='sheet'?text(body.member_id,'membre',100,true):null;
      if(memberId&&!data.members.some(m=>m.id===memberId&&m.has_sheet))fail('Membre de la fiche absent.');
      const slot=kind==='sheet'?`sheet-${memberId}`:kind==='minutes'?'minutes':text(body.slot,'photo',60,true);
      if((kind==='photo'&&!/^photo-(?:[1-9]|10)$/.test(slot))||(kind==='thumbnail'&&!/^photo-(?:[1-9]|10)-thumb$/.test(slot)))fail('Dix photos maximum.');
      const fid=crypto.randomUUID(),key=`soumissions-degustations/${id}/${fid}.${kind==='photo'||kind==='thumbnail'?'webp':'pdf'}`;
      if(kind==='photo'&&!text(body.alt,'description',500))fail('Décrire la photo pour les lecteurs d’écran.');
      const registered=await db.prepare("INSERT INTO tasting_submission_files (id,submission_id,kind,member_id,slot,name,s3_key,alt,caption) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM tasting_submissions WHERE id=? AND status IN ('draft','needs_info')) ON CONFLICT(submission_id,slot) DO UPDATE SET state='reserved',s3_key=excluded.s3_key,alt=excluded.alt,caption=excluded.caption,name=excluded.name WHERE EXISTS (SELECT 1 FROM tasting_submissions WHERE id=? AND status IN ('draft','needs_info'))").bind(fid,id,kind,memberId,slot,text(body.name,'nom de pièce',180,true),key,text(body.alt,'description',500),text(body.caption,'légende',1000),id,id).run();
      if(registered.meta.changes!==1)fail('Le dossier est verrouillé.',409);
      const f=await db.prepare('SELECT id FROM tasting_submission_files WHERE submission_id=? AND slot=?').bind(id,slot).first();return json({id:f.id},201);
    }
    const f=await db.prepare("SELECT * FROM tasting_submission_files WHERE submission_id=? AND id=? AND state<>'removed'").bind(id,fileId||'').first();
    if(!f)fail('Pièce introuvable.',404);
    if(request.method==='DELETE'){const removed=await db.prepare("UPDATE tasting_submission_files SET state='removed' WHERE id=? AND EXISTS (SELECT 1 FROM tasting_submissions WHERE id=? AND status IN ('draft','needs_info'))").bind(f.id,id).run();if(removed.meta.changes!==1)fail('Le dossier est verrouillé.',409);return json({ok:true});}
    if(request.method==='PUT') {
      if(f.state!=='reserved')fail('Cette pièce est déjà reçue. Réserver une nouvelle version pour la remplacer.',409);
      const bytes=await boundedBody(request,f.kind==='sheet'||f.kind==='minutes'?15*1024*1024:2500000),meta=validateUpload(bytes,f.kind);
      const hash=await sha256(bytes);
      const claim=await db.prepare("UPDATE tasting_submission_files SET state='uploading' WHERE id=? AND s3_key=? AND state='reserved' AND EXISTS (SELECT 1 FROM tasting_submissions WHERE id=? AND status IN ('draft','needs_info'))").bind(f.id,f.s3_key,id).run();
      if(claim.meta.changes!==1)fail('Un autre transfert a déjà pris en charge cette pièce.',409);
      try{await s3(env,env.CRCC_S3_SUBMISSIONS_BUCKET,f.s3_key,'PUT',bytes,{'content-type':meta.type,'x-amz-server-side-encryption':'AES256'});}
      catch(error){await db.prepare("UPDATE tasting_submission_files SET state='reserved' WHERE id=? AND s3_key=? AND state='uploading'").bind(f.id,f.s3_key).run();throw error;}
      const received=await db.prepare("UPDATE tasting_submission_files SET state='uploaded',type=?,bytes=?,width=?,height=?,sha256=? WHERE id=? AND s3_key=? AND state='uploading' AND EXISTS (SELECT 1 FROM tasting_submissions WHERE id=? AND status IN ('draft','needs_info'))").bind(meta.type,bytes.byteLength,meta.width,meta.height,hash,f.id,f.s3_key,id).run();
      if(received.meta.changes!==1)fail('Le dossier ou cette pièce a changé pendant le transfert. Recharger le dossier.',409);
      return json({ok:true,id:f.id,...meta,bytes:bytes.byteLength});
    }
  }
  if(action==='submit'&&scope==='draft'&&request.method==='POST') {
    if(!EDITABLE.has(row.status))fail('Ce dossier a déjà été transmis.',409);
    const data=cleanSubmission(JSON.parse(row.payload));checkFiles(data,await files(db,id));
    const body=await input(request);
    const [,result]=await db.batch([archive(db,row),db.prepare("UPDATE tasting_submissions SET status='pending',submitted_payload=COALESCE(submitted_payload,?),submitted_at=CURRENT_TIMESTAMP,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND status=? AND NOT EXISTS (SELECT 1 FROM tasting_submission_files WHERE submission_id=? AND state NOT IN ('uploaded','removed'))").bind(JSON.stringify(data),id,body.version,row.status,id)]);
    if(result.meta.changes!==1)fail('Le dossier a changé. Rechargez-le.',409);
    await event(db,id,'submitted','Dossier transmis au Comité.').run();return json({ok:true,status:'pending'});
  }
  if(action==='decision'&&scope==='admin'&&request.method==='POST') {
    if(!['pending','needs_info'].includes(row.status))fail('Décision indisponible pour cet état.',409);
    const body=await input(request),feedback=text(body.feedback,'motif de décision',5000,true);
    if(!['needs_info','rejected'].includes(body.status))fail('Décision invalide.');
    const result=await db.prepare('UPDATE tasting_submissions SET status=?,feedback=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND status=?').bind(body.status,feedback,id,body.version,row.status).run();
    if(result.meta.changes!==1)fail('Le dossier a changé. Rechargez-le.',409);
    await event(db,id,body.status,feedback).run();return json({ok:true,status:body.status});
  }
  if(action==='approve'&&scope==='admin'&&request.method==='POST') {
    if(row.status!=='pending')fail('Ce dossier n’attend plus de validation.',409);
    const body=await input(request),data=cleanSubmission(body.data||JSON.parse(row.payload));await validatePeople(db,data);
    const review=cleanReview(body.review,data),attached=await files(db,id);checkFiles(data,attached);
    if(attached.some(f=>f.kind==='minutes')&&data.members.filter(m=>m.has_sheet).some(m=>!review.members[m.id].minutes_contribution))fail('Préciser l’utilisation des minutes pour chaque fiche.');
    if(!storageReady(env)||!env.CRCC_DEGUSTATIONS_DEPLOY_HOOK)fail('Stockage ou publication non configurés.',503);
    const claim=await db.prepare("UPDATE tasting_submissions SET status='processing',payload=?,review=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND status='pending'").bind(JSON.stringify(data),JSON.stringify(review),id,body.version).run();
    if(claim.meta.changes!==1)fail('Validation déjà engagée ou dossier modifié.',409);
    try{await approve(db,row,review,data,attached,env);}catch(error){await db.prepare("UPDATE tasting_submissions SET status='pending' WHERE id=? AND status='processing'").bind(id).run();throw error;}
    try{await trigger(env);}catch(error){await db.prepare("UPDATE tasting_submissions SET status='publish_failed' WHERE id=? AND status='publishing'").bind(id).run();throw error;}
    return json({ok:true,status:'publishing',session_id:row.session_id},202);
  }
  if(action==='retry'&&scope==='admin'&&request.method==='POST') {
    if(row.status==='processing') {
      if(Date.now()-Date.parse(row.updated_at.replace(' ','T')+'Z')<300000)fail('La validation est encore en cours. Attendre cinq minutes avant une reprise.',409);
      const existing=await db.prepare('SELECT payload FROM sessions WHERE id=?').bind(row.session_id).first();
      if(!existing){await db.prepare("UPDATE tasting_submissions SET status='pending',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='processing'").bind(id).run();await event(db,id,'processing.recovered','Validation interrompue ; examen conservé et dossier rouvert.').run();return json({ok:true,status:'pending'});}
      const marker=JSON.parse(existing.payload).publication_marker;
      await db.prepare("UPDATE tasting_submissions SET status='publishing',publication_marker=? WHERE id=? AND status='processing'").bind(marker,id).run();
      row.status='publishing';
    }
    if(!['publishing','publish_failed'].includes(row.status))fail('Ce dossier n’a pas de publication à relancer.',409);
    await trigger(env);await db.prepare("UPDATE tasting_submissions SET status='publishing',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();return json({ok:true,status:'publishing'},202);
  }
  if(action==='check'&&scope==='admin'&&request.method==='POST') {
    if(row.status==='published')return json({status:'published',url:`/fiches-degustation/seance-${row.session_id}`});
    if(!['publishing','publish_failed'].includes(row.status))return json({status:row.status});
    const target=new URL(`/fiches-degustation/seance-${row.session_id}`,url.origin);
    const r=await fetch(target,{headers:{Authorization:request.headers.get('Authorization'),'Cache-Control':'no-cache'},redirect:'follow'});
    const html=r.ok?await r.text():'';
    if(html.includes(`name="crcc-publication" content="${row.publication_marker}"`)) {
      await db.batch([db.prepare("UPDATE tasting_submissions SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('publishing','publish_failed')").bind(id),event(db,id,'published','Déploiement vérifié : page et marqueur de publication présents.')]);
      return json({status:'published',url:target.pathname});
    }
    return json({status:row.status,message:'Données enregistrées ; la nouvelle page n’est pas encore disponible.'});
  }
  fail('Opération inconnue.',404);
 } catch(error) {
  // Never return provider errors or credentials to browsers.
  return json({error:error.status?error.message:'Le traitement du dossier a échoué. Réessayez ou contactez le Comité.'},error.status||500);
 }
}
