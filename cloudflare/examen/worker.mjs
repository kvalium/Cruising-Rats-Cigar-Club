
const QUESTIONS = [{"no":1,"text":"De quoi est principalement constitué un cigare traditionnel ?","options":["De feuilles de tabac","De papier et de tabac haché uniquement","De feuilles de vigne séchées","D’un petit rouleau de moquette tropicale"],"correct":0},{"no":2,"text":"Quelle partie du cigare allume-t-on ?","options":["La tête","Le pied","La bague","Le côté qui semble le plus motivé"],"correct":1},{"no":3,"text":"Qu’appelle-t-on la cape ?","options":["La feuille extérieure visible du cigare","Le tabac situé au centre","Une protection que l’on retire avant de fumer","Le manteau réglementaire du torcedor"],"correct":0},{"no":4,"text":"Pourquoi coupe-t-on la tête d’un cigare avant de le fumer ?","options":["Pour permettre le passage de l’air et de la fumée","Pour faire sortir l’humidité","Pour vérifier s’il contient bien du tabac","Pour lui montrer qui commande"],"correct":0},{"no":5,"text":"Que désigne principalement le tirage ?","options":["La longueur du cigare","La facilité avec laquelle l’air traverse le cigare","Sa puissance en nicotine","L’élection annuelle du Président du cigare"],"correct":1},{"no":6,"text":"Dans la construction classique d’un cigare, quelles sont les trois grandes parties ?","options":["Cape, sous-cape et tripe","Tête, corps et filtre","Cape, bouchon et foyer","Devant, derrière et milieu"],"correct":0},{"no":7,"text":"Qu’est-ce qu’un cigare tripa larga ?","options":["Un cigare dont la tripe est constituée de longues feuilles de tabac","Un cigare particulièrement long","Un cigare roulé uniquement à Cuba","Un cigare livré avec une rallonge"],"correct":0},{"no":8,"text":"Le « cepo » d’un cigare correspond à :","options":["Son diamètre","Son poids après fumage","Son taux d’humidité","Son tour de taille après Noël"],"correct":0},{"no":9,"text":"Un cepo de 50 représente approximativement :","options":["50 mm","50/64 de pouce","50 % de tabac","Cinquante feuilles exactement, sous contrôle d’huissier"],"correct":1},{"no":10,"text":"Qu’est-ce que la rétro-olfaction lors d’une dégustation ?","options":["Faire passer une partie de la fumée par le nez","Sentir le cigare avant de l’allumer","Inhaler profondément la fumée dans les poumons","Renifler discrètement le cigare de son voisin"],"correct":0},{"no":11,"text":"Dans une plante de tabac, les feuilles dites ligero proviennent généralement :","options":["Du sommet de la plante","Du bas de la plante","Des racines","D’un tiroir spécial marqué « LIGERO »"],"correct":0},{"no":12,"text":"Quelle caractéristique associe-t-on généralement au ligero ?","options":["Plus de puissance et une combustion relativement lente","Une feuille très légère et très douce","Une feuille exclusivement destinée à la cape","Une tendance naturelle à demander un digestif"],"correct":0},{"no":13,"text":"Quelle affirmation décrit correctement la fermentation du tabac ?","options":["C’est une transformation contrôlée des feuilles après récolte","C’est uniquement une longue période de séchage au soleil","C’est le moment où l’on ajoute les arômes artificiels","C’est lorsque les feuilles commencent à avoir des opinions"],"correct":0},{"no":14,"text":"Quelle différence existe entre une vitola de galera et une vitola de salida dans la terminologie cubaine ?","options":["La première décrit le format de fabrication, la seconde le nom commercial","La première désigne la cape, la seconde la tripe","Elles désignent exactement la même chose dans tous les cas","L’une sort de l’usine, l’autre prend les transports en commun"],"correct":0},{"no":15,"text":"Un cigare brûle en biais pendant plusieurs minutes. Quelle conclusion est la plus rigoureuse ?","options":["Il est nécessairement mal roulé","Il faut observer avant de conclure : humidité, allumage, vent ou construction peuvent intervenir","Il est forcément trop sec","Il cherche probablement à quitter le cendrier"],"correct":1},{"no":16,"text":"Selon les archives historiques du CRCC, qui est à l’origine de la première fiche de dégustation ?","options":["Cigarolo, qui souhaitait mesurer scientifiquement la longueur des cendres.","Pipa, afin de tenir un registre des consommations de chaque membre.","Julien, qui exigea que la grandeur du Club puisse se retrouver dans un classeur.","Un contrôleur fiscal qui ne comprenait pas pourquoi quatre personnes fumaient sans justificatif."],"correct":2},{"no":17,"text":"Selon la chronique officielle — quoique légèrement apocryphe — dans quelles circonstances le CRCC aurait-il vu le jour ?","options":["À l’automne 1927, dans un salon privé de Gironde, après une dégustation devenue assemblée.","En 1959 à La Havane, lors d’une réunion de producteurs de tabac.","En 1932 à Bordeaux, à la suite d’un désaccord entre deux négociants en cigares.","En 1487, lorsque Cigarolo fut expulsé d’un monastère pour avoir fumé pendant les vêpres."],"correct":0},{"no":18,"text":"Un membre perd une fiche officielle déjà complétée. Quelle procédure est prévue par le règlement ?","options":["La dégustation est annulée et définitivement retirée des archives.","Le membre peut reconstituer sa fiche à partir de ses souvenirs et des données disponibles, en signalant cette reconstitution.","Le membre doit demander à un autre Rat de lui céder l’une de ses fiches.","Une commission se rend au domicile du membre pour interroger les cendres restantes."],"correct":1},{"no":19,"text":"Quelle affirmation concernant le Coupe-Cigare du Président est conforme au règlement ?","options":["Il devient la propriété du membre après trois utilisations consécutives.","Son emprunt est libre dès lors que le membre possède le grade de Rat Homologué.","Il peut être prêté avec l’autorisation expresse du Président, mais doit lui être restitué.","Il ne peut être touché qu’avec des gants blancs, une procuration notariée et une pince de 30 centimètres."],"correct":2},{"no":20,"text":"De quelle couleur sont les yeux de Pipa ?","options":["Bleus, comme les eaux des Caraïbes.","Verts, comme les plantations de tabac cubaines.","Noisette, avec de subtils reflets ambrés.","Personne ne le sait. Aucun membre du Comité n’a encore réussi à regarder aussi haut."],"correct":3},{"no":21,"text":"Dans « La Grande Homologation », quelle condition permet à un membre CRCC de prétendre à un siège au Comité, conformément à l’article 11 du règlement du guichet ?","options":["Être Rat Homologué et obtenir au moins 80 points lors d’une dégustation.","Présenter une carte de membre valide et disposer de huit fiches archivées.","Posséder trois fiches validées et bénéficier du parrainage du Président.","Justifier de cinq années d’ancienneté et présenter un hamster empaillé en garantie."],"correct":1},{"no":22,"text":"Pourquoi le règlement recommande-t-il de ne pas confier la clé de la cave à Monsieur Sanson ?","options":["Parce qu’il a déjà perdu le Coupe-Cigare du Président.","Parce qu’il est officiellement responsable des dégustations clandestines du HRPC.","Parce qu’il a été condamné à ne jamais approcher un humidor.","Parce que le Comité émet de sérieux doutes sur sa capacité à gérer un stock, la comptabilité ou à savoir depuis combien de temps il se trouve dans l’établissement."],"correct":3},{"no":23,"text":"Quel type de coupe-cigare figure sur le logo officiel du CRCC ?","options":["Un coupe-cigare à emporte-pièce (punch).","Un coupe-cigare à double lame, de type guillotine.","Un coupe-cigare à encoche en V.","Un sécateur miniature, prévu pour les modules particulièrement récalcitrants."],"correct":1},{"no":24,"text":"Dans « La Grande Homologation », que permet un raid réussi contre le Hamster Riding Pipe Club lorsque celui-ci a saboté le bureau ?","options":["D’annuler toutes les erreurs commises pendant la journée.","De confisquer les pipes du HRPC et de les revendre au profit du Comité.","De rétablir l’accès au règlement et d’empêcher de nouvelles interventions du HRPC pendant la partie.","De transformer temporairement les hamsters en cendriers réglementaires."],"correct":2},{"no":25,"text":"Lorsqu’un membre affirme sentir « une vieille malle en cuir », le CRCC attend surtout :","options":["Qu’il soit capable d’expliquer ce qu’il entend par là.","Qu’il fournisse la marque et, si possible, le modèle exact de la malle.","Que les autres membres confirment avoir senti la même chose.","Qu’un maroquinier assermenté soit convoqué pour une expertise contradictoire."],"correct":1},{"no":26,"text":"Que prévoit le règlement officiel concernant les archives sonores du CRCC, dont fait partie son répertoire musical ?","options":["Elles sont facultatives et réservées aux séances accompagnées de spiritueux.","Elles doivent être écoutées uniquement par les membres du Comité.","Elles peuvent remplacer les fiches de dégustation lorsqu’une chanson décrit correctement les arômes.","Leur écoute est obligatoire pour les membres du Club."],"correct":3},{"no":27,"text":"Qui est Cousin Wursty ?","options":["Un membre du Hamster Riding Pipe Club infiltré à l’Oktoberfest.","Le cousin bavarois de Cigarolo, qui se trouve être une saucisse.","Un fabricant allemand de cigares spécialisé dans les modules courts.","Le résultat d’une relation administrativement contestable entre un rat et une knack."],"correct":1},{"no":28,"text":"Pourquoi le CRCC a-t-il jugé nécessaire de consacrer une chanson entière au « Protocole du Cigare » ?","options":["Parce qu’un règlement intérieur classique n’était pas suffisamment pénible.","Parce qu’au CRCC, même le plaisir de fumer mérite une procédure solennelle.","Parce que le Comité souhaite remplacer les fiches de dégustation par des partitions musicales.","Parce que le Président avait commandé un hymne national et que le budget ne permettait que trois minutes de musique."],"correct":1},{"no":29,"text":"Dans « Cigare sous surveillance », quel avertissement particulièrement inquiétant est formulé au sujet de la cendre ?","options":["Une cendre trop longue peut entraîner la suspension immédiate du membre.","La cendre pourrait se mettre à poursuivre celui qui la poursuit.","Une cendre tombée sans autorisation devient automatiquement propriété du Président.","La cendre conserve les empreintes digitales et peut témoigner devant le Comité."],"correct":1},{"no":30,"text":"Parmi ces propositions, laquelle contient deux titres authentiques des Aventures de Cigarolo ?","options":["« Le Dernier Habano » et « La Cendre interdite ».","« Le Mystère du Coupe-Cigare » et « Les Hamsters de minuit ».","« Un membre de trop » et « Un nez très fin ».","« Cigarolo contre les forces du mal » et « Le Retour de la saucisse radioactive »."],"correct":2}];
const DURATION = 1200; // 20 minutes, applied to newly started attempts only.
const TEST_PREFIX = 'crcc-test-';
// An isolated test has no matching roster member and must never trigger an homologation.
function isTestInvite(invite){return String(invite?.member_id||'').startsWith(TEST_PREFIX);}
const jsonHeaders = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function response(body,status=200,extra={}) {return new Response(JSON.stringify(body),{status,headers:{...jsonHeaders,...extra}});}
function error(message,status=400){return response({error:message},status);}
function now(){return Math.floor(Date.now()/1000);}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
function randomCode(){const a=new Uint8Array(32);crypto.getRandomValues(a);return hex(a);}
async function digest(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));}
function equals(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
function rotation(id,no){let x=2166136261;for(const c of id+':'+no){x=Math.imul(x^c.charCodeAt(0),16777619);}return (x>>>0)%4;}
async function input(request){if(!request.headers.get('content-type')?.includes('application/json'))throw new Error('JSON requis');const text=await request.text();if(text.length>4096)throw new Error('Requête trop volumineuse');return JSON.parse(text);}
async function session(request,env){const v=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)crcc_exam=([a-f0-9]{64})(?:;|$)/);if(!v)return null;const hash=await digest(v[1]);return env.EXAMS_DB.prepare('SELECT * FROM exam_invites WHERE session_hash=?').bind(hash).first();}
async function finalize(invite,env,manual=false){
  if(!invite?.started_at||invite.revoked_at||invite.score_cigare!==null)return;
  if(!invite.finished_at&&(!manual&&invite.deadline_at>now()))return;
  if(!invite.finished_at){
    await env.EXAMS_DB.prepare("UPDATE exam_invites SET finished_at=unixepoch(),finish_reason=CASE WHEN deadline_at<=unixepoch() THEN 'timeout' ELSE 'manual' END WHERE id=? AND finished_at IS NULL AND started_at IS NOT NULL").bind(invite.id).run();
  }
  const answers=await env.EXAMS_DB.prepare('SELECT question_no,choice FROM exam_answers WHERE invite_id=?').bind(invite.id).all();
  const map=new Map(answers.results.map(a=>[a.question_no,a.choice]));
  const first=QUESTIONS.slice(0,15).filter(q=>map.get(q.no)===q.correct).length;
  const second=QUESTIONS.slice(15).filter(q=>map.get(q.no)===q.correct).length;
  await env.EXAMS_DB.prepare('UPDATE exam_invites SET score_cigare=?,score_club=? WHERE id=? AND finished_at IS NOT NULL AND score_cigare IS NULL').bind(first,second,invite.id).run();
}
async function state(request,env){
  let invite=await session(request,env);
  if(!invite)return error('Session absente. Présentez votre code personnel.',401);
  if(invite.started_at&&(invite.finished_at||invite.deadline_at<=now())){await finalize(invite,env);invite=await session(request,env);}
  const answers=await env.EXAMS_DB.prepare('SELECT question_no,choice FROM exam_answers WHERE invite_id=?').bind(invite.id).all();
  const selected={};
  for(const a of answers.results){selected[a.question_no]=(a.choice-rotation(invite.id,a.question_no)+4)%4;}
  const phase=invite.revoked_at?'revoque':invite.finished_at?'termine':invite.started_at?'en_cours':'pret';
  const result={phase,name:invite.member_name,memberId:invite.member_id,startedAt:invite.started_at,deadlineAt:invite.deadline_at,serverNow:now(),selected,answered:answers.results.length};
  if(phase==='en_cours'){
    result.questions=QUESTIONS.map(q=>{const r=rotation(invite.id,q.no);return {no:q.no,text:q.text,options:q.options.map((_,i)=>q.options[(i+r)%4])};});
  }
  if(phase==='termine')result.reason=invite.finish_reason;
  return response(result);
}
async function redeem(request,env){
  const data=await input(request);
  const code=String(data.code||'').trim().toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(code))return error('Code d’invitation invalide.',403);
  const token=randomCode(), hash=await digest(token), codeHash=await digest(code);
  const res=await env.EXAMS_DB.prepare('UPDATE exam_invites SET session_hash=?,claimed_at=unixepoch() WHERE code_hash=? AND session_hash IS NULL AND revoked_at IS NULL RETURNING id').bind(hash,codeHash).first();
  if(!res)return error('Code inconnu, révoqué ou déjà utilisé. Contactez le Comité.',403);
  return response({ok:true},200, {'Set-Cookie':'crcc_exam='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/examen; Max-Age=604800'});
}
async function start(request,env){
  const invite=await session(request,env);
  if(!invite||invite.revoked_at)return error('Invitation indisponible.',403);
  await env.EXAMS_DB.prepare('UPDATE exam_invites SET started_at=unixepoch(),deadline_at=unixepoch()+? WHERE id=? AND started_at IS NULL AND revoked_at IS NULL').bind(DURATION,invite.id).run();
  const latest=await session(request,env);
  if(latest.started_at===null)return error('Impossible de démarrer.',409);
  return response({ok:true,serverNow:now(),deadlineAt:latest.deadline_at});
}
async function answer(request,env){
  const invite=await session(request,env);
  if(!invite||invite.revoked_at)return error('Session non autorisée.',403);
  const data=await input(request);const no=Number(data.no), choice=Number(data.choice);
  if(!Number.isInteger(no)||no<1||no>30||!Number.isInteger(choice)||choice<0||choice>3)return error('Réponse invalide.');
  const original=(choice+rotation(invite.id,no))%4;
  const sql='INSERT INTO exam_answers(invite_id,question_no,choice,updated_at) SELECT id,?,?,unixepoch() FROM exam_invites WHERE id=? AND started_at IS NOT NULL AND deadline_at>unixepoch() AND finished_at IS NULL AND revoked_at IS NULL ON CONFLICT(invite_id,question_no) DO UPDATE SET choice=excluded.choice,updated_at=unixepoch() WHERE EXISTS(SELECT 1 FROM exam_invites WHERE id=excluded.invite_id AND deadline_at>unixepoch() AND finished_at IS NULL AND revoked_at IS NULL)';
  const result=await env.EXAMS_DB.prepare(sql).bind(no,original,invite.id).run();
  if(!result.meta?.changes)return error('Temps écoulé : réponse non enregistrée.',409);
  return response({ok:true,serverNow:now()});
}
async function submit(request,env){
  let invite=await session(request,env);
  if(!invite||invite.revoked_at)return error('Session non autorisée.',403);
  if(!invite.started_at)return error('L’épreuve n’a pas commencé.',409);
  await finalize(invite,env,true);
  return response({ok:true});
}
function admin(request,env){const raw=request.headers.get('Authorization')||'';const expected=env.CRCC_EXAM_ADMIN_PASSWORD;return !!expected&&equals(raw,'Bearer '+expected);}
async function adminMembers(env){
  const x=await env.ARCHIVES_DB.prepare("SELECT m.id,m.name,m.grade,(SELECT COUNT(*) FROM sheets s WHERE s.member_id=m.id) AS fiches FROM members m ORDER BY m.name").all();
  return response({members:x.results.map(m=>({id:m.id,name:m.name,grade:m.grade,fiches:m.fiches,eligible:(m.grade||'').toLowerCase()==='rat de passage'&&m.fiches>=3}))});
}
// The table is initialized lazily for existing D1 databases on first authenticated use.
async function ensureOpinionStore(env){
  await env.EXAMS_DB.prepare("CREATE TABLE IF NOT EXISTS exam_opinions (invite_id TEXT PRIMARY KEY REFERENCES exam_invites(id) ON DELETE CASCADE, opinion TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT (unixepoch()))").run();
}
async function adminResponses(request,env){
  const id=new URL(request.url).searchParams.get('id')||'';
  if(!/^[a-f0-9-]{36}$/.test(id))return error('Identifiant de convocation invalide.');
  const invite=await env.EXAMS_DB.prepare('SELECT * FROM exam_invites WHERE id=?').bind(id).first();
  if(!invite)return error('Convocation introuvable.',404);
  if(invite.started_at && (invite.finished_at || invite.deadline_at<=now()))await finalize(invite,env);
  await ensureOpinionStore(env);
  const [rows,opinion,updated]=await Promise.all([
    env.EXAMS_DB.prepare('SELECT question_no,choice,updated_at FROM exam_answers WHERE invite_id=?').bind(id).all(),
    env.EXAMS_DB.prepare('SELECT opinion,updated_at FROM exam_opinions WHERE invite_id=?').bind(id).first(),
    env.EXAMS_DB.prepare('SELECT started_at,deadline_at,finished_at,finish_reason,score_cigare,score_club,decision FROM exam_invites WHERE id=?').bind(id).first()
  ]);
  const map=new Map(rows.results.map(a=>[a.question_no,a]));
  const questions=QUESTIONS.map(q=>{
    const r=rotation(id,q.no), a=map.get(q.no);
    const correct=(q.correct-r+4)%4;
    const selected=a?(a.choice-r+4)%4:null;
    return {no:q.no,text:q.text,options:q.options.map((_,i)=>q.options[(i+r)%4]),selected,correct,isCorrect:a? a.choice===q.correct:null,answeredAt:a?.updated_at||null};
  });
  return response({id,name:invite.member_name,memberId:invite.member_id,isTest:isTestInvite(invite),...updated,opinion:opinion?.opinion||'',opinionUpdatedAt:opinion?.updated_at||null,questions});
}
async function adminOpinion(request,env){
  const data=await input(request);
  const id=String(data.id||''),opinion=String(data.opinion??'').trim();
  if(!/^[a-f0-9-]{36}$/.test(id))return error('Identifiant de convocation invalide.');
  if(opinion.length>2500)return error('Avis limité à 2 500 caractères.');
  const exists=await env.EXAMS_DB.prepare('SELECT id FROM exam_invites WHERE id=?').bind(id).first();
  if(!exists)return error('Convocation introuvable.',404);
  await ensureOpinionStore(env);
  await env.EXAMS_DB.prepare("INSERT INTO exam_opinions (invite_id,opinion,updated_at) VALUES(?,?,unixepoch()) ON CONFLICT(invite_id) DO UPDATE SET opinion=excluded.opinion,updated_at=unixepoch()").bind(id,opinion).run();
  await env.EXAMS_DB.prepare("INSERT INTO exam_audit(invite_id,action) VALUES(?,'avis_comite')").bind(id).run();
  return response({ok:true,opinion,updatedAt:now()});
}
async function adminInvitations(env){
  await ensureOpinionStore(env);
  const r=await env.EXAMS_DB.prepare('SELECT i.id,i.member_id,i.member_name,i.created_at,i.claimed_at,i.started_at,i.deadline_at,i.finished_at,i.finish_reason,i.score_cigare,i.score_club,i.decision,i.decided_at,i.revoked_at, (SELECT updated_at FROM exam_opinions o WHERE o.invite_id=i.id) AS opinion_updated_at FROM exam_invites i ORDER BY i.created_at DESC').all();
  const invitations=[],testInvitations=[];
  for(const a of r.results){
    if(a.started_at&&(a.finished_at||a.deadline_at<=now())&&a.score_cigare===null)await finalize(a,env);
    const fresh=await env.EXAMS_DB.prepare('SELECT score_cigare,score_club,finished_at,finish_reason FROM exam_invites WHERE id=?').bind(a.id).first();
    const first=fresh.score_cigare,second=fresh.score_club;
    const isTest=isTestInvite(a);
    const record={...a,isTest,score_cigare:first,score_club:second,finished_at:fresh.finished_at,finish_reason:fresh.finish_reason,passed:!isTest&&first!==null&&second!==null&&(first+second)>=24&&first>=10&&second>=10};
    (isTest?testInvitations:invitations).push(record);
  }
  return response({invitations,testInvitations});
}
async function adminIssue(request,env){
  const data=await input(request);
  const memberId=String(data.memberId||'');
  if(!/^[a-z0-9_-]{1,80}$/.test(memberId))return error('Identifiant de membre invalide.');
  const member=await env.ARCHIVES_DB.prepare("SELECT m.id,m.name,m.grade,(SELECT COUNT(*) FROM sheets s WHERE s.member_id=m.id) AS fiches FROM members m WHERE m.id=?").bind(memberId).first();
  if(!member)return error('Membre introuvable.',404);
  if((member.grade||'').toLowerCase()!=='rat de passage'||member.fiches<3)return error('Éligibilité refusée : Rat de passage et 3 fiches archivées requis.',409);
  const code=randomCode(),id=crypto.randomUUID();
  try{
    await env.EXAMS_DB.prepare('INSERT INTO exam_invites(id,code_hash,member_id,member_name) VALUES(?,?,?,?)').bind(id,await digest(code),member.id,member.name).run();
  }catch(e){if(String(e).includes('UNIQUE'))return error('Une invitation active existe déjà. Révoquez-la avant toute nouvelle tentative.',409);throw e;}
  await env.EXAMS_DB.prepare("INSERT INTO exam_audit(invite_id,action) VALUES(?,'invitation')").bind(id).run();
  return response({id,memberName:member.name,code,url:'https://cruising-rats-cigar-club.fr/examen'},201);
}
// Committee-only test invitations use the real exam flow but have their own synthetic
// member IDs. They never appear in member eligibility or homologation decisions.
async function adminTestInvite(request,env){
  const code=randomCode(),id=crypto.randomUUID();
  const memberId=TEST_PREFIX+id;
  const memberName='Comité — Test technique';
  await env.EXAMS_DB.prepare('INSERT INTO exam_invites(id,code_hash,member_id,member_name) VALUES(?,?,?,?)')
    .bind(id,await digest(code),memberId,memberName).run();
  await env.EXAMS_DB.prepare("INSERT INTO exam_audit(invite_id,action) VALUES(?,'invitation_test')").bind(id).run();
  return response({id,memberName,code,url:'https://cruising-rats-cigar-club.fr/examen',isTest:true},201);
}
async function adminDecision(request,env){
  const data=await input(request),id=String(data.id||''),decision=String(data.decision||'');
  if(!/^[a-f0-9-]{36}$/.test(id)||!['homologue','ajourne'].includes(decision))return error('Décision invalide.');
  const item=await env.EXAMS_DB.prepare('SELECT * FROM exam_invites WHERE id=?').bind(id).first();
  if(!item||item.revoked_at)return error('Dossier indisponible.',404);
  if(isTestInvite(item))return error('Une convocation de test ne peut donner lieu à aucune décision d’homologation.',409);
  await finalize(item,env);
  const result=await env.EXAMS_DB.prepare('UPDATE exam_invites SET decision=?,decided_at=unixepoch() WHERE id=? AND finished_at IS NOT NULL AND revoked_at IS NULL RETURNING id').bind(decision,id).first();
  if(!result)return error('L’épreuve doit être terminée avant la décision.',409);
  await env.EXAMS_DB.prepare("INSERT INTO exam_audit(invite_id,action) VALUES(?,?)").bind(id,'decision:'+decision).run();
  return response({ok:true});
}
async function adminRevoke(request,env){
  const data=await input(request),id=String(data.id||'');
  if(!/^[a-f0-9-]{36}$/.test(id))return error('Identifiant invalide.');
  const item=await env.EXAMS_DB.prepare('UPDATE exam_invites SET revoked_at=unixepoch() WHERE id=? AND revoked_at IS NULL RETURNING id').bind(id).first();
  if(!item)return error('Invitation introuvable ou déjà révoquée.',404);
  await env.EXAMS_DB.prepare("INSERT INTO exam_audit(invite_id,action) VALUES(?,'revocation')").bind(id).run();
  return response({ok:true});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/examen/api/'))return error('Introuvable.',404);
    const action=url.pathname.slice('/examen/api/'.length);
    const method=request.method;
    if(!['GET','POST'].includes(method))return error('Méthode non autorisée.',405);
    if(method==='POST'){
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return error('Origine non autorisée.',403);
    }
    try{
      if(action==='state'&&method==='GET')return await state(request,env);
      if(action==='redeem'&&method==='POST')return await redeem(request,env);
      if(action==='start'&&method==='POST')return await start(request,env);
      if(action==='answer'&&method==='POST')return await answer(request,env);
      if(action==='submit'&&method==='POST')return await submit(request,env);
      if(action.startsWith('admin/')){
        if(!env.CRCC_EXAM_ADMIN_PASSWORD)return error('Mot de passe du Comité non configuré.',503);
        if(!admin(request,env))return error('Accès Comité refusé.',401);
        if(action==='admin/members'&&method==='GET')return await adminMembers(env);
        if(action==='admin/invitations'&&method==='GET')return await adminInvitations(env);
        if(action==='admin/invitations'&&method==='POST')return await adminIssue(request,env);
        if(action==='admin/test-invitation'&&method==='POST')return await adminTestInvite(request,env);
        if(action==='admin/responses'&&method==='GET')return await adminResponses(request,env);
        if(action==='admin/opinion'&&method==='POST')return await adminOpinion(request,env);
        if(action==='admin/decision'&&method==='POST')return await adminDecision(request,env);
        if(action==='admin/revoke'&&method==='POST')return await adminRevoke(request,env);
      }
      return error('Route inconnue.',404);
    }catch(e){console.error('CRCC exam API:',e?.name||'error');return error('Une anomalie technique a été consignée. Réessayez ou contactez le Comité.',500);}
  }
};