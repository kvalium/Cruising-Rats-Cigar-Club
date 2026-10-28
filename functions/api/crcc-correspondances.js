/* CRCC — Bureau des correspondances v3: D1 + Resend.
 * Private read and write API, separate administrative secret.
 * Messages are never sent unless the admin secret and Resend are configured.
 */
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
const safe=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validEmail=s=>typeof s==="string"&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const fields=["recipient","recipient_name","template_id","subject","body","observation","reference"];
function clean(input){const x={};for(const f of fields){if(typeof input[f]!=="string"||input[f].length>15000)throw Error("Champ invalide : "+f);x[f]=input[f].trim();}if(!validEmail(x.recipient)||!x.subject||!x.body||!x.template_id)throw Error("Destinataire, sujet ou contenu invalide");return x;}
function authorized(req,env){const actual=req.headers.get("Authorization")||"";const expected=env.CRCC_MAIL_ADMIN_PASSWORD?"Basic "+btoa("comite:"+env.CRCC_MAIL_ADMIN_PASSWORD):"";if(!expected||actual.length!==expected.length)return false;let bad=0;for(let i=0;i<actual.length;i++)bad|=actual.charCodeAt(i)^expected.charCodeAt(i);return bad===0;}
function htmlMail(m){const paragraphs=(m.body||"").split(/\n\s*\n/).filter(Boolean).map(x=>"<p>"+safe(x).replace(/\n/g,"<br>")+"</p>").join("");return '<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:22px;background:#e9e5dc;color:#292722;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" style="max-width:620px;width:100%;background:#fffefa;border:1px solid #bfb8a8" cellpadding="0" cellspacing="0"><tr><td style="padding:26px 32px;background:#292722;color:white"><span style="font-size:11px;letter-spacing:2px">CRUISING RATS CIGAR CLUB — NOTIFICATION OFFICIELLE</span><h1 style="font:normal 27px Georgia,serif;color:#fff">'+safe(m.subject)+'</h1></td></tr><tr><td style="padding:28px 32px;font-size:14px;line-height:23px"><p style="font-family:Georgia,serif;font-size:17px">Cher '+safe(m.recipient_name||"membre")+',</p>'+paragraphs+(m.observation?'<table role="presentation" width="100%" style="border-collapse:collapse;margin:24px 0;background:#eeebe3;border:1px solid #c9c1b4"><tr><td style="background:#292722;color:white;font-size:12px;font-weight:bold;letter-spacing:1px;padding:12px">OBSERVATION DU COMITÉ EXÉCUTIF</td></tr><tr><td style="padding:20px;white-space:pre-wrap">'+safe(m.observation)+'</td></tr></table>':'')+(m.reference?'<p style="font-size:12px;color:#756e63">Référence du dossier : '+safe(m.reference)+'</p>':'')+'<p style="margin-top:26px">Pour le Comité exécutif,<br><strong>Le Président</strong></p><p style="padding-top:15px;border-top:1px solid #d0c8bc;text-align:center;font:italic 16px Georgia,serif">« On pipe rien, mais on a des fiches. »</p></td></tr></table></td></tr></table></body></html>';}

