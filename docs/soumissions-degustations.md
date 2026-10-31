# Dépôt et validation des dégustations

Le lien **Soumettre une dégustation** figure sur l’accueil des membres. Le
formulaire `/fiches-degustation/soumettre-degustation` utilise la protection de
l’espace membres. Le dossier est associé au navigateur du déposant par un jeton
aléatoire conservé dans un cookie HttpOnly, Secure et SameSite=Strict ; seul son
SHA-256 est enregistré en D1. Il ne s’agit pas d’un compte personnel nominatif.

Le **Bureau du Comité** et le répertoire des bureaux donnent accès à
`/fiches-degustation/validation-degustations`. La validation nécessite le mot de
passe existant du Comité (`CRCC_EXAM_ADMIN_PASSWORD`), distinct de celui des
membres. Ce mot de passe reste uniquement en mémoire dans l’onglet, sans stockage
local. Fermer l’accréditation vide cette mémoire.

## Saisie et pièces

La séance contient date, titre, lieu, horaires, contexte, ambiance sonore,
prospects et notes complémentaires. Chaque membre peut déclarer sa présence avec
ou sans fiche ; au moins une fiche est nécessaire pour publier une séance.
Les profils existants sont réutilisés. Les nouveaux noms sont contrôlés contre
le registre pour éviter les doublons manifestes ; le Comité confirme les grades
historiques avant publication. Aucune promotion n’est calculée à l’approbation.

Les données individuelles comprennent référence, marque, origine, module, coupe,
tirage, durée, prix, note personnelle /10, arômes, accompagnements distincts,
cendre, rallumages, retouches, puissance, richesse, dimensions, conservation et
notes. Les valeurs absentes deviennent `null`, jamais zéro. Les observations
déclarées restent distinctes des corrections et de la note documentaire /100.

Les fiches et minutes acceptent un PDF ou jusqu’à douze scans JPG/PNG/WebP,
transformés en un PDF image de 15 Mo maximum. Les minutes sont facultatives.
Les photos sont limitées à **10 par séance**, converties avant transfert en
WebP : vue agrandie de 1920 px maximum, miniature de 640 px maximum. La conversion
canvas retire les métadonnées et applique l’orientation. Le serveur contrôle le
format, les dimensions, la taille, les métadonnées interdites et les dix
emplacements autorisés ; une description est requise, une légende facultative.
Le transfert s’effectue fichier par fichier pour éviter un formulaire géant.

## Stockage et configuration

- D1 `CRCC_ARCHIVES_DB` : base `crcc-archives`, identifiant existant ; le schéma
  additif est `cloudflare/tasting-submissions.sql`. Les tables de soumissions sont
  séparées des séances et des statistiques publiées.
- Bucket privé : `crcc-degustations-privees-038698405614`, région `eu-west-3`,
  blocage des accès publics et chiffrement AES256. Chaque dossier utilise
  `soumissions-degustations/<id-depot>/`.
- Après approbation : copie des seuls documents retenus vers
  `documents/seances/<id-seance>/` et des photos vers
  `images/seances/<id-seance>/` dans le bucket du site.
- Les documents de séance sont téléchargés pendant le build et servis sous le
  chemin protégé `fiches-degustation-docs/`, y compris lorsqu’ils n’existent pas
  dans le dépôt. Les photographies approuvées utilisent le stockage d’images du
  site ; ne pas y transférer les dépôts en attente.

Secrets Pages : `CRCC_S3_ACCESS_KEY_ID`, `CRCC_S3_SECRET_ACCESS_KEY` et
`CRCC_DEGUSTATIONS_DEPLOY_HOOK`. Variables : `CRCC_S3_REGION`,
`CRCC_S3_SUBMISSIONS_BUCKET`, `CRCC_S3_PUBLIC_BUCKET`. Les clés ne sont jamais
transmises au navigateur ni commitées. Le compte technique IAM
`crcc-degustations-pages` peut lire/écrire uniquement le préfixe privé des dépôts,
et écrire les deux préfixes de publication dans le bucket public. Il n’a aucun
droit de suppression ni d’accès aux autres préfixes. La rotation des clés passe
par les secrets Pages, sans modification du code.

## Examen, décisions et publication

Les états sont : brouillon, à examiner, compléments demandés, refusée, validation
en cours, publication en cours, publication à relancer, publiée.

Le Comité peut consulter les pièces et les déclarations originales, corriger les
données structurées, enregistrer son examen, demander des compléments ou refuser
avec un motif. Le déposant peut reprendre son dossier si des compléments sont
demandés. Les versions de données et les événements sont conservés en D1 ; retirer
une pièce d’un brouillon ne supprime pas l’objet source sur S3.

La validation exige un descriptif documenté du cigare, des sources HTTPS, une
comparaison individuelle, un compte rendu détaillé, la base de l’évaluation, les
cinq critères justifiés du barème `crcc-propose-2026-v1`, la mention et l’avis global.
Si des minutes sont présentes, leur emploi individuel doit être expliqué. La
simple présence de minutes n’ajoute aucun point.

L’approbation réserve le dossier, copie les pièces retenues puis enregistre la
séance, les fiches, les comptes rendus et l’état de publication dans une
transaction D1. La numérotation est calculée depuis les fiches existantes ; un
conflit bloque la transaction au lieu de dupliquer une contribution. Un second
clic sur un dossier déjà approuvé est refusé. Les profils et statistiques sont
recalculés par le build existant, depuis l’ensemble des archives.

Le hook de production `main` déclenche ensuite Pages. Un échec du déclenchement
conserve la séance enregistrée et permet **Relancer la publication** sans refaire
l’insertion. Le contrôle du déploiement recherche un marqueur unique dans la page
réellement servie ; D1 seul ne suffit jamais à afficher « publiée ».

Les sauvegardes complètes de `crcc-archives` incluent les quatre nouvelles tables.
Les fichiers sont conservés sur S3 et ne figurent jamais dans le dépôt public.

## Vérifications

```sh
python3 scripts/build-degustations.py
python3 scripts/test-degustations.py
node scripts/test-member-stats.js
python3 scripts/test-session-photos.py
node scripts/test-tasting-submissions.mjs
python3 scripts/build-site.py
npx wrangler pages functions build functions --outdir .openai/functions-build
```

Le test d’intégration emploie un vrai SQLite local pour simuler D1 et un stockage
S3 de test en mémoire. Il couvre notamment les refus d’accès, CSRF, brouillons,
pièces, compléments, zéros et valeurs absentes, versions, erreurs S3, approbation,
publication différée et prévention des doubles validations. Il ne crée aucune
séance de test dans la base de production.
