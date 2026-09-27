/* CRCC — La Grande Homologation. Aucun compte, aucune donnée envoyée. */
(() => {
  'use strict';

  const REASONS = {
    carte: 'Carte non validée par le Comité',
    fiche: 'Fiche de dégustation incomplète',
    habano: '« Habano » sans preuve d’origine cubaine',
    coupe_grade: 'Emprunt du Coupe-cigare sans 3 fiches archivées',
    parrain: 'Présentation d’un candidat sans 3 fiches archivées',
    inspection: 'Inspection préalable du Coupe-cigare absente'
  };

  const RULES = [
    { day: 1, id: '01', text: 'La carte de membre doit porter la validation du Comité exécutif.' },
    { day: 1, id: '02', text: 'La fiche du jour doit indiquer le cigare, une observation et une appréciation.' },
    { day: 2, id: '03', text: 'Le terme « habano » exige une preuve de provenance cubaine jointe au dossier.' },
    { day: 2, id: '04', text: 'Le Coupe-cigare du Président est empruntable à partir de 3 fiches archivées.' },
    { day: 3, id: '05', text: 'Proposer un nouveau membre exige également 3 fiches archivées.' },
    { day: 3, id: '06', text: 'Tout emprunt du Coupe-cigare requiert un état des lieux préalable consigné.' }
  ];

  const BULLETINS = {
    1: 'Le Comité rappelle que la présence d’un tampon est une preuve de tampon, ce qui constitue un début.',
    2: 'Circulaire du jour : contrôle renforcé des « habanos » et des mains approchant le Coupe-cigare.',
    3: 'Nouvelle directive : les parrainages et l’état des lieux du Coupe-cigare relèvent désormais du guichet.'
  };

  // Chaque dossier comporte une seule infraction déterminante, ou aucune.
  const CASES = [
    { id: '001', day: 1, name: 'Madame Braise', avatar: 'B', quote: '« J’ai même rempli la case “appréciation”. Je suis bouleversée. »', card: { number: '0041', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Tirage souple, notes de bois', appreciation: 'Agréable' }, request: { action: 'Accès à la séance', note: 'Demande d’une chaise avec dossier.' }, reason: null, explanation: 'Carte validée et fiche complète. Le mobilier n’est pas une infraction.' },
    { id: '002', day: 1, name: 'Monsieur Rature', avatar: 'R', quote: '« Le cachet était beaucoup trop voyant, je l’ai retiré. »', card: { number: '0019', grade: 'Rat de passage', archived: 2, valid: false }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Fumée dense', appreciation: 'Correct' }, request: { action: 'Accès à la séance', note: 'Promet de ne plus retoucher les documents.' }, reason: 'carte', explanation: 'La carte ne porte aucune validation du Comité.' },
    { id: '003', day: 1, name: 'Capitaine Cendre', avatar: 'C', quote: '« Mon avis se lit dans mon regard. »', card: { number: '0036', grade: 'Rat de passage', archived: 0, valid: true }, sheet: { cigar: 'San Pedro de Macorís', observation: 'Combustion régulière', appreciation: '' }, request: { action: 'Accès à la séance', note: 'Le candidat regarde intensément sa fiche.' }, reason: 'fiche', explanation: 'La case « appréciation » est vide. Un regard ne s’archive pas.' },
    { id: '004', day: 2, name: 'Madame Minuit', avatar: 'M', quote: '« Je demande un fauteuil. Pas une promotion. »', card: { number: '0008', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois et café', appreciation: 'Équilibré' }, request: { action: 'Accès à la séance', note: 'Souhaite un fauteuil avec une autorité naturelle.' }, reason: null, explanation: 'Toutes les pièces sont conformes. La demande de fauteuil reste libre.' },
    { id: '005', day: 2, name: 'Le Vicomte du Terroir', avatar: 'V', quote: '« C’est un habano. Je l’ai décidé au nez. »', card: { number: '0012', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'Habano — origine cubaine', observation: 'Épices légères', appreciation: 'Très bon' }, request: { action: 'Accès à la séance', note: 'Preuve de provenance : aucune pièce jointe.' }, reason: 'habano', explanation: 'Le mot « habano » figure sur la fiche, sans preuve de provenance cubaine.' },
    { id: '006', day: 2, name: 'Monsieur Tremblote', avatar: 'T', quote: '« Je ne le toucherai qu’avec respect et des gants imaginaires. »', card: { number: '0063', grade: 'Rat de passage', archived: 2, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Notes de pain grillé', appreciation: 'Satisfaisant' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux : impeccablement rempli.' }, reason: 'coupe_grade', explanation: 'Il n’a que 2 fiches archivées. Il en faut 3 pour emprunter le Coupe-cigare.' },
    { id: '007', day: 3, name: 'Monsieur Crevette', avatar: 'C', quote: '« J’ai trouvé un candidat d’une grande tenue. Il possède des chaussures. »', card: { number: '0007', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois sec, tirage net', appreciation: 'Convaincant' }, request: { action: 'Proposition d’un nouveau membre', note: 'Candidat : Monsieur Parapluie. Dossier joint.' }, reason: 'parrain', explanation: 'Pour proposer un membre, il faut 3 fiches archivées. Monsieur Crevette n’en a qu’une.' },
    { id: '008', day: 3, name: 'Madame Velours', avatar: 'V', quote: '« Il était déjà comme ça avant. Enfin, je suppose. »', card: { number: '0025', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { cigar: 'San Pedro de Macorís', observation: 'Tirage franc', appreciation: 'Bon' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable : absent. Mention manuscrite : « il était déjà comme ça avant ».' }, reason: 'inspection', explanation: 'L’état des lieux préalable manque. Cette formule manuscrite ne le remplace pas.' },
    { id: '009', day: 3, name: 'Docteur Moustache', avatar: 'M', quote: '« Mes trois fiches ont reçu le tampon. Je n’en reviens pas. »', card: { number: '0033', grade: 'Rat homologué', archived: 3, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Cèdre et café', appreciation: 'Équilibré' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable : signé, lame intacte.' }, reason: null, explanation: 'Trois fiches archivées et inspection préalable consignée : l’emprunt est recevable.' },
    { id: '010', day: 3, name: 'Madame Sans-Gêne', avatar: 'S', quote: '« Je propose mon ami. Il dit sentir la photocopieuse du mercredi. »', card: { number: '0011', grade: 'Rat homologué', archived: 10, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Cèdre léger', appreciation: 'Personnellement, j’aime bien' }, request: { action: 'Proposition d’un nouveau membre', note: 'Candidat : Monsieur Mercredi. Pièces de candidature jointes.' }, reason: null, explanation: 'Dossier conforme. Les propos du candidat sont curieux, mais le règlement ne punit pas la poésie involontaire.' }
  ];

  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let state = null;
  let audio = null;
  let soundEnabled = false;

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function visible(section) {
    ['intro', 'play', 'result', 'ending'].forEach(id => $(id).classList.toggle('hidden', id !== section));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function tone(frequency, duration, type = 'triangle') {
    if (!soundEnabled) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch (_) { /* Son optionnel. */ }
  }

  function start() {
    state = { cases: [1, 2, 3].flatMap(day => shuffle(CASES.filter(item => item.day === day))), index: 0, balance: 0, errors: 0, exact: 0 };
    showCase();
  }

  function row(label, value) {
    return `<div class="doc-row"><label>${escapeHTML(label)}</label><strong>${escapeHTML(value || '—')}</strong></div>`;
  }

  function documentCard(code, title, rows, note, stamp, bad = false) {
    return `<article class="document"><div class="document-head"><span>CRCC / ${escapeHTML(code)}</span><span>PIÈCE OFFICIELLE</span></div><h3>${escapeHTML(title)}</h3>${rows}${note ? `<p class="doc-note">${escapeHTML(note)}</p>` : ''}${stamp ? `<div class="doc-stamp ${bad ? 'bad' : ''}">${escapeHTML(stamp)}</div>` : ''}</article>`;
  }

  function showCase() {
    const item = state.cases[state.index];
    $('day-label').textContent = `${String(item.day).padStart(2, '0')} / 03`;
    $('case-label').textContent = `${String(state.index + 1).padStart(2, '0')} / ${state.cases.length}`;
    $('balance-label').textContent = `${state.balance} F`;
    $('errors-label').textContent = state.errors;
    $('bulletin').innerHTML = `<b>BULLETIN N° ${item.day} —</b> ${escapeHTML(BULLETINS[item.day])}`;
    $('visitor-avatar').textContent = item.avatar;
    $('visitor-name').textContent = item.name;
    $('visitor-quote').textContent = item.quote;
    $('queue-number').textContent = `N° ${item.id}`;

    const activeRules = RULES.filter(rule => rule.day <= item.day);
    $('rules-list').innerHTML = [1, 2, 3].filter(day => day <= item.day).map(day =>
      `<div class="rule-group"><h3>${day === 1 ? 'DISPOSITIONS PERMANENTES' : `CIRCULAIRE DU JOUR ${day}`}</h3>${activeRules.filter(rule => rule.day === day).map(rule => `<p class="rule"><b>${rule.id}</b><span>${escapeHTML(rule.text)}</span></p>`).join('')}</div>`
    ).join('');

    const card = item.card, sheet = item.sheet, request = item.request;
    $('documents').innerHTML =
      documentCard('MEM', 'Carte de membre', row('Titulaire', item.name) + row('N°', card.number) + row('Grade', card.grade) + row('Fiches archivées', String(card.archived)), '', card.valid ? 'VALIDÉ · COMITÉ' : 'VALIDATION ABSENTE', !card.valid) +
      documentCard('FD', 'Fiche du jour', row('Cigare', sheet.cigar) + row('Observation', sheet.observation) + row('Appréciation', sheet.appreciation), 'Document destiné aux archives du Club.', 'FICHE REÇUE') +
      documentCard('REQ', 'Demande au guichet', row('Objet', request.action), request.note, 'DÉPOSÉ CE JOUR');

    $('reason-select').innerHTML = '<option value="">Choisir le motif…</option>' + Object.entries(REASONS).filter(([key]) => activeRules.some(rule => ({ carte: '01', fiche: '02', habano: '03', coupe_grade: '04', parrain: '05', inspection: '06' }[key] === rule.id))).map(([key, label]) => `<option value="${key}">${escapeHTML(label)}</option>`).join('');
    $('reason-select').value = '';
    $('confirm-refusal').disabled = true;
    $('reason-picker').classList.add('hidden');
    $('actions').classList.remove('hidden');
    visible('play');
  }

  function decide(verdict, reason = null) {
    const item = state.cases[state.index];
    const correctVerdict = (verdict === 'refuse') === Boolean(item.reason);
    const exact = correctVerdict && (verdict === 'approve' || reason === item.reason);
    let delta;
    if (!correctVerdict) { delta = -80; state.errors++; }
    else if (!exact) { delta = -20; state.errors++; }
    else { delta = verdict === 'refuse' ? 75 : 50; state.exact++; }
    state.balance += delta;
    tone(exact ? 330 : 130, .13, exact ? 'triangle' : 'sawtooth');
    setTimeout(() => tone(exact ? 440 : 110, .18), 110);

    $('result-stamp').className = `result-stamp ${exact ? 'good' : 'bad'}`;
    $('result-stamp').textContent = exact ? 'CONFORME' : 'OBSERVATION';
    $('result-title').textContent = exact ? (verdict === 'approve' ? 'Accès accordé.' : 'Refus motivé.') : 'Le Comité relève une anomalie.';
    $('result-text').textContent = exact ? item.explanation : `${item.explanation} ${!correctVerdict ? `Ce dossier devait être ${item.reason ? 'refusé' : 'validé'}.` : `Le motif exact était : ${REASONS[item.reason]}.`}`;
    $('result-ledger').textContent = `${delta > 0 ? '+' : ''}${delta} F · Caisse du bureau : ${state.balance} F`;
    $('next-button').innerHTML = state.index === state.cases.length - 1 ? 'CLÔTURER LE SERVICE <span>→</span>' : 'DOSSIER SUIVANT <span>→</span>';
    visible('result');
  }

  function next() {
    state.index++;
    if (state.index < state.cases.length) showCase();
    else finish();
  }

  function finish() {
    const score = state.exact;
    const rank = score === 10 ? 'Grand Rat du guichet' : score >= 8 ? 'Rat homologué aux tampons' : score >= 5 ? 'Rat à peu près compétent' : 'Rat de passage surveillé';
    $('ending-title').textContent = rank;
    $('ending-copy').textContent = score === 10 ? 'Dix dossiers, zéro écart. Le Comité envisage de vous confier un second tampon. La décision est reportée.' : score >= 8 ? 'Votre application du règlement est remarquée. Le Comité demande néanmoins un rapport sur la présence de cette remarque.' : score >= 5 ? 'Vous avez conservé une certaine dignité administrative. Les erreurs feront l’objet d’un dossier distinct.' : 'Votre service est terminé. Le Comité recommande une lecture lente du règlement, si possible avant de tamponner.';
    $('ending-stats').innerHTML = `<div><strong>${score}/10</strong><span>Décisions exactes</span></div><div><strong>${state.errors}</strong><span>Observations</span></div><div><strong>${state.balance} F</strong><span>Caisse finale</span></div>`;
    visible('ending');
  }

  $('start-button').addEventListener('click', start);
  $('restart-button').addEventListener('click', start);
  $('approve-button').addEventListener('click', () => decide('approve'));
  $('refuse-button').addEventListener('click', () => { $('actions').classList.add('hidden'); $('reason-picker').classList.remove('hidden'); $('reason-select').focus(); });
  $('cancel-refusal').addEventListener('click', () => { $('reason-picker').classList.add('hidden'); $('actions').classList.remove('hidden'); $('refuse-button').focus(); });
  $('reason-select').addEventListener('change', event => { $('confirm-refusal').disabled = !event.target.value; });
  $('confirm-refusal').addEventListener('click', () => { if ($('reason-select').value) decide('refuse', $('reason-select').value); });
  $('next-button').addEventListener('click', next);
  $('sound-toggle').addEventListener('click', () => { soundEnabled = !soundEnabled; $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled)); $('sound-toggle').textContent = soundEnabled ? '♫ Son activé' : '♪ Son coupé'; tone(420, .12); });
})();
