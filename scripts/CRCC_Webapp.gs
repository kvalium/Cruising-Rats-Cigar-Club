/** CRCC — Passerelle Google Apps Script pour le Bureau des correspondances.
 * À déployer comme application web : exécuter en tant que moi, accès tous.
 * Sécurisée par CRCC_MAILER_TOKEN dans les Propriétés du script.
 * Ce fichier complète, sans remplacer, les fonctions d'envoi historiques.
 */
const CRCC_SHEET_ID='1Sh3hu1JXRI8Vwv7y5OjKmdIwdv7oXWBc5YyE9Xq0hlE';
const CRCC_SENDER='cruisingratscigarclub@gmail.com';
function crccReply_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    if(!e||!e.postData||!e.postData.contents)return crccReply_({ok:false,error:'Requête vide.'});
    const obj=JSON.parse(e.postData.contents);
    const token=PropertiesService.getScriptProperties().getProperty('CRCC_MAILER_TOKEN');
    if(!token||String(obj.token)!==token)return crccReply_({ok:false,error:'Autorisation refusée.'});
    if(!lock.tryLock(20000))return crccReply_({ok:false,error:'Une opération est déjà en cours.'});
    if(!['draft','send'].includes(obj.action)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.to||'')||!String(obj.subject||'').trim()||!String(obj.html||'').trim())return crccReply_({ok:false,error:'Paramètres invalides.'});
    const sender='Comité exécutif — Cruising Rats Cigar Club';
    const opts={name:sender,replyTo:CRCC_SENDER,htmlBody:obj.html};
    if(GmailApp.getAliases().indexOf(CRCC_SENDER)>=0)opts.from=CRCC_SENDER;
    let id='';
    if(obj.action==='draft'){const draft=GmailApp.createDraft(obj.to,obj.subject,obj.text||'Notification du Comité exécutif',opts);id=draft.getId();}
    else{GmailApp.sendEmail(obj.to,obj.subject,obj.text||'Notification du Comité exécutif',opts);id='sent-'+Utilities.getUuid();}
    try{
      SpreadsheetApp.openById(CRCC_SHEET_ID).getSheetByName('Historique').appendRow([new Date(),obj.action,obj.reference||'',obj.to,obj.type||'',obj.subject,obj.action==='draft'?'Brouillon créé':'Envoyé']);
    }catch(logError){console.warn('Historique non disponible : '+logError);}
    return crccReply_({ok:true,id:id});
  }catch(err){return crccReply_({ok:false,error:String(err.message||err)});}
  finally{try{lock.releaseLock()}catch(_){}}
}
