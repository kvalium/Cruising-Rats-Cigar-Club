# Bureau des correspondances — mise en service Gmail

Interface privée directe : https://cruising-rats-cigar-club.fr/fiches-degustation/bureau-correspondances.html

Aucun lien ajouté aux pages existantes. La page utilise le mot de passe de consultation du Club, **mais l'envoi nécessite une seconde accréditation administrateur**.

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
