# Examen de passage CRCC

Page candidat : https://cruising-rats-cigar-club.fr/examen

Bureau privé : https://cruising-rats-cigar-club.fr/examen?comite=1

Backend dédié : `cloudflare/examen/worker.mjs` déployé comme Worker `crcc-examen`.

Bases D1 :
- `EXAMS_DB` : `crcc-examens` (UE), réservée aux examens.
- `ARCHIVES_DB` : `crcc-archives` (UE), consultation des membres et du nombre de fiches.

Route Cloudflare : `cruising-rats-cigar-club.fr/examen/api/*`.
Les secrets ne sont **jamais** placés dans le dépôt.

## Dernière action de mise en service : secret administrateur

**Indispensable avant toute émission de convocation :** configurer le secret `CRCC_EXAM_ADMIN_PASSWORD` dans Cloudflare > Workers & Pages > `crcc-examen` > Settings > Variables and Secrets > Add > Secret.

Le mot de passe doit rester dans le gestionnaire de secrets du Comité : ne jamais le publier dans GitHub ni communiquer à un candidat.

Contrôler ensuite le bureau privé et créer une convocation, en choisissant un membre éligible.

## Délivrance et examen

Un Rat de passage doit avoir au moins **3 fiches archivées** (contrôle serveur sur `crcc-archives`). Le Comité crée un code unique de 64 caractères et doit le transmettre en privé : seul son SHA-256 est conservé, il n'est affiché qu'une seule fois.

Le candidat échange son code contre une session via un cookie `HttpOnly; Secure; SameSite=Strict`, puis démarre lui-même l'examen. Son heure serveur de début et son échéance `+900` secondes (15 minutes) sont figées en D1 pour toute nouvelle session. Les tentatives commencées sous le précédent délai de 30 minutes conservent leur échéance initiale. Les réponses enregistrées avant cette échéance sont retenues ; les modifications tardives sont refusées. Le navigateur affiche le temps restant, mais n'est jamais l'autorité. Déconnexion et rafraîchissement n'interrompent pas le délai.

Correction : 1 point par bonne réponse, parties 1–15 et 16–30. Proposition de seuil : 24/30 dont 10/15 à chaque partie. Les notes ne sont montrées qu'au Comité. La décision `homologue` ou `ajourne` est consignée, sans modifier le grade du membre.

## Consultation des copies et avis du Comité

Depuis le bureau privé, chaque convocation dispose du bouton **Voir la copie / avis**. Cette vue confidentielle présente les 30 questions, la réponse choisie par le candidat, la réponse attendue et son état (correcte, incorrecte ou absente). L'ordre des choix est restitué tel qu'affiché au candidat, même lorsque les propositions ont été permutées.

Le Comité peut saisir jusqu'à **2 500 caractères** dans **Avis du Comité**, puis cliquer **Enregistrer l'avis**. L'avis est enregistré dans la base D1 des examens, distinct de la note, du grade et de la décision d'homologation ; il est inaccessible au candidat.

La table `exam_opinions` est définie dans `schema.sql`. Sur une base existante, les nouvelles routes administratives l'initialisent automatiquement au premier accès authentifié (`CREATE TABLE IF NOT EXISTS`). Cette table est incluse dans les sauvegardes de `crcc-examens`.

Pour redéployer le Worker via API, conserver le secret `CRCC_EXAM_ADMIN_PASSWORD` en utilisant `keep_bindings: ["secret_text"]` dans les métadonnées de l'upload et vérifier sa présence après le déploiement.

## Codes de test réservés au Comité

Le Bureau du Comité (`/examen?comite=1`) propose **Générer un code de test du Comité**. Cet appel authentifié utilise `POST /examen/api/admin/test-invitation`, retourne un code cryptographiquement aléatoire de 64 caractères (32 octets) et le montre **une seule fois**.

La convocation créée suit le même parcours que celle d'un membre : code à usage unique, session privée, 30 questions, 15 minutes, réponses et correction. Les codes de test ne nécessitent **aucune fiche ni aucun profil membre**. Leur `member_id` technique unique commence par `crcc-test-` ; seul le SHA-256 du code est conservé, sans modifier le schéma D1.

Ces essais sont distingués dans un **registre technique séparé**. Ils ne figurent pas parmi les convocations des membres, ne sont pas comptés dans leur appréciation, ne produisent aucune décision d'homologation et ne modifient jamais les grades. La route `admin/decision` refuse explicitement une décision sur un test. Les essais peuvent être consultés, corrigés et révoqués par le Comité.

Pour faire le test : ouvrir le Bureau du Comité, cliquer sur **Générer un code de test du Comité**, copier le code, ouvrir `/examen` dans un autre navigateur ou une fenêtre privée, échanger le code puis cliquer sur **Commencer l'épreuve**. Les 15 minutes démarrent seulement à ce clic. Il n'est pas nécessaire de déployer un nouveau Worker pour chaque code.

## Points de vigilance

- La connexion via un code consommé fonctionne **sur le même navigateur** ; si le candidat perd le cookie après échange, l'invitation doit être révoquée puis régénérée.
- Le Comité doit sauvegarder ses secrets : pas de récupération du code ni du mot de passe dans D1.
- Une convocation à la fois par membre tant que non révoquée ; les tentatives closes restent archivées, et un nouvel examen nécessite révocation explicite de l'ancienne convocation.
- Ne pas afficher le corrigé dans le frontend.
- Aucun contrôle anti-triche ne remplace une surveillance réelle.
- Les sauvegardes D1 doivent inclure aussi `crcc-examens` (avec confidentialité adaptée).
- Les endpoints admin sont inutilisables tant que le secret n'est pas configuré.
- Tester en réel : code unique, progression, sauvegarde, refresh, échéance, fermeture de session, visa.

## Installation

Le schéma est dans `cloudflare/examen/schema.sql`. S'il faut reconstruire une base, appliquer ce schéma à la nouvelle base D1 et affecter les bindings.
Le frontend `examen.html` est publié par le build Pages habituel sur `/examen` ; il ne faut pas inclure le Worker d'examen dans le build statique de Pages.
