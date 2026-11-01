import assert from 'node:assert/strict';
import {historyHtml} from '../js/tasting-history.js';

const events=[
  {event:'draft.saved',created_at:'2026-10-31 20:49:14',details:'Brouillon conservé.'},
  {event:'analysis_prepared',created_at:'2026-10-31 21:14:20',details:JSON.stringify({source_version:5,draft_version:6,proposed_status:'valide-avec-reserves',proposed_committee_scores:{julien:86},file_ids:['private-id']})},
  {event:'published',created_at:'2026-11-01 15:24:17',details:'Page vérifiée.'},
];
const html=historyHtml(events,[{id:'julien',name:'Julien'}]);
assert(html.indexOf('Publication vérifiée')<html.indexOf('Brouillon enregistré'));
assert(html.includes('31 octobre 2026 à 22:14'),'D1 timestamps are UTC; the committee reads Paris time');
assert(html.includes('datetime="2026-10-31T21:14:20.000Z"'));
assert(html.includes('5 → 6')&&html.includes('86/100')&&html.includes('Julien'));
assert(html.includes('VALIDÉ AVEC RÉSERVES'));
assert(!html.includes('<details open'),'Technical metadata must be collapsed initially');
assert(html.indexOf('private-id')>html.indexOf('<details class="history-technical">'));
assert(!html.includes('<h3>analysis_prepared'));
assert.equal(events[0].event,'draft.saved','Rendering does not mutate the audit trail');
const hostile=historyHtml([{event:'analysis_prepared',created_at:'invalid',details:JSON.stringify({reason:'<img src=x onerror=alert(1)>',title:'</dd><script>bad</script>'})}]);
assert(!hostile.includes('<img')&&!hostile.includes('<script>'));
assert(hostile.includes('Date non renseignée'));
assert(historyHtml([{event:'future.event',details:'Action conservée.'}]).includes('Événement du dossier'));
assert(historyHtml([]).includes('Aucun événement'));
console.log('Committee history checks passed: chronology, Paris time, summaries, preserved audit data and HTML escaping.');
