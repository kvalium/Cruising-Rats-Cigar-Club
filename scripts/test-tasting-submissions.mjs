import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {handleTasting} from '../functions/lib/tasting-api.js';
import {cleanSubmission,validateUpload} from '../functions/lib/tasting-model.js';
import {signedRequest} from '../functions/lib/tasting-storage.js';

const root=resolve(import.meta.dirname,'..'),temporary=mkdtempSync(join(tmpdir(),'crcc-tastings-')),database=join(temporary,'test.db');
function sqlite(request) {
  const r=spawnSync('python3',[join(root,'scripts/sqlite-d1-adapter.py')],{input:JSON.stringify({database,...request}),encoding:'utf8'});
  if(r.status!==0)throw Error(r.stdout||r.stderr);return JSON.parse(r.stdout).results;
}
export function createTestDB(path) {
  function execute(statements){const r=spawnSync('python3',[join(root,'scripts/sqlite-d1-adapter.py')],{input:JSON.stringify({database:path,statements}),encoding:'utf8'});if(r.status!==0)throw Error(r.stdout||r.stderr);return JSON.parse(r.stdout).results;}
  const db={prepare(sql){return {sql,params:[],bind(...params){this.params=params;return this;},async run(){return execute([this])[0];},async all(){return execute([this])[0];},async first(){return execute([this])[0].results[0]||null;}};},async batch(statements){return execute(statements);}};return db;
}
const db=createTestDB(database);
sqlite({script:readFileSync(join(root,'cloudflare/schema.sql'),'utf8')+'\n'+readFileSync(join(root,'cloudflare/tasting-submissions.sql'),'utf8')});
sqlite({statements:[{sql:'INSERT INTO members VALUES (?,?,?,?)',params:['test-rat','Rat de contrôle','Rat de Passage',JSON.stringify({id:'test-rat',name:'Rat de contrôle',grade:'Rat de Passage'})]},{sql:'INSERT INTO members VALUES (?,?,?,?)',params:['witness','Témoin','Rat de Passage',JSON.stringify({id:'witness',name:'Témoin',grade:'Rat de Passage'})]}]});
const env={CRCC_ARCHIVES_DB:db,CRCC_MEMBERS_PASSWORD:'local-members-only',CRCC_EXAM_ADMIN_PASSWORD:'local-committee-only',CRCC_S3_ACCESS_KEY_ID:'TESTACCESS',CRCC_S3_SECRET_ACCESS_KEY:'local-test-secret',CRCC_S3_SUBMISSIONS_BUCKET:'private-test-bucket',CRCC_S3_PUBLIC_BUCKET:'public-test-bucket',CRCC_DEGUSTATIONS_DEPLOY_HOOK:'https://test.invalid/deploy'};
const objects=new Map();let copyFailure=false,hookFailure=false,showPublished=false;
globalThis.fetch=async(url,init={})=>{
  url=String(url);
  if(url==='https://test.invalid/deploy')return new Response('',{status:hookFailure?500:200});
  if(url.includes('/fiches-degustation/seance-')){const row=await db.prepare('SELECT publication_marker FROM tasting_submissions WHERE status IN (\'publishing\',\'publish_failed\') LIMIT 1').first();return new Response(showPublished?`<meta name="crcc-publication" content="${row.publication_marker}">`:'Old release');}
  const u=new URL(url),key=u.host+u.pathname;
  assert.match(init.headers.authorization,/AWS4-HMAC-SHA256 Credential=TESTACCESS\//);
  if(init.method==='PUT') {
    if(init.headers['x-amz-copy-source']){if(copyFailure)return new Response('<Error>Failure</Error>');const source='private-test-bucket.s3.eu-west-3.amazonaws.com'+init.headers['x-amz-copy-source'].replace('/private-test-bucket','');objects.set(key,objects.get(source));return new Response('<CopyObjectResult/>');}
    objects.set(key,init.body);return new Response('');
  }
  return objects.has(key)?new Response(objects.get(key)):new Response('',{status:404});
};
let owner='';
async function request(path,method='GET',body,options={}) {
  const headers={Authorization:'Basic '+btoa('crcc:'+env.CRCC_MEMBERS_PASSWORD),Origin:'https://club.test',...(owner?{Cookie:owner}:{}),...options.headers};
  if(options.admin)headers['X-Committee-Password']=env.CRCC_EXAM_ADMIN_PASSWORD;
  const raw=body instanceof Uint8Array;
  if(body!==undefined&&!raw)headers['Content-Type']='application/json';
  const r=await handleTasting({env,request:new Request('https://club.test/fiches-degustation/api/degustations'+path,{method,headers,body:body===undefined?undefined:raw?body:JSON.stringify(body)})});
  if(r.headers.has('Set-Cookie'))owner=r.headers.get('Set-Cookie').split(';')[0];
  let data;try{data=await r.clone().json();}catch{data=await r.text();}return {status:r.status,data};
}
const person={id:'test-rat',name:'Rat de contrôle',grade:'Rat de Passage',has_sheet:true,cigar:'Cigare déclaré',brand:'Marque',cigar_score:0,duration_minutes:0,relights:0,aromas:['Bois','Bois'],pairings:['Rhum','Verveine'],notes:'Observation personnelle'};
const original={date:'2026-10-31',title:'Séance de contrôle',context:'Pièces synthétiques',members:[person,{id:'witness',name:'Témoin',grade:'Rat de Passage',has_sheet:false}]};
const normalized=cleanSubmission(original);assert.equal(normalized.members[0].cigar_score,0);assert.equal(normalized.members[0].relights,0);assert.equal(normalized.members[0].touchups,null);assert.deepEqual(normalized.members[0].aromas,['Bois']);
assert.throws(()=>cleanSubmission({...original,date:'2026-02-31'}));
assert.equal((await request('/catalog','GET',undefined,{headers:{Authorization:''}})).status,401);
assert.equal((await request('/admin/list')).status,403);
assert.equal((await request('/draft','POST',{}, {headers:{Origin:'https://evil.test'}})).status,403);
const client_id=crypto.randomUUID();let r=await request('/draft','POST',{client_id,data:original});assert.equal(r.status,201);const id=r.data.id;
assert.equal((await request('/draft','POST',{client_id,data:original})).data.id,id);
assert.equal((await request('/draft/'+id,'GET',undefined,{headers:{Cookie:''}})).status,403);
assert.equal((await request('/draft/'+id+'/submit','POST',{version:1})).status,400);
async function attach(kind,slot,bytes,extra={}) {
  const registration=await request('/draft/'+id+'/files','POST',{kind,slot,name:kind==='sheet'?'fiche.pdf':'photo.webp',member_id:kind==='sheet'?'test-rat':undefined,alt:'Image technique',...extra});
  assert.equal(registration.status,201);return {...await request('/draft/'+id+'/files/'+registration.data.id,'PUT',bytes),id:registration.data.id};
}
const pdf=new TextEncoder().encode('%PDF-1.4\n% synthetic test fixture\n%%EOF');
const file=await attach('sheet',null,pdf);assert.equal(file.status,200);
assert.equal((await request('/files/'+file.id,'GET',undefined,{headers:{Cookie:''}})).status,403);
assert.equal((await request('/files/'+file.id,'GET',undefined,{admin:true,headers:{Cookie:''}})).status,200);
assert.equal((await request('/draft/'+id+'/files/'+file.id,'PUT',pdf)).status,409);
const image=spawnSync('python3',['-c',"from PIL import Image;import io,sys;i=io.BytesIO();Image.new('RGB',(20,12),'brown').save(i,format='WEBP');sys.stdout.buffer.write(i.getvalue())"]);
const photo=new Uint8Array(image.stdout);assert.deepEqual(validateUpload(photo.buffer,'photo'),{type:'image/webp',width:20,height:12});
assert.throws(()=>validateUpload(new TextEncoder().encode('<svg/>').buffer,'photo'));
assert.equal((await request('/draft/'+id+'/files','POST',{kind:'photo',slot:'photo-11',alt:'x',name:'x'})).status,400);
await attach('photo','photo-1',photo);await attach('thumbnail','photo-1-thumb',photo);
r=await request('/draft/'+id+'/submit','POST',{version:1});assert.equal(r.status,200);
assert.equal((await request('/draft/'+id,'PUT',{data:original,version:2})).status,409);
assert.equal((await request('/draft/'+id+'/files/'+file.id,'DELETE')).status,409);
r=await request('/admin/'+id+'/decision','POST',{version:2,status:'needs_info',feedback:'Préciser le lieu.'},{admin:true});assert.equal(r.status,200);
let row=(await request('/draft/'+id)).data;
const corrected={...original,place:'Lieu précisé',title:'Séance complétée'};
assert.equal((await request('/draft/'+id,'PUT',{data:corrected,version:row.version-1})).status,409);
r=await request('/draft/'+id,'PUT',{data:corrected,version:row.version});assert.equal(r.status,200);
await request('/draft/'+id+'/submit','POST',{version:r.data.version});row=(await request('/draft/'+id)).data;assert.equal(row.submitted_payload.title,original.title);
const review={confirmed:true,status:'valide-avec-reserves',description:'Référence synthétique non commerciale.',sources:['https://example.com/fabricant'],appreciation:'Dossier de contrôle exploitable.',members:{'test-rat':{report:'Compte rendu individuel.\n\nAnalyse justifiée.',comparison:'Référence contrôlée avec prudence.',evaluation_basis:'Fiche et précisions du formulaire.',mention:'Validé avec réserves',next_steps:['Préciser le module'],criteria:[15,20,30,20,15].map(max=>({score:max-1,comment:'Justification du critère.'}))}}};
assert.equal((await request('/admin/'+id+'/approve','POST',{version:row.version,review:{...review,sources:[]}},{admin:true})).status,400);
copyFailure=true;r=await request('/admin/'+id+'/approve','POST',{version:row.version,review},{admin:true});assert.equal(r.status,502);assert.equal((await request('/draft/'+id)).data.status,'pending');copyFailure=false;
hookFailure=true;r=await request('/admin/'+id+'/approve','POST',{version:row.version,review},{admin:true});assert.equal(r.status,502);row=(await request('/draft/'+id)).data;assert.equal(row.status,'publish_failed');
const published=await db.prepare('SELECT payload FROM sessions WHERE id=?').bind(row.session_id).first(),session=JSON.parse(published.payload);assert.equal(session.participants.length,2);assert.equal(session.sheets.length,1);assert.equal(session.sheets[0].cigar_score,0);assert.equal(session.sheets[0].number,1);assert.equal(session.sheets[0].criteria.reduce((n,c)=>n+c.score,0),95);assert.equal(session.photos.length,1);assert.equal(session.committee_review.appreciation,review.appreciation);assert.match(session.photos[0].src,/images\/seances\//);
assert.equal((await request('/admin/'+id+'/approve','POST',{version:row.version,review},{admin:true})).status,409);
hookFailure=false;assert.equal((await request('/admin/'+id+'/retry','POST',{}, {admin:true})).status,202);
assert.equal((await request('/admin/'+id+'/check','POST',{}, {admin:true})).data.status,'publishing');showPublished=true;
assert.equal((await request('/admin/'+id+'/check','POST',{}, {admin:true})).data.status,'published');
assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM sheets').first()).n,1);
assert.ok((await db.prepare('SELECT COUNT(*) AS n FROM tasting_submission_versions').first()).n>=3);
// Exercise the actual Python generator with a newly approved payload, including
// a participant without a sheet and a missing brand in the structured form.
const reportRows=(await db.prepare('SELECT sheet_id,html FROM reports').all()).results;
const generation=spawnSync('python3',['-c',`
import importlib.util,json,shutil,sys,tempfile
from pathlib import Path
root=Path(sys.argv[1]);data=json.load(sys.stdin)
spec=importlib.util.spec_from_file_location('new_archive',root/'scripts/build-degustations.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
with tempfile.TemporaryDirectory() as temporary:
    target=Path(temporary);builder.ROOT=target
    (target/'js').mkdir();(target/'data/comptes-rendus').mkdir(parents=True)
    for filename in ('member-stats.js','member-observatory.js'):shutil.copy2(root/'js'/filename,target/'js'/filename)
    shutil.copy2(root/'index.html',target/'index.html');(target/'sitemap.xml').write_text('<urlset></urlset>')
    for session in data['sessions']:
        for sheet in session['sheets']:
            sheet['brand']=None
            pdf=target/sheet['pdf'];pdf.parent.mkdir(parents=True,exist_ok=True);pdf.write_bytes(b'%PDF-1.4')
            (target/sheet['report']).write_text(data['reports'][sheet['id']])
    builder.build(data)
    page=(target/'fiches-degustation'/builder.session_url(data['sessions'][0])).read_text()
    assert 'name="crcc-publication"' in page and 'Photos de la séance' in page
    assert (target/'fiches-degustation/membre-witness.html').is_file()
`,root],{input:JSON.stringify({members:[{id:'test-rat',name:'Rat de contrôle',grade:'Rat de Passage'},{id:'witness',name:'Témoin',grade:'Rat de Passage'}],sessions:[session],reports:Object.fromEntries(reportRows.map(r=>[r.sheet_id,r.html]))}),encoding:'utf8'});
assert.equal(generation.status,0,generation.stderr||generation.stdout);
const signed=await signedRequest(env,env.CRCC_S3_SUBMISSIONS_BUCKET,'soumissions-degustations/test.pdf','PUT',pdf,{'content-type':'application/pdf'},new Date('2026-10-31T12:00:00Z'));
assert.equal(signed.init.headers['x-amz-date'],'20261031T120000Z');assert.match(signed.init.headers.authorization,/SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date/);
rmSync(temporary,{recursive:true,force:true});
console.log('Tasting submission integration checks passed: access, CSRF, ownership, drafts, uploads, 10-photo limit, zero/null values, complements, preserved originals, rubric, approval, S3 failure recovery, publication marker and duplicate prevention.');
