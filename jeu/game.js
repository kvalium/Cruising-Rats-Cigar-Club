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

  RULES.push({ day: 4, id: '07', text: 'Le numéro inscrit sur la fiche du jour doit correspondre à celui de la carte.' });
  BULLETINS[4] = 'Dernière circulaire : vérifiez aussi les numéros. Le Comité refuse de compter deux fois le même membre.';

  const EXTRA_CASES = [
    { id: '011', day: 1, name: 'Madame Tampon', avatar: 'T', quote: '« J’ai apporté un tampon personnel. Il est décoratif. »', card: { number: '0074', grade: 'Rat de passage', archived: 0, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois discret', appreciation: 'Plaisant' }, request: { action: 'Accès à la séance', note: 'Tampon privé en forme de navet, non appliqué aux pièces.' }, reason: null, explanation: 'Le tampon décoratif n’altère aucun document. Toutes les pièces sont en règle.' },
    { id: '012', day: 2, name: 'Signor Cacao', avatar: 'C', quote: '« Cette fois, la provenance est écrite. En toutes lettres. »', card: { number: '0057', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Habano — origine cubaine', observation: 'Cacao et épices', appreciation: 'Franc' }, request: { action: 'Accès à la séance', note: 'Preuve de provenance cubaine : facture d’origine jointe et lisible.' }, reason: null, explanation: 'L’origine cubaine est documentée. Le mot « habano » est ici recevable.' },
    { id: '013', day: 3, name: 'Monsieur Rature', avatar: 'R', quote: '', card: { number: '0019', grade: 'Rat homologué', archived: 3, valid: false }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Bois et café', appreciation: 'Sobre' }, request: { action: 'Accès à la séance', note: '' }, reason: 'carte', explanation: '' },
    { id: '014', day: 4, name: 'Madame Velours', avatar: 'V', quote: '', card: { number: '0025', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { memberNumber: '0025', cigar: 'San Pedro de Macorís', observation: 'Tirage régulier', appreciation: 'Équilibré' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: '' }, reason: 'inspection', explanation: '' },
    { id: '015', day: 4, name: 'Monsieur Crevette', avatar: 'C', quote: '', card: { number: '0007', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { memberNumber: '0007', cigar: 'Flor de Oliva', observation: 'Bois sec', appreciation: 'Honnête' }, request: { action: 'Proposition d’un nouveau membre', note: '' }, reason: 'parrain', explanation: '' },
    { id: '016', day: 4, name: 'Madame Index', avatar: 'I', quote: '« Ce numéro ressemble au mien à un chiffre près. »', card: { number: '0081', grade: 'Rat homologué', archived: 7, valid: true }, sheet: { memberNumber: '0018', cigar: 'Flor de Oliva', observation: 'Cèdre net', appreciation: 'Apprécié' }, request: { action: 'Accès à la séance', note: 'La fiche aurait été recopiée très vite.' }, reason: 'numero', explanation: 'La carte porte le n° 0081, la fiche le n° 0018. Le Comité exige une correspondance exacte.' },
    { id: '017', day: 4, name: 'Monsieur Miroir', avatar: 'M', quote: '« Je suis deux fois dans le miroir, mais une seule fois au registre. »', card: { number: '0044', grade: 'Rat homologué', archived: 9, valid: true }, sheet: { memberNumber: '0044', cigar: 'Don Tomás Clásico', observation: 'Fumée généreuse', appreciation: 'Bien' }, request: { action: 'Accès à la séance', note: 'Miroir apporté pour vérifier la symétrie du nœud papillon.' }, reason: null, explanation: 'Les numéros correspondent. Le miroir n’a pas de statut réglementaire.' },
    { id: '018', day: 4, name: 'Colonel Poussière', avatar: 'P', quote: '« La bague a voyagé. Le cigare, beaucoup moins. »', card: { number: '0066', grade: 'Rat homologué', archived: 8, valid: true }, sheet: { memberNumber: '0066', cigar: 'Habano — origine cubaine', observation: 'Poivre doux', appreciation: 'Très satisfaisant' }, request: { action: 'Accès à la séance', note: 'Pièce jointe : facture indiquant une origine dominicaine.' }, reason: 'habano', explanation: 'La facture établit une origine dominicaine. La mention « habano » n’est donc pas justifiée.' }
  ];

  const ALL_CASES = [...CASES, ...EXTRA_CASES];
  const REASON_RULE = { carte: '01', fiche: '02', habano: '03', coupe_grade: '04', parrain: '05', inspection: '06', numero: '07' };
  REASONS.numero = 'Numéro de membre différent sur la fiche';
  const EVIDENCE = {
    carte: ['card.valid', 'rule.01'], fiche: ['sheet.appreciation', 'rule.02'],
    habano: ['sheet.cigar', 'request.note'], coupe_grade: ['card.archived', 'request.action'],
    parrain: ['card.archived', 'request.action'], inspection: ['request.note', 'rule.06'],
    numero: ['card.number', 'sheet.memberNumber']
  };
  const SAVE_KEY = 'crcc-homologation-v3';
  const DIRECTIVES = {
    '005': 'Note orale du Président : « Le Vicomte du Terroir est un ami. Évitons de vérifier sa provenance aujourd’hui. »',
    '007': 'Note orale du Président : « Laissez Monsieur Crevette présenter son candidat. Ses fiches suivront, paraît-il. »'
  };
  const incoming = new URL(window.location.href);
  let incomingSeed = /^[A-Z0-9]{4,12}$/.test((incoming.searchParams.get('defi') || '').toUpperCase()) ? incoming.searchParams.get('defi').toUpperCase() : null;
  const incomingTimed = incoming.searchParams.get('chrono') === '1';
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let state = null;
  let selection = [];
  let audio = null;
  let soundEnabled = false;
  let timer = null;

  function randomSeed() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(6);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
  }
  function seedNumber(seed) { let hash = 2166136261; for (const char of seed) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
  function seededRandom(seed) {
    let value = seedNumber(seed);
    return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function stored() {
    try {
      let data = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem('crcc-homologation-v2'));
      if (data?.version === 2) {
        const nextDay = data.index < data.order.length ? ALL_CASES.find(item => item.id === data.order[data.index])?.day : 5;
        data = { ...data, version: 3, seed: null, timed: false, favor: 0, appeal: nextDay > 1 ? { skipped: true } : null,
          cutter: nextDay > 3 ? { skipped: true } : null, timerCaseId: null, timerDeadline: null };
      }
      if (incomingSeed && data?.seed !== incomingSeed) return null;
      if (data?.version !== 3 || !Array.isArray(data.order) || data.order.length !== ALL_CASES.length ||
          new Set(data.order).size !== ALL_CASES.length || !data.order.every(id => ALL_CASES.some(item => item.id === id)) ||
          !Number.isInteger(data.index) || data.index < 0 || data.index > data.order.length ||
          (data.index === data.order.length && !['daily', 'ending'].includes(data.phase)) ||
          !['play', 'result', 'daily', 'ending', 'appeal', 'cutter', 'eventResult'].includes(data.phase) || !data.history || typeof data.history !== 'object') return null;
      return data;
    } catch (_) { return null; }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* Partie jouable sans stockage. */ } }
  function visible(section) {
    if (section !== 'play') stopTimer();
    ['intro', 'play', 'result', 'daily', 'appeal', 'cutter', 'event-result', 'ending'].forEach(id => $(id).classList.toggle('hidden', id !== section));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function tone(frequency, duration, type = 'triangle') {
    if (!soundEnabled) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch (_) { /* Son optionnel. */ }
  }
  function start() {
    const seed = incomingSeed || randomSeed(), random = seededRandom(seed);
    state = { version: 3, seed, timed: $('timed-mode').checked,
      order: [1, 2, 3, 4].flatMap(day => shuffle(ALL_CASES.filter(item => item.day === day), random).map(item => item.id)),
      index: 0, balance: 0, errors: 0, exact: 0, favor: 0, appeal: null, cutter: null,
      timerCaseId: null, timerDeadline: null, history: {}, paidDays: [], phase: 'play' };
    showCase();
  }
  function current() {
    const item = structuredClone(ALL_CASES.find(entry => entry.id === state.order[state.index]));
    if (item.id === '013') {
      const refused = state.history['002']?.verdict === 'refuse' || state.appeal?.corrected;
      item.card.valid = refused;
      item.quote = refused ? '« J’ai fait valider la carte. Le tampon est toujours là. »' : '« On m’a laissé passer sans tampon. Pourquoi changer ? »';
      item.request.note = refused ? 'Nouvelle carte validée par le Comité après contrôle.' : 'Carte inchangée depuis la précédente visite.';
      item.reason = refused ? null : 'carte';
      item.explanation = refused ? 'Après son refus, Monsieur Rature a obtenu la validation manquante. Dossier conforme.' : 'La carte est encore dépourvue de validation, malgré le précédent passage.';
    }
    if (item.id === '014') {
      const refused = state.history['008']?.verdict === 'refuse';
      item.quote = refused ? '« Voilà votre état des lieux. En trois exemplaires. »' : '« Le précédent emprunt s’est fait sans contrôle. »';
      item.request.note = refused ? 'État des lieux préalable : signé, lame intacte.' : 'État des lieux préalable : toujours absent. Lame signalée ébréchée après le précédent passage.';
      item.reason = refused ? null : 'inspection';
      item.explanation = refused ? 'Madame Velours revient avec une inspection préalable consignée. L’emprunt est recevable.' : 'L’absence d’inspection n’a pas été régularisée. Le précédent accord ne crée aucun droit.';
    }
    if (item.id === '015') {
      const refused = state.history['007']?.verdict === 'refuse';
      item.card.archived = refused ? 3 : 1;
      item.card.grade = refused ? 'Rat homologué' : 'Rat de passage';
      item.quote = refused ? '« Trois fiches. Je les ai même remplies. »' : '« On m’a dit oui l’autre fois. J’ai gardé ma fiche unique. »';
      item.request.note = refused ? 'Candidat : Monsieur Parapluie. Pièces jointes. Deux fiches supplémentaires archivées.' : 'Candidat : Monsieur Parapluie. Aucune fiche supplémentaire.';
      item.reason = refused ? null : 'parrain';
      item.explanation = refused ? 'Monsieur Crevette a désormais 3 fiches archivées et peut proposer ce candidat.' : 'Une seule fiche archivée : le parrainage reste irrecevable.';
    }
    return item;
  }
  function evidenceButton(key, label, value, css = '') {
    return `<button type="button" class="evidence ${css}" data-evidence="${escapeHTML(key)}" data-label="${escapeHTML(label)} : ${escapeHTML(value || '—')}" aria-pressed="false">${escapeHTML(value || '—')}</button>`;
  }
  function row(key, label, value) {
    return `<div class="doc-row"><span>${escapeHTML(label)}</span>${evidenceButton(key, label, value)}</div>`;
  }
  function documentCard(code, title, rows, note, noteKey, stamp, stampKey) {
    return `<article class="document"><div class="document-head"><span>CRCC / ${escapeHTML(code)}</span><span>PIÈCE OFFICIELLE</span></div><h3>${escapeHTML(title)}</h3>${rows}${note ? `<div class="doc-note">${evidenceButton(noteKey, 'Mention', note)}</div>` : ''}${stamp ? evidenceButton(stampKey, 'Validation', stamp, 'doc-stamp') : ''}</article>`;
  }
  function selectionUI() {
    document.querySelectorAll('[data-evidence]').forEach(button => button.setAttribute('aria-pressed', String(selection.some(part => part.key === button.dataset.evidence))));
    $('comparison-text').textContent = selection.length ? selection.map(part => part.label).join('  ↔  ') : 'Cliquez sur une mention du dossier ou un article du règlement, puis sur une seconde.';
    $('clear-evidence').disabled = !selection.length;
    $('refuse-button').disabled = selection.length !== 2;
    $('confirm-refusal').disabled = selection.length !== 2 || !$('reason-select').value;
  }
  function selectEvidence(button) {
    const key = button.dataset.evidence;
    if (selection.some(part => part.key === key)) selection = selection.filter(part => part.key !== key);
    else selection = selection.length === 2 ? [{ key, label: button.dataset.label }] : [...selection, { key, label: button.dataset.label }];
    selectionUI(); tone(240, .06);
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function tickTimer() {
    if (!state?.timed || state.phase !== 'play') return;
    const seconds = Math.max(0, Math.ceil((state.timerDeadline - Date.now()) / 1000));
    $('timer-label').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    $('timer-box').classList.toggle('urgent', seconds <= 20);
    if (seconds === 0) decide('timeout');
  }
  function startTimer(item) {
    stopTimer();
    $('timer-box').classList.toggle('hidden', !state.timed);
    if (!state.timed) return;
    if (state.timerCaseId !== item.id || !Number.isFinite(state.timerDeadline)) {
      state.timerCaseId = item.id;
      state.timerDeadline = Date.now() + 120000;
      save();
    }
    timer = setInterval(tickTimer, 250);
    tickTimer();
  }
  function showCase() {
    const item = current(), card = item.card, sheet = item.sheet, request = item.request;
    $('day-label').textContent = `${String(item.day).padStart(2, '0')} / 04`;
    $('case-label').textContent = `${String(state.index + 1).padStart(2, '0')} / ${state.order.length}`;
    $('balance-label').textContent = `${state.balance} F`;
    $('errors-label').textContent = state.errors;
    $('bulletin').innerHTML = `<b>BULLETIN N° ${item.day} —</b> ${escapeHTML(BULLETINS[item.day])}`;
    $('president-note').classList.toggle('hidden', !DIRECTIVES[item.id]);
    $('president-note').textContent = DIRECTIVES[item.id] || '';
    $('visitor-avatar').textContent = item.avatar;
    $('visitor-name').textContent = item.name;
    $('visitor-quote').textContent = item.quote;
    $('queue-number').textContent = `N° ${item.id}`;
    const activeRules = RULES.filter(rule => rule.day <= item.day);
    $('rules-list').innerHTML = [1, 2, 3, 4].filter(day => day <= item.day).map(day =>
      `<div class="rule-group"><h3>${day === 1 ? 'DISPOSITIONS PERMANENTES' : `CIRCULAIRE DU JOUR ${day}`}</h3>${activeRules.filter(rule => rule.day === day).map(rule => `<div class="rule"><b>${rule.id}</b>${evidenceButton(`rule.${rule.id}`, `Article ${rule.id}`, rule.text)}</div>`).join('')}</div>`
    ).join('');
    $('documents').innerHTML =
      documentCard('MEM', 'Carte de membre', row('card.number', 'N°', card.number) + row('card.grade', 'Grade', card.grade) + row('card.archived', 'Fiches archivées', String(card.archived)), `Titulaire : ${item.name}`, 'card.name', card.valid ? 'VALIDÉ · COMITÉ' : 'VALIDATION ABSENTE', 'card.valid') +
      documentCard('FD', 'Fiche du jour', (sheet.memberNumber ? row('sheet.memberNumber', 'N° membre', sheet.memberNumber) : '') + row('sheet.cigar', 'Cigare', sheet.cigar) + row('sheet.observation', 'Observation', sheet.observation) + row('sheet.appreciation', 'Appréciation', sheet.appreciation), 'Document destiné aux archives du Club.', 'sheet.note', 'FICHE REÇUE', 'sheet.stamp') +
      documentCard('REQ', 'Demande au guichet', row('request.action', 'Objet', request.action), request.note, 'request.note', 'DÉPOSÉ CE JOUR', 'request.stamp');
    $('reason-select').innerHTML = '<option value="">Choisir le motif…</option>' + Object.entries(REASONS).filter(([key]) => activeRules.some(rule => rule.id === REASON_RULE[key])).map(([key, label]) => `<option value="${key}">${escapeHTML(label)}</option>`).join('');
    $('reason-select').value = '';
    selection = [];
    $('reason-picker').classList.add('hidden'); $('actions').classList.remove('hidden');
    selectionUI(); state.phase = 'play'; save(); visible('play'); startTimer(item);
  }
  function decide(verdict, reason = null) {
    if (state.phase !== 'play' || (verdict === 'refuse' && (selection.length !== 2 || !reason))) return;
    const item = current();
    const correctVerdict = verdict !== 'timeout' && (verdict === 'refuse') === Boolean(item.reason);
    const correctReason = verdict === 'approve' || reason === item.reason;
    const correctEvidence = verdict === 'approve' || EVIDENCE[item.reason]?.every(key => selection.some(part => part.key === key));
    const exact = Boolean(correctVerdict && correctReason && correctEvidence);
    const delta = verdict === 'timeout' ? -40 : exact ? (verdict === 'refuse' ? 75 : 50) : correctVerdict ? -30 : -80;
    state.balance += delta;
    if (exact) state.exact++; else state.errors++;
    if (DIRECTIVES[item.id] && verdict !== 'timeout') state.favor += verdict === 'approve' ? 1 : -1;
    state.history[item.id] = { verdict, reason, evidence: selection.map(part => part.key), exact, delta, day: item.day };
    stopTimer(); state.timerCaseId = null; state.timerDeadline = null;
    state.phase = 'result'; save(); showResult();
    tone(exact ? 330 : 130, .13, exact ? 'triangle' : 'sawtooth');
    setTimeout(() => tone(exact ? 440 : 110, .18), 110);
  }
  function showResult() {
    const item = current(), outcome = state.history[item.id];
    if (!outcome) { showCase(); return; }
    $('result-stamp').className = `result-stamp ${outcome.exact ? 'good' : 'bad'}`;
    $('result-stamp').textContent = outcome.exact ? 'CONFORME' : 'OBSERVATION';
    $('result-title').textContent = outcome.verdict === 'timeout' ? 'Délai expiré.' : outcome.exact ? (outcome.verdict === 'approve' ? 'Accès accordé.' : 'Refus motivé.') : 'Le Comité relève une anomalie.';
    const expectedPair = item.reason ? `La comparaison utile était : ${EVIDENCE[item.reason].map(key => ({ 'card.valid': 'validation de la carte', 'rule.01': 'article 01', 'sheet.appreciation': 'appréciation', 'rule.02': 'article 02', 'sheet.cigar': 'cigare déclaré', 'request.note': 'pièce ou mention jointe', 'card.archived': 'fiches archivées', 'request.action': 'objet de la demande', 'rule.06': 'article 06', 'card.number': 'numéro de la carte', 'sheet.memberNumber': 'numéro de la fiche' }[key])).join(' et ')}.` : '';
    const pressure = DIRECTIVES[item.id] && outcome.verdict !== 'timeout' ? (outcome.verdict === 'approve' ? ' Le Président apprécie votre docilité. Le règlement, moins.' : ' Le Président prend personnellement note de votre indépendance.') : '';
    $('result-text').textContent = (outcome.verdict === 'timeout' ? `Le dossier a été renvoyé sans décision. ${item.explanation}` : outcome.exact ? item.explanation : `${item.explanation} ${expectedPair}`) + pressure;
    $('result-ledger').textContent = `${outcome.delta > 0 ? '+' : ''}${outcome.delta} F · Caisse du bureau : ${state.balance} F`;
    const lastOfDay = state.index === state.order.length - 1 || ALL_CASES.find(entry => entry.id === state.order[state.index + 1]).day !== item.day;
    $('next-button').innerHTML = lastOfDay ? 'CLÔTURER LA JOURNÉE <span>→</span>' : 'DOSSIER SUIVANT <span>→</span>';
    visible('result');
  }
  function next() {
    if (state.phase !== 'result') return;
    const lastDay = current().day;
    state.index++;
    if (state.index === state.order.length || current().day !== lastDay) closeDay(lastDay);
    else showCase();
  }
  function closeDay(day) {
    if (!state.paidDays.includes(day)) {
      const results = Object.values(state.history).filter(entry => entry.day === day);
      const exact = results.filter(entry => entry.exact).length;
      const quota = day >= 3 ? 4 : 3;
      state.balance += exact >= quota ? 40 : -40;
      state.paidDays.push(day);
    }
    state.phase = 'daily'; save(); showDaily(day);
  }
  function showDaily(day) {
    const results = Object.values(state.history).filter(entry => entry.day === day);
    const exact = results.filter(entry => entry.exact).length, quota = day >= 3 ? 4 : 3;
    const paid = exact >= quota;
    $('daily-kicker').textContent = `CRCC / FIN DU JOUR ${String(day).padStart(2, '0')}`;
    $('daily-title').textContent = paid ? 'Quota rempli. Le Comité prend note.' : 'Quota manqué. Le Comité aussi.';
    $('daily-copy').textContent = `Vous avez rendu ${exact} décision${exact > 1 ? 's' : ''} parfaitement justifiée${exact > 1 ? 's' : ''} sur ${results.length} dossiers. L’objectif du jour était de ${quota}.`;
    $('daily-lines').innerHTML = `<div><span>Décisions conformes</span><strong>${exact} / ${results.length}</strong></div><div><span>${paid ? 'Prime de rigueur' : 'Retenue administrative'}</span><strong>${paid ? '+40' : '-40'} F</strong></div><div><span>Caisse cumulée</span><strong>${state.balance} F</strong></div><div><span>Faveur du Président</span><strong>${state.favor > 0 ? '+' : ''}${state.favor}</strong></div>`;
    const notes = {
      1: state.history['002']?.verdict === 'refuse' ? 'Monsieur Rature a déposé une demande de nouveau tampon. Elle sera examinée.' : 'Monsieur Rature affirme que son entrée sans tampon constitue désormais une tradition.',
      2: 'Le Coupe-cigare du Président reste sur son coussin. Le coussin a demandé une indemnité.',
      3: state.history['008']?.verdict === 'refuse' ? 'Madame Velours prépare trois exemplaires de son état des lieux.' : 'Une note concernant la lame du Coupe-cigare circule sans signature.',
      4: 'Le Comité se réunit pour établir si le Comité a été suffisamment consulté.'
    };
    $('daily-note').textContent = notes[day];
    $('continue-button').innerHTML = day === 4 ? 'DÉPOSER LE RAPPORT FINAL <span>→</span>' : 'OUVRIR LE GUICHET DEMAIN <span>→</span>';
    visible('daily');
  }
  function continueDay() {
    if (state.phase !== 'daily') return;
    const day = state.paidDays.at(-1);
    if (day === 1 && !state.appeal) showAppeal();
    else if (day === 3 && !state.cutter) showCutter();
    else if (state.index === state.order.length) finish();
    else showCase();
  }
  function showAppeal() {
    const earlier = state.history['002'];
    $('appeal-intro').textContent = earlier?.verdict === 'refuse' ? 'Vous avez refusé sa carte le jour 1. Monsieur Rature conteste le refus et présente aujourd’hui une carte dûment tamponnée.' : earlier?.verdict === 'timeout' ? 'Son dossier est resté sans décision le jour 1. Le Comité exige maintenant de statuer sur cette omission.' : 'Monsieur Rature a été admis le jour 1. Le Comité contrôle maintenant la validité de cette admission.';
    $('appeal-question').textContent = 'Le nouveau tampon change-t-il la validité de la décision prise le jour 1 ? Jugez les pièces telles qu’elles existaient alors.';
    $('appeal-uphold').textContent = earlier?.verdict === 'refuse' ? 'CONFIRMER LE REFUS' : earlier?.verdict === 'timeout' ? 'CLASSER SANS SUITE' : 'MAINTENIR L’ADMISSION';
    $('appeal-revise').textContent = earlier?.verdict === 'refuse' ? 'ANNULER LE REFUS' : earlier?.verdict === 'timeout' ? 'RECTIFIER L’OMISSION' : 'RECTIFIER L’ADMISSION';
    state.phase = 'appeal'; save(); visible('appeal');
  }
  function decideAppeal(choice) {
    if (state.phase !== 'appeal') return;
    const admitted = state.history['002']?.verdict !== 'refuse';
    const correct = admitted ? choice === 'revise' : choice === 'uphold';
    const delta = correct ? 60 : -60;
    state.balance += delta;
    state.appeal = { choice, correct, delta, corrected: admitted && correct };
    state.eventType = 'appeal'; state.phase = 'eventResult'; save(); showEventResult();
  }
  function cutterSVG(defect) {
    const scratch = defect === 'blade' ? '<path d="M68 78l15 21m-11-23l15 21" stroke="#a04432" stroke-width="3"/>' : '';
    const pivot = defect === 'pivot' ? '<path d="M185 76l16 22" stroke="#a04432" stroke-width="3"/>' : '';
    const handle = defect === 'handle' ? '<path d="M184 136l12-14" stroke="#a04432" stroke-width="4"/>' : '';
    return `<svg viewBox="0 0 240 180" role="img" aria-label="Coupe-cigare ${defect === 'none' ? 'intact' : 'à examiner'}"><rect x="24" y="35" width="192" height="110" rx="16" fill="#59473d" stroke="#ab906e" stroke-width="4"/><circle cx="120" cy="90" r="28" fill="#e9deca" stroke="#ab906e" stroke-width="3"/><path d="M39 90L100 70v40Z" fill="#b8b7ad" stroke="#6c6b68" stroke-width="2"/><path d="M201 90l-61-20v40Z" fill="#b8b7ad" stroke="#6c6b68" stroke-width="2"/><circle cx="193" cy="90" r="8" fill="#ad946f" stroke="#e2c79e" stroke-width="3"/><path d="M30 130q12 22 32 4M210 130q-12 22-32 4" fill="none" stroke="#ab906e" stroke-width="5"/>${scratch}${pivot}${handle}</svg>`;
  }
  function showCutter() {
    const part = ['blade', 'pivot', 'handle', 'none'][seedNumber(state.seed || 'LEGACY') % 4];
    state.cutterTarget = part;
    $('cutter-before').innerHTML = cutterSVG('none');
    $('cutter-after').innerHTML = cutterSVG(part);
    state.phase = 'cutter'; save(); visible('cutter');
  }
  function decideCutter(choice) {
    if (state.phase !== 'cutter') return;
    const correct = choice === state.cutterTarget, delta = correct ? 50 : -40;
    state.balance += delta;
    state.cutter = { choice, part: state.cutterTarget, correct, delta };
    state.eventType = 'cutter'; state.phase = 'eventResult'; save(); showEventResult();
  }
  function showEventResult() {
    const appeal = state.eventType === 'appeal', result = appeal ? state.appeal : state.cutter;
    $('event-result-kicker').textContent = appeal ? 'AVIS DE LA COMMISSION D’APPEL' : 'RAPPORT D’INSPECTION';
    $('event-result-stamp').className = `result-stamp ${result.correct ? 'good' : 'bad'}`;
    $('event-result-stamp').textContent = result.correct ? 'CONFORME' : 'OBSERVATION';
    $('event-result-title').textContent = appeal ? result.correct ? 'Appel correctement jugé.' : 'Le Comité infirme votre avis.' : result.correct ? 'Différence consignée.' : 'Inspection contestée.';
    $('event-result-text').textContent = appeal ? 'La carte du jour 1 était dépourvue de validation. Le tampon obtenu le jour 2 régularise les visites futures, sans modifier le passé.' : `État des lieux : ${result.part === 'none' ? 'aucune différence' : { blade: 'rayure sur la lame', pivot: 'fissure près du pivot', handle: 'entaille sur la poignée' }[result.part]}. Le Président exige un rapport sur la précision de ce rapport.`;
    $('event-result-ledger').textContent = `${result.delta > 0 ? '+' : ''}${result.delta} F · Caisse du bureau : ${state.balance} F`;
    visible('event-result');
  }
  function eventNext() { if (state.phase === 'eventResult') showCase(); }
  function linkFor(seed, timed) {
    const url = new URL(window.location.href);
    url.hash = ''; url.search = '';
    if (seed) url.searchParams.set('defi', seed);
    if (timed) url.searchParams.set('chrono', '1');
    return url.toString();
  }
  function challengeURL() { return linkFor(state.seed, state.timed); }
  function showIntroChallenge() {
    if (!incomingSeed) return;
    const url = linkFor(incomingSeed, $('timed-mode').checked);
    $('challenge-label').textContent = `DÉFI PARTAGÉ · CODE ${incomingSeed} · MÊME ORDRE DE DOSSIERS`;
    $('challenge-label').classList.remove('hidden');
    $('challenge-url').value = url;
    $('challenge-share').classList.remove('hidden');
    window.history.replaceState(null, '', url);
    $('resume-button').classList.toggle('hidden', !stored());
  }
  async function copyChallenge() {
    const url = $('challenge-url').value;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        $('challenge-url').select();
        if (!document.execCommand('copy')) throw Error('copy unavailable');
      }
      $('challenge-status').textContent = 'Lien copié. Transmettez-le à votre collègue de guichet.';
    } catch (_) {
      $('challenge-url').select();
      $('challenge-status').textContent = 'Sélectionnez et copiez le lien ci-dessus.';
    }
  }
  function shareText() {
    const rank = $('ending-title').textContent;
    return `CRCC — La Grande Homologation : ${state.exact}/${state.order.length} décisions exactes, ${state.errors} observations, ${state.balance} F en caisse. Grade : ${rank}. ${state.timed ? 'Mode chrono.' : 'Mode tranquille.'} Même défi : ${challengeURL()} On pipe rien, mais on a des fiches.`;
  }
  function finish() {
    const score = state.exact;
    const rank = score === 18 ? 'Grand Rat du guichet' : score >= 14 ? 'Rat homologué aux tampons' : score >= 9 ? 'Rat à peu près compétent' : 'Rat de passage surveillé';
    $('ending-title').textContent = rank;
    let story = score === 18 ? 'Dix-huit dossiers, aucun écart. Le Comité envisage de vous confier un second tampon. La décision est reportée.' : score >= 14 ? 'Votre application du règlement est remarquée. Le Comité demande néanmoins un rapport sur cette remarque.' : score >= 9 ? 'Vous avez conservé une certaine dignité administrative. Les erreurs feront l’objet d’un dossier distinct.' : 'Le Comité recommande une lecture lente du règlement, si possible avant de tamponner.';
    if (state.history['008']?.verdict === 'approve') story += ' Quant au Coupe-cigare, une expertise de la lame est toujours en cours.';
    if (state.history['007']?.verdict === 'refuse' && state.history['015']?.verdict === 'approve') story += ' Monsieur Crevette vous remercie pour sa promotion, avec une retenue inhabituelle.';
    if (state.favor > 0) story += ' Le Président vous adresse une chaleureuse note sans numéro de référence.';
    if (state.favor < 0) story += ' Le Président respecte votre indépendance avec une froideur protocolaire.';
    $('ending-copy').textContent = story;
    $('ending-stats').innerHTML = `<div><strong>${score}/${state.order.length}</strong><span>Décisions exactes</span></div><div><strong>${state.errors}</strong><span>Observations</span></div><div><strong>${state.balance} F</strong><span>Caisse finale</span></div>`;
    $('ending-special').textContent = `Commission d’appel : ${state.appeal?.correct ? 'avis juste' : state.appeal?.skipped ? 'non tenue' : 'avis contesté'}. Coupe-cigare : ${state.cutter?.correct ? 'inspection juste' : state.cutter?.skipped ? 'non inspecté' : 'inspection contestée'}. Faveur du Président : ${state.favor > 0 ? '+' : ''}${state.favor}.`;
    $('share-preview').textContent = shareText(); $('share-status').textContent = '';
    state.phase = 'ending'; save(); visible('ending');
  }
  async function copyScore() {
    const result = shareText();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(result);
      else {
        const field = document.createElement('textarea');
        field.value = result; field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw Error('copy unavailable');
      }
      $('share-status').textContent = 'Résultat copié. Le Comité autorise sa diffusion.';
    } catch (_) { $('share-status').textContent = 'Copie indisponible : sélectionnez le texte ci-dessus pour le partager.'; }
  }
  async function shareScore() {
    if (!navigator.share) return copyScore();
    try { await navigator.share({ title: 'La Grande Homologation — CRCC', text: shareText() }); $('share-status').textContent = 'Rapport partagé.'; }
    catch (error) { if (error?.name !== 'AbortError') await copyScore(); }
  }
  $('start-button').addEventListener('click', start);
  $('create-challenge').addEventListener('click', () => {
    incomingSeed = randomSeed();
    $('challenge-status').textContent = '';
    showIntroChallenge();
  });
  $('copy-challenge').addEventListener('click', copyChallenge);
  $('timed-mode').addEventListener('change', showIntroChallenge);
  $('restart-button').addEventListener('click', start);
  $('resume-button').addEventListener('click', () => {
    state = stored(); if (!state) return;
    if (state.phase === 'play') showCase();
    else if (state.phase === 'result') showResult();
    else if (state.phase === 'daily') showDaily(state.index === state.order.length ? 4 : current().day - 1);
    else if (state.phase === 'appeal') showAppeal();
    else if (state.phase === 'cutter') showCutter();
    else if (state.phase === 'eventResult') showEventResult();
    else finish();
  });
  $('documents').addEventListener('click', event => { const button = event.target.closest('[data-evidence]'); if (button) selectEvidence(button); });
  $('rules-list').addEventListener('click', event => { const button = event.target.closest('[data-evidence]'); if (button) selectEvidence(button); });
  $('clear-evidence').addEventListener('click', () => { selection = []; selectionUI(); });
  $('approve-button').addEventListener('click', () => decide('approve'));
  $('refuse-button').addEventListener('click', () => { if (selection.length !== 2) return; $('actions').classList.add('hidden'); $('reason-picker').classList.remove('hidden'); $('reason-select').focus(); });
  $('cancel-refusal').addEventListener('click', () => { $('reason-picker').classList.add('hidden'); $('actions').classList.remove('hidden'); $('refuse-button').focus(); });
  $('reason-select').addEventListener('change', selectionUI);
  $('confirm-refusal').addEventListener('click', () => decide('refuse', $('reason-select').value));
  $('next-button').addEventListener('click', next);
  $('continue-button').addEventListener('click', continueDay);
  $('appeal-uphold').addEventListener('click', () => decideAppeal('uphold'));
  $('appeal-revise').addEventListener('click', () => decideAppeal('revise'));
  $('cutter-options').addEventListener('click', event => { const button = event.target.closest('[data-part]'); if (button) decideCutter(button.dataset.part); });
  $('event-next').addEventListener('click', eventNext);
  $('share-button').addEventListener('click', shareScore);
  $('copy-button').addEventListener('click', copyScore);
  $('sound-toggle').addEventListener('click', () => { soundEnabled = !soundEnabled; $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled)); $('sound-toggle').textContent = soundEnabled ? '♫ Son activé' : '♪ Son coupé'; tone(420, .12); });
  $('timed-mode').checked = incomingTimed;
  if (incomingSeed) showIntroChallenge();
  $('resume-button').classList.toggle('hidden', !stored());
})();
