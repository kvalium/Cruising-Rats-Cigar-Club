# Bureau des correspondances — mise en service Gmail

Interface privée directe : https://cruising-rats-cigar-club.fr/fiches-degustation/bureau-correspondances.html

Le bureau est répertorié dans [Bureaux et Commissions](https://cruising-rats-cigar-club.fr/fiches-degustation/bureaux-commissions), accessible depuis la page d’accueil des membres. La page demeure protégée par le mot de passe des archives du Club ; **une seconde accréditation administrateur distincte** est nécessaire pour utiliser le bureau et expédier des courriers.

## Ce qui fonctionne dès le déploiement

Choix entre cinq modèles, édition du destinataire, nom, référence, sujet, observations du Comité et paragraphe complémentaire, aperçu en direct. Aucun envoi ne se produit pendant une prévisualisation.

## Activer les brouillons et l'envoi Gmail

1. Dans le Google Apps Script existant, ajoutez un fichier `CRCC_Webapp.gs` avec le contenu de `scripts/CRCC_Webapp.gs` de ce dépôt.
2. Ouvrez **Paramètres du projet → Propriétés du script** et ajoutez `CRCC_MAILER_TOKEN` avec un secret long et aléatoire.
3. **Déployer → Nouveau déploiement → Application web**, exécutée **en tant que moi**, accès **Tous les utilisateurs** (requis pour l'appel serveur Cloudflare). Le jeton protège les opérations ; il ne doit jamais apparaître dans le navigateur.
4. Copiez l'URL `https://script.google.com/macros/s/.../exec` du déploiement.
5. Dans Cloudflare Pages → `crcc-site` → **Settings → Variables and Secrets → Production**, ajoutez en tant que secrets : `CRCC_MAIL_ADMIN_PASSWORD` (mot de passe différent de celui des membres), `CRCC_MAILER_URL` (URL de l'application web), et `CRCC_MAILER_TOKEN` (identique à celui des propriétés Apps Script).
6. Redéployez le projet pour charger les secrets. Testez **Créer un brouillon Gmail** sur votre propre adresse avant d'essayer **Envoyer**.

La configuration échoue de manière sécurisée : si un secret manque, aucun email n'est envoyé. **Ne pas utiliser le mot de passe de l'espace membres comme accréditation d'envoi.**

Les emails envoyés à partir du Bureau sont générés dans la même direction artistique CRCC, et leur corps est contrôlé côté Cloudflare. Les cinq HTML historiques du S3 restent inchangés et l'ancien script peut continuer à fonctionner en parallèle.

État connu : l'outil d'édition du projet Apps Script n'est pas accessible depuis cette conversation, donc l'ajout du nouveau fichier et le déploiement Web App doivent être faits depuis l'éditeur Google.

## Interface unifiée CRCC

Le bureau des correspondances utilise maintenant les feuilles de style `css/style.css` et `css/offices.css`, communes au répertoire des bureaux, dans les tons papier, encre et bordeaux du site officiel. La connexion est présentée avec le même en-tête institutionnel, un formulaire et un panneau blanc que le bureau du Comité.

La protection de l'espace membres par HTTP Basic, appliquée par `functions/_middleware.js`, reste active sur le répertoire et les correspondances. Cette première authentification membre est suivie du formulaire d'accréditation administrateur déjà en place : `CRCC_MAIL_ADMIN_PASSWORD` demeure indépendant de `CRCC_MEMBERS_PASSWORD` et `CRCC_EXAM_ADMIN_PASSWORD`.

L'envoi, les brouillons, les modèles HTML, les aperçus et le registre D1 conservent leur logique et leurs API existantes. La mise à jour porte sur la présentation, la navigation et les interactions de connexion (dont la touche Entrée).


## Convocation à l'examen d'homologation

Nouveau modèle « Convocation à l'examen d'homologation » (`convocation_examen`), avec l'habillage institutionnel CRCC, une épreuve de **30 questions en 15 minutes**, les règles de non-interruption, un lien vers `https://cruising-rats-cigar-club.fr/examen` et un encadré pour le **code individuel à usage unique**.

Dans « Nouveau courrier », sélectionner ce type : un champ « Code personnel de convocation » apparaît. Coller le code de **64 caractères hexadécimaux** obtenu via le Bureau du Comité, vérifier le destinataire et prévisualiser. L'aperçu tolère un code encore absent en affichant un rappel ; l'enregistrement du brouillon et l'envoi exigent un code valide.

Le code est conservé dans le champ `mail_messages.exam_code` de la base `CRCC_MAIL_DB` afin que le brouillon puisse être rouvert sans perte. Le modèle `mail_templates.convocation_examen` est inséré sans écraser une personnalisation existante (`INSERT OR IGNORE`). L'API effectue au besoin une migration idempotente de la table `mail_messages`. L'HTML est défini côté serveur dans `functions/lib/exam-convocation-template.js` ; les marqueurs `{{RECIPIENT_NAME}}`, `{{EXAM_CODE}}` et `{{EXAM_URL}}` ne sont remplacés qu'en construisant l'aperçu ou l'email. La version texte envoyée par Resend comporte également le code et le lien.

Dans le formulaire « Convocation à l'examen », une zone **Essai technique réservé au Comité** permet également de créer directement un code de test : saisir le **mot de passe distinct du Bureau du Comité** puis cliquer sur **Générer un code de test du Comité**. Le navigateur appelle directement `POST /examen/api/admin/test-invitation`, avec l'autorisation du Comité, sans transmettre ce mot de passe au backend des correspondances. Le nouveau code de test est automatiquement inséré dans le champ `exam_code`. La génération ne produit aucun email, n'affecte aucun membre réel et ne lance aucun chronomètre ; les tests restent dans leur registre technique, sans décision de grade. Ne pas expédier une telle convocation de test à un candidat réel.

La préparation d'un courrier ordinaire ne crée **aucune invitation dans la base des examens** et ne lance pas le chronomètre : une convocation nominative ordinaire doit préalablement être créée dans le Bureau du Comité. Ne communiquer un code qu'au destinataire nominatif ; le message et son registre sont réservés aux administrateurs. Aucun email n'est envoyé sans confirmation explicite depuis le bureau.
