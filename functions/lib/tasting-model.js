export const RUBRIC = [
  ['Identification et renseignements généraux',15], ['Préparation et observations techniques',20],
  ['Description et évolution aromatiques',30], ['Cohérence et nuance du jugement',20], ['Soin et exploitation de la fiche',15],
];
export const EDITABLE = new Set(['draft','needs_info']);
export const STATES = {draft:'Brouillon',pending:'À examiner',needs_info:'Compléments demandés',rejected:'Refusée',processing:'Validation en cours',publishing:'Publication en cours',publish_failed:'Publication à relancer',published:'Publiée'};
export const slug = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fail(message,status=400) { throw Object.assign(Error(message),{status}); }
export function text(value,label,max=2000,required=false) {
  if (value == null) value='';
  if (typeof value !== 'string' || value.length>max || (required&&!value.trim())) fail(`Champ invalide : ${label}.`);
  return value.trim();
}
function number(value,label,max,integer=false) {
  if (value==='' || value==null) return null;
  if (typeof value!=='number' || !Number.isFinite(value) || value<0 || value>max || (integer&&!Number.isInteger(value))) fail(`Valeur invalide : ${label}.`);
  return value;
}
const list=(value,label)=>{
  if (value==null) return [];
  if(!Array.isArray(value)||value.length>50) fail(`Liste invalide : ${label}.`);
  return [...new Set(value.map(v=>text(v,label,180,true)))];
};
export function cleanSubmission(input) {
  if(!input || typeof input!=='object') fail('Dossier invalide.');
  const date=text(input.date,'date',10,true);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date) fail('Date de séance invalide.');
  const out={date};
  for(const [key,label,max,required] of [
    ['title','titre',180,true],['place','lieu',250],['start_time','début',5],['end_time','fin',5],
    ['context','contexte',4000],['notes','notes complémentaires',10000],['prospects','prospects',1000],['music','ambiance sonore',400],
  ]) out[key]=text(input[key],label,max,required);
  for(const k of ['start_time','end_time']) if(out[k]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out[k])) fail('Horaire invalide.');
  if(!Array.isArray(input.members)||!input.members.length||input.members.length>20) fail('Déclarer entre 1 et 20 membres.');
  const ids=new Set();
  out.members=input.members.map(m=>{
    const id=text(m.id,'identifiant membre',100,true);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||ids.has(id)) fail('Membre invalide ou en double.');
    ids.add(id);
    const person={id,name:text(m.name,'nom',120,true),grade:text(m.grade,'grade historique',100),has_sheet:m.has_sheet!==false};
    for(const key of ['brand','cigar','module','origin','reference_exact','cut','draw','storage','stop_reason','price','sheet_title']) person[key]=text(m[key],key,500);
    person.notes=text(m.notes,'notes individuelles',6000);
    for(const [key,max,int] of [['cigar_score',10],['duration_minutes',1440,true],['ash_max_cm',60],['relights',100,true],['touchups',100,true],['strength_score',10],['richness_score',10],['length_mm',1000],['ring_gauge',200],['humidity',100],['temperature',80]]) person[key]=number(m[key],key,max,int);
    person.aromas=list(m.aromas,'arômes'); person.pairings=list(m.pairings,'accompagnements');
    return person;
  });
  if(!out.members.some(m=>m.has_sheet)) fail('Au moins une fiche est nécessaire.');
  return out;
}
export function validateUpload(bytes,kind) {
  const b=new Uint8Array(bytes), ascii=(a,n)=>String.fromCharCode(...b.slice(a,a+n));
  if(kind==='sheet'||kind==='minutes') {
    if(b.length>15*1024*1024||ascii(0,5)!=='%PDF-') fail('Joindre un PDF valide de 15 Mo maximum.');
    return {type:'application/pdf',width:null,height:null};
  }
  if(!['photo','thumbnail'].includes(kind)||b.length>(kind==='thumbnail'?350000:2500000)||ascii(0,4)!=='RIFF'||ascii(8,4)!=='WEBP') fail('Photo WebP optimisée invalide.');
  const view=new DataView(bytes); let width=0,height=0;
  if(view.getUint32(4,true)+8!==b.length) fail('Photo WebP tronquée.');
  for(let p=12;p+8<=b.length;) {
    const type=ascii(p,4),size=view.getUint32(p+4,true),start=p+8;
    if(start+size>b.length) fail('Photo WebP tronquée.');
    if(['EXIF','XMP ','ANIM','ANMF'].includes(type)) fail('Transmettre une photo fixe sans métadonnées.');
    if(type==='VP8X'&&size>=10) {width=1+(b[start+4]|b[start+5]<<8|b[start+6]<<16);height=1+(b[start+7]|b[start+8]<<8|b[start+9]<<16);}
    if(type==='VP8 '&&size>=10) {if(ascii(start+3,3)!=='\x9d\x01\x2a') fail('Photo WebP invalide.');width=view.getUint16(start+6,true)&16383;height=view.getUint16(start+8,true)&16383;}
    if(type==='VP8L'&&size>=5&&b[start]===47) {const n=view.getUint32(start+1,true);width=(n&16383)+1;height=((n>>>14)&16383)+1;}
    p=start+size+(size%2);
  }
  if(!width||!height||Math.max(width,height)>(kind==='thumbnail'?640:1920)) fail('Dimensions photo invalides.');
  return {type:'image/webp',width,height};
}
export function cleanReview(input,data) {
  if(!input?.confirmed) fail('Confirmer la lecture des pièces et la vérification du cigare.');
  const out={appreciation:text(input.appreciation,'avis global',8000,true),description:text(input.description,'descriptif vérifié du cigare',4000,true),status:text(input.status,'état',100,true)};
  if(!['valide','valide-avec-reserves','a-regulariser'].includes(out.status)) fail('État du dossier invalide.');
  out.sources=list(input.sources,'sources').map(url=>{try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)throw Error();return u.href;}catch{fail('Sources : URL HTTPS attendue.');}});
  if(!out.sources.length) fail('Indiquer au moins une source de référence.');
  out.members={};
  for(const m of data.members.filter(m=>m.has_sheet)) {
    const r=input.members?.[m.id]; if(!r) fail(`Évaluation manquante : ${m.name}.`);
    const v={};
    for(const key of ['report','mention','comparison','minutes_contribution','evaluation_basis']) v[key]=text(r[key],key,12000,key!=='minutes_contribution');
    if(!Array.isArray(r.criteria)||r.criteria.length!==RUBRIC.length) fail('Barème incomplet.');
    v.criteria=RUBRIC.map(([label,max],i)=>{
      const score=number(r.criteria[i].score,label,max,true);
      if(score===null) fail(`Note manquante : ${label}.`);
      return {label,max,score,comment:text(r.criteria[i].comment,'justification du critère',1500,true)};
    });
    v.next_steps=list(r.next_steps,'axes de progression');
    out.members[m.id]=v;
  }
  return out;
}
