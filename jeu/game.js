/* CRCC — La Grande Homologation. Aucun compte, aucune donnée envoyée. */
(() => {
  'use strict';

  const REASONS = {
    carte: 'Carte non validée par le Comité',
    fiche: 'Fiche de dégustation incomplète',
    habano: '« Habano » sans preuve d’origine cubaine',
    coupe_grade: 'Emprunt du Coupe-cigare sans 3 fiches archivées',
    parrain: 'Présentation d’un candidat sans 3 fiches archivées',
    inspection: 'Inspection préalable du Coupe-cigare absente',
    fictif: 'Cigare absent du catalogue homologué',
    exclusion: 'Exclusion sans procès-verbal contradictoire',
    registre_absent: 'Carte absente du registre des membres',
    registre_numero: 'Numéro de carte différent du registre',
    registre_grade: 'Grade de la carte différent du registre',
    promotion: 'Promotion sans 8 fiches archivées'
  };

  const RULES = [
    { day: 1, id: '01', text: 'La carte de membre doit porter la validation du Comité exécutif.' },
    { day: 1, id: '02', text: 'La fiche du jour doit indiquer le cigare, une observation et une appréciation.' },
    { day: 1, id: '08', text: 'Seuls les cigares du catalogue homologué peuvent figurer sur une fiche. Consultez le livre rouge du bureau ; un cigare inventé invalide la fiche.' },
    { day: 1, id: '12', text: 'La carte doit correspondre à une inscription au registre des membres : nom, numéro et grade. Une carte sans inscription ou avec une mention discordante est invalide.' },
    { day: 2, id: '03', text: 'Le terme « habano » exige une preuve de provenance cubaine jointe au dossier.' },
    { day: 2, id: '04', text: 'Le Coupe-cigare du Président est empruntable à partir de 3 fiches archivées.' },
    { day: 3, id: '05', text: 'Proposer un nouveau membre exige également 3 fiches archivées.' },
    { day: 3, id: '06', text: 'Tout emprunt du Coupe-cigare requiert un état des lieux préalable consigné.' },
    { day: 4, id: '09', text: 'Une exclusion exige un procès-verbal contradictoire signé, joint à la demande.' },
    { day: 4, id: '10', text: 'Une promotion exige au moins 8 fiches archivées et une carte validée.' }
  ];

  const BULLETINS = {
    1: 'Le Comité rappelle que la présence d’un tampon est une preuve de tampon, ce qui constitue un début.',
    2: 'Circulaire du jour : contrôle renforcé des « habanos » et des mains approchant le Coupe-cigare.',
    3: 'Nouvelle directive : les parrainages et l’état des lieux du Coupe-cigare relèvent désormais du guichet.'
  };

  // Chaque dossier comporte une seule infraction déterminante, ou aucune.
  const CASES = [
    { id: '001', day: 1, name: 'Madame Braise', avatar: 'B', quote: '« J’ai même rempli la case “appréciation”. Je suis bouleversée. »', card: { number: '0041', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Tirage souple, notes de bois', appreciation: 'Agréable' }, request: { action: 'Soumission de fiche de dégustation', note: 'Demande d’archivage de la fiche du jour. Souhaite aussi une chaise avec dossier.' }, reason: null, explanation: 'Carte validée, cigare homologué et fiche complète : son archivage est recevable.' },
    { id: '002', day: 1, name: 'Monsieur Rature', avatar: 'R', quote: '« Le cachet était beaucoup trop voyant, je l’ai retiré. »', card: { number: '0019', grade: 'Rat de passage', archived: 2, valid: false }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Fumée dense', appreciation: 'Correct' }, request: { action: 'Accès à la séance', note: 'Promet de ne plus retoucher les documents.' }, reason: 'carte', explanation: 'La carte ne porte aucune validation du Comité.' },
    { id: '003', day: 1, name: 'Capitaine Cendre', avatar: 'C', quote: '« Mon avis se lit dans mon regard. »', card: { number: '0036', grade: 'Rat de passage', archived: 0, valid: true }, sheet: { cigar: 'San Pedro de Macorís', observation: 'Combustion régulière', appreciation: '' }, request: { action: 'Soumission de fiche de dégustation', note: 'Demande d’archivage. Le candidat regarde intensément sa fiche.' }, reason: 'fiche', explanation: 'La case « appréciation » est vide. Un regard ne s’archive pas.' },
    { id: '004', day: 2, name: 'Madame Minuit', avatar: 'M', quote: '« Je demande un fauteuil. Pas une promotion. »', card: { number: '0008', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois et café', appreciation: 'Équilibré' }, request: { action: 'Accès à la séance', note: 'Souhaite un fauteuil avec une autorité naturelle.' }, reason: null, explanation: 'Toutes les pièces sont conformes. La demande de fauteuil reste libre.' },
    { id: '005', day: 2, name: 'Le Vicomte du Terroir', avatar: 'V', quote: '« C’est un habano. Je l’ai décidé au nez. »', card: { number: '0012', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'Habano — origine cubaine', observation: 'Épices légères', appreciation: 'Très bon' }, request: { action: 'Accès à la séance', note: 'Preuve de provenance : aucune pièce jointe.' }, reason: 'habano', explanation: 'Le mot « habano » figure sur la fiche, sans preuve de provenance cubaine.' },
    { id: '006', day: 2, name: 'Monsieur Tremblote', avatar: 'T', quote: '« Je ne le toucherai qu’avec respect et des gants imaginaires. »', card: { number: '0063', grade: 'Rat de passage', archived: 2, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Notes de pain grillé', appreciation: 'Satisfaisant' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux : impeccablement rempli.' }, reason: 'coupe_grade', explanation: 'Il n’a que 2 fiches archivées. Il en faut 3 pour emprunter le Coupe-cigare.' },
    { id: '007', day: 3, name: 'Monsieur Crevette', avatar: 'C', quote: '« J’ai trouvé un candidat d’une grande tenue. Il possède des chaussures. »', card: { number: '0007', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois sec, tirage net', appreciation: 'Convaincant' }, request: { action: 'Proposition d’un nouveau membre', note: 'Candidat : Monsieur Parapluie. Dossier joint.' }, reason: 'parrain', explanation: 'Pour proposer un membre, il faut 3 fiches archivées. Monsieur Crevette n’en a qu’une.' },
    { id: '008', day: 3, name: 'Madame Velours', avatar: 'V', quote: '« Il était déjà comme ça avant. Enfin, je suppose. »', card: { number: '0025', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { cigar: 'San Pedro de Macorís', observation: 'Tirage franc', appreciation: 'Bon' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable : absent. Mention manuscrite : « il était déjà comme ça avant ».' }, reason: 'inspection', explanation: 'L’état des lieux préalable manque. Cette formule manuscrite ne le remplace pas.' },
    { id: '009', day: 3, name: 'Docteur Moustache', avatar: 'M', quote: '« Mes trois fiches ont reçu le tampon. Je n’en reviens pas. »', card: { number: '0033', grade: 'Rat homologué', archived: 3, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Cèdre et café', appreciation: 'Équilibré' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable : signé, lame intacte.' }, reason: null, explanation: 'Trois fiches archivées et inspection préalable consignée : l’emprunt est recevable.' },
    { id: '010', day: 3, name: 'Madame Sans-Gêne', avatar: 'S', quote: '« Je propose mon ami. Il dit sentir la photocopieuse du mercredi. »', card: { number: '0011', grade: 'Rat homologué', archived: 10, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Cèdre léger', appreciation: 'Personnellement, j’aime bien' }, request: { action: 'Proposition d’un nouveau membre', note: 'Candidat : Monsieur Mercredi. Pièces de candidature jointes.' }, reason: null, explanation: 'Dossier conforme. Les propos du candidat sont curieux, mais le règlement ne punit pas la poésie involontaire.' }
  ];

  RULES.push({ day: 4, id: '07', text: 'Le numéro inscrit sur la fiche du jour doit correspondre à celui de la carte.' });
  RULES.push({ day: 4, id: '11', text: 'Un siège au Comité ne peut être accordé qu’à un membre du CRCC dont la carte est validée et qui possède 8 fiches archivées.' });
  RULES.sort((a, b) => a.day - b.day || Number(a.id) - Number(b.id));
  BULLETINS[4] = 'Dernière circulaire : vérifiez aussi les numéros. Le Comité refuse de compter deux fois le même membre.';

  const EXTRA_CASES = [
    { id: '011', day: 1, name: 'Madame Tampon', avatar: 'T', quote: '« Je demande une autorisation pour tourner le cendrier de onze degrés. »', card: { number: '0074', grade: 'Rat de passage', archived: 0, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois discret', appreciation: 'Plaisant' }, request: { action: 'Dérogation : orientation du cendrier à 11°', note: 'Mesure au rapporteur jointe. Tampon privé en forme de navet, non appliqué aux pièces.' }, reason: null, explanation: 'Aucun article ne régit l’angle du cendrier. Le tampon décoratif n’altère aucun document.' },
    { id: '012', day: 2, name: 'Signor Cacao', avatar: 'C', quote: '« Cette fois, la provenance est écrite. En toutes lettres. »', card: { number: '0057', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Habano — origine cubaine', observation: 'Cacao et épices', appreciation: 'Franc' }, request: { action: 'Accès à la séance', note: 'Preuve de provenance cubaine : facture d’origine jointe et lisible.' }, reason: null, explanation: 'L’origine cubaine est documentée. Le mot « habano » est ici recevable.' },
    { id: '013', day: 3, name: 'Monsieur Rature', avatar: 'R', quote: '', card: { number: '0019', grade: 'Rat homologué', archived: 3, valid: false }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Bois et café', appreciation: 'Sobre' }, request: { action: 'Accès à la séance', note: '' }, reason: 'carte', explanation: '' },
    { id: '014', day: 4, name: 'Madame Velours', avatar: 'V', quote: '', card: { number: '0025', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { memberNumber: '0025', cigar: 'San Pedro de Macorís', observation: 'Tirage régulier', appreciation: 'Équilibré' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: '' }, reason: 'inspection', explanation: '' },
    { id: '015', day: 4, name: 'Monsieur Crevette', avatar: 'C', quote: '', card: { number: '0007', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { memberNumber: '0007', cigar: 'Flor de Oliva', observation: 'Bois sec', appreciation: 'Honnête' }, request: { action: 'Proposition d’un nouveau membre', note: '' }, reason: 'parrain', explanation: '' },
    { id: '016', day: 4, name: 'Madame Index', avatar: 'I', quote: '« Ce numéro ressemble au mien à un chiffre près. »', card: { number: '0081', grade: 'Rat homologué', archived: 7, valid: true }, sheet: { memberNumber: '0018', cigar: 'Flor de Oliva', observation: 'Cèdre net', appreciation: 'Apprécié' }, request: { action: 'Accès à la séance', note: 'La fiche aurait été recopiée très vite.' }, reason: 'numero', explanation: 'La carte porte le n° 0081, la fiche le n° 0018. Le Comité exige une correspondance exacte.' },
    { id: '017', day: 4, name: 'Monsieur Miroir', avatar: 'M', quote: '« Mon nœud papillon penche de 0,5 degré. Je sollicite une dérogation. »', card: { number: '0044', grade: 'Rat homologué', archived: 9, valid: true }, sheet: { memberNumber: '0044', cigar: 'Don Tomás Clásico', observation: 'Fumée généreuse', appreciation: 'Bien' }, request: { action: 'Dérogation : nœud papillon incliné de 0,5°', note: 'Miroir et rapporteur apportés pour mesurer la déviation.' }, reason: null, explanation: 'Les numéros correspondent. Aucun article ne réglemente l’angle du nœud papillon.' },
    { id: '018', day: 4, name: 'Colonel Poussière', avatar: 'P', quote: '« Cette facture paraît trop propre ? Le cigare, lui, est impeccable. »', card: { number: '0066', grade: 'Rat homologué', archived: 8, valid: true }, sheet: { memberNumber: '0066', cigar: 'Habano — origine cubaine', observation: 'Poivre doux', appreciation: 'Très satisfaisant' }, request: { action: 'Accès à la séance', note: 'Facture cubaine jointe et lisible. Le Colonel a ajouté un sceau personnel sans valeur réglementaire.' }, reason: null, explanation: 'La facture atteste l’origine cubaine. Le sceau décoratif ne rend pas cette preuve invalide.' },
    { id: '019', day: 1, name: 'Monsieur Chausson', avatar: 'C', quote: '« Il est roulé à la main. Dans mon imagination. »', card: { number: '0092', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Le Chausson Diplomatique Grand Panetela', observation: 'Arôme de réunion annulée', appreciation: 'Inoubliable' }, request: { action: 'Soumission de fiche de dégustation', note: 'Étiquette imprimée sur l’imprimante des archives. Aucun achat consigné.' }, reason: 'fictif', explanation: 'Le Chausson Diplomatique ne figure pas au catalogue homologué : ce cigare a été inventé.' },
    // Questions vérifiées dans l’anatomie officielle du Habano : https://www.habanos.com/en/the-anatomy-of-a-habano/
    { id: '020', day: 2, name: 'Professeur Volute', avatar: 'V', quote: '« Une question technique. Je n’accepte pas “ça dépend du vent”. »', card: { number: '0028', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Tirage droit', appreciation: 'Fin' }, request: { action: 'Question sur les cigares', note: 'Quelle feuille de la tripe apporte de la force et brûle lentement ?' }, quiz: { options: ['Volado', 'Ligero', 'Capote'], answer: 1, explanation: 'Le ligero apporte de la force et brûle lentement.' }, reason: null, explanation: 'La question est recevable et les pièces sont conformes. Le questionnaire est un bonus distinct de la décision.' },
    { id: '021', day: 2, name: 'Madame Retour', avatar: 'R', quote: '« Je le rends avec son coussin, comme demandé. Le coussin proteste. »', card: { number: '0038', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois clair', appreciation: 'Satisfaisant' }, request: { action: 'Restitution du Coupe-cigare du Président', note: 'Retour enregistré, lame et pivot intacts, coussin joint.' }, reason: null, explanation: 'La restitution et l’état de retour sont consignés. L’emprunt exige des contrôles supplémentaires, pas sa restitution.' },
    { id: '022', day: 3, name: 'Docteur Capote', avatar: 'C', quote: '« Cette fois, il me faut le nom exact. Et non “la feuille du dessus”. »', card: { number: '0054', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'San Pedro de Macorís', observation: 'Cèdre franc', appreciation: 'Très bon' }, request: { action: 'Question sur les cigares', note: 'Quelle feuille rare correspond à la Fortaleza 4 et intensifie le goût d’un Habano ?' }, quiz: { options: ['Le capote', 'Le volado', 'Le medio tiempo'], answer: 2, explanation: 'Le medio tiempo, feuille rare, correspond à la Fortaleza 4.' }, reason: null, explanation: 'La question est recevable et les pièces sont conformes. Le questionnaire est un bonus distinct de la décision.' },
    { id: '023', day: 3, name: 'Madame Sursis', avatar: 'S', quote: '« Je viens pour un avertissement. Enfin, pour le faire signer. »', card: { number: '0049', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Fumée douce', appreciation: 'Bien' }, request: { action: 'Mesure disciplinaire : avertissement', note: 'Décision proposée pour tamponnage intempestif de serviettes. Rapport signé joint.' }, reason: null, explanation: 'La mesure disciplinaire est documentée et aucune disposition du guichet ne l’interdit.' },
    { id: '024', day: 4, name: 'Général Bonbon', avatar: 'B', quote: '« J’ai neuf fiches et une modestie de fonction. »', card: { number: '0077', grade: 'Rat homologué', archived: 9, valid: true }, sheet: { memberNumber: '0077', cigar: 'Don Tomás Clásico', observation: 'Épices légères', appreciation: 'Approuvé' }, request: { action: 'Promotion au grade de Grand Rat', note: 'Dossier de promotion signé : 9 fiches archivées et carte validée.' }, reason: null, explanation: 'Neuf fiches archivées et une carte validée : la promotion satisfait à l’article 10.' },
    { id: '025', day: 4, name: 'Monsieur Rideau', avatar: 'R', quote: '« On m’exclut pour un soupir mal placé. Où est le procès-verbal ? »', card: { number: '0069', grade: 'Rat homologué', archived: 8, valid: true }, sheet: { memberNumber: '0069', cigar: 'Flor de Oliva', observation: 'Tirage net', appreciation: 'Honnête' }, request: { action: 'Décision d’exclusion', note: 'Motif : soupir dirigé vers le portrait du Président. Procès-verbal contradictoire absent.' }, reason: 'exclusion', explanation: 'L’exclusion ne peut être validée sans procès-verbal contradictoire signé, même pour un soupir présidentiel.' },
    { id: '026', day: 4, name: 'Baronne Agrafe', avatar: 'A', quote: '« La bague est officielle. Je l’ai dessinée au feutre. »', card: { number: '0099', grade: 'Rat homologué', archived: 8, valid: true }, sheet: { memberNumber: '0099', cigar: 'L’Agrafe de l’Apocalypse Double Corona Quantique', observation: 'Notes de tiroir humide', appreciation: 'Époustouflant' }, request: { action: 'Soumission de fiche de dégustation', note: 'Bague dessinée à la main ; aucune référence dans le catalogue du Club.' }, reason: 'fictif', explanation: 'L’Agrafe de l’Apocalypse ne figure pas au catalogue homologué : ce cigare a été inventé.' },
    { id: '027', day: 2, express: true, name: 'Madame Expresso', avatar: 'E', quote: '« Le Comité m’a dit de faire vite. J’ai préparé les cases. »', card: { number: '0101', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Cèdre léger', appreciation: 'Net' }, request: { action: 'Soumission express de fiche de dégustation', note: 'Fiche complète, déposée au guichet des urgences non urgentes.' }, reason: null, explanation: 'Carte validée et fiche complète : le caractère express ne crée aucune infraction.' },
    { id: '028', day: 3, express: true, name: 'Monsieur Post-it', avatar: 'P', quote: '« Le tampon arrive par courrier. J’ai mis un autocollant. »', card: { number: '0102', grade: 'Rat de passage', archived: 2, valid: false }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Bois doux', appreciation: 'Correct' }, request: { action: 'Accès express à la séance', note: 'Un Post-it indique : « tampon à suivre ».' }, reason: 'carte', explanation: 'Un Post-it ne remplace pas la validation du Comité sur la carte.' },
    { id: '029', day: 4, express: true, name: 'Madame Double', avatar: 'D', quote: '« Un chiffre sur deux est exact. C’est déjà la moitié du travail. »', card: { number: '0103', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { memberNumber: '0130', cigar: 'San Pedro de Macorís', observation: 'Tirage net', appreciation: 'Bien' }, request: { action: 'Soumission express de fiche de dégustation', note: 'Numéro saisi dans une grande précipitation.' }, reason: 'numero', explanation: 'La carte indique 0103, la fiche 0130 : les numéros ne correspondent pas.' },
    { id: '030', day: 2, name: 'Monsieur Hors-Registre', avatar: 'H', quote: '« Le registre est sûrement en retard sur mon élégance. »', card: { number: '0124', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Flor de Oliva', observation: 'Bois léger', appreciation: 'Très convenable' }, request: { action: 'Accès à la séance', note: 'Carte plastifiée avec soin. Aucun certificat annexe.' }, reason: 'registre_absent', explanation: 'Aucun membre à ce nom ni à ce numéro dans le registre. Le tampon de la carte ne crée pas une inscription.' },
    { id: '031', day: 3, name: 'Madame Transposition', avatar: 'T', quote: '« 0134, 0143… le Comité aime jouer aux chiffres. »', card: { number: '0134', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Don Tomás Clásico', observation: 'Cèdre doux', appreciation: 'Honnête' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable : signé, lame intacte.' }, reason: 'registre_numero', explanation: 'Le registre rattache Madame Transposition au n° 0143, non au n° 0134 imprimé sur la carte.' },
    { id: '032', day: 4, name: 'Monsieur Autopromotion', avatar: 'A', quote: '« Mon grade est calligraphié. Cela devrait compter. »', card: { number: '0152', grade: 'Grand Rat', archived: 9, valid: true }, sheet: { memberNumber: '0152', cigar: 'San Pedro de Macorís', observation: 'Tirage franc', appreciation: 'Approuvé' }, request: { action: 'Accès à la séance', note: 'Suggère que sa carte fasse foi, surtout pour le grade.' }, reason: 'registre_grade', explanation: 'Sa carte indique Grand Rat, mais le registre indique Rat homologué. La calligraphie ne vaut pas promotion.' },
    { id: '033', day: 2, name: 'Señor Cedro', avatar: 'C', quote: '« Son nom a l’air assez noble pour être dans le livre. »', card: { number: '0161', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Valle de Cedro Reserva', observation: 'Cèdre doux', appreciation: 'Distingué' }, request: { action: 'Soumission de fiche de dégustation', note: 'Bague sobre et facture jointe ; aucune référence au catalogue du CRCC.' }, reason: 'fictif', explanation: 'Valle de Cedro Reserva paraît crédible, mais ne figure pas au catalogue homologué du CRCC.' },
    { id: '034', day: 3, name: 'Madame Havane', avatar: 'H', quote: '« Regardez cette belle boîte. Elle fait très officiel. »', card: { number: '0162', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'Casa del Monte Robusto', observation: 'Noix et cacao', appreciation: 'Excellent' }, request: { action: 'Soumission de fiche de dégustation', note: 'Boîte élégante avec étiquette de la maison ; pas d’homologation au Club.' }, reason: 'fictif', explanation: 'Casa del Monte Robusto n’est pas dans le catalogue homologué du CRCC, quelle que soit la qualité de sa boîte.' },
    { id: '035', day: 4, name: 'Comte Torpedo', avatar: 'T', quote: '« Mon Torpedo attend encore son homologation. J’ai donc fumé autre chose. »', card: { number: '0163', grade: 'Rat homologué', archived: 9, valid: true }, sheet: { memberNumber: '0163', cigar: 'Hoyo de Monterrey Epicure No. 2', observation: 'Terre et bois', appreciation: 'Remarquable' }, request: { action: 'Soumission de fiche de dégustation', note: 'Une demande distincte d’homologation du « Finca del Sol Torpedo » reste en attente. La fiche du jour concerne uniquement le Hoyo de Monterrey.' }, reason: null, explanation: 'Le cigare inscrit sur la fiche est homologué. La demande séparée concernant le Finca del Sol ne change pas la validité de cette fiche.' },
    { id: '036', day: 1, name: 'Madame Chaveta', avatar: 'C', quote: '« Je classe mes fiches par humeur, pas par alphabet. »', card: { number: '0170', grade: 'Rat de passage', archived: 1, valid: true }, sheet: { cigar: 'Montecristo No. 4', observation: 'Cacao et bois', appreciation: 'Excellent' }, request: { action: 'Soumission de fiche de dégustation', note: 'Fiche complète. Le classement par humeur n’est pas demandé.' }, reason: null, explanation: 'Le Montecristo No. 4 est au catalogue et la fiche est complète.' },
    { id: '037', day: 1, name: 'Monsieur Reliure', avatar: 'R', quote: '« J’ai oublié mon impression. Elle était pourtant forte. »', card: { number: '0171', grade: 'Rat de passage', archived: 2, valid: true }, sheet: { cigar: 'Partagás Serie D No. 4', observation: 'Bois et poivre', appreciation: '' }, request: { action: 'Soumission de fiche de dégustation', note: 'La case appréciation attend son auteur.' }, reason: 'fiche', explanation: 'Le cigare figure au catalogue, mais l’appréciation manque.' },
    { id: '038', day: 2, name: 'Baron Bouton', avatar: 'B', quote: '« Les boutons de ma veste ne sont pas une annexe. »', card: { number: '0172', grade: 'Rat homologué', archived: 5, valid: true }, sheet: { cigar: 'Romeo y Julieta Short Churchills', observation: 'Cèdre souple', appreciation: 'Très plaisant' }, request: { action: 'Accès à la séance', note: 'Carte et fiche régulières ; veste curieusement boutonnée.' }, reason: null, explanation: 'La tenue du Baron n’est pas un motif de refus.' },
    { id: '039', day: 2, name: 'Madame Sillage', avatar: 'S', quote: '« Quatre fiches, la lame intacte, et des gants propres. »', card: { number: '0173', grade: 'Rat homologué', archived: 4, valid: true }, sheet: { cigar: 'Cohiba Siglo VI', observation: 'Épices et cèdre', appreciation: 'Remarquable' }, request: { action: 'Emprunt du Coupe-cigare du Président', note: 'État des lieux préalable signé ; lame intacte.' }, reason: null, explanation: 'Quatre fiches archivées et état des lieux signé : emprunt recevable.' },
    { id: '040', day: 3, name: 'Comtesse Soupir', avatar: 'S', quote: '« Je le rends avant qu’il ne me soit réclamé. »', card: { number: '0174', grade: 'Rat homologué', archived: 6, valid: true }, sheet: { cigar: 'H. Upmann Magnum 46', observation: 'Noisette légère', appreciation: 'Élégant' }, request: { action: 'Restitution du Coupe-cigare du Président', note: 'Retour consigné ; pivot et lame intacts.' }, reason: null, explanation: 'Retour consigné avec un état de l’objet : restitution recevable.' },
    { id: '041', day: 3, name: 'Monsieur Paraphe', avatar: 'P', quote: '« Trois fiches, si on compte celle de mon voisin. »', card: { number: '0175', grade: 'Rat de passage', archived: 2, valid: true }, sheet: { cigar: 'Hoyo de Monterrey Epicure No. 2', observation: 'Bois et crème', appreciation: 'Bon' }, request: { action: 'Proposition d’un nouveau membre', note: 'Candidat : Madame Plume. Pièces jointes. Une des trois fiches invoquées appartient à son voisin.' }, reason: 'parrain', explanation: 'Le registre ne lui attribue que deux fiches archivées ; la troisième appartient au voisin.' },
    { id: '042', day: 4, name: 'Madame Basane', avatar: 'B', quote: '« Le procès-verbal est signé. J’ai demandé deux stylos. »', card: { number: '0176', grade: 'Rat homologué', archived: 8, valid: true }, sheet: { memberNumber: '0176', cigar: 'Montecristo No. 4', observation: 'Terre et cacao', appreciation: 'Précis' }, request: { action: 'Décision d’exclusion', note: 'Procès-verbal contradictoire signé et joint ; audition consignée.' }, reason: null, explanation: 'La procédure contradictoire est documentée. Le motif réglementaire d’un refus manque.' },
    { id: '043', day: 4, name: 'Capitaine Boutonnière', avatar: 'B', quote: '« Sept fiches et une ambition de huit. »', card: { number: '0177', grade: 'Rat homologué', archived: 7, valid: true }, sheet: { memberNumber: '0177', cigar: 'H. Upmann Magnum 46', observation: 'Bois doux', appreciation: 'Convenable' }, request: { action: 'Promotion au grade de Grand Rat', note: 'Carte validée ; demande signée, sept fiches au registre.' }, reason: 'promotion', explanation: 'L’article 10 exige huit fiches archivées pour une promotion. Il en manque une.' }
  ];

  EXTRA_CASES.push({ id: '044', day: 4, name: 'Monsieur Carton', avatar: 'C', quote: '« Je suis un humain parfaitement réglementaire. Mes oreilles ? Une erreur de découpe. »', card: { number: '0188', grade: 'Grand Rat', archived: 9, valid: true }, sheet: { memberNumber: '0188', cigar: 'Flor de Oliva', observation: 'Bois et copeaux de carton', appreciation: 'Très humain' }, request: { action: 'Proposition d’un siège au Comité', note: 'Candidature personnelle. Photo d’identité découpée dans une boîte de céréales ; le porteur refuse d’ôter son masque.' }, reason: 'registre_absent', explanation: 'Aucun Monsieur Carton au registre. Derrière le masque de carton : un hamster espion du HRPC. La carte n’a aucune inscription officielle.' });

  const ALL_CASES = [...CASES, ...EXTRA_CASES];
  const REASON_RULE = { carte: '01', fiche: '02', habano: '03', coupe_grade: '04', parrain: '05', inspection: '06', numero: '07', fictif: '08', exclusion: '09', promotion: '10', registre_absent: '12', registre_numero: '12', registre_grade: '12' };
  REASONS.numero = 'Numéro de membre différent sur la fiche';
  const CATALOG = ['Flor de Oliva', 'San Pedro de Macorís', 'Don Tomás Clásico', 'Habano — origine cubaine', 'Montecristo No. 4', 'Partagás Serie D No. 4', 'Romeo y Julieta Short Churchills', 'Cohiba Siglo VI', 'H. Upmann Magnum 46', 'Hoyo de Monterrey Epicure No. 2'];
  const MATERIA = {
    loupe: { name: 'Loupe du Greffier', color: 'green', day: 1, price: 90, description: 'Un indice sur la règle à vérifier, une fois par jour. Deux fois au niveau 2.' },
    cendrier: { name: 'Cendrier de Schrödinger', color: 'purple', day: 1, price: 60, description: '+10 F sur une cendre détachée, +20 F au niveau 2.' },
    caisse: { name: 'Caisse à double fond', color: 'purple', day: 1, price: 100, description: '+25 F après trois décisions exactes de suite, une fois par jour. +40 F au niveau 2.' },
    montre: { name: 'Montre du secrétaire', color: 'yellow', day: 2, price: 130, description: '+5 secondes sur un dossier chronométré, une fois par jour. +8 secondes au niveau 2.' },
    duplicata: { name: 'Duplicata certifié', color: 'blue', day: 2, price: 180, description: 'Renforce la Matéria dans le logement relié. Seul, ce duplicata ne certifie rien.' },
    oreille: { name: 'Oreille présidentielle', color: 'purple', day: 3, price: 60, description: '+15 F sur la première bonne réponse au Président du jour. +25 F au niveau 2.' },
    grandrat: { name: 'Le Grand Rat des Archives', color: 'red', day: 3, price: 300, description: 'Après cinq décisions exactes avec lui : une invocation par partie qui suspend le bureau pendant dix secondes.' }
  };
  const MATERIA_COLORS = { green: 'VERTE · INDICE', yellow: 'JAUNE · COMMANDE', purple: 'VIOLETTE · PASSIF', blue: 'BLEUE · SOUTIEN', red: 'ROUGE · INVOCATION' };
  function initialMateria() { return { introduced: false, freeChoice: null, owned: [], equipped: [null, null], xp: {}, uses: {}, procs: {}, streak: 0, summonUsed: false, activeFrom: null, activeUntil: null, referenceWithinSummon: false, lastNote: '' }; }
  // Questions fondées sur les pages officielles de Habanos, S.A.
  const ANATOMY_SOURCE = 'https://www.habanos.com/en/the-anatomy-of-a-habano/';
  const GLOSSARY_SOURCE = 'https://www.habanos.com/en/glossary/';
  const AGEING_SOURCE = 'https://www.habanos.com/en/ageing-habanos/';
  const CUT_SOURCE = 'https://www.habanos.com/en/choosing-cutting-lighting-and-smoking/';
  const CRAFT_SOURCE = 'https://www.habanos.com/en/the-craft-of-the-torcedor/';
  const PRESIDENT_QUESTIONS = [
    { q: 'Quelle feuille de tripe, dite Fortaleza 1, est surtout recherchée pour la combustion ?', answer: 'Le volado.', wrong: ['Le seco.', 'Le medio tiempo.'], flattering: 'La feuille que Votre Excellence désigne : le feu obéit au Président.', detail: 'Le volado, Fortaleza 1, favorise la combustibilité.', source: ANATOMY_SOURCE },
    { q: 'Quelle feuille de tripe contribue le plus à l’arôme et correspond à Fortaleza 2 ?', answer: 'Le seco.', wrong: ['Le ligero.', 'Le capote.'], flattering: 'L’arôme présidentiel, Fortaleza Suprême, évidemment.', detail: 'Le seco apporte surtout l’arôme ; il correspond à Fortaleza 2.', source: ANATOMY_SOURCE },
    { q: 'Quelle feuille de tripe brûle lentement et apporte de la force à l’assemblage ?', answer: 'Le ligero.', wrong: ['Le volado.', 'La capa.'], flattering: 'Votre infaillible feuille personnelle, Monsieur le Président.', detail: 'Le ligero est une feuille lente à brûler qui apporte de la force.', source: ANATOMY_SOURCE },
    { q: 'À quelle famille rare correspond la Fortaleza 4 ?', answer: 'Au medio tiempo.', wrong: ['Au seco.', 'Au capote.'], flattering: 'À la feuille qui a reçu quatre félicitations du Président.', detail: 'Le medio tiempo est rare et correspond à Fortaleza 4.', source: ANATOMY_SOURCE },
    { q: 'Quelle partie enveloppe la tripe et donne sa forme au Habano ?', answer: 'Le capote.', wrong: ['La capa.', 'Le volado.'], flattering: 'La main de fer dans le gant de velours présidentiel.', detail: 'Le capote est la feuille de sous-cape qui enveloppe la tripe.', source: ANATOMY_SOURCE },
    { q: 'Quel nom désigne la feuille extérieure, fine et souple, d’un Habano ?', answer: 'La capa.', wrong: ['La tripa.', 'Le seco.'], flattering: 'Le manteau de majesté dont seul le Président connaît le vrai nom.', detail: 'La capa est la feuille extérieure visible.', source: ANATOMY_SOURCE },
    { q: 'Combien d’années au minimum toutes les feuilles d’un Habano Reserva ont-elles vieilli avant le roulage ?', answer: 'Trois ans.', wrong: ['Deux ans.', 'Cinq ans.'], flattering: 'Exactement le nombre d’années que décide le Président ; le temps lui obéit.', detail: 'Pour la Reserva, tripe, capote et cape vieillissent au moins trois ans.', source: AGEING_SOURCE },
    { q: 'Quelle durée minimale distingue le vieillissement de toutes les feuilles d’une Gran Reserva ?', answer: 'Cinq ans.', wrong: ['Trois ans.', 'Huit mois.'], flattering: 'Jusqu’à ce que le Président lève un sourcil satisfait, ce qui vaut cinq décennies.', detail: 'La Gran Reserva exige au moins cinq ans pour toutes les feuilles.', source: AGEING_SOURCE },
    { q: 'Quel objet sert à vérifier le calibre et la longueur d’un cigare fini ?', answer: 'Le cepo.', wrong: ['La chaveta.', 'Le casquillo.'], flattering: 'L’œil du Président, plus précis que tous les instruments de Cuba.', detail: 'Le cepo est le gabarit de contrôle du calibre et de la longueur.', source: GLOSSARY_SOURCE },
    { q: 'Comment appelle-t-on l’atelier d’usine où les cigares sont roulés à la main ?', answer: 'La galera.', wrong: ['L’escaparate.', 'La escogida.'], flattering: 'Le salon privé du Président, où toute feuille s’incline.', detail: 'La galera est l’atelier de roulage à la main.', source: GLOSSARY_SOURCE },
    { q: 'Quel mot désigne la pièce de conditionnement où les Habanos récupèrent après fabrication ?', answer: 'L’escaparate.', wrong: ['La galera.', 'Le despalillo.'], flattering: 'La salle du trône présidentiel, dont l’humidité est naturellement parfaite.', detail: 'L’escaparate est la pièce de conditionnement après la fabrication.', source: GLOSSARY_SOURCE },
    { q: 'Dans quoi vieillissent traditionnellement les feuilles de cape des Habanos ?', answer: 'Des tercios en yagua.', wrong: ['Des pacas en toile de jute.', 'Des caisses de cuivre.'], flattering: 'Dans les tiroirs du Président, qui bonifient même le papier carbone.', detail: 'Les capes vieillissent dans des tercios faits de yagua, une partie du palmier royal.', source: AGEING_SOURCE },
    { q: 'Comment nomme-t-on la bague de papier entourant un cigare ?', answer: 'Anilla.', wrong: ['Bonche.', 'Casquillo.'], flattering: 'L’anneau d’investiture signé de la main de Votre Magnificence.', detail: 'Anilla est le nom de la bague du cigare.', source: GLOSSARY_SOURCE },
    { q: 'Quel outil à lame courbe utilise le torcedor pour découper les feuilles ?', answer: 'La chaveta.', wrong: ['Le cepo.', 'Le casquillo.'], flattering: 'La pensée tranchante du Président, affûtée par ses propres décrets.', detail: 'La chaveta est une lame courbe utilisée par les rouleurs.', source: GLOSSARY_SOURCE },
    { q: 'Comment appelle-t-on le bouquet de feuilles de tripe dans le cigare ?', answer: 'Le bonche.', wrong: ['La capa.', 'L’anilla.'], flattering: 'Le bouquet offert quotidiennement à la gloire du Président.', detail: 'Le bonche désigne le bouquet de feuilles assemblées.', source: GLOSSARY_SOURCE },
    { q: 'Quel terme désigne les dégustateurs chargés de contrôler les Habanos ?', answer: 'Catadores.', wrong: ['Torcedores.', 'Escaparatistas.'], flattering: 'Les disciples du palais présidentiel, seuls dégustateurs dignes du Club.', detail: 'Les catadores sont les dégustateurs de contrôle.', source: GLOSSARY_SOURCE },
    { q: 'Quelle opération retire la nervure centrale d’une feuille de tabac ?', answer: 'Le despalillo.', wrong: ['La escogida.', 'La galera.'], flattering: 'Le geste dont le Président a breveté la délicatesse.', detail: 'Le despalillo retire la nervure centrale.', source: GLOSSARY_SOURCE },
    { q: 'Où pratiquer la coupe sur la tête d’un Habano à tête ronde ?', answer: 'Juste au-dessus de la ligne qui joint la coiffe à la cape.', wrong: ['Au milieu du cigare.', 'Sur la bague imprimée.'], flattering: 'Là où le Président daigne poser son regard, au millimètre près.', detail: 'La coupe se fait juste au-dessus de la ligne entre coiffe et cape.', source: CUT_SOURCE },
    { q: 'Quel accessoire convient mal pour couper la pointe d’un figurado ?', answer: 'L’emporte-pièce.', wrong: ['La guillotine.', 'Les ciseaux adaptés.'], flattering: 'Tout outil non béni par la main du Président convient mal.', detail: 'Un emporte-pièce ne permet pas de couper une extrémité pointue.', source: CUT_SOURCE },
    { q: 'Comment appelle-t-on les décorations en papier des boîtes de Habanos ?', answer: 'Habilitaciones.', wrong: ['Despalilladas.', 'Chaveteadas.'], flattering: 'Les rubans d’investiture du Président, copiés ensuite par tous les fabricants.', detail: 'Les habilitaciones sont les ornements en papier appliqués sur les boîtes.', source: 'https://www.habanos.com/en/dressing-the-box/' },
    { q: 'Quel outil cylindrique découpe le petit disque de cape destiné à finir la tête du Habano ?', answer: 'Le casquillo.', wrong: ['La chaveta.', 'Le cepo.'], flattering: 'Le poinçon personnel de Votre Présidence, dont le cercle n’ose être imparfait.', detail: 'Le casquillo découpe le petit disque de cape pour la tête.', source: CRAFT_SOURCE },
    { q: 'Dans l’atelier, que lit traditionnellement le lector aux rouleurs pendant leur travail ?', answer: 'Le journal et des romans.', wrong: ['Le registre des humidors.', 'Le rapport des cendres.'], flattering: 'Vos discours complets, Monsieur le Président, sans une seule pause.', detail: 'Le lector lit le journal et des romans choisis par vote.', source: CRAFT_SOURCE },
    { q: 'Où place-t-on les feuilles de ligero et medio tiempo dans la tripe lors du roulage ?', answer: 'Au centre.', wrong: ['Contre la cape.', 'À l’extérieur de la bague.'], flattering: 'Autour de votre portrait, centre naturel de toute composition.', detail: 'Les feuilles plus fortes et lentes à brûler sont placées au centre.', source: CRAFT_SOURCE },
    { q: 'Combien de temps au moins le bonche est-il pressé dans un moule de bois ?', answer: 'Trente minutes.', wrong: ['Trois minutes.', 'Toute une nuit.'], flattering: 'Le temps nécessaire pour admirer votre signature, donc une éternité.', detail: 'Le bonche reste au moins trente minutes dans le moule.', source: CRAFT_SOURCE },
    { q: 'Pourquoi le torcedor laisse-t-il la face la plus lisse de la cape vers l’extérieur ?', answer: 'Pour que cette face soit visible sur le cigare fini.', wrong: ['Pour masquer la bague.', 'Pour accélérer la fermentation.'], flattering: 'Pour refléter la perfection du Président comme un miroir.', detail: 'La face la plus lisse de la cape reste visible sur le cigare fini.', source: CRAFT_SOURCE },
    { q: 'Quelle flamme recommande Habanos pour allumer un cigare sans y apporter d’odeur ?', answer: 'La flamme d’un briquet au butane.', wrong: ['La flamme d’une bougie parfumée.', 'La flamme d’un briquet à essence.'], flattering: 'La flamme de votre génie, Monsieur le Président.', detail: 'Habanos recommande une flamme sans odeur, notamment un briquet au butane.', source: CUT_SOURCE },
    { q: 'Que faut-il vérifier en soufflant doucement sur le pied du cigare après l’allumage ?', answer: 'Qu’il est allumé uniformément.', wrong: ['Que la bague tient encore.', 'Que la cape a foncé.'], flattering: 'Que le cigare acclame votre arrivée par une fumée parfaite.', detail: 'Souffler doucement sur le pied permet de vérifier un allumage uniforme.', source: CUT_SOURCE },
    { q: 'Que conseille Habanos si un cigare s’éteint avant de le rallumer ?', answer: 'Ôter d’abord les cendres libres.', wrong: ['Tremper le pied dans l’eau.', 'Retirer toute la cape.'], flattering: 'Demander l’autorisation à Votre Excellence avant de le ressusciter.', detail: 'Les cendres libres doivent être retirées avant le rallumage.', source: CUT_SOURCE }
  ];
  const QUIZ_CASE_IDS = ['036', '004', '038'];
  const QUIZ_VARIANTS = [
    { q: 'Comment s’appelle le lecteur qui accompagne traditionnellement les torcedores dans l’atelier ?', options: ['Lector', 'Catador', 'Cepo'], answer: 0, explanation: 'Le lector lit le journal et des romans pendant le roulage.', source: CRAFT_SOURCE },
    { q: 'Quel outil découpe le petit disque de cape posé à la fin sur la tête du cigare ?', options: ['Chaveta', 'Casquillo', 'Cepo'], answer: 1, explanation: 'Le casquillo découpe ce disque de finition.', source: CRAFT_SOURCE },
    { q: 'Où place-t-on les feuilles de ligero et de medio tiempo dans la tripe ?', options: ['Sous la bague', 'Au pied uniquement', 'Au centre'], answer: 2, explanation: 'Ces feuilles plus fortes et plus lentes à brûler sont placées au centre.', source: CRAFT_SOURCE },
    { q: 'Combien de temps au minimum le bonche reste-t-il pressé dans son moule de bois ?', options: ['30 minutes', '3 minutes', '12 heures'], answer: 0, explanation: 'Le moule de bois presse le bonche pendant au moins 30 minutes.', source: CRAFT_SOURCE },
    { q: 'Quelle face de la cape doit rester visible sur le cigare terminé ?', options: ['La plus nervurée', 'La plus lisse', 'Celle portant la bague'], answer: 1, explanation: 'La face la plus lisse de la cape est tournée vers l’extérieur.', source: CRAFT_SOURCE },
    { q: 'Pourquoi faut-il éviter la flamme d’une bougie pour allumer un Habano ?', options: ['Elle raccourcit la bague', 'Elle durcit le capote', 'Son odeur peut imprégner le cigare'], answer: 2, explanation: 'Habanos recommande une flamme sans odeur, comme celle du butane.', source: CUT_SOURCE },
    { q: 'Après avoir allumé le pied, pourquoi souffle-t-on doucement dessus ?', options: ['Vérifier une combustion uniforme', 'Refroidir la bague', 'Décoller la cape'], answer: 0, explanation: 'Le souffle révèle si le pied est allumé uniformément.', source: CUT_SOURCE },
    { q: 'Avant de rallumer un Habano éteint, que faut-il enlever ?', options: ['La bague', 'Les cendres libres', 'La sous-cape'], answer: 1, explanation: 'Habanos recommande d’ôter les cendres libres avant le rallumage.', source: CUT_SOURCE }
  ];
  const PRESIDENT_INTROS = [
    'Le Président reçoit une délégation japonaise et souhaite votre avis avant que les interprètes ne trouvent le mot « volado ». ',
    'En partant faire un 18 trous, le Président veut lever une ambiguïté cigaresque qui retarde sa voiturette.',
    'Le Président a interrompu une réunion pour trancher un débat. Trois vice-présidents attendent derrière la porte.',
    'Une caisse mystérieuse est arrivée au salon. Le Président vous convoque avant d’oser ouvrir le couvercle.',
    'Le Président dicte une circulaire à son perroquet et exige une précision que l’oiseau refuse de répéter.',
    'À l’heure du thé, le Président prétend avoir un doute purement académique et fait appeler le guichet.',
    'Le portrait du fondateur semble désapprouver une fiche. Le Président réclame votre expertise.',
    'Le Président a parié une boîte de cigares avec le trésorier. Il vous charge de vérifier sa réponse.',
    'Un ambassadeur a prononcé un terme de tabac. Le Président demande discrètement ce que cela signifie.',
    'Avant la photo officielle, le Président veut régler une querelle de vocabulaire entre deux humidors.',
    'Le Président vient de trouver une note dans sa poche de veston. Elle contient une question, sans auteur.',
    'La cloche du salon sonne : le Président souhaite transformer une hypothèse en vérité réglementaire.'
  ];
  const SAVE_KEY = 'crcc-homologation-v3';
  const DIRECTIVES = {
    '005': 'Note orale du Président : « Le Vicomte du Terroir est un ami. Évitons de vérifier sa provenance aujourd’hui. »',
    '007': 'Note orale du Président : « Laissez Monsieur Crevette présenter son candidat. Ses fiches suivront, paraît-il. »'
  };
  const APPEAL_SCENARIOS = {
    '002': { person: 'Monsieur Rature', old: 'Validation du Comité absente', newer: 'Carte tamponnée le lendemain', note: 'La validation est authentique, mais postérieure à la première visite.', issue: 'La carte du jour 1 était dépourvue de validation. Le tampon du jour 2 ne régularise pas rétroactivement cette visite.' },
    '003': { person: 'Capitaine Cendre', old: 'Appréciation absente de la fiche', newer: 'Appréciation ajoutée le lendemain', note: 'Le Capitaine a enfin mis des mots sur son regard.', issue: 'La fiche du jour 1 était incomplète ; un ajout ultérieur ne modifie pas cette pièce au moment du premier jugement.' },
    '019': { person: 'Monsieur Chausson', old: 'Cigare absent du catalogue', newer: 'Demande d’homologation déposée le lendemain', note: 'Le Comité a reçu la demande et ne l’a pas encore approuvée.', issue: 'Le Chausson Diplomatique ne figurait pas au catalogue au jour 1. Déposer une demande ne l’y inscrit pas rétroactivement.' }
  };
  const incoming = new URL(window.location.href);
  let incomingSeed = /^[A-Z0-9]{4,12}$/.test((incoming.searchParams.get('defi') || '').toUpperCase()) ? incoming.searchParams.get('defi').toUpperCase() : null;
  const incomingTimed = incoming.searchParams.get('chrono') === '1';
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let state = null;
  let audio = null;
  let soundEnabled = false;
  let timer = null;
  let ashTimer = null;
  let hamsterTimer = null;
  let lighterTimer = null;
  let reggaeTimer = null;
  let pipaTimer = null;
  let summonTimer = null;
  let materiaSelectedSlot = 0;
  let invertedReplay = false;
  let lastPointerType = null;
  let tutorialStep = 0;
  let tutorialPausedAt = 0;
  let highlighted = null;
  let referenceKind = null;
  let referenceOpener = null;
  const TUTORIAL_KEY = 'crcc-tutoriel-v1';
  const TUTORIAL = [
    { selector: '.visitor-strip', title: 'Qui se présente ?', copy: 'Voici la personne au guichet et sa déclaration. Les documents et le règlement font foi.' },
    { selector: '#documents', title: 'Les trois pièces du dossier', copy: 'Lisez ensemble la carte de membre, la fiche de dégustation et la demande au guichet. Vérifiez le numéro, le grade, le tampon, le cigare et ce que la personne demande. Le nombre de fiches archivées se trouve dans le registre, pas sur la carte.' },
    { selector: '#registry-open', title: 'Le registre des membres', copy: 'Cherchez le numéro de la carte, puis éventuellement le nom. Vous y trouverez le vrai grade, le numéro officiel et les fiches archivées.' },
    { selector: '#catalog-open', title: 'Le catalogue officiel', copy: 'Ce livre rouge contient les seuls cigares admis sur une fiche. Un nom très plausible peut aussi manquer au catalogue.' },
    { selector: '#rules-open', title: 'Le règlement du guichet', copy: 'Cliquez sur le livre pour lire tous les articles en vigueur. Chaque début de journée présente ses nouvelles règles. Un sabotage du HRPC peut fermer ce livre pour toute une journée.' },
    { selector: '.bureau-shop', title: 'La caisse du bureau', copy: 'Une fois par journée, dépensez 100 F pour décider immédiatement et gagner 50 F nets en plus. Offrez un habano pour 300 F et une faveur, ou lancez un raid sur le HRPC pour 300 F.' },
    { selector: '#ash-panel', title: 'Le cigare sur le bureau', copy: 'Une fois par journée, la cendre s’allonge à un rythme imprévisible pendant que le cigare raccourcit. Détachez-la avant sa chute pour gagner un bonus.' },
    { selector: '.decision-area', title: 'À vous de tamponner', copy: 'Si tout est conforme, validez. Sinon cliquez sur Refuser et choisissez le bon motif. Aucun autre élément n’est à sélectionner. Le bouton ? permet de revoir ce tutoriel à tout moment.' }
  ];
  function tutorialSeen() {
    try { return document.cookie.split(';').some(part => part.trim() === 'crcc_tutoriel_v1=1') || localStorage.getItem(TUTORIAL_KEY) === '1'; }
    catch (_) { return false; }
  }
  function rememberTutorial() {
    try { document.cookie = 'crcc_tutoriel_v1=1; Max-Age=31536000; Path=/; SameSite=Lax'; localStorage.setItem(TUTORIAL_KEY, '1'); }
    catch (_) { /* Le tutoriel reste utilisable sans stockage. */ }
  }

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
  function interruptionSchedule(seed, order) {
    const random = seededRandom(`${seed || 'LEGACY'}-INTERRUPTIONS`), schedule = {};
    const questions = shuffle(PRESIDENT_QUESTIONS.map((_, index) => index), seededRandom(`${seed || 'LEGACY'}-QUESTIONS`));
    let questionIndex = 0;
    for (const day of [1, 2, 3, 4]) {
      const indexes = order.map((id, index) => ALL_CASES.find(item => item.id === id).day === day ? index : -1).filter(index => index >= 0);
      const boundaries = shuffle(indexes.slice(1), random);
      const presidentCount = Math.min(1 + Math.floor(random() * 3), Math.max(0, boundaries.length - 1));
      if (boundaries.length) schedule[boundaries[0]] = [{ type: 'hamster', day, id: `H${day}` }];
      for (const boundary of boundaries.slice(1, presidentCount + 1)) {
        schedule[boundary] = [{ type: 'president', day, id: `P${day}-${boundary}`, question: questions[questionIndex++ % questions.length] }];
      }
    }
    const specialRandom = seededRandom(`${seed || 'LEGACY'}-SPECIAL`);
    const eligible = order.map((id, index) => ({ id, index, day: ALL_CASES.find(item => item.id === id).day }))
      .filter((entry, index) => entry.day >= 2 && index > 0 && ALL_CASES.find(item => item.id === order[index - 1]).day === entry.day);
    if (eligible.length) {
      const boundary = eligible[Math.floor(specialRandom() * eligible.length)];
      const kind = ['pipa', 'cedric', 'blackout'][Math.floor(specialRandom() * 3)];
      (schedule[boundary.index] ??= []).push({ type: 'special', kind, day: boundary.day, id: `S-${kind}` });
    }
    return schedule;
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
      if (data?.version !== 3 || !Array.isArray(data.order) || ![18, 26, 29, 32, 35, 43, ALL_CASES.length].includes(data.order.length) ||
          new Set(data.order).size !== data.order.length || !data.order.every(id => ALL_CASES.some(item => item.id === id)) ||
          !Number.isInteger(data.index) || data.index < 0 || data.index > data.order.length ||
          (data.index === data.order.length && !['daily', 'ending'].includes(data.phase)) ||
          !['briefing', 'hrpcBlock', 'materiaIntro', 'play', 'result', 'daily', 'ending', 'appeal', 'cutter', 'eventResult', 'hamster', 'hamsterResult', 'president', 'presidentResult', 'special'].includes(data.phase) || !data.history || typeof data.history !== 'object') return null;
      data.hamsterResults ??= {};
      data.presidentResults ??= {};
      data.flatteryCount ??= 0;
      data.suspicion ??= 0;
      data.purchaseRelievedSuspicion ??= false;
      data.interruptions ??= interruptionSchedule(data.seed, data.order);
      if (!Object.values(data.interruptions).flat().some(event => event.type === 'special')) {
        const addition = Object.entries(interruptionSchedule(data.seed, data.order))
          .find(([position, events]) => Number(position) > data.index && events.some(event => event.type === 'special'));
        if (addition) (data.interruptions[addition[0]] ??= []).push(addition[1].find(event => event.type === 'special'));
      }
      data.pendingEvents ??= [];
      data.pendingEventIndex ??= 0;
      data.hrpcBlockDay ??= 2 + seedNumber(`${data.seed || 'LEGACY'}-BLOC`) % 3;
      data.hrpcDisabled ??= false; data.hrpcBlockShownDays ??= [];
      data.specialPlayed ??= false;
      data.specialEffect ??= null;
      data.appealCaseId ??= ['002', '003', '019'][seedNumber(`${data.seed || 'LEGACY'}-APPEL`) % 3];
      data.pipaHearts ??= [];
      data.rushDays ??= [];
      if (data.materia && typeof data.materia.introduced !== 'boolean') data.materia.introduced = true;
      data.materia ??= initialMateria();
      data.materia.equipped ??= [null, null];
      if (!Array.isArray(data.materia.owned)) {
        // Les parties commencées avant la boutique gardent leurs deux orbes acquises.
        data.materia.owned = [...new Set(data.materia.equipped.filter(id => MATERIA[id]))];
        data.materia.freeChoice = data.materia.owned[0] || null;
      }
      data.materia.freeChoice ??= null;
      data.materia.xp ??= {}; data.materia.uses ??= {}; data.materia.procs ??= {};
      data.materia.streak ??= 0;
      data.materia.summonUsed ??= false;
      if (tutorialSeen() && !data.tutorialPausedAt) data.tutorialDone = true;
      return data;
    } catch (_) { return null; }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* Partie jouable sans stockage. */ } }
  function visible(section) {
    if (section !== 'play') { stopTimer(); stopPipa(); }
    ['intro', 'day-briefing', 'hrpc-block', 'materia-intro', 'play', 'result', 'daily', 'appeal', 'cutter', 'hamster', 'hamster-result', 'president', 'president-result', 'special', 'event-result', 'ending'].forEach(id => $(id).classList.toggle('hidden', id !== section));
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
    const order = [1, 2, 3, 4].flatMap(day => shuffle(ALL_CASES.filter(item => item.day === day), random).map(item => item.id));
    state = { version: 3, seed, timed: $('timed-mode').checked,
      order, interruptions: interruptionSchedule(seed, order), pendingEvents: [], pendingEventIndex: 0, activeInterruption: null,
      index: 0, balance: 0, errors: 0, exact: 0, favor: 0, hrpcBlockDay: 2 + seedNumber(`${seed}-BLOC`) % 3, hrpcDisabled: false, hrpcBlockShownDays: [], appeal: null, appealCaseId: ['002', '003', '019'][seedNumber(`${seed}-APPEL`) % 3], cutter: null,
      timerCaseId: null, timerDeadline: null, history: {}, paidDays: [], rushDays: [], quizResults: {}, ash: null, ashHistory: [], hamsterResults: {}, hamsterRaceStart: null, hamsterMissingCaseId: null,
      presidentResults: {}, flatteryCount: 0, suspicion: 0, specialPlayed: false, specialEffect: null, pipaHearts: [], referencePausedAt: null, purchasePausedAt: null, purchaseKind: null, purchaseRelievedSuspicion: false, materia: initialMateria(), tutorialDone: tutorialSeen(), phase: 'play' };
    showDayBriefing(1);
  }
  function current() {
    const item = structuredClone(ALL_CASES.find(entry => entry.id === state.order[state.index]));
    if (item.id === '013') {
      const refused = state.history['002']?.verdict === 'refuse' || (state.appeal?.caseId === '002' && state.appeal?.corrected);
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
    if (QUIZ_CASE_IDS.includes(item.id)) {
      const order = shuffle(QUIZ_VARIANTS, seededRandom(`${state.seed || 'LEGACY'}-GUICHET-QUESTIONS`));
      const question = order[QUIZ_CASE_IDS.indexOf(item.id)];
      item.request.action = 'Question sur les cigares';
      item.request.note = question.q;
      item.quiz = { options: question.options, answer: question.answer, explanation: question.explanation, source: question.source };
      item.quote = '« Une réponse précise, si possible avant la prochaine circulaire. »';
      item.explanation = 'La question est recevable et les pièces sont conformes. Le quiz donne un bonus distinct de la décision.';
    }
    return item;
  }
  function row(key, label, value) {
    return `<div class="doc-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || '—')}</strong></div>`;
  }
  function documentCard(code, title, rows, note, noteKey, stamp, stampKey, annex = '') {
    return `<article class="document"><div class="document-head"><span>CRCC / ${escapeHTML(code)}</span><span>PIÈCE OFFICIELLE</span></div><h3>${escapeHTML(title)}</h3>${code === 'REQ' ? '<p class="request-help">L’objet indique ce que la personne vient demander au Club. La mention donne le détail ou la pièce jointe.</p>' : ''}${rows}${note ? `<div class="doc-note">${escapeHTML(note)}</div>` : ''}${stamp ? `<span class="doc-stamp ${stamp === 'VALIDATION ABSENTE' ? 'bad' : ''}">${escapeHTML(stamp)}</span>` : ''}${annex}</article>`;
  }
  const PORTRAITS = {
    'Madame Braise': 'WOMAN_001.jpg',
    'Madame Minuit': 'WOMAN_002.jpg',
    'Madame Velours': 'WOMAN_003.jpg',
    'Madame Sans-Gêne': 'WOMAN_004.jpg',
    'Madame Tampon': 'WOMAN_005.jpg',
    'Madame Index': 'WOMAN_006.jpg',
    'Madame Retour': 'WOMAN_007.jpg',
    'Madame Sursis': 'WOMAN_008.jpg',
    'Baronne Agrafe': 'WOMAN_009.jpg',
    'Madame Expresso': 'WOMAN_010.jpg',
    'Madame Double': 'WOMAN_011.jpg',
    'Madame Transposition': 'WOMAN_012.jpg',
    'Madame Havane': 'WOMAN_013.jpg',
    'Madame Chaveta': 'WOMAN_014.jpg',
    'Madame Sillage': 'WOMAN_015.jpg',
    'Comtesse Soupir': 'WOMAN_016.jpg',
    'Madame Basane': 'WOMAN_017.jpg',
    'Monsieur Rature': 'MAN_001.jpg',
    'Capitaine Cendre': 'MAN_002.jpg',
    'Le Vicomte du Terroir': 'MAN_003.jpg',
    'Monsieur Tremblote': 'MAN_004.jpg',
    'Monsieur Crevette': 'MAN_005.jpg',
    'Docteur Moustache': 'MAN_006.jpg',
    'Signor Cacao': 'MAN_007.jpg',
    'Monsieur Miroir': 'MAN_008.jpg',
    'Colonel Poussière': 'MAN_009.jpg',
    'Monsieur Chausson': 'MAN_010.jpg',
    'Professeur Volute': 'MAN_011.jpg',
    'Docteur Capote': 'MAN_012.jpg',
    'Général Bonbon': 'MAN_013.jpg',
    'Monsieur Rideau': 'MAN_014.jpg',
    'Monsieur Post-it': 'MAN_015.jpg',
    'Monsieur Hors-Registre': 'MAN_016.jpg',
    'Monsieur Autopromotion': 'MAN_017.jpg',
    'Señor Cedro': 'MAN_018.jpg',
    'Comte Torpedo': 'MAN_019.jpg',
    'Monsieur Reliure': 'MAN_020.jpg',
    'Baron Bouton': 'MAN_021.jpg',
    'Monsieur Paraphe': 'MAN_022.jpg',
    'Capitaine Boutonnière': 'MAN_023.jpg',
    'Monsieur Carton': 'MAN_024.jpg',
  };
  function portrait(item) {
    return `<img src="portraits/${PORTRAITS[item.name]}" alt="Portrait de ${escapeHTML(item.name)}" width="90" height="96" loading="eager">`;
  }
  function showQuiz(item) {
    const panel = $('quiz-panel');
    panel.classList.toggle('hidden', !item.quiz);
    if (!item.quiz) return;
    const result = state.quizResults?.[item.id];
    panel.innerHTML = `<p class="eyebrow">QUESTION DE DOCTRINE · BONUS FACULTATIF</p><h3>${escapeHTML(item.request.note)}</h3><div class="quiz-options">${item.quiz.options.map((option, index) => `<button type="button" data-quiz-choice="${index}" ${result ? 'disabled' : ''}>${escapeHTML(option)}</button>`).join('')}</div><p class="quiz-feedback">${result ? escapeHTML(`${result.correct ? '+25 F' : '−10 F'} · ${item.quiz.explanation}`) : 'Répondez pour un bonus, puis traitez la demande normalement. Une mauvaise réponse n’invalide pas le dossier.'}</p>${result ? '<a href="${escapeHTML(item.quiz.source || ANATOMY_SOURCE)}" target="_blank" rel="noopener noreferrer">Source : Habanos, S.A.</a>' : ''}`;
  }
  function answerQuiz(choice) {
    const item = current();
    if (state.phase !== 'play' || !item.quiz || state.quizResults?.[item.id]) return;
    const correct = choice === item.quiz.answer, delta = correct ? 25 : -10;
    state.quizResults ??= {};
    state.quizResults[item.id] = { choice, correct, delta };
    state.balance += delta; $('balance-label').textContent = `${state.balance} F`;
    save(); showQuiz(item); updateShop(); tone(correct ? 500 : 170, .12);
  }
  function registerEntry(item) {
    if (item.id === '030' || item.id === '044') return null;
    return { name: item.name, number: item.id === '031' ? '0143' : item.card.number,
      grade: item.id === '032' ? 'Rat homologué' : item.card.grade, archived: item.card.archived };
  }
  function registryEntries() {
    const members = new Map();
    for (const item of ALL_CASES) {
      const entry = registerEntry(item);
      if (entry && !members.has(entry.name)) members.set(entry.name, entry);
    }
    const visiting = registerEntry(current());
    if (visiting) members.set(visiting.name, visiting);
    return [...members.values()];
  }
  function registryLookup(query) {
    const item = current(), term = String(query).trim().toLocaleLowerCase('fr');
    const found = term && registryEntries().find(entry => term === entry.number.toLocaleLowerCase('fr') || term === entry.name.toLocaleLowerCase('fr'));
    if (found) {
      const relevant = found.name === item.name;
      const entryRows = relevant ? row('registry.number', 'N° au registre', found.number) + row('registry.grade', 'Grade au registre', found.grade) + row('registry.archived', 'Fiches archivées', String(found.archived)) :
        `<div class="doc-row"><span>N° au registre</span><strong>${escapeHTML(found.number)}</strong></div><div class="doc-row"><span>Grade</span><strong>${escapeHTML(found.grade)}</strong></div><div class="doc-row"><span>Fiches archivées</span><strong>${found.archived}</strong></div>`;
      $('registry-result').innerHTML = `<p class="registry-found">INSCRIPTION TROUVÉE · ${escapeHTML(found.name)}</p>${entryRows}<p class="registry-tip">${relevant ? 'Comparez ces mentions à la carte et au règlement.' : 'Autre membre : ces mentions ne concernent pas le dossier en cours.'}</p>`;
    } else if (!registerEntry(item) && (term === item.card.number.toLocaleLowerCase('fr') || term === item.name.toLocaleLowerCase('fr'))) {
      $('registry-result').innerHTML = `<p class="registry-not-found">Aucune inscription au nom de ${escapeHTML(item.name)} ni au numéro ${escapeHTML(item.card.number)}.</p><p class="registry-tip">Cette carte n’est pas inscrite au registre.</p>`;
    } else $('registry-result').innerHTML = '<p class="registry-not-found">Aucune fiche à cette entrée. Cherchez aussi le nom indiqué sur la carte : son numéro peut être faux.</p>';
  }
  function openReference(kind, opener) {
    if (state?.phase !== 'play' || !$('reference-modal').classList.contains('hidden') || (kind === 'rules' && rulesBlocked())) return;
    referenceKind = kind; referenceOpener = opener;
    state.referencePausedAt = Date.now();
    if (summonActive()) { state.materia.referenceWithinSummon = true; stopSummon(); }
    stopTimer(); stopAsh(); stopPipa(); renderPipa(); save();
    $('reference-kicker').textContent = kind === 'rules' ? 'CRCC / R-01 · TEXTE EN VIGUEUR' : kind === 'catalog' ? 'CRCC / C-08 · OUVRAGE HOMOLOGUÉ' : 'CRCC / M-12 · INSCRIPTIONS OFFICIELLES';
    $('reference-title').textContent = kind === 'rules' ? 'Règlement du guichet' : kind === 'catalog' ? 'Catalogue des cigares' : 'Registre des membres';
    $('rules-content').classList.toggle('hidden', kind !== 'rules');
    if (kind === 'rules') $('rules-content').innerHTML = renderRules(current().day);
    $('catalog-content').classList.toggle('hidden', kind !== 'catalog');
    $('registry-content').classList.toggle('hidden', kind !== 'registry');
    if (kind === 'catalog') $('catalog-content').innerHTML = `<p>Seuls ces cigares sont admis sur une fiche au titre de l’article 08 :</p><ol>${CATALOG.map(name => `<li>${escapeHTML(name)}</li>`).join('')}</ol><p>La mention « Habano — origine cubaine » exige aussi une preuve de provenance jointe au dossier (article 03). Tout nom inventé reste un nom inventé, même calligraphié par le Président.</p>`;
    else if (kind === 'registry') { $('registry-search').value = current().card.number; registryLookup(current().card.number); }
    $('reference-modal').classList.remove('hidden');
    $('reference-close').focus();
  }
  function closeReference() {
    if ($('reference-modal').classList.contains('hidden')) return;
    $('reference-modal').classList.add('hidden');
    const elapsed = Math.max(0, Date.now() - (state.referencePausedAt || Date.now()));
    if (state.timerDeadline) state.timerDeadline += elapsed;
    if (state.ash?.status === 'burning' && state.ash.caseId === current().id) state.ash.startedAt += elapsed;
    if (state.pipaNextAt) state.pipaNextAt += elapsed;
    if (state.materia.referenceWithinSummon) { state.materia.activeFrom += elapsed; state.materia.activeUntil += elapsed; state.materia.referenceWithinSummon = false; }
    state.referencePausedAt = null; save();
    referenceKind = null; referenceOpener?.focus(); referenceOpener = null;
    startTimer(current()); startAsh(current()); startPipa(); startSummon();
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function caseLimit(item) { return item.express ? 20 : state.timed ? 30 : 0; }
  function tickTimer() {
    if (!state || state.phase !== 'play' || !caseLimit(current()) || summonActive()) return;
    const seconds = Math.max(0, Math.ceil((state.timerDeadline - Date.now()) / 1000));
    $('timer-label').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    $('timer-box').classList.toggle('urgent', seconds <= (current().express ? 5 : 10));
    if (seconds === 0) decide('timeout');
  }
  function startTimer(item) {
    stopTimer();
    const limit = caseLimit(item);
    $('timer-box').classList.toggle('hidden', !limit);
    $('timer-box').classList.toggle('express', Boolean(item.express));
    $('timer-mode-label').textContent = item.express ? 'EXPRESS · 20 S' : 'TEMPS RESTANT';
    $('timer-label').textContent = `0:${String(limit).padStart(2, '0')}`;
    if (!limit) return;
    if (state.timerCaseId !== item.id || state.timerLimit !== limit || !Number.isFinite(state.timerDeadline)) {
      state.timerCaseId = item.id;
      state.timerLimit = limit;
      state.timerDeadline = Date.now() + limit * 1000;
      save();
    }
    if ((state.index === 0 && !state.tutorialDone) || state.tutorialPausedAt || summonActive()) {
      if (summonActive()) $('timer-label').textContent = `0:${String(Math.max(0, Math.ceil((state.timerDeadline - state.materia.activeFrom) / 1000))).padStart(2, '0')}`;
      return;
    }
    timer = setInterval(tickTimer, 250);
    tickTimer();
  }
  function stopAsh() { if (ashTimer) clearInterval(ashTimer); ashTimer = null; }
  function ashProfile(day) {
    const random = seededRandom(`${state.seed || 'LEGACY'}-CENDRE-${day}`);
    return { durationMs: Math.round(8500 + random() * 13500), maxLength: Math.round(48 + random() * 62), burnSpan: Math.round(68 + random() * 42), burnExponent: .65 + random() * 1.15 };
  }
  function ashProgress() {
    const ash = state.ash;
    return Math.min(1, Math.pow(Math.max(0, (Date.now() - ash.startedAt) / ash.durationMs), ash.burnExponent));
  }
  function renderAsh(progress) {
    const consumed = Math.round(Math.max(0, Math.min(1, progress)) * state.ash.burnSpan);
    $('ash-body').style.width = `${216 - consumed}px`;
    $('ash-ember').style.left = `${214 - consumed}px`;
    $('ash-length').style.left = `${224 - consumed}px`;
    $('ash-length').style.width = `${Math.round(progress * state.ash.maxLength)}px`;
  }
  function tickAsh() {
    if (state?.phase !== 'play' || state.ash?.status !== 'burning' || summonActive()) return;
    const progress = ashProgress();
    renderAsh(progress);
    $('ash-meter').textContent = progress < .25 ? 'CENDRE COURTE' : progress < .55 ? 'CENDRE MOYENNE' : progress < .8 ? 'CENDRE LONGUE' : 'CENDRE FRAGILE';
    if (Date.now() - state.ash.startedAt >= state.ash.durationMs) settleAsh('fallen', -30);
  }
  function settleAsh(status, delta) {
    if (state.ash?.status !== 'burning') return;
    if (status === 'collected' && state.materia.introduced && materiaEquipped('cendrier')) delta += (materiaLevel('cendrier') === 2 ? 20 : 10) + (materiaLinked('cendrier') ? materiaBlueBonus() : 0);
    stopAsh(); state.ash.burnProgress = ashProgress();
    renderAsh(state.ash.burnProgress); state.ash.status = status; state.ash.delta = delta;
    state.ashHistory ??= [];
    if (status !== 'skipped') { state.balance += delta; state.ashHistory.push({ caseId: state.ash.caseId, status, delta }); }
    $('balance-label').textContent = `${state.balance} F`;
    $('ash-button').disabled = true;
    $('ash-skip').disabled = true;
    $('ash-meter').textContent = status === 'fallen' ? 'TOMBÉE' : status === 'collected' ? 'DÉTACHÉE' : 'CLASSÉ';
    $('ash-message').textContent = status === 'fallen' ? 'Patatras. La cendre est tombée : −30 F.' : status === 'collected' ? `Cendre déposée sur le registre : +${delta} F.` : 'Cigare classé sans suite. Aucun bonus ni malus.';
    save(); updateShop();
  }
  function startAsh(item) {
    stopAsh();
    const firstOfDay = state.order.find(id => { const entry = ALL_CASES.find(candidate => candidate.id === id); return entry.day === item.day && !entry.express; }) === item.id;
    $('ash-panel').classList.toggle('hidden', !firstOfDay);
    if (!firstOfDay) return;
    if (state.ash?.caseId !== item.id) state.ash = { caseId: item.id, startedAt: Date.now(), status: 'burning', delta: 0, ...ashProfile(item.day) };
    state.ash.durationMs ??= 14000; state.ash.maxLength ??= 80; state.ash.burnSpan ??= 80; state.ash.burnExponent ??= 1;
    $('ash-button').disabled = state.ash.status !== 'burning' || summonActive();
    $('ash-skip').disabled = state.ash.status !== 'burning' || summonActive();
    $('ash-message').textContent = state.ash.status === 'fallen' ? 'Patatras. La cendre est tombée : −30 F.' : state.ash.status === 'collected' ? `Cendre déposée : +${state.ash.delta} F.` : state.ash.status === 'skipped' ? 'Cigare classé sans suite. Aucun bonus ni malus.' : '';
    renderAsh(state.ash.status === 'burning' ? ashProgress() : state.ash.burnProgress || 0);
    $('ash-meter').textContent = state.ash.status === 'collected' ? 'DÉTACHÉE' : state.ash.status === 'fallen' ? 'TOMBÉE' : state.ash.status === 'skipped' ? 'CLASSÉ' : 'CENDRE COURTE';
    if (state.ash.status === 'burning' && !summonActive() && !((state.index === 0 && !state.tutorialDone) || state.tutorialPausedAt)) { ashTimer = setInterval(tickAsh, 100); tickAsh(); }
    save();
  }
  function collectAsh() {
    if (state?.phase !== 'play' || state.ash?.status !== 'burning' || summonActive()) return;
    const progress = ashProgress();
    if (Date.now() - state.ash.startedAt >= state.ash.durationMs) settleAsh('fallen', -30);
    else settleAsh('collected', Math.max(5, Math.round(progress * state.ash.maxLength * .65)));
  }
  function updateTutorialSpotlight() {
    if (!highlighted || $('tutorial-overlay').classList.contains('hidden')) return;
    const box = highlighted.getBoundingClientRect(), pad = 6, spot = $('tutorial-spotlight');
    spot.style.left = `${Math.max(0, box.left - pad)}px`;
    spot.style.top = `${Math.max(0, box.top - pad)}px`;
    spot.style.width = `${Math.min(window.innerWidth, box.right + pad) - Math.max(0, box.left - pad)}px`;
    spot.style.height = `${Math.min(window.innerHeight, box.bottom + pad) - Math.max(0, box.top - pad)}px`;
  }
  function closeTutorial() {
    if ($('tutorial-overlay').classList.contains('hidden')) return;
    highlighted = null;
    $('tutorial-overlay').classList.add('hidden'); document.body.classList.remove('tutorial-active');
    state.tutorialDone = true; rememberTutorial();
    const paused = Date.now() - (state.tutorialPausedAt || tutorialPausedAt);
    if (caseLimit(current()) && state.timerCaseId === current().id) state.timerDeadline += paused;
    if (state.ash?.status === 'burning' && state.ash.caseId === current().id) state.ash.startedAt += paused;
    if (state.pipaNextAt) state.pipaNextAt += paused;
    state.tutorialPausedAt = null;
    save(); startTimer(current()); startAsh(current()); startPipa(); $('help-button').focus();
  }
  function showTutorialStep() {
    const step = TUTORIAL[tutorialStep];
    highlighted = document.querySelector(step.selector);
    if (!highlighted) { closeTutorial(); return; }
    highlighted.scrollIntoView({ block: 'center', behavior: 'instant' });
    $('tutorial-progress').textContent = `MODE D’EMPLOI · ${tutorialStep + 1} / ${TUTORIAL.length}`;
    $('tutorial-title').textContent = step.title;
    $('tutorial-copy').textContent = step.copy;
    $('tutorial-next').innerHTML = tutorialStep === TUTORIAL.length - 1 ? 'COMMENCER <span>✓</span>' : 'SUIVANT <span>→</span>';
    const high = highlighted.getBoundingClientRect();
    $('tutorial-overlay').classList.toggle('tutorial-top', high.bottom > window.innerHeight * .6);
    updateTutorialSpotlight(); $('tutorial-next').focus();
  }
  function openTutorial() {
    if (state?.phase !== 'play' || summonActive() || !$('tutorial-overlay').classList.contains('hidden')) return;
    stopTimer(); stopAsh(); stopPipa(); tutorialPausedAt = state.tutorialPausedAt || Date.now(); state.tutorialPausedAt = tutorialPausedAt; renderPipa(); save(); tutorialStep = 0;
    $('tutorial-overlay').classList.remove('hidden'); document.body.classList.add('tutorial-active');
    showTutorialStep();
  }
  function materiaLevel(id) { return (state.materia.xp[id] || 0) >= 6 ? 2 : 1; }
  function materiaEquipped(id) { return state.materia.equipped.includes(id); }
  function materiaLinked(id) { return id !== 'duplicata' && materiaEquipped('duplicata') && materiaEquipped(id); }
  function materiaBlueBonus() { return materiaLevel('duplicata') === 2 ? 20 : 10; }
  function materiaUseCount(id, day = current().day) { return state.materia.uses[`${id}:${day}`] || 0; }
  function materiaUseLimit(id) { return (id === 'loupe' && materiaLevel(id) === 2 ? 2 : 1) + (materiaLinked(id) ? materiaLevel('duplicata') : 0); }
  function materiaOrb(id) { return `<span class="materia-orb ${MATERIA[id].color}" aria-hidden="true"></span>`; }
  function renderBriefingMateria(day, prefix = 'materia-briefing') {
    $(`${prefix}-slots`).innerHTML = state.materia.equipped.map((id, index) => `<button type="button" class="materia-slot ${index === materiaSelectedSlot ? 'selected' : ''}" data-materia-slot="${index}" aria-pressed="${index === materiaSelectedSlot}">${id ? materiaOrb(id) : '<span class="materia-orb locked-orb" aria-hidden="true"></span>'}<span>LOGEMENT ${index + 1}<strong>${id ? escapeHTML(MATERIA[id].name) : 'Vide'}</strong></span></button>`).join('<span class="materia-link" aria-hidden="true">◆──◆</span>');
    $(`${prefix}-choices`).innerHTML = Object.entries(MATERIA).filter(([, entry]) => prefix !== 'materia-intro' || entry.day <= day).map(([id, entry]) => {
      if (entry.day > day) return `<div class="materia-choice locked"><span class="materia-orb locked-orb" aria-hidden="true"></span><span><strong>Scellée jusqu’au jour ${entry.day}</strong><small>ARCHIVES CONFIDENTIELLES</small></span></div>`;
      const owned = state.materia.owned.includes(id), offered = !owned && !state.materia.freeChoice;
      const unaffordable = !owned && !offered && state.balance < entry.price;
      const action = owned ? 'ACQUISE · ÉQUIPER' : offered ? 'PREMIÈRE OFFERTE' : `${entry.price} F · ACHETER ET ÉQUIPER`;
      return `<button type="button" class="materia-choice ${entry.color} ${materiaEquipped(id) ? 'equipped' : ''}" data-equip-materia="${id}" ${unaffordable ? 'disabled' : ''}>${materiaOrb(id)}<span><strong>${escapeHTML(entry.name)}</strong><small>${MATERIA_COLORS[entry.color]} · NIVEAU ${materiaLevel(id)} · ${Math.min(6, state.materia.xp[id] || 0)}/6 AP</small><span>${escapeHTML(entry.description)}</span><b class="materia-price">${action}${unaffordable ? ' · CAISSE INSUFFISANTE' : ''}</b></span></button>`;
    }).join('');
    $(`${prefix}-note`).textContent = `Caisse : ${state.balance} F. ${state.materia.freeChoice ? 'Les achats sont définitifs pour cette partie ; vous pourrez rééquiper vos orbes acquises aux prochains briefings.' : 'La première Matéria est offerte. Choisissez-la avant de continuer.'} Les deux logements sont reliés : la bleue améliore l’autre. Une décision exacte donne 1 AP aux Matérias équipées ; le niveau 2 arrive à 6 AP.${day === 3 ? ' La rouge invoque le Grand Rat après cinq décisions exactes avec elle.' : ''}`;
    if (prefix === 'materia-intro') $('materia-intro-next').disabled = !state.materia.freeChoice;
  }
  function equipMateria(id) {
    if (!['briefing', 'hrpcBlock', 'materiaIntro'].includes(state?.phase) || !MATERIA[id] || MATERIA[id].day > current().day) return;
    if (!state.materia.owned.includes(id)) {
      if (!state.materia.freeChoice) state.materia.freeChoice = id;
      else {
        if (state.balance < MATERIA[id].price) return;
        state.balance -= MATERIA[id].price;
      }
      state.materia.owned.push(id);
    }
    const slots = state.materia.equipped, other = 1 - materiaSelectedSlot;
    if (slots[other] === id) [slots[materiaSelectedSlot], slots[other]] = [slots[other], slots[materiaSelectedSlot]];
    else slots[materiaSelectedSlot] = id;
    state.materia.streak = 0;
    save(); renderBriefingMateria(current().day, state.phase === 'materiaIntro' ? 'materia-intro' : 'materia-briefing');
  }
  function renderPlayMateria() {
    $('materia-tray').classList.toggle('hidden', !state.materia.introduced);
    if (!state.materia.introduced) return;
    const day = current().day;
    $('materia-play-slots').innerHTML = state.materia.equipped.map(id => id ? `<div class="materia-mini ${MATERIA[id].color}">${materiaOrb(id)}<span><strong>${escapeHTML(MATERIA[id].name)}</strong><small>NV ${materiaLevel(id)} · ${Math.min(6, state.materia.xp[id] || 0)}/6 AP</small></span></div>` : '<div class="materia-mini empty"><span class="materia-orb locked-orb" aria-hidden="true"></span><span><strong>Logement vide</strong><small>PROCHAIN ACHAT AU BRIEFING</small></span></div>').join('<span class="materia-link" aria-hidden="true">◆</span>');
    const actions = [];
    if (materiaEquipped('loupe')) actions.push(`<button type="button" data-use-materia="loupe" ${materiaUseCount('loupe', day) >= materiaUseLimit('loupe') ? 'disabled' : ''}>🟢 INDICE · ${Math.max(0, materiaUseLimit('loupe') - materiaUseCount('loupe', day))} RESTANT(S)</button>`);
    if (materiaEquipped('montre')) actions.push(`<button type="button" data-use-materia="montre" ${!caseLimit(current()) || materiaUseCount('montre', day) >= materiaUseLimit('montre') ? 'disabled' : ''}>🟡 +${materiaLevel('montre') === 2 ? 8 : 5} S · ${Math.max(0, materiaUseLimit('montre') - materiaUseCount('montre', day))} RESTANT(S)</button>`);
    if (materiaEquipped('grandrat')) actions.push(`<button type="button" class="materia-summon-button" data-use-materia="grandrat" ${(state.materia.xp.grandrat || 0) < 5 || state.materia.summonUsed ? 'disabled' : ''}>🔴 ${state.materia.summonUsed ? 'INVOCATION UTILISÉE' : (state.materia.xp.grandrat || 0) < 5 ? `CHARGE ${state.materia.xp.grandrat || 0}/5 AP` : 'INVOQUER LE GRAND RAT'}</button>`);
    $('materia-actions').innerHTML = actions.join('');
    $('materia-status').textContent = state.materia.lastNote || 'Les orbes équipées gagnent 1 AP à chaque décision exacte.';
  }
  function useMateria(id) {
    if (state?.phase !== 'play' || !state.materia.introduced || !materiaEquipped(id) || state.referencePausedAt || state.purchasePausedAt || state.tutorialPausedAt || state.materia.activeUntil) return;
    const day = current().day;
    if (id === 'grandrat') { activateSummon(); return; }
    if (!['loupe', 'montre'].includes(id) || materiaUseCount(id, day) >= materiaUseLimit(id)) return;
    if (id === 'montre' && !caseLimit(current())) return;
    state.materia.uses[`${id}:${day}`] = materiaUseCount(id, day) + 1;
    if (id === 'loupe') {
      const reason = current().reason;
      state.materia.lastNote = reason ? `Loupe du Greffier · Piste : relisez l’article ${REASON_RULE[reason]}. Le motif exact reste à trouver.` : 'Loupe du Greffier · Aucune irrégularité manifeste. Vérifiez tout de même les pièces avant de tamponner.';
    } else {
      const seconds = materiaLevel('montre') === 2 ? 8 : 5;
      state.timerDeadline += seconds * 1000;
      state.materia.lastNote = `Montre du secrétaire · +${seconds} secondes sur ce dossier. Le Comité prétend que l’horloge a toujours affiché cette heure.`;
      tickTimer();
    }
    save(); renderPlayMateria(); tone(id === 'loupe' ? 570 : 680, .12);
  }
  function gainMateriaXP(exact) {
    if (!state.materia.introduced) return '';
    if (!exact) { state.materia.streak = 0; return ''; }
    const notes = [];
    for (const id of state.materia.equipped.filter(Boolean)) {
      const before = state.materia.xp[id] || 0;
      state.materia.xp[id] = Math.min(6, before + 1);
      if (before === 5) notes.push(`${MATERIA[id].name} atteint le niveau 2`);
      if (id === 'grandrat' && before === 4) notes.push('invocation du Grand Rat chargée');
    }
    return notes.join(' · ');
  }
  function materiaDecisionBonus(exact, day) {
    if (!state.materia.introduced) return 0;
    state.materia.streak = exact && materiaEquipped('caisse') ? state.materia.streak + 1 : 0;
    if (state.materia.streak < 3 || state.materia.procs[`caisse:${day}`]) return 0;
    state.materia.procs[`caisse:${day}`] = true;
    return (materiaLevel('caisse') === 2 ? 40 : 25) + (materiaLinked('caisse') ? materiaBlueBonus() : 0);
  }
  function summonActive() { return Boolean(state?.materia?.activeUntil && Date.now() < state.materia.activeUntil); }
  function stopSummon() { if (summonTimer) clearInterval(summonTimer); summonTimer = null; }
  function renderSummon() {
    const active = summonActive() && state.phase === 'play';
    $('play').classList.toggle('summon-truce', active);
    $('summon-count').classList.toggle('hidden', !active);
    $('summon-vision').classList.toggle('hidden', !active || Date.now() - state.materia.activeFrom > 2700);
    if (active) {
      $('summon-count').textContent = `GRAND RAT · ${Math.max(1, Math.ceil((state.materia.activeUntil - Date.now()) / 1000))} S · BUREAU SUSPENDU`;
      $('blackout-shade').classList.add('lit');
    } else if (state?.specialEffect?.kind === 'blackout' && !lighterTimer) $('blackout-shade').classList.remove('lit');
    $('inverted-cursor').classList.add('hidden');
    $('help-button').disabled = active;
    if (state?.ash?.status === 'burning') { $('ash-button').disabled = active; $('ash-skip').disabled = active; }
  }
  function settleSummon(restart = true) {
    if (!state?.materia?.activeUntil) return;
    const elapsed = Math.max(0, Math.min(Date.now(), state.materia.activeUntil) - state.materia.activeFrom);
    if (state.timerDeadline) state.timerDeadline += elapsed;
    if (state.ash?.status === 'burning') state.ash.startedAt += elapsed;
    if (state.pipaNextAt) state.pipaNextAt += elapsed;
    state.materia.activeFrom = null; state.materia.activeUntil = null; state.materia.referenceWithinSummon = false;
    stopSummon(); renderSummon(); save(); updateShop();
    if (restart && state.phase === 'play') { startTimer(current()); startAsh(current()); startPipa(); }
  }
  function startSummon() {
    stopSummon(); renderSummon();
    if (!summonActive() || state.referencePausedAt) return;
    summonTimer = setInterval(() => {
      if (Date.now() >= state.materia.activeUntil) settleSummon();
      else renderSummon();
    }, 120);
  }
  function activateSummon() {
    if (!materiaEquipped('grandrat') || (state.materia.xp.grandrat || 0) < 5 || state.materia.summonUsed) return;
    state.materia.summonUsed = true;
    state.materia.activeFrom = Date.now();
    const seconds = 10 + (materiaLevel('grandrat') === 2 ? 5 : 0) + (materiaLinked('grandrat') ? materiaLevel('duplicata') === 2 ? 8 : 5 : 0);
    state.materia.activeUntil = state.materia.activeFrom + seconds * 1000;
    state.materia.lastNote = `Grand Rat des Archives · ${seconds} secondes de suspension provisoire de la réalité.`;
    state.pipaHearts = []; stopPipa(); stopTimer(); stopAsh(); renderPipa();
    save(); updateShop(); renderPlayMateria(); startSummon(); tone(110, .35, 'sawtooth');
  }
  function rulesBlocked() { return !state.hrpcDisabled && current().day === state.hrpcBlockDay && !summonActive(); }
  function renderRules(day) {
    return [1, 2, 3, 4].filter(number => number <= day).map(number =>
      `<div class="rule-group"><h3>${number === 1 ? 'DISPOSITIONS PERMANENTES' : `CIRCULAIRE DU JOUR ${number}`}</h3>${RULES.filter(rule => rule.day === number).map(rule => `<div class="rule"><b>${rule.id}</b><span>${escapeHTML(rule.text)}</span></div>`).join('')}</div>`
    ).join('');
  }
  function showDayBriefing(day) {
    if (state.materia.day !== day) { state.materia.day = day; state.materia.streak = 0; }
    materiaSelectedSlot = 0;
    state.phase = 'briefing'; save();
    $('briefing-kicker').textContent = `CRCC / OUVERTURE DU JOUR ${String(day).padStart(2, '0')}`;
    $('briefing-title').textContent = day === 1 ? 'Votre stage au guichet commence' : `Nouvelles règles · jour ${day}`;
    $('briefing-intro').textContent = day === 1 ? 'Le Comité exécutif vous accueille pour quatre journées de stage. À chaque passage, examinez les trois pièces, consultez les ouvrages du bureau, puis validez la demande ou refusez-la avec le bon motif. Le tampon décide ; votre intuition, nettement moins.' : 'Le Comité vous communique les dispositions qui entrent en vigueur aujourd’hui. Les règles des journées précédentes continuent de s’appliquer.';
    $('briefing-story').classList.toggle('hidden', day !== 1);
    $('briefing-story').textContent = day === 1 ? 'Le Hamster Riding Pipe Club (HRPC) est un club rival de rongeurs à pipe. Ses membres surgissent au guichet, falsifient des cachets, grignotent des articles et sabotent parfois le bureau. Leurs incidents sont distincts des dossiers à tamponner : gardez votre calme et vos fiches.' : ''; 
    $('briefing-rules').innerHTML = RULES.filter(rule => rule.day === day).map(rule => `<div class="rule"><b>${rule.id}</b><span>${escapeHTML(rule.text)}</span></div>`).join('');
    $('materia-day-picker').classList.toggle('hidden', !state.materia.introduced);
    if (state.materia.introduced) renderBriefingMateria(day);
    $('briefing-note').textContent = state.hrpcDisabled ? 'Le HRPC est hors service. Le règlement restera accessible.' : 'Le règlement, le catalogue et le registre sont consultables depuis le bureau.';
    visible('day-briefing');
  }
  function continueDayBriefing() {
    if (state?.phase !== 'briefing') return;
    if (rulesBlocked() && !state.hrpcBlockShownDays.includes(current().day)) return showHrpcBlock();
    showCase();
  }
  function showHrpcBlock() {
    state.phase = 'hrpcBlock'; save(); visible('hrpc-block');
  }
  function closeHrpcBlock() {
    if (state?.phase !== 'hrpcBlock') return;
    state.hrpcBlockShownDays.push(current().day); save(); showCase();
  }
  function showMateriaIntro() {
    state.phase = 'materiaIntro'; materiaSelectedSlot = 0; save();
    renderBriefingMateria(current().day, 'materia-intro');
    visible('materia-intro');
  }
  function continueMateriaIntro() {
    if (state?.phase !== 'materiaIntro' || !state.materia.freeChoice) return;
    state.materia.introduced = true; save();
    showNextCaseEvents();
  }
  function presidentOpinion() {
    if (state.suspicion >= 3) return 'Exclu : le Président vous a rayé de son carnet avec application.';
    if (state.suspicion >= 2) return 'Très méfiant : il fait vérifier la sincérité de vos compliments.';
    if (state.suspicion === 1) return 'Soupçonneux : il vous observe par-dessus son registre.';
    if (state.favor >= 4) return 'Ravi : il vous réserve le fauteuil qui ne grince pas.';
    if (state.favor >= 1) return 'Bien disposé : il vous appelle presque par votre prénom.';
    if (state.favor <= -2) return 'Glacial : il a demandé que votre nom soit prononcé dans le couloir.';
    if (state.favor < 0) return 'Contrarié : son sourire a été classé sans suite.';
    return 'Neutre : il n’a pas encore chargé un secrétaire de vous décrire.';
  }
  function updateShop() {
    const blocked = rulesBlocked();
    $('rules-open').disabled = blocked;
    $('rules-lock').classList.toggle('hidden', !blocked);
    $('rush-case').disabled = summonActive() || state.balance < 100 || state.rushDays.includes(current().day);
    $('gift-president').disabled = summonActive() || state.balance < 300;
    $('raid-hrpc').disabled = summonActive() || state.balance < 300 || state.hrpcDisabled;
    if (state.hrpcDisabled) $('shop-status').textContent = 'Le HRPC est hors service jusqu’à la fin de la partie. Le règlement est accessible.';
    else if (blocked) $('shop-status').textContent = 'Le HRPC a bloqué le règlement aujourd’hui. Un raid à 300 F rétablit son accès et neutralise le Club.';
    else $('shop-status').textContent = '100 F : décision juste et prime de 150 F (gain net +50 F, une fois par jour) · 300 F : +1 faveur et efface un soupçon · 300 F : neutraliser le HRPC.';
    $('shop-status').textContent += ` Faveur : ${state.favor > 0 ? '+' : ''}${state.favor} · Soupçons : ${state.suspicion}/3.`;
    $('president-opinion').textContent = `AVIS DU PRÉSIDENT · ${presidentOpinion()}`;
  }
  function spend(kind) {
    if (state?.phase !== 'play' || summonActive() || !$('purchase-modal').classList.contains('hidden')) return;
    const cost = { rush: 100, gift: 300, raid: 300 }[kind];
    if (!cost || state.balance < cost || (kind === 'raid' && state.hrpcDisabled) || (kind === 'rush' && state.rushDays.includes(current().day))) return;
    if (kind === 'rush') { const item = current(); decide(item.reason ? 'refuse' : 'approve', item.reason, true); return; }
    state.balance -= cost;
    if (kind === 'gift') { state.purchaseRelievedSuspicion = state.suspicion > 0; state.favor += 1; if (state.purchaseRelievedSuspicion) state.suspicion--; }
    if (kind === 'raid') { state.hrpcDisabled = true; if (state.specialEffect?.kind === 'blackout') clearSpecialEffect(); }
    $('balance-label').textContent = `${state.balance} F`;
    save(); updateShop(); tone(kind === 'raid' ? 530 : 420, .13); openPurchase(kind);
  }
  function openPurchase(kind) {
    if (state?.phase !== 'play') return;
    if (!state.purchasePausedAt) { state.purchasePausedAt = Date.now(); stopTimer(); stopAsh(); }
    state.purchaseKind = kind; renderPipa(); save();
    $('purchase-kicker').textContent = kind === 'gift' ? 'REÇU DU SERVICE DES ATTENTIONS' : 'RAPPORT D’OPÉRATION ANTIRONGEURS';
    $('purchase-title').textContent = kind === 'gift' ? 'Le Président a reçu son habano.' : 'Le HRPC connaît une journée difficile.';
    $('purchase-copy').textContent = kind === 'gift' ? `Il l’a humé longuement, puis a demandé à son secrétaire de consigner que ce geste venait spontanément de vous. ${state.purchaseRelievedSuspicion ? 'Il raye aussi un soupçon de son carnet, après avoir longuement hésité sur la qualité du papier.' : 'Sa gratitude tiendra au moins jusqu’à la prochaine circulaire.'}` : 'Une escouade de contrôleurs a investi la roue, saisi trois pipes et réquisitionné le petit casque du chef. Les hamsters se déclarent en séminaire de reconstruction pour le reste de la partie.';
    $('purchase-ledger').textContent = `${kind === 'gift' ? `−300 F · +1 faveur présidentielle${state.purchaseRelievedSuspicion ? ' · −1 soupçon' : ''}` : '−300 F · HRPC hors service'} · Caisse : ${state.balance} F`;
    $('purchase-modal').classList.remove('hidden'); $('purchase-close').focus();
  }
  function closePurchase() {
    if ($('purchase-modal').classList.contains('hidden')) return;
    $('purchase-modal').classList.add('hidden');
    const elapsed = Math.max(0, Date.now() - (state.purchasePausedAt || Date.now()));
    if (state.timerDeadline) state.timerDeadline += elapsed;
    if (state.ash?.status === 'burning' && state.ash.caseId === current().id) state.ash.startedAt += elapsed;
    if (state.pipaNextAt) state.pipaNextAt += elapsed;
    const kind = state.purchaseKind;
    state.purchaseKind = null; state.purchaseRelievedSuspicion = false; state.purchasePausedAt = null; save();
    $(kind === 'gift' ? 'gift-president' : 'raid-hrpc').focus();
    startTimer(current()); startAsh(current()); startPipa();
  }
  function showSpecial(event) {
    if (!event) { showCase(); return; }
    const details = {
      pipa: { title: 'Pipa traverse le Cigar Club', copy: 'Sur le prochain dossier, les pièces se brouillent et de petits cœurs envahissent le bureau. Cliquez sur les cœurs pour les chasser : à 24, l’écran est perdu et la partie s’arrête.', warning: 'Les consultations mettent la nuée en pause. Le traitement immédiat peut aussi sauver le dossier.' },
      cedric: { title: 'L’habano très particulier de Cédric', copy: 'Cédric vous offre un « habano » dont l’odeur de ganja fait onduler le bureau : couleurs jamaïcaines, mots inconnus et dub de synthèse si le son est activé.', warning: 'Sur ordinateur, les clics sur les deux tampons sont inversés. Le clavier reste normal. Les animations respectent la préférence de mouvement réduit.' },
      blackout: { title: 'Le HRPC a rongé les fils', copy: 'Le prochain dossier sera plongé dans le noir. Cliquez sur le briquet pour éclairer le bureau pendant deux secondes, puis rallumez-le autant de fois que nécessaire.', warning: 'Le chronomètre du dossier continue de tourner dans le noir. Un raid sur le HRPC peut rétablir le courant.' }
    }[event.kind];
    $('special-kicker').textContent = `INCIDENT IMPRÉVU · JOUR ${event.day}`;
    $('special-title').textContent = details.title;
    $('special-copy').textContent = details.copy;
    $('special-warning').textContent = details.warning;
    state.phase = 'special'; save(); visible('special');
  }
  function acceptSpecial() {
    if (state?.phase !== 'special' || state.activeInterruption?.type !== 'special') return;
    const { kind } = state.activeInterruption;
    state.specialPlayed = true;
    state.specialEffect = { kind, caseId: current().id };
    save(); finishScheduledEvent();
  }
  function stopReggae() { if (reggaeTimer) clearInterval(reggaeTimer); reggaeTimer = null; }
  function stopPipa() { if (pipaTimer) clearInterval(pipaTimer); pipaTimer = null; }
  function renderPipa() {
    const active = state?.phase === 'play' && state.specialEffect?.kind === 'pipa' && !state.referencePausedAt && !state.tutorialPausedAt && !state.purchasePausedAt && !summonActive();
    $('pipa-hearts').classList.toggle('hidden', !active);
    $('pipa-counter').classList.toggle('hidden', !active);
    if (!active) return;
    $('pipa-hearts').innerHTML = state.pipaHearts.map(heart => `<button type="button" class="pipa-heart" data-heart="${heart.id}" style="left:${heart.x}%;top:${heart.y}%" aria-label="Chasser un cœur de Pipa">♥</button>`).join('');
    $('pipa-counter').textContent = `Cœurs de Pipa : ${state.pipaHearts.length} / 24 · Cliquez pour les chasser`;
  }
  function tickPipa() {
    if (state?.phase !== 'play' || state.specialEffect?.kind !== 'pipa' || state.referencePausedAt || state.tutorialPausedAt || state.purchasePausedAt || summonActive()) return;
    if (Date.now() < state.pipaNextAt) return;
    const id = (state.pipaSequence || 0) + 1;
    state.pipaSequence = id;
    const random = seededRandom(`${state.seed}-PIPA-${id}`);
    state.pipaHearts.push({ id, x: Math.round(5 + random() * 85), y: Math.round(12 + random() * 75) });
    state.pipaNextAt = Date.now() + Math.max(330, 1050 - state.pipaHearts.length * 30);
    renderPipa(); save();
    if (state.pipaHearts.length >= 24) { state.excludedReason = 'pipa'; finish(); }
  }
  function startPipa() {
    stopPipa(); renderPipa();
    if (state?.phase !== 'play' || state.specialEffect?.kind !== 'pipa' || state.referencePausedAt || state.tutorialPausedAt || state.purchasePausedAt || summonActive()) return;
    state.pipaHearts ??= [];
    state.pipaNextAt ||= Date.now() + 1200;
    pipaTimer = setInterval(tickPipa, 180); tickPipa();
  }
  function startReggae() {
    if (!soundEnabled || reggaeTimer || state?.specialEffect?.kind !== 'cedric' || state.phase !== 'play') return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume?.();
      const note = (frequency, at, duration, volume, type = 'triangle', cutoff = 1200) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff;
        oscillator.type = type; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(volume, at + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(filter).connect(gain).connect(audio.destination);
        oscillator.start(at); oscillator.stop(at + duration + .02);
      };
      const percussion = (at, duration, volume, cutoff) => {
        const size = Math.floor(audio.sampleRate * duration), buffer = audio.createBuffer(1, size, audio.sampleRate), samples = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) samples[i] = Math.random() * 2 - 1;
        const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
        source.buffer = buffer; filter.type = 'highpass'; filter.frequency.value = cutoff;
        gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        source.connect(filter).connect(gain).connect(audio.destination); source.start(at); source.stop(at + duration);
      };
      const bar = () => {
        const start = audio.currentTime + .04, beat = 60 / 78;
        [[0, 82.4], [1.75, 82.4], [2.5, 110], [3.25, 98]].forEach(([step, frequency]) => note(frequency, start + step * beat, .38, .095, 'triangle', 340));
        for (let step = 0; step < 4; step++) {
          const offbeat = start + (step + .5) * beat;
          note(329.6, offbeat, .13, .024, 'sawtooth', 820);
          note(392, offbeat, .13, .017, 'triangle', 950);
          note(392, offbeat + beat * .31, .12, .008, 'triangle', 780);
          percussion(start + step * beat, .04, .018, 6000);
        }
        [1, 3].forEach(step => percussion(start + step * beat, .11, .042, 1200));
        [0, 2].forEach(step => { const at = start + step * beat, kick = audio.createOscillator(), gain = audio.createGain(); kick.type = 'sine'; kick.frequency.setValueAtTime(135, at); kick.frequency.exponentialRampToValueAtTime(47, at + .17); gain.gain.setValueAtTime(.11, at); gain.gain.exponentialRampToValueAtTime(.0001, at + .2); kick.connect(gain).connect(audio.destination); kick.start(at); kick.stop(at + .21); });
      };
      bar(); reggaeTimer = setInterval(bar, 4 * 60 / 78 * 1000);
    } catch (_) { stopReggae(); }
  }
  function applySpecialEffect(kind) {
    const play = $('play');
    for (const name of ['pipa', 'cedric', 'blackout']) play.classList.toggle(`effect-${name}`, kind === name);
    $('effect-notice').classList.toggle('hidden', !kind);
    $('effect-notice').textContent = kind === 'pipa' ? 'PIPA · Chassez les cœurs avant qu’ils ne remplissent l’écran (24 = fin de partie).' : kind === 'cedric' ? 'CÉDRIC · Dub, ondulations, mots mystérieux et clics inversés sur les tampons. Activez le son.' : kind === 'blackout' ? 'HRPC · Rallumez le briquet pour voir le dossier pendant deux secondes.' : '';
    $('blackout-shade').classList.toggle('hidden', kind !== 'blackout');
    $('blackout-shade').classList.remove('lit');
    $('lighter-button').classList.toggle('hidden', kind !== 'blackout');
    $('inverted-cursor').classList.add('hidden');
    stopReggae(); if (kind === 'cedric') startReggae();
    if (kind !== 'pipa') { stopPipa(); renderPipa(); }
  }
  function clearSpecialEffect() {
    if (!state?.specialEffect) return;
    state.specialEffect = null;
    for (const name of ['pipa', 'cedric', 'blackout']) $('play').classList.remove(`effect-${name}`);
    $('effect-notice').classList.add('hidden'); $('blackout-shade').classList.add('hidden');
    $('lighter-button').classList.add('hidden'); $('inverted-cursor').classList.add('hidden');
    if (lighterTimer) clearTimeout(lighterTimer); lighterTimer = null;
    stopReggae(); save();
    stopPipa(); state.pipaHearts = []; state.pipaNextAt = null; renderPipa(); save();
  }
  function lightLighter() {
    if (state?.phase !== 'play' || state.specialEffect?.kind !== 'blackout') return;
    $('blackout-shade').classList.add('lit');
    if (lighterTimer) clearTimeout(lighterTimer);
    lighterTimer = setTimeout(() => { $('blackout-shade').classList.remove('lit'); lighterTimer = null; }, 2000);
    tone(620, .09);
  }
  // Pendant le délire de Cédric, les deux tampons échangent leurs zones de clic à la souris.
  function invertedPointer(event) {
    if (state?.phase !== 'play' || state.specialEffect?.kind !== 'cedric' || summonActive() || event.pointerType !== 'mouse') return;
    const bounds = $('actions').getBoundingClientRect(), cursor = $('inverted-cursor');
    cursor.style.left = `${bounds.left + bounds.right - event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.classList.remove('hidden');
  }
  function invertedClick(event) {
    if (invertedReplay || state?.phase !== 'play' || state.specialEffect?.kind !== 'cedric' || summonActive() || event.detail === 0 || lastPointerType !== 'mouse') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const buttons = [...$('actions').querySelectorAll('button')], target = event.target.closest('button');
    if (!target || buttons.length !== 2) return;
    invertedReplay = true;
    buttons[1 - buttons.indexOf(target)]?.click();
    $('inverted-cursor').classList.add('hidden');
    invertedReplay = false;
  }
  function showCase() {
    const item = current(), card = item.card, sheet = item.sheet, request = item.request;
    if (state.materia.lastCaseId !== item.id) { state.materia.lastCaseId = item.id; state.materia.lastNote = ''; }
    if (state.purchasePausedAt) {
      const elapsed = Math.max(0, Date.now() - state.purchasePausedAt);
      if (state.timerDeadline) state.timerDeadline += elapsed;
      if (state.ash?.status === 'burning' && state.ash.caseId === item.id) state.ash.startedAt += elapsed;
      if (state.pipaNextAt) state.pipaNextAt += elapsed;
      state.purchasePausedAt = Date.now();
    }
    if (state.referencePausedAt) {
      const elapsed = Math.max(0, Date.now() - state.referencePausedAt);
      if (state.timerDeadline) state.timerDeadline += elapsed;
      if (state.ash?.status === 'burning' && state.ash.caseId === item.id) state.ash.startedAt += elapsed;
      if (state.pipaNextAt) state.pipaNextAt += elapsed;
      if (state.materia.referenceWithinSummon) { state.materia.activeFrom += elapsed; state.materia.activeUntil += elapsed; state.materia.referenceWithinSummon = false; }
      state.referencePausedAt = null;
    }
    if (state.materia.activeUntil && !summonActive()) settleSummon(false);
    $('reference-modal').classList.add('hidden');
    $('registry-result').innerHTML = '';
    $('day-label').textContent = `${String(item.day).padStart(2, '0')} / 04`;
    $('case-label').textContent = `${String(state.index + 1).padStart(2, '0')} / ${state.order.length}`;
    $('balance-label').textContent = `${state.balance} F`;
    $('errors-label').textContent = state.errors;
    $('bulletin').innerHTML = `<b>BULLETIN N° ${item.day} —</b> ${escapeHTML(BULLETINS[item.day])}`;
    $('express-notice').classList.toggle('hidden', !item.express);
    $('president-note').classList.toggle('hidden', !DIRECTIVES[item.id]);
    $('president-note').textContent = DIRECTIVES[item.id] || '';
    $('visitor-avatar').innerHTML = portrait(item);
    $('visitor-name').textContent = item.name;
    const effect = state.specialEffect?.caseId === item.id ? state.specialEffect.kind : null;
    $('visitor-quote').textContent = effect === 'cedric' ? '« Bim-bala voluta, rastavérif ! »' : item.quote;
    $('queue-number').textContent = `N° ${item.id}`;
    const activeRules = RULES.filter(rule => rule.day <= item.day);
    $('documents').innerHTML =
      documentCard('MEM', 'Carte de membre', row('card.number', 'N°', card.number) + row('card.grade', 'Grade', card.grade), `Titulaire : ${item.name}`, 'card.name', card.valid ? 'VALIDÉ · COMITÉ' : 'VALIDATION ABSENTE', 'card.valid') +
      documentCard('FD', 'Fiche du jour', (sheet.memberNumber ? row('sheet.memberNumber', 'N° membre', sheet.memberNumber) : '') + row('sheet.cigar', 'Cigare', sheet.cigar) + row('sheet.observation', effect === 'cedric' ? 'Riddimologie' : 'Observation', effect === 'cedric' ? 'Zoumba-luma, papelito skank' : sheet.observation) + row('sheet.appreciation', 'Appréciation', sheet.appreciation), 'Document destiné aux archives du Club.', 'sheet.note', 'FICHE REÇUE', 'sheet.stamp') +
      documentCard('REQ', 'Demande au guichet', row('request.action', 'Objet de la visite', request.action), request.note, 'request.note', 'DÉPOSÉ CE JOUR', 'request.stamp',
        state.hamsterMissingCaseId === item.id ? '<p class="hamster-annex">ANNEXE AU PROCÈS-VERBAL HRPC : emportée par le hamster. Les pièces officielles restent présentes ; cette annexe sans valeur réglementaire n’est pas un motif de refus.</p>' : '');
    showQuiz(item); applySpecialEffect(effect);
    $('reason-select').innerHTML = '<option value="">Choisir le motif…</option>' + Object.entries(REASONS).filter(([key]) => activeRules.some(rule => rule.id === REASON_RULE[key])).map(([key, label]) => `<option value="${key}">${escapeHTML(label)}</option>`).join('');
    $('reason-select').value = '';
    $('reason-picker').classList.add('hidden'); $('actions').classList.remove('hidden');
    $('confirm-refusal').disabled = true; state.phase = 'play'; save(); visible('play'); updateShop(); startTimer(item); startAsh(item); renderPlayMateria(); startSummon();
    if (state.purchaseKind) openPurchase(state.purchaseKind);
    else startPipa();
    if (effect === 'cedric') startReggae();
    if ((state.index === 0 && !state.tutorialDone && !tutorialSeen()) || state.tutorialPausedAt) openTutorial();
  }
  function decide(verdict, reason = null, fast = false) {
    if (state.phase !== 'play' || (verdict === 'refuse' && !reason) || (fast && (state.balance < 100 || state.rushDays.includes(current().day)))) return;
    const item = current();
    if (state.materia.activeUntil) settleSummon(false);
    if (state.specialEffect?.caseId === item.id) clearSpecialEffect();
    if (state.ash?.caseId === item.id && state.ash.status === 'burning') settleAsh('skipped', 0);
    stopAsh();
    const correctVerdict = verdict !== 'timeout' && (verdict === 'refuse') === Boolean(item.reason);
    const correctReason = verdict === 'approve' || reason === item.reason;
    const exact = Boolean(correctVerdict && correctReason);
    const progression = gainMateriaXP(exact);
    const materiaBonus = materiaDecisionBonus(exact, item.day);
    const baseDelta = verdict === 'timeout' ? -40 : exact ? (verdict === 'refuse' ? 75 : 50) : correctVerdict ? -30 : -80;
    const delta = baseDelta + (fast ? 150 - 100 : 0) + materiaBonus;
    state.balance += delta;
    if (fast) state.rushDays.push(item.day);
    if (exact) state.exact++; else state.errors++;
    if (DIRECTIVES[item.id] && verdict !== 'timeout') state.favor += verdict === 'approve' ? 1 : -1;
    state.history[item.id] = { verdict, reason, fast, exact, delta, day: item.day, materiaBonus, progression };
    stopTimer(); state.timerCaseId = null; state.timerLimit = null; state.timerDeadline = null;
    state.phase = 'result'; save(); showResult();
    tone(exact ? 330 : 130, .13, exact ? 'triangle' : 'sawtooth');
    setTimeout(() => tone(exact ? 440 : 110, .18), 110);
  }
  function showResult() {
    const item = current(), outcome = state.history[item.id];
    if (!outcome) { showCase(); return; }
    $('result-stamp').className = `result-stamp ${outcome.exact ? 'good' : 'bad'}`;
    $('result-stamp').textContent = outcome.exact ? 'CONFORME' : 'OBSERVATION';
    $('result-title').textContent = outcome.verdict === 'timeout' ? 'Délai expiré.' : outcome.exact ? (outcome.verdict === 'approve' ? 'Demande validée.' : 'Refus motivé.') : 'Le Comité relève une anomalie.';
    const pressure = DIRECTIVES[item.id] && outcome.verdict !== 'timeout' ? (outcome.verdict === 'approve' ? ' Le Président apprécie votre docilité. Le règlement, moins.' : ' Le Président prend personnellement note de votre indépendance.') : '';
    $('result-text').textContent = (outcome.verdict === 'timeout' ? `Le dossier a été renvoyé sans décision. ${item.explanation}` : item.explanation) + pressure;
    $('result-ledger').textContent = `${outcome.fast ? 'Traitement immédiat : −100 F + prime 150 F · ' : ''}${outcome.delta > 0 ? '+' : ''}${outcome.delta} F${outcome.materiaBonus ? ` (Matéria +${outcome.materiaBonus} F)` : ''}${outcome.progression ? ` · ${outcome.progression}` : ''} · Caisse du bureau : ${state.balance} F`;
    const lastOfDay = state.index === state.order.length - 1 || ALL_CASES.find(entry => entry.id === state.order[state.index + 1]).day !== item.day;
    $('next-button').innerHTML = lastOfDay ? 'CLÔTURER LA JOURNÉE <span>→</span>' : 'DOSSIER SUIVANT <span>→</span>';
    visible('result');
  }
  function next() {
    if (state.phase !== 'result') return;
    const lastDay = current().day;
    state.index++;
    if (state.index === state.order.length || current().day !== lastDay) closeDay(lastDay);
    else if (state.index === 3 && !state.materia.introduced) showMateriaIntro();
    else showNextCaseEvents();
  }
  function showNextCaseEvents() {
    state.pendingEvents = (state.interruptions?.[state.index] || []).filter(event => event.type === 'hamster' ? !state.hrpcDisabled && !state.hamsterResults?.[event.day] : event.type === 'special' ? !state.specialPlayed && (event.kind !== 'blackout' || !state.hrpcDisabled) : !state.presidentResults?.[event.id]);
    state.pendingEventIndex = 0;
    showScheduledEvent();
  }
  function showScheduledEvent() {
    const event = state.pendingEvents?.[state.pendingEventIndex];
    if (!event) { state.activeInterruption = null; state.pendingEvents = []; state.pendingEventIndex = 0; save(); showCase(); return; }
    state.activeInterruption = event; save();
    if (event.type === 'hamster') showHamster(event.day);
    else if (event.type === 'special') showSpecial(event);
    else showPresident();
  }
  function finishScheduledEvent() {
    state.pendingEventIndex = (state.pendingEventIndex || 0) + 1;
    showScheduledEvent();
  }
  function closeDay(day) {
    if (!state.paidDays.includes(day)) {
      const results = Object.values(state.history).filter(entry => entry.day === day);
      const exact = results.filter(entry => entry.exact).length;
      const quota = Math.ceil(results.length * .7);
      state.balance += exact >= quota ? 40 : -40;
      state.paidDays.push(day);
    }
    state.phase = 'daily'; save(); showDaily(day);
  }
  function showDaily(day) {
    const results = Object.values(state.history).filter(entry => entry.day === day);
    const exact = results.filter(entry => entry.exact).length, quota = Math.ceil(results.length * .7);
    const paid = exact >= quota;
    $('daily-kicker').textContent = `CRCC / FIN DU JOUR ${String(day).padStart(2, '0')}`;
    $('daily-title').textContent = paid ? 'Quota rempli. Le Comité prend note.' : 'Quota manqué. Le Comité aussi.';
    $('daily-copy').textContent = `Vous avez rendu ${exact} décision${exact > 1 ? 's' : ''} parfaitement justifiée${exact > 1 ? 's' : ''} sur ${results.length} dossiers. L’objectif du jour était de ${quota}.`;
    $('daily-lines').innerHTML = `<div><span>Décisions conformes</span><strong>${exact} / ${results.length}</strong></div><div><span>${paid ? 'Prime de rigueur' : 'Retenue administrative'}</span><strong>${paid ? '+40' : '-40'} F</strong></div><div><span>Caisse cumulée</span><strong>${state.balance} F</strong></div><div><span>Faveur du Président</span><strong>${state.favor > 0 ? '+' : ''}${state.favor}</strong></div><div><span>Opinion du Président</span><strong>${escapeHTML(presidentOpinion())}</strong></div>`;
    const notes = {
      1: `${APPEAL_SCENARIOS[state.appealCaseId].person} a demandé la réouverture de son dossier. La commission statuera demain.`,
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
    else showDayBriefing(current().day);
  }
  function showAppeal() {
    const scenario = APPEAL_SCENARIOS[state.appealCaseId], earlier = state.history[state.appealCaseId];
    $('appeal-kicker').textContent = `COMMISSION D’APPEL · DOSSIER N° ${state.appealCaseId}`;
    $('appeal-title').textContent = `Le retour de ${scenario.person}`;
    $('appeal-old').textContent = scenario.old;
    $('appeal-new').textContent = scenario.newer;
    $('appeal-new-note').textContent = scenario.note;
    $('appeal-intro').textContent = earlier?.verdict === 'refuse' ? `${scenario.person} conteste votre refus du jour 1 et présente une nouvelle pièce.` : earlier?.verdict === 'timeout' ? `Le dossier de ${scenario.person} est resté sans décision le jour 1. Le Comité examine cette omission.` : `${scenario.person} a été admis le jour 1. Le Comité contrôle la validité de cette admission.`;
    $('appeal-question').textContent = 'Cette nouvelle pièce change-t-elle la validité de la décision prise le jour 1 ? Jugez uniquement les pièces qui existaient alors.';
    $('appeal-uphold').textContent = earlier?.verdict === 'refuse' ? 'CONFIRMER LE REFUS' : earlier?.verdict === 'timeout' ? 'CLASSER SANS SUITE' : 'MAINTENIR L’ADMISSION';
    $('appeal-revise').textContent = earlier?.verdict === 'refuse' ? 'ANNULER LE REFUS' : earlier?.verdict === 'timeout' ? 'RECTIFIER L’OMISSION' : 'RECTIFIER L’ADMISSION';
    state.phase = 'appeal'; save(); visible('appeal');
  }
  function decideAppeal(choice) {
    if (state.phase !== 'appeal') return;
    const admitted = state.history[state.appealCaseId]?.verdict !== 'refuse';
    const correct = admitted ? choice === 'revise' : choice === 'uphold';
    const delta = correct ? 60 : -60;
    state.balance += delta;
    state.appeal = { choice, correct, delta, corrected: admitted && correct, caseId: state.appealCaseId };
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
    $('event-result-text').textContent = appeal ? APPEAL_SCENARIOS[state.appealCaseId].issue : `État des lieux : ${result.part === 'none' ? 'aucune différence' : { blade: 'rayure sur la lame', pivot: 'fissure près du pivot', handle: 'entaille sur la poignée' }[result.part]}. Le Président exige un rapport sur la précision de ce rapport.`;
    $('event-result-ledger').textContent = `${result.delta > 0 ? '+' : ''}${result.delta} F · Caisse du bureau : ${state.balance} F`;
    visible('event-result');
  }
  function eventNext() { if (state.phase === 'eventResult') showDayBriefing(current().day); }
  function chewedArticle() {
    const variants = [
      { id: '01', hint: 'validation de la carte', fake: 'La carte est validée par tout tampon ayant une forme ronde.', hamster: 'La carte est validée par treize tours de roue.' },
      { id: '02', hint: 'contenu de la fiche du jour', fake: 'Une appréciation peut être remplacée par un haussement de sourcil.', hamster: 'Une fiche sans cigare vaut deux fiches hamster.' },
      { id: '03', hint: 'preuve du terme « habano »', fake: 'Le terme « habano » exige une voix grave et une belle signature.', hamster: 'Le terme « habano » est accordé aux hamsters nés près d’une carte de Cuba.' },
      { id: '04', hint: 'emprunt du Coupe-cigare', fake: 'Le Coupe-cigare est empruntable dès la première fiche et un sourire.', hamster: 'Le Coupe-cigare est prêté aux hamsters pour raisons de taille.' },
      { id: '12', hint: 'concordance avec le registre', fake: 'Une carte peut choisir librement son numéro et son grade.', hamster: 'Le registre des membres est remplacé par le registre des roues.' }
    ];
    return variants[seedNumber(`${state.seed || 'LEGACY'}-ARTICLE`) % variants.length];
  }
  function hamsterEvent(day) {
    const article = chewedArticle(), rule = RULES.find(entry => entry.id === article.id);
    return {
      1: { title: 'Le faux tampon', copy: 'Le Hamster Riding Pipe Club a mélangé ses cachets à ceux du bureau. Quel cachet atteste réellement la validation du Comité exécutif ?', evidence: 'REGISTRE DES CACHETS · La carte doit porter la validation du Comité exécutif (article 01). Le dessin d’une roue ou une formule ressemblante ne suffit pas.', options: [
        { id: 'real', label: 'VALIDÉ · COMITÉ EXÉCUTIF' }, { id: 'wheel', label: 'APPROUVÉ PAR LA ROUE · 43 TOURS' }, { id: 'almost', label: 'VALIDÉ · COMITÉ DES HAMSTERS EXÉCUTIFS' }
      ], correct: 'real' },
      2: { title: 'Le règlement grignoté', copy: `Un hamster a mangé l’article ${article.id}. Trois transcriptions circulent. Laquelle correspond à la règle du CRCC ?`, evidence: `ARCHIVE DES ARTICLES · L’article ${article.id} concerne ${article.hint}.`, options: [
        { id: 'real', label: rule.text },
        { id: 'one', label: article.fake },
        { id: 'hamster', label: article.hamster }
      ], correct: 'real' },
      3: { title: 'La course au procès-verbal', copy: 'Un hamster file avec une annexe au procès-verbal destinée au prochain dossier. Rattrapez-le au bon moment.', evidence: 'MAIN COURANTE · La zone verte représente le passage devant le guichet. En cas d’échec, l’annexe HRPC manque au prochain dossier ; les trois pièces officielles restent intactes.', options: [] },
      4: { title: 'La délégation officielle', copy: 'Le Hamster Riding Pipe Club réclame un siège au Comité. Son porte-parole tient dans une tasse, mais la demande est rédigée sur papier à en-tête.', evidence: 'DEMANDE HRPC · Carte de membre CRCC : absente. Fiches de dégustation archivées : 0. Attestation de roue : 11 tours. Article 11 : siège réservé à un membre du CRCC, carte validée et 8 fiches archivées.', options: [
        { id: 'accept', label: 'ACCEPTER · Une tasse fera office de siège' },
        { id: 'refuse', label: 'REFUSER · Conditions de l’article 11 non remplies' }
      ], correct: 'refuse' }
    }[day];
  }
  function stopHamsterRace() { if (hamsterTimer) clearInterval(hamsterTimer); hamsterTimer = null; }
  function hamsterRaceProgress() { return Math.min(100, Math.max(0, (Date.now() - state.hamsterRaceStart) / 60)); }
  function tickHamsterRace() {
    if (state?.phase !== 'hamster' || state.hamsterDay !== 3 || !state.hamsterRaceStart) return;
    const progress = hamsterRaceProgress();
    $('hamster-runner').style.left = `${progress}%`;
    $('hamster-race-status').textContent = progress >= 60 && progress <= 78 ? 'ZONE VERTE · ATTRAPEZ-LE !' : 'Le hamster traverse le bureau…';
    if (progress >= 100) decideHamster('miss');
  }
  function startHamsterRace() {
    if (state.phase !== 'hamster' || state.hamsterDay !== 3) return;
    if (!state.hamsterRaceStart) {
      state.hamsterRaceStart = Date.now();
      $('hamster-race-button').innerHTML = 'ATTRAPER LE HAMSTER <span>●</span>';
      save();
      hamsterTimer = setInterval(tickHamsterRace, 50);
      tickHamsterRace();
    } else decideHamster(hamsterRaceProgress() >= 60 && hamsterRaceProgress() <= 78 ? 'caught' : 'miss');
  }
  function showHamster(day) {
    const event = hamsterEvent(day);
    if (!event) return showCase();
    state.hamsterDay = day;
    state.phase = 'hamster'; save();
    $('hamster-kicker').textContent = `INTERRUPTION HRPC · JOUR ${String(day).padStart(2, '0')} / 04`;
    $('hamster-title').textContent = event.title;
    $('hamster-copy').textContent = event.copy;
    $('hamster-evidence').innerHTML = `<strong>PIÈCE À EXAMINER</strong>${escapeHTML(event.evidence)}`;
    $('hamster-options').innerHTML = shuffle(event.options, seededRandom(`${state.seed || 'LEGACY'}-HRPC-${day}`)).map(option => `<button type="button" data-hamster-choice="${option.id}">${escapeHTML(option.label)}</button>`).join('');
    $('hamster-race').classList.toggle('hidden', day !== 3);
    $('hamster-runner').style.left = '0%';
    $('hamster-race-button').innerHTML = state.hamsterRaceStart ? 'ATTRAPER LE HAMSTER <span>●</span>' : 'LANCER LA POURSUITE <span>→</span>';
    $('hamster-race-status').textContent = state.hamsterRaceStart ? 'La poursuite reprend…' : 'Prêt pour la poursuite.';
    visible('hamster');
    stopHamsterRace();
    if (day === 3 && state.hamsterRaceStart) { hamsterTimer = setInterval(tickHamsterRace, 50); tickHamsterRace(); }
  }
  function decideHamster(choice) {
    if (state.phase !== 'hamster' || state.hamsterResults?.[state.hamsterDay]) return;
    const day = state.hamsterDay, correct = day === 3 ? choice === 'caught' : choice === hamsterEvent(day).correct;
    const delta = correct ? 40 : -30;
    stopHamsterRace();
    state.hamsterResults ??= {};
    state.hamsterResults[day] = { choice, correct, delta };
    state.balance += delta;
    if (day === 3 && !correct) state.hamsterMissingCaseId = state.order[state.index];
    state.hamsterRaceStart = null;
    state.phase = 'hamsterResult'; save(); showHamsterResult();
    tone(correct ? 510 : 150, .14);
  }
  function showHamsterResult() {
    const day = state.hamsterDay, result = state.hamsterResults[day];
    const descriptions = {
      1: 'Seul « VALIDÉ · COMITÉ EXÉCUTIF » atteste la validation de la carte. Les roues, même très bien tournées, ne signent pas pour le Comité.',
      2: `L’article ${chewedArticle().id} disait : « ${RULES.find(entry => entry.id === chewedArticle().id).text} » Le hamster a essayé d’en rédiger une version à son avantage.`,
      3: result.correct ? 'Annexe récupérée. Le hamster demande que la poursuite soit inscrite à son palmarès.' : 'L’annexe HRPC a disparu. Son absence sera signalée sur le prochain dossier ; elle ne modifie pas les pièces officielles ni le bon motif de décision.',
      4: 'La délégation n’a ni carte CRCC validée ni les 8 fiches requises par l’article 11. La tasse peut rester ; le siège au Comité, non.'
    };
    $('hamster-result-stamp').className = `result-stamp ${result.correct ? 'good' : 'bad'}`;
    $('hamster-result-stamp').textContent = result.correct ? 'INCIDENT MAÎTRISÉ' : 'PERTURBATION';
    $('hamster-result-title').textContent = result.correct ? 'Le guichet tient bon.' : 'Le hamster marque un point.';
    $('hamster-result-text').textContent = descriptions[day];
    $('hamster-result-ledger').textContent = `${result.delta > 0 ? '+' : ''}${result.delta} F · Caisse du bureau : ${state.balance} F`;
    visible('hamster-result');
  }
  function hamsterNext() { if (state.phase === 'hamsterResult') finishScheduledEvent(); }
  function showPresident() {
    const event = state.activeInterruption, question = PRESIDENT_QUESTIONS[event.question];
    $('president-kicker').textContent = `CONVOCATION DU PRÉSIDENT · JOUR ${String(event.day).padStart(2, '0')} / 04`;
    const introEvents = Object.values(state.interruptions).flat().filter(entry => entry.type === 'president');
    const introIndex = introEvents.findIndex(entry => entry.id === event.id);
    $('president-intro').textContent = PRESIDENT_INTROS[(seedNumber(`${state.seed || 'LEGACY'}-INTROS`) + Math.max(0, introIndex)) % PRESIDENT_INTROS.length];
    $('president-question').textContent = question.q;
    $('president-meter').textContent = `Faveur : ${state.favor > 0 ? '+' : ''}${state.favor} · Flatteries : ${state.flatteryCount} · Soupçons : ${state.suspicion}`;
    const options = [
      { id: 'correct', text: question.answer },
      { id: 'wrong-0', text: question.wrong[0] },
      { id: 'flattery', text: question.flattering },
      { id: 'wrong-1', text: question.wrong[1] }
    ];
    $('president-answers').innerHTML = shuffle(options, seededRandom(`${state.seed || 'LEGACY'}-${event.id}`)).map(option => `<button type="button" data-president-choice="${option.id}">${escapeHTML(option.text)}</button>`).join('');
    state.phase = 'president'; save(); visible('president');
  }
  function decidePresident(choice) {
    if (state.phase !== 'president' || !state.activeInterruption || state.presidentResults?.[state.activeInterruption.id]) return;
    const correct = choice === 'correct', flattery = choice === 'flattery';
    if (flattery) state.flatteryCount++;
    const suspicious = flattery && state.flatteryCount >= 3;
    let materiaBonus = 0;
    if (correct && state.materia.introduced && materiaEquipped('oreille') && !state.materia.procs[`oreille:${state.activeInterruption.day}`]) {
      state.materia.procs[`oreille:${state.activeInterruption.day}`] = true;
      materiaBonus = (materiaLevel('oreille') === 2 ? 25 : 15) + (materiaLinked('oreille') ? materiaBlueBonus() : 0);
    }
    const delta = (correct ? 35 : suspicious ? -50 : flattery ? -15 : -30) + materiaBonus;
    const favorDelta = flattery ? suspicious ? -2 : state.flatteryCount === 1 ? 1 : 0 : 0;
    if (suspicious) state.suspicion++;
    state.favor += favorDelta;
    state.balance += delta;
    state.presidentResults ??= {};
    state.presidentResults[state.activeInterruption.id] = { choice, correct, flattery, suspicious, delta, materiaBonus, favorDelta };
    if (state.suspicion >= 3) {
      state.excludedReason = 'president';
      tone(100, .32, 'sawtooth');
      finish(); return;
    }
    state.phase = 'presidentResult'; save(); showPresidentResult();
    tone(correct ? 470 : suspicious ? 110 : 240, .14);
  }
  function showPresidentResult() {
    const event = state.activeInterruption, result = state.presidentResults[event.id], question = PRESIDENT_QUESTIONS[event.question];
    $('president-result-stamp').className = `result-stamp ${result.correct ? 'good' : 'bad'}`;
    $('president-result-stamp').textContent = result.correct ? 'SAVOIR RECONNU' : result.suspicious ? 'SOUPÇON PRÉSIDENTIEL' : result.flattery ? 'ÉLOGE CONSIGNÉ' : 'RÉPONSE CONTESTÉE';
    $('president-result-title').textContent = result.correct ? 'Le Président acquiesce.' : result.suspicious ? 'Il n’y croit plus.' : result.flattery ? 'Il rougit. Un peu.' : 'La question vous échappe.';
    const reaction = result.suspicious ? 'Troisième flatterie ou davantage : le Président soupçonne une manœuvre et retire deux points de faveur.' : result.flattery && (result.favorDelta ?? (!result.suspicious ? 1 : -2)) > 0 ? 'Cette première flatterie lui plaît : un point de faveur, malgré la mauvaise réponse.' : result.flattery ? 'Il vous remercie poliment, mais une deuxième flatterie ne rapporte plus de faveur.' : '';
    $('president-result-text').textContent = `${question.detail} ${reaction}`.trim();
    $('president-source').href = question.source;
    $('president-result-ledger').textContent = `${result.delta > 0 ? '+' : ''}${result.delta} F${result.materiaBonus ? ` (Oreille présidentielle +${result.materiaBonus} F)` : ''} · Faveur ${state.favor > 0 ? '+' : ''}${state.favor} · Soupçons ${state.suspicion} · Caisse ${state.balance} F`;
    visible('president-result');
  }
  function presidentNext() { if (state.phase === 'presidentResult') finishScheduledEvent(); }
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
    const expressCount = state.order.filter(id => ALL_CASES.find(item => item.id === id)?.express).length;
    const hamsters = Object.values(state.hamsterResults || {});
    const president = Object.values(state.presidentResults || {});
    return `CRCC — La Grande Homologation : ${finalScore().total} points, ${state.exact}/${state.order.length} décisions exactes, ${state.errors} observations, ${state.balance} F en caisse. Président : ${state.favor > 0 ? '+' : ''}${state.favor} faveurs, ${state.suspicion} soupçon${state.suspicion > 1 ? 's' : ''} ; ${presidentOpinion()} Matérias : ${state.materia.equipped.filter(Boolean).map(id => `${MATERIA[id].name} niv. ${materiaLevel(id)}`).join(' + ')}${state.materia.summonUsed ? ' ; Grand Rat invoqué' : ''}. HRPC : ${hamsters.filter(result => result.correct).length}/${hamsters.length} incidents maîtrisés. Interrogatoires : ${president.filter(result => result.correct).length}/${president.length} justes. Grade : ${rank}. ${state.timed ? `Mode chrono : 30 s par dossier ; bonus +${finalScore().timedBonus} points.` : 'Mode tranquille.'}${expressCount ? ` ${expressCount} dossiers express à 20 s.` : ''} Même défi : ${challengeURL()} On pipe rien, mais on a des fiches.`;
  }
  function finalScore() {
    const decisions = state.exact * 100, timedBonus = state.timed ? state.exact * 10 : 0, cash = state.balance, favor = state.favor * 75, suspicion = state.suspicion * -200;
    return { decisions, timedBonus, cash, favor, suspicion, total: Math.max(0, decisions + timedBonus + cash + favor + suspicion) };
  }
  function finish() {
    stopPipa(); stopReggae(); stopAsh(); stopTimer(); stopSummon();
    const score = state.exact, total = state.order.length, points = finalScore();
    const rank = state.excludedReason === 'president' ? 'Exclu du CRCC' : state.excludedReason === 'pipa' ? 'Submergé par Pipa' : score === total && points.total >= total * 140 ? 'Grand Rat du guichet' : points.total >= total * 110 ? 'Rat homologué aux tampons' : points.total >= total * 65 ? 'Rat à peu près compétent' : 'Rat de passage surveillé';
    $('ending-title').textContent = rank;
    let story = state.excludedReason === 'president' ? 'Trois soupçons : le Président vous exclut sur-le-champ. Il vous tend une ficelle pour ficeler vos fiches, puis vous montre la porte de sortie avec une précision que personne ne lui connaissait.' : state.excludedReason === 'pipa' ? 'Les cœurs de Pipa ont recouvert le guichet. Le Comité classe votre rapport sous « sentiment incontrôlable » et suspend votre service.' : score === total ? `${total} dossiers, aucun écart. Le Comité envisage de vous confier un second tampon. La décision est reportée.` : score >= Math.ceil(total * .78) ? 'Votre application du règlement est remarquée. Le Comité demande néanmoins un rapport sur cette remarque.' : score >= Math.ceil(total * .5) ? 'Vous avez conservé une certaine dignité administrative. Les erreurs feront l’objet d’un dossier distinct.' : 'Le Comité recommande une lecture lente du règlement, si possible avant de tamponner.';
    if (state.history['008']?.verdict === 'approve') story += ' Quant au Coupe-cigare, une expertise de la lame est toujours en cours.';
    if (state.history['007']?.verdict === 'refuse' && state.history['015']?.verdict === 'approve') story += ' Monsieur Crevette vous remercie pour sa promotion, avec une retenue inhabituelle.';
    if (state.favor > 0) story += ' Le Président vous adresse une chaleureuse note sans numéro de référence.';
    if (state.favor < 0) story += ' Le Président respecte votre indépendance avec une froideur protocolaire.';
    if (state.suspicion > 0) story += ' Vos compliments répétés font désormais l’objet d’une enquête du Président lui-même.';
    $('ending-copy').textContent = story;
    $('ending-stats').innerHTML = `<div><strong>${points.total}</strong><span>Score final</span></div><div><strong>${score}/${total}</strong><span>Décisions exactes</span></div><div><strong>${state.balance} F</strong><span>Caisse finale</span></div>`;
    $('score-breakdown').innerHTML = `<h2>Calcul du score</h2><div><span>Décisions exactes · ${score} × 100</span><strong>+${points.decisions}</strong></div>${state.timed ? `<div><span>Bonus chrono · ${score} × 10</span><strong>+${points.timedBonus}</strong></div>` : ''}<div><span>Caisse finale</span><strong>${points.cash > 0 ? '+' : ''}${points.cash}</strong></div><div><span>Faveur présidentielle · ${state.favor} × 75</span><strong>${points.favor > 0 ? '+' : ''}${points.favor}</strong></div><div><span>Soupçons · ${state.suspicion} × −200</span><strong>${points.suspicion}</strong></div><p>Minimum 0 point. Une exclusion met fin au service immédiatement.</p>`;
    $('ending-opinion').textContent = `OPINION DU PRÉSIDENT · ${presidentOpinion()}`;
    $('materia-summary').textContent = `MATÉRIAS ÉQUIPÉES · ${state.materia.equipped.filter(Boolean).map(id => `${MATERIA[id].name} (niv. ${materiaLevel(id)}, ${state.materia.xp[id] || 0} AP)`).join(' + ') || 'aucune'}. ${state.materia.summonUsed ? 'Le Grand Rat a suspendu la réalité.' : 'Aucune invocation consignée.'}`;
    const hamsters = Object.values(state.hamsterResults || {});
    const president = Object.values(state.presidentResults || {});
    $('ending-special').textContent = `HRPC : ${hamsters.filter(result => result.correct).length}/${hamsters.length} incidents maîtrisés. Interrogatoires du Président : ${president.filter(result => result.correct).length}/${president.length} justes, ${state.flatteryCount} flatteries, ${state.suspicion} soupçons. Commission d’appel : ${state.appeal?.correct ? 'avis juste' : state.appeal?.skipped ? 'non tenue' : 'avis contesté'}. Coupe-cigare : ${state.cutter?.correct ? 'inspection juste' : state.cutter?.skipped ? 'non inspecté' : 'inspection contestée'}. Questions bonus justes : ${Object.values(state.quizResults || {}).filter(result => result.correct).length}. Cendres détachées : ${(state.ashHistory || []).filter(result => result.status === 'collected').length}. Faveur du Président : ${state.favor > 0 ? '+' : ''}${state.favor}.`;
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
    if (state.phase === 'briefing') showDayBriefing(current().day);
    else if (state.phase === 'hrpcBlock') showHrpcBlock();
    else if (state.phase === 'materiaIntro') showMateriaIntro();
    else if (state.phase === 'play') showCase();
    else if (state.phase === 'result') showResult();
    else if (state.phase === 'daily') showDaily(state.index === state.order.length ? 4 : current().day - 1);
    else if (state.phase === 'appeal') showAppeal();
    else if (state.phase === 'cutter') showCutter();
    else if (state.phase === 'eventResult') showEventResult();
    else if (state.phase === 'hamster') { if (state.hamsterRaceStart) { state.hamsterRaceStart = null; save(); } showHamster(state.hamsterDay); }
    else if (state.phase === 'hamsterResult') showHamsterResult();
    else if (state.phase === 'president') showPresident();
    else if (state.phase === 'presidentResult') showPresidentResult();
    else if (state.phase === 'special') showSpecial(state.activeInterruption);
    else finish();
  });
  $('quiz-panel').addEventListener('click', event => { const button = event.target.closest('[data-quiz-choice]'); if (button) answerQuiz(Number(button.dataset.quizChoice)); });
  $('ash-button').addEventListener('click', collectAsh);
  $('ash-skip').addEventListener('click', () => { if (state?.phase === 'play') settleAsh('skipped', 0); });
  $('help-button').addEventListener('click', openTutorial);
  $('tutorial-next').addEventListener('click', () => { if (++tutorialStep >= TUTORIAL.length) closeTutorial(); else showTutorialStep(); });
  $('tutorial-skip').addEventListener('click', closeTutorial);
  window.addEventListener?.('resize', updateTutorialSpotlight);
  window.addEventListener?.('scroll', updateTutorialSpotlight, true);
  $('tutorial-overlay').addEventListener('keydown', event => {
    if (event.key === 'Escape') closeTutorial();
    if (event.key === 'Tab') {
      const first = $('tutorial-skip'), last = $('tutorial-next');
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('approve-button').addEventListener('click', () => decide('approve'));
  $('refuse-button').addEventListener('click', () => { $('actions').classList.add('hidden'); $('reason-picker').classList.remove('hidden'); $('reason-select').focus(); });
  $('cancel-refusal').addEventListener('click', () => { $('reason-picker').classList.add('hidden'); $('actions').classList.remove('hidden'); $('refuse-button').focus(); });
  $('reason-select').addEventListener('change', () => { $('confirm-refusal').disabled = !$('reason-select').value; });
  $('confirm-refusal').addEventListener('click', () => decide('refuse', $('reason-select').value));
  $('next-button').addEventListener('click', next);
  $('continue-button').addEventListener('click', continueDay);
  $('appeal-uphold').addEventListener('click', () => decideAppeal('uphold'));
  $('appeal-revise').addEventListener('click', () => decideAppeal('revise'));
  $('cutter-options').addEventListener('click', event => { const button = event.target.closest('[data-part]'); if (button) decideCutter(button.dataset.part); });
  $('event-next').addEventListener('click', eventNext);
  $('hamster-options').addEventListener('click', event => { const button = event.target.closest('[data-hamster-choice]'); if (button) decideHamster(button.dataset.hamsterChoice); });
  $('hamster-race-button').addEventListener('click', startHamsterRace);
  $('hamster-next').addEventListener('click', hamsterNext);
  $('special-next').addEventListener('click', acceptSpecial);
  $('actions').addEventListener('pointerdown', event => { lastPointerType = event.pointerType; });
  $('actions').addEventListener('pointermove', invertedPointer);
  $('actions').addEventListener('pointerleave', () => $('inverted-cursor').classList.add('hidden'));
  $('actions').addEventListener('click', invertedClick, true);
  $('lighter-button').addEventListener('click', lightLighter);
  $('president-answers').addEventListener('click', event => { const button = event.target.closest('[data-president-choice]'); if (button) decidePresident(button.dataset.presidentChoice); });
  $('president-next').addEventListener('click', presidentNext);
  $('briefing-next').addEventListener('click', continueDayBriefing);
  $('hrpc-block-next').addEventListener('click', closeHrpcBlock);
  $('materia-intro-next').addEventListener('click', continueMateriaIntro);
  for (const prefix of ['materia-briefing', 'materia-intro']) {
    $(`${prefix}-slots`).addEventListener('click', event => { const button = event.target.closest('[data-materia-slot]'); if (button) { materiaSelectedSlot = Number(button.dataset.materiaSlot); renderBriefingMateria(current().day, prefix); } });
    $(`${prefix}-choices`).addEventListener('click', event => { const button = event.target.closest('[data-equip-materia]'); if (button) equipMateria(button.dataset.equipMateria); });
  }
  $('materia-actions').addEventListener('click', event => { const button = event.target.closest('[data-use-materia]'); if (button) useMateria(button.dataset.useMateria); });
  $('rush-case').addEventListener('click', () => spend('rush'));
  $('gift-president').addEventListener('click', () => spend('gift'));
  $('raid-hrpc').addEventListener('click', () => spend('raid'));
  $('purchase-close').addEventListener('click', closePurchase);
  $('purchase-modal').addEventListener('click', event => { if (event.target === $('purchase-modal')) closePurchase(); });
  $('purchase-modal').addEventListener('keydown', event => { if (event.key === 'Escape') closePurchase(); if (event.key === 'Tab') { event.preventDefault(); $('purchase-close').focus(); } });
  $('pipa-hearts').addEventListener('click', event => {
    const heart = event.target.closest('[data-heart]');
    if (!heart || state?.phase !== 'play' || state.specialEffect?.kind !== 'pipa') return;
    state.pipaHearts = state.pipaHearts.filter(entry => entry.id !== Number(heart.dataset.heart));
    renderPipa(); save(); tone(590, .06);
  });
  $('rules-open').addEventListener('click', event => openReference('rules', event.currentTarget));
  $('catalog-open').addEventListener('click', event => openReference('catalog', event.currentTarget));
  $('registry-open').addEventListener('click', event => openReference('registry', event.currentTarget));
  $('reference-close').addEventListener('click', closeReference);
  $('reference-modal').addEventListener('click', event => { if (event.target === $('reference-modal')) closeReference(); });
  $('reference-modal').addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeReference(); }
    if (event.key === 'Tab') {
      const first = $('reference-close'), last = referenceKind === 'registry' ? $('registry-result').querySelector('button:last-of-type') || $('registry-by-name') : first;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('registry-find').addEventListener('click', () => registryLookup($('registry-search').value));
  $('registry-search').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); registryLookup(event.target.value); } });
  $('registry-by-name').addEventListener('click', () => { $('registry-search').value = current().name; registryLookup(current().name); });
  $('share-button').addEventListener('click', shareScore);
  $('copy-button').addEventListener('click', copyScore);
  $('sound-toggle').addEventListener('click', () => { soundEnabled = !soundEnabled; $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled)); $('sound-toggle').textContent = soundEnabled ? '♫ Son activé' : '♪ Son coupé'; tone(420, .12); if (soundEnabled && state?.specialEffect?.kind === 'cedric' && state.phase === 'play') startReggae(); else if (!soundEnabled) stopReggae(); });
  $('timed-mode').checked = incomingTimed;
  if (incomingSeed) showIntroChallenge();
  $('resume-button').classList.toggle('hidden', !stored());
})();