function memberProfileUrl(m){
 const name=String(m.recipient_name||"").trim();
 if(!name)throw Error("Nom du membre requis pour le lien du dossier personnel");
 const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 const id=slug==="m-crevette"?"m-crevette":slug;
 if(!id)throw Error("Identifiant de membre indisponible");
 return "https://cruising-rats-cigar-club.fr/fiches-degustation/membre-"+id+".html";
}
function personalizeOriginal(t,m){
 let h=t.original_html;
 if(!h)throw Error("Modèle HTML manquant");
 if(m.template_id==="ratDePassage" && h.includes("{{MEMBER_PROFILE_URL}}"))h=h.replaceAll("{{MEMBER_PROFILE_URL}}",safe(memberProfileUrl(m)));
 h=h.replace(/Cher\s+(?:Candidat|Membre)\s*,/i,"Cher "+safe(m.recipient_name||"membre")+",");
 if(m.template_id==="candidature" && m.observation.trim()){
   const marker=h.indexOf("PROPOSITION DU COMITÉ EXÉCUTIF");
   const start=h.indexOf("<div",marker+30),gt=h.indexOf(">",start),end=h.indexOf("</div>",gt);
   if(marker<0||start<0||gt<0||end<0)throw Error("Bloc de proposition introuvable");
   h=h.slice(0,gt+1)+"\n"+safe(m.observation).replace(/\n/g,"<br>")+"\n"+h.slice(end);
 }
 const grade=m.template_id==="ratDePassage"||m.template_id==="ratHomologue";
 if(grade){
   if(!m.observation.trim())throw Error("Observation obligatoire pour une notification de grade");
   const note=safe(m.observation).replace(/\n/g,"<br>");
   if(m.template_id==="ratDePassage"){
      const title=h.indexOf("OBSERVATION DU COMITÉ EXÉCUTIF"),a=h.indexOf("<span style=",title),first=h.indexOf(">",a),end=h.indexOf("</span>",first);
      if(title<0||a<0||first<0||end<0)throw Error("Bloc d'observation du Rat de Passage non retrouvé");
      h=h.slice(0,first+1)+note+h.slice(end);
   }else{
      const box='<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;background:#eeebe3;border:1px solid #c9c1b4"><tr><td style="padding:12px;background:#292722;color:#fff;text-align:center;font:12px Arial;letter-spacing:1px">OBSERVATION DU COMITÉ EXÉCUTIF</td></tr><tr><td style="padding:20px;font:14px/23px Arial;color:#4b4740">'+note+'</td></tr></table>';
      const marker=h.indexOf("DÉFINITION DU GRADE"),position=h.lastIndexOf("<div",marker);
      if(marker<0||position<0)throw Error("Position de l'observation d'homologation non retrouvée");
      h=h.slice(0,position)+box+h.slice(position);
   }
 }
 if(m.template_id==="communication"){
 let content=safe(m.body);
 content=content.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,'<a style="color:#743c36" href="$2">$1</a>');
 content=content.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*\n]+)\*/g,"<em>$1</em>");
 content=content.split(/\n\s*\n/).map(p=>p.startsWith("## ")?'<h2 style="font:normal 22px Georgia,serif">'+p.slice(3)+'</h2>':"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("");
 if(!h.includes("{{CONTENU_COMMUNICATION}}"))throw Error("Corps de communication introuvable");
 h=h.replace("{{CONTENU_COMMUNICATION}}",content);
}
 if(m.reference){const at=h.toLowerCase().lastIndexOf("</td>");if(at>0)h=h.slice(0,at)+"<p>Réf. : "+safe(m.reference)+"</p>"+h.slice(at);}
 return h;
}
async function handle(req,env){
 if(!env.CRCC_MAIL_ADMIN_PASSWORD)return json({error:"Accréditation administrateur non configurée dans Cloudflare."},503);
 if(!authorized(req,env))return json({error:"Accès réservé au Comité exécutif."},401);
 if(!env.CRCC_MAIL_DB)return json({error:"Base de données D1 indisponible."},503);
 const db=env.CRCC_MAIL_DB,url=new URL(req.url),op=url.searchParams.get("op")||"init";
 try{
  if(req.method==="GET"){
   if(op==="init"){const [ts,ms]=await Promise.all([db.prepare("SELECT * FROM mail_templates ORDER BY rowid").all(),db.prepare("SELECT id,recipient,recipient_name,template_id,subject,status,created_at,updated_at,sent_at,provider_id,reply_received_at FROM mail_messages ORDER BY created_at DESC LIMIT 100").all()]);const contacts=await db.prepare("SELECT id,name,email FROM mail_members WHERE active=1 ORDER BY name").all();return json({templates:ts.results.map(({original_html,...t})=>({...t,has_original:!!original_html})),messages:ms.results,members:contacts.results,send_ready:Boolean(env.RESEND_API_KEY&&env.CRCC_MAIL_FROM)});}
   if(op==="original"){const t=await db.prepare("SELECT original_html FROM mail_templates WHERE id=?").bind(url.searchParams.get("id")||"").first();return t?.original_html?json({html:t.original_html}):json({error:"Modèle historique introuvable"},404);}
   if(op==="due"){const q=await db.prepare("SELECT id,recipient,recipient_name,subject,sent_at FROM mail_messages WHERE template_id='candidature' AND sent_at <= datetime('now','-7 days') AND reply_received_at IS NULL AND status IN ('sent','delivered') AND NOT EXISTS (SELECT 1 FROM mail_messages b WHERE b.recipient=mail_messages.recipient AND b.template_id='candidature_relance' AND b.created_at>=mail_messages.sent_at AND b.status IN ('sent','delivered','sending'))").all();return json({due:q.results});}
   if(op==="message"){const item=await db.prepare("SELECT * FROM mail_messages WHERE id=?").bind(url.searchParams.get("id")||"").first();return item?json({message:item}):json({error:"Courrier introuvable"},404);}
   if(op==="events"){const events=await db.prepare("SELECT * FROM mail_events WHERE message_id=? ORDER BY id DESC LIMIT 50").bind(url.searchParams.get("id")||"").all();return json({events:events.results});}
   if(op==="status"){if(!env.RESEND_API_KEY)return json({error:"Resend non configuré"},503);const id=url.searchParams.get("id")||"";const item=await db.prepare("SELECT * FROM mail_messages WHERE id=?").bind(id).first();if(!item||!item.provider_id)return json({error:"Courrier sans identifiant Resend"},404);const r=await fetch("https://api.resend.com/emails/"+encodeURIComponent(item.provider_id),{headers:{"Authorization":"Bearer "+env.RESEND_API_KEY}});if(!r.ok)return json({error:"Statut Resend indisponible"},502);const response=await r.json(),last=response.last_event||"sent";const status=last==="delivered"?"delivered":last==="bounced"?"bounced":last==="failed"?"failed":"sent";if(item.status!==status){await db.prepare("UPDATE mail_messages SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,id).run();await db.prepare("INSERT INTO mail_events (message_id,event_type,details) VALUES (?,?,?)").bind(id,"resend."+last,"Statut récupéré depuis Resend").run();}return json({status,last_event:last});}
   return json({error:"Opération inconnue"},404);
  }
  if(req.method!=="POST")return json({error:"Méthode non autorisée"},405);
  const input=await req.json();
  if(op==="preview"){const previewInput={...input,recipient:input.recipient||"apercu@example.fr",body:input.body||"Aperçu"};const m=clean(previewInput);const t=await db.prepare("SELECT original_html,observation FROM mail_templates WHERE id=?").bind(m.template_id).first();if(!t?.original_html)return json({error:"Modèle historique introuvable"},404);if(!m.observation&&["ratDePassage","ratHomologue"].includes(m.template_id))m.observation=t.observation||"Observation du Comité à rédiger avant envoi.";return json({html:personalizeOriginal(t,m)});}
  if(op==="mark-replied"){const id=String(input.id||"");const q=await db.prepare("UPDATE mail_messages SET reply_received_at=CURRENT_TIMESTAMP WHERE id=? AND template_id='candidature'").bind(id).run();return json({ok:q.meta.changes>0});}
  if(op==="save"){const m=clean(input);const template=await db.prepare("SELECT id FROM mail_templates WHERE id=?").bind(m.template_id).first();if(!template)return json({error:"Modèle inconnu"},400);const id=(typeof input.id==="string"&&input.id)?input.id:crypto.randomUUID();const existing=await db.prepare("SELECT status FROM mail_messages WHERE id=?").bind(id).first();if(existing&&existing.status!=="draft")return json({error:"Un courrier expédié ne peut pas être modifié"},409);
  if(existing){await db.prepare("UPDATE mail_messages SET recipient=?,recipient_name=?,template_id=?,subject=?,body=?,observation=?,reference=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(m.recipient,m.recipient_name,m.template_id,m.subject,m.body,m.observation,m.reference,id).run();}
  else{await db.prepare("INSERT INTO mail_messages (id,recipient,recipient_name,template_id,subject,body,observation,reference) VALUES (?,?,?,?,?,?,?,?)").bind(id,m.recipient,m.recipient_name,m.template_id,m.subject,m.body,m.observation,m.reference).run();}
  await db.prepare("INSERT INTO mail_events (message_id,event_type,details) VALUES (?,?,?)").bind(id,"draft.saved","Brouillon enregistré").run();return json({ok:true,id});}
  if(op==="template"){
   const id=String(input.id||""),label=String(input.label||""),subject=String(input.subject||""),html=String(input.original_html||"");
   if(!id||!label.trim()||!subject.trim()||html.length<100||html.length>150000||!/<html\b/i.test(html)||!/<\/html>/i.test(html)||/<script\b/i.test(html))return json({error:"Modèle HTML invalide. Un document HTML complet sans script est requis."},400);
   let observation=null;if(id==="candidature"){const start=html.indexOf("PROPOSITION DU COMITÉ EXÉCUTIF"),d=html.indexOf("<div",start+30),gt=html.indexOf(">",d),end=html.indexOf("</div>",gt);if(start<0||d<0||gt<0||end<0)return json({error:"Bloc de proposition introuvable dans le modèle."},400);observation=html.slice(gt+1,end).replace(/<br\s*\/?\s*>/gi,"\n").replace(/<[^>]*>/g,"").trim();}const result=await db.prepare("UPDATE mail_templates SET label=?,subject=?,original_html=?,observation=COALESCE(?,observation),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(label,subject,html,observation,id).run();
   return result.meta.changes?json({ok:true}):json({error:"Modèle inconnu"},404);
  }
  if(op==="delete"){
   const id=String(input.id||"");const found=await db.prepare("SELECT status FROM mail_messages WHERE id=?").bind(id).first();
   if(!found)return json({error:"Courrier introuvable."},404);
   await db.batch([db.prepare("DELETE FROM mail_events WHERE message_id=?").bind(id),db.prepare("DELETE FROM mail_messages WHERE id=?").bind(id)]);
   return json({ok:true,was_sent:found.status!=="draft"});
  }
  if(op==="send"){if(!env.RESEND_API_KEY||!env.CRCC_MAIL_FROM)return json({error:"Resend non configuré : aucun message envoyé."},503);const id=String(input.id||"");const pre=await db.prepare("SELECT * FROM mail_messages WHERE id=? AND status='draft'").bind(id).first();if(!pre)return json({error:"Courrier introuvable ou déjà envoyé."},409);const t0=await db.prepare("SELECT original_html FROM mail_templates WHERE id=?").bind(pre.template_id).first();if(!t0?.original_html)return json({error:"Modèle indisponible"},503);let finalHTML;try{finalHTML=personalizeOriginal(t0,pre)}catch(e){return json({error:e.message},400)}const claim=await db.prepare("UPDATE mail_messages SET status='sending',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'").bind(id).run();if(claim.meta.changes!==1)return json({error:"Envoi non autorisé : ce brouillon n'est plus disponible."},409);const m=await db.prepare("SELECT * FROM mail_messages WHERE id=?").bind(id).first();const template=await db.prepare("SELECT original_html FROM mail_templates WHERE id=?").bind(m.template_id).first();if(!template?.original_html)return json({error:"Modèle HTML original introuvable. Aucun envoi effectué."},503);const payload={from:env.CRCC_MAIL_FROM,to:[m.recipient],subject:m.subject,html:finalHTML,text:"Cher "+(m.recipient_name||"membre")+",\n\n"+m.body+"\n\n"+(m.observation||"")+"\n\nPour le Comité exécutif — Le Président",headers:{"X-Entity-Ref-ID":id}};if(env.CRCC_MAIL_REPLY_TO)payload.reply_to=env.CRCC_MAIL_REPLY_TO;
  let result;try{result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"crcc-"+id},body:JSON.stringify(payload)})}catch(err){return json({error:"Réponse Resend incertaine : vérifier Resend avant de réessayer.",id},502)}
  if(!result.ok){const reason=(await result.text()).slice(0,400);await db.prepare("UPDATE mail_messages SET status='draft',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='sending'").bind(id).run();await db.prepare("INSERT INTO mail_events (message_id,event_type,details) VALUES (?,?,?)").bind(id,"resend.rejected",reason).run();return json({error:"Resend a refusé l'envoi : "+reason},502)}
  const accepted=await result.json();await db.prepare("UPDATE mail_messages SET status='sent',provider_id=?,sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(accepted.id||null,id).run();await db.prepare("INSERT INTO mail_events (message_id,event_type,details) VALUES (?,?,?)").bind(id,"email.sent",accepted.id||"Accepté par Resend").run();return json({ok:true,id,provider_id:accepted.id||null});}
  return json({error:"Opération inconnue"},404);
 }catch(e){return json({error:e&&e.message?e.message:"Erreur du Bureau des correspondances"},500)}
}
export const onRequestGet=({request,env})=>handle(request,env);
export const onRequestPost=({request,env})=>handle(request,env);
