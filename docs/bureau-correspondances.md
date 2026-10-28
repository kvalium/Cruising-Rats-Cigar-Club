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
