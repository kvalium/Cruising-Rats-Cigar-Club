# Déploiement du site CRCC

## État au 25 octobre 2026

- Base D1 `crcc-archives` créée en juridiction UE (`ae82b3fb-f396-4ca5-9cfb-a4098e4704cf`). Import vérifié : 4 membres, 3 séances, 5 fiches et 5 comptes rendus.
- Worker `crcc-publication` déployé et lié à cette base. Aucun jeton de publication ou d'export n'est encore défini : les routes internes refusent les accès.
- Le projet Pages n'a pas été créé : Cloudflare renvoie une erreur 401 concernant son installation GitHub. Réparer cette connexion avant d'activer les déploiements Git.
- Les sept PDF de dégustation, les sept déclinaisons du badge et la photo des fondateurs sont présents dans S3 avec leur type MIME.
- La zone Cloudflare du domaine (`515c4fe9578e7e9826c71b0b3a111ae4`) est créée et en attente d'activation. Les serveurs de noms proposés sont `etienne.ns.cloudflare.com` et `melody.ns.cloudflare.com`. Aucun enregistrement DNS n'y est encore défini et les serveurs de noms du registrar n'ont pas été modifiés. L'ancien site reste en place.

La branche contient l'identifiant D1 réel dans `cloudflare/wrangler.jsonc`. Vérifier sa présence dans la PR brouillon après la mise à jour GitHub.

Le dépôt conserve le code, les gabarits et une copie de référence des archives. Après
l'import initial, **D1 est la source de publication** des membres et séances. Cloudflare
Pages sert des fichiers HTML générés lors de chaque publication ; les visites du
public n'interrogent ni le Worker ni D1. PDF et images sont servis depuis le S3 du club.
L'ancien GitHub Pages reste disponible jusqu'à la bascule vérifiée.

## 1. Préparer S3

Le script `bash scripts/sync-assets.sh` copie `documents/` et `images/` vers le bucket
`cruising-rats-cigar-club`, sans supprimer les objets distants. Il utilise le profil
AWS de l'opérateur. Vérifier que chaque objet destiné à une archive publique est
accessible par HTTPS (réponse HTTP 200). Ne pas publier les exports privés de D1
dans un préfixe S3 accessible au public. Les fichiers source locaux restent dans Git
pour préserver les anciennes URL de GitHub Pages pendant la transition.

## 2. Créer D1 et importer une fois les archives

Installer Wrangler et se connecter au compte Cloudflare du club, puis :

```sh
npx wrangler d1 create crcc-archives --jurisdiction eu
```

Reporter l'identifiant renvoyé dans `cloudflare/wrangler.jsonc`. Créer la base et
les tables avant tout appel au Worker :

```sh
npx wrangler d1 execute crcc-archives --remote --file cloudflare/schema.sql
python3 scripts/seed-d1.py cloudflare/initial.sql
npx wrangler d1 execute crcc-archives --remote --file cloudflare/initial.sql
```

`initial.sql` est ignoré par Git ; ne pas relancer ce dernier import sur une base
déjà utilisée. Contrôler les comptes : 4 membres, 3 séances et 5 fiches pour l'état
du dépôt au 25 octobre 2026.

## 3. Déployer le Worker privé

Définir deux secrets distincts (`CRCC_EXPORT_TOKEN` et `CRCC_PUBLISH_TOKEN`) via
`npx wrangler secret put <NOM> --config cloudflare/wrangler.jsonc`. Déployer avec :

```sh
npx wrangler deploy --config cloudflare/wrangler.jsonc
```

L'API ne sert que `GET /internal/snapshot`, `PUT /internal/sessions/<id>` et
`PUT /internal/members/<id>`. Chaque route requiert son jeton. Le Worker valide la
séance avant insertion ; les versions précédentes sont archivées en base lors d'une
révision. Conserver les jetons dans un gestionnaire de secrets, jamais dans Git.

## 4. Créer Cloudflare Pages

Lier le dépôt GitHub à un projet Pages. Commande de build :
`python3 scripts/build-site.py` ; répertoire de sortie : `dist`.

Configurer les variables de build :

| Variable | Valeur |
| --- | --- |
| `CRCC_SITE_URL` | `https://cruising-rats-cigar-club.fr` |
| `CRCC_DATA_URL` | `https://<worker>/internal/snapshot` |
| `CRCC_EXPORT_TOKEN` | Le jeton privé correspondant au Worker |
| `CRCC_S3_BASE` | `https://cruising-rats-cigar-club.s3.eu-west-3.amazonaws.com` |
| `CRCC_REQUIRE_S3` | `1` (échec du build si un PDF ou une image manque sur S3) |

Sans `CRCC_DATA_URL`, le build local utilise le JSON et les comptes rendus du dépôt.
Sans `CRCC_S3_BASE`, il conserve les copies locales des PDF et images pour le test.
En production, le build exclut ces copies et crée des liens directs vers S3.

Créer un Deploy Hook Pages et enregistrer son URL comme secret Worker
`CRCC_DEPLOY_HOOK`. À chaque écriture, le Worker déclenche un nouveau build. Si le
build échoue, la dernière version statique publiée reste en ligne ; relancer le
hook après correction. L'URL du hook est un secret.

## 5. Intégrer l'agent

L'agent continue d'analyser la séance, d'écrire `data/degustations.json` et les
comptes rendus, et de faire valider les pièces. Après synchronisation S3 et tests
existants, il peut soumettre une séance par
`python3 scripts/publish-record.py session <id>`, ou un membre sans séance avec
`python3 scripts/publish-record.py member <id>`. Fournir `CRCC_PUBLISH_URL` et
`CRCC_PUBLISH_TOKEN` dans son environnement sécurisé. La réponse `202` confirme
l'enregistrement, **pas encore la réussite du build** : vérifier le déploiement Pages.

## 6. Vérifier, puis basculer le domaine

Avant la bascule : comparer les 14 pages d'archives, le jeu, les liens PDF, les
statistiques, les badges, le sitemap et les URL canoniques sur le domaine de
prévisualisation. Tester une nouvelle séance et une révision ; contrôler que le
Worker rejette les appels sans jeton. Effectuer un export D1 et tester sa lecture.

Ajouter `cruising-rats-cigar-club.fr` dans **Pages > Custom domains**, puis faire
pointer les serveurs DNS du domaine vers Cloudflare. Configurer `www` en redirection
vers le domaine nu. Mettre à jour les liens publiés dans les courriers existants.
Une fois la nouvelle version validée, conserver les anciennes pages GitHub Pages
ou leur donner des redirections adaptées ; ne pas supprimer leurs PDF avant d'avoir
vérifié les liens externes.

L'offre gratuite D1 conserve sept jours de restauration. Exporter périodiquement
la base (`npx wrangler d1 export crcc-archives --remote --output backup.sql`) et
stocker la copie dans un emplacement privé distinct du bucket public.

## Périmètre reporté

La connexion des membres, l'interface de création des séances et l'envoi de
courriers ne font pas partie de cette mise en service.
