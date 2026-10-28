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

Le mot de passe est conservé séparément dans le fichier remis au Comité `CRCC_Acces_Comite_Examen.txt` : ne jamais le publier dans GitHub ni communiquer à un candidat.

Contrôler ensuite le bureau privé et créer une convocation, en choisissant un membre éligible.

## Délivrance et examen

Un Rat de passage doit avoir au moins **3 fiches archivées** (contrôle serveur sur `crcc-archives`). Le Comité crée un code unique de 64 caractères et doit le transmettre en privé : seul son SHA-256 est conservé, il n'est affiché qu'une seule fois.

Le candidat échange son code contre une session via un cookie `HttpOnly; Secure; SameSite=Strict`, puis démarre lui-même l'examen. Son heure serveur de début et son échéance `+1800` secondes sont figées en D1. Les réponses enregistrées avant cette échéance sont retenues ; les modifications tardives sont refusées. Le navigateur affiche le temps restant, mais n'est jamais l'autorité. Déconnexion et rafraîchissement n'interrompent pas le délai.

Correction : 1 point par bonne réponse, parties 1–15 et 16–30. Proposition de seuil : 24/30 dont 10/15 à chaque partie. Les notes ne sont montrées qu'au Comité. La décision `homologue` ou `ajourne` est consignée, sans modifier le grade du membre.

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
