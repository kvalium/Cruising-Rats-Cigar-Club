# Traitement des séances de dégustation du CRCC

Consignes demandées par le propriétaire le 23 octobre 2026. Elles s’appliquent aux prochaines soumissions de séances, en complément du canon éditorial CRCC.

## Vérifier les informations avant de commencer

- Inventorier tous les documents fournis et les pièces pertinentes déjà connues : fiches, pages annexes et minutes communes. Lire l’ensemble, y compris les manuscrits et les tableaux ; consulter les fichiers actuels plutôt que des résumés anciens.
- Vérifier la date et l’identité de la séance, les participants, l’auteur de chaque fiche, les numéros individuels, les cigares déclarés et la présence éventuelle de minutes. Distinguer un document absent d’un document non encore transmis.
- Rapprocher ces informations des identifiants et profils déjà présents dans `data/degustations.json`. Conserver le grade historique documenté ; ne pas inventer de membre, de grade, de référence commerciale, de note ni de mesure.
- Rechercher d’abord les informations déjà accessibles. Si une ambiguïté ou une pièce manquante peut modifier l’attribution, le compte rendu ou l’avis global, demander les précisions nécessaires avant de les rédiger et de publier. Les champs sensoriels laissés vides restent des observations non renseignées ; ils ne justifient pas d’inventer des réponses.

## Classer les documents par séance dans la Bibliothèque

- Pour les nouvelles soumissions, utiliser `Cruising Rats Cigar Club/Fiches de dégustation/AAAA-MM-JJ - Titre de séance/` (un dossier dédié à la séance).
- Placer toutes les fiches et les minutes de cette séance dans ce même dossier. Aucun nouveau classement par membre. Identifier le membre et le numéro dans le nom de chaque fiche si nécessaire ; conserver l’identité Library des documents lors des déplacements.
- Conserver les minutes communes une seule fois. Ne pas dupliquer les originaux existants et ne pas déplacer les anciennes archives sans demande de reclassement.
- Utiliser le skill Library et vérifier le résultat de chaque opération. Ne jamais prétendre qu’un classement a réussi sans confirmation de l’application.
- Pour les copies publiées sur le site, privilégier `documents/seances/<id-seance>/fiche-<membre>-<numero>.pdf` et `documents/seances/<id-seance>/minutes.pdf`. Les anciens liens restent valides.

## Produire l’analyse complète

- Avant chaque appréciation, identifier la référence et la variante exactes du cigare et rechercher ses caractéristiques auprès du fabricant ou de sources primaires fiables : module, dimensions, composition des feuilles, profil annoncé et autres données effectivement vérifiables. Consigner les liens et la date de consultation, puis comparer explicitement ces données aux fiches et aux minutes.
- Distinguer les faits corrigibles des sensations personnelles. Ne pas pénaliser l’absence d’un arôme publicitaire, imposer un niveau de puissance ressenti ni attribuer les corrections du Comité au membre. Ne pas confondre pays de fabrication, origine des feuilles et millésime ; ne pas transformer un prix étranger ou une durée indicative en vérité sur la séance. Signaler l’incertitude quand la variante ou les caractéristiques restent indémontrables.
- Rédiger un compte rendu détaillé pour chaque fiche, avec l’appréciation individuelle du Comité et sa note sur 100, distincte de la note personnelle du cigare.
- Prendre en compte les minutes dans les critères concernés seulement lorsque les observations sont attribuées au membre. Les faits communs restent un contexte ; l’absence de minutes facultatives ne pénalise pas la note.
- Rédiger l’avis global de séance à partir de toutes les fiches et des minutes disponibles ; renseigner l’état du dossier, la date et les pièces examinées dans `committee_review`. Cet état n’est pas la moyenne des notes des membres.
- Lors d’une révision, actualiser l’avis global et les évaluations concernées, même si les PDF gardent leur chemin. Conserver un barème comparable ou identifier explicitement son changement.

## Mettre à jour le site et tous les profils

- Ajouter ou réutiliser les identifiants stables des participants. Les membres explicitement enregistrés sans séance peuvent figurer dans `members` ; les participants aux séances sont aussi intégrés automatiquement au registre.
- Régénérer les pages de séance, les comptes rendus, le registre des membres et les profils de tous les membres impliqués. Créer les profils manquants et recalculer les statistiques depuis les contributions archivées, sans écraser leur historique.
- Ne pas ajouter d’entrée au menu principal pour ces archives. Conserver les liens membre → profil et les liens entre registre, séance, fiches et PDF.
- Exécuter `python3 scripts/build-degustations.py`, `python3 scripts/test-degustations.py` et `node scripts/test-member-stats.js`. Vérifier les liens et les changements visibles, puis publier dans le dépôt GitHub Pages existant et confirmer le déploiement.
