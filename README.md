# Code secret — Mastermind

Jeu solo réalisé avec Codex pour le séminaire sur les technologies émergentes, HEG-Genève. **Jeu v1.0.0**, créé le 11 novembre 2026 ; documentation complétée le **15 novembre 2026**.

- [Dépôt GitHub](https://github.com/EleonoreDeLuca/mastermind) · [Télécharger le projet ZIP](https://github.com/EleonoreDeLuca/mastermind/archive/refs/heads/main.zip).
- **[Jouer en ligne](https://eleonoredeluca.github.io/mastermind/)** · [Accès à l’API de test](https://eleonoredeluca.github.io/mastermind/?test=1). Publication GitHub Pages activée et vérifiée le **15 novembre 2026**. Le dépôt de code et le site jouable sont deux adresses différentes.
- Pour jouer sur ordinateur : extraire le ZIP, puis ouvrir `Code-secret-Mastermind.html` dans un navigateur récent. Ce fichier autonome contient le jeu entier. `index.html` utilise les mêmes sources, réparties en plusieurs fichiers. Aucune installation ni ressource externe n’est requise pour jouer.

## 1. Règles et utilisation

Le programme tire quatre couleurs ordonnées parmi **rouge, bleu, vert, jaune, orange, violet**, avec répétitions possibles. Le code reste fixe et caché. Le joueur a dix essais ; chaque proposition valide consomme un essai et reste visible avec ses indices.

Compter d’abord les couleurs à la bonne position, puis les couleurs présentes ailleurs parmi les occurrences restantes. Chaque occurrence compte au maximum une fois. Les indices sont deux nombres ; ils ne désignent aucun pion. Quatre bien placées donnent la victoire, même au dixième essai ; sinon, dix essais donnent une défaite. Les propositions invalides ne consomment aucun essai. Après la fin, aucun coup supplémentaire n’est accepté. « Nouvelle partie » réinitialise la partie ; la solution n’est pas révélée séparément, même après une défaite.

**Commandes :** sélectionner un pion, puis sa couleur ; modifier les choix avant de valider. Au clavier : Tab/Maj+Tab pour parcourir les commandes, Espace pour activer un bouton, ←/→ pour sélectionner un pion, 1 à 6 pour les couleurs, Entrée depuis les pions ou la palette pour valider. Sur écran tactile : toucher les mêmes commandes. Les noms et lettres R, B, V, J, O, Vi complètent les couleurs.

**Références :** [énoncé, édition 2.2](https://docs.google.com/document/d/17RUqUnEvIilitiNSY1kbK0QT7vBVcUeAT3L6ONJN8XU/edit), [API commune, contrat 0.2](https://docs.google.com/document/d/1hxqc3QfG0PTknulNIisBvg-0h0W7CjRe6eHC1q_jBYU/edit), règles `code-couleurs-1.0` et [critères d’évaluation, version 1.3](https://docs.google.com/document/d/12frV3vQ_56p4iZkzQG4BskaaSHbMgCwzQUwbAcS2S5A/edit). Les supports de cours 1 à 3 ont été consultés le 15 novembre : distinction README/AGENTS, consignes durables, essais attendu/observé/version/limite et commits après les changements importants. Les exemples fictifs des supports ne sont pas des preuves de ce projet.

## 2. Choix et reprise du projet

L’étudiante a fourni les règles, les documents de référence et demandé la création puis l’envoi sur GitHub. Codex a proposé et réalisé l’interface, le moteur, les tests et la documentation. **Décision de conception proposée par Codex :** utiliser un seul moteur pour l’écran et l’API afin d’éviter deux parties divergentes. Les noms et lettres rendent les couleurs identifiables sans dépendre de leur teinte. L’étudiante doit encore reformuler personnellement les choix qu’elle retient et leurs raisons pour sa capsule ; ce texte ne prétend pas démontrer à lui seul sa compréhension.

Le jeu est entièrement exécuté dans le navigateur, sans compte, données personnelles, paiement, serveur applicatif, service d’IA ni clé d’accès. Le code secret est privé dans le moteur et absent des états retournés. Aucun enregistrement persistant : recharger la page recommence le jeu. Le fichier autonome permet de jouer hors connexion après récupération ; il ne constitue pas une PWA installable.

| Fichier | Rôle |
| --- | --- |
| `index.html`, `style.css`, `icon.svg` | Page, présentation et icône |
| `game.js` | Règles, comptage, validation et état de la partie |
| `app.js` | Commandes, affichage et API utilisant ce même moteur |
| `Code-secret-Mastermind.html` | Copie autonome générée, téléchargeable depuis le pied de page du jeu |
| `build.cjs` | Génération de cette copie avec `node build.cjs` |
| `tests/game.test.cjs` | Tests reproductibles du moteur avec Node.js |
| `tests/browser.html`, `tests/browser.js` | Contrôles de l’API et de son lien avec la véritable interface |
| `AGENTS.md` | Consignes de travail pour Codex, ajoutées le 15 novembre 2026 |

Après une modification du jeu, tester le comportement concerné et régénérer le fichier autonome. Aucun paquet tiers à installer. Pour le moteur : `node --test tests/game.test.cjs`. Pour l’intégration : servir le dossier avec un serveur de fichiers statiques, ouvrir `tests/browser.html`, puis `tests/browser.html?standalone=1` pour la copie autonome. Ce serveur de vérification n’est pas nécessaire pour jouer au fichier téléchargé.

### API commune 0.2

Ajouter `?test=1` à l’URL du jeu, ou `&test=1` si elle contient déjà des paramètres. Après chargement, `window.codeSecretTest` est disponible et la partie est `not-started`. Cet objet est absent sans ce paramètre. `getConfig()` et `getState()` sont synchrones ; `startGame()` et `submitGuess()` renvoient des promesses, à attendre successivement. Les mêmes coups et indices apparaissent dans l’interface.

```js
const api = window.codeSecretTest;
api.getConfig();
await api.startGame({ secret: ["rouge", "rouge", "bleu", "vert"] });
const s = await api.submitGuess(["rouge", "bleu", "rouge", "vert"]);
console.assert(s.attempts === 1);
console.assert(s.lastResult.wellPlaced === 2 && s.lastResult.misplaced === 2);
api.getState(); // comparer ensuite à l’écran, puis essayer un coup depuis l’interface
```

Un `startGame` invalide rejette avec une `Error` portant `code` et `message`, sans changer l’état ni l’écran. Un refus de `submitGuess` résout vers l’état avec `lastError`, sans consommer d’essai. L’ordre des refus et les identifiants exacts suivent le contrat ; le secret n’est jamais retourné.

## 3. Vérifications, correction et historique

**Versions présentes sur GitHub avant cette mise à jour documentaire :**

| Date | Commit | Contenu |
| --- | --- | --- |
| 11 novembre 2026 | [`9850caa`](https://github.com/EleonoreDeLuca/mastermind/commit/9850caaffa77da0a14e2da028c42f74fafda4035) | Jeu v1.0.0, API 0.2, fichier autonome, README et génération |
| 11 novembre 2026 | [`32c5f35`](https://github.com/EleonoreDeLuca/mastermind/commit/32c5f35) | Page `tests/browser.html` |
| 11 novembre 2026 | [`1f7124c`](https://github.com/EleonoreDeLuca/mastermind/commit/1f7124c4b49ab9e5f48f9d7ae821f42e1c8ac02a) | Scripts des tests du moteur et de l’intégration |
| 15 novembre 2026 | [`8a1d0ee`](https://github.com/EleonoreDeLuca/mastermind/commit/8a1d0eefca0e22857ddc95cfcaf7c0cef2772af2) | Ajout d’AGENTS.md et documentation des versions, résultats et limites |

Les vérifications du navigateur ci-dessous ont été réalisées **le 11 novembre, en local**, dans le navigateur intégré de ChatGPT sous Windows, sur les sources v1.0.0 ensuite enregistrées dans ces commits. Elles ont donné **18/18 contrôles réussis pour la page standard et pour la copie autonome**. Ces observations historiques sont conservées ; les nouvelles vérifications sur le site public du 15 novembre sont détaillées plus bas. Les tests du moteur ont été relancés **le 15 novembre sur `1f7124c` : 8 groupes réussis, 0 échec**, avec Node.js sous Windows.

Dans le tableau : R = rouge, B = bleu, V = vert ; les appels emploient les noms complets.

| Comportement et action | Attendu | Obtenu et portée de la preuve |
| --- | --- | --- |
| Charger avec puis sans `test=1` | API 0.2 présente puis absente ; état initial `not-started`, 0 essai | Conforme dans les contrôles navigateur du 11 novembre |
| Secret R R B V ; proposer R B R V par l’API | 2 bien placées, 2 mal placées, 1 essai ; même ligne à l’écran | 2/2, compteur à 1 et historique identique, contrôles navigateur du 11 novembre ; moteur reconfirmé le 15 |
| Secret R R B V ; proposer R R R R | 2 bien placées, 0 mal placée | 2/0, test moteur T06 réussi le 15 novembre |
| Secret R R B V ; proposer R B R R | 1 bien placée, 2 mal placées | 1/2, contrôle navigateur T09 du 11 novembre et test moteur du 15 réussis |
| Modifier un pion avant validation, puis soumettre R B R V | La dernière sélection est utilisée une seule fois et se retrouve dans l’API | Conforme, 1 essai, indices 2/2, contrôle navigateur du 11 novembre |
| Valider une proposition vide dans l’interface | Refus expliqué, compteur et historique inchangés | Message visible, aucun essai ajouté, contrôle navigateur du 11 novembre |
| Après 9 essais, envoyer `["rouge"]`, puis la combinaison exacte au dixième | Refus `invalid-length` à 9 ; ensuite `won` à 10 | Conforme dans les contrôles navigateur du 11 novembre et le moteur le 15 |
| Secret R R R R ; envoyer dix fois B B B B, puis rejouer | `lost` à 10 ; coup suivant refusé `game-finished`, historique conservé | Conforme dans les contrôles navigateur du 11 novembre et le moteur le 15 |
| Recommencer après la fin ; tenter un démarrage invalide ; modifier les objets retournés | Remise à zéro ; démarrage invalide sans effet ; copies indépendantes | Contrôles navigateur du 11 novembre et tests moteur du 15 réussis |
| Calculer les indices pour tous les couples de codes | Même résultat qu’un calcul indépendant par fréquences | 1 679 616 couples conformes, test moteur relancé le 15 novembre |

**Correction réelle du 11 novembre :** le même appel `startGame({ secret: ["rouge", "rouge", "bleu", "vert"] })`, depuis la fenêtre parente du jeu, devait démarrer la partie. Avant correction, il rejetait à tort `invalid-options` ; le contrôle d’intégration s’interrompait après 5 contrôles réussis et 1 échec. Le moteur comparait les prototypes des objets par identité, différente entre fenêtres. Après correction, il reconnaît un objet ordinaire provenant d’un autre contexte : cet appel démarre la partie et les 18 contrôles passent. Le test « Options ordinaires provenant d’une autre fenêtre ou d’un autre contexte » protège ce cas. Cette correction est déjà incluse dans `9850caa` ; **la version fautive n’a pas été conservée dans Git**. La preuve avant repose sur l’observation faite pendant le développement, pas sur un ancien commit reproductible. Le vérificateur a aussi été corrigé pour attendre le chargement du jeu plutôt que le document vide initial du cadre.

**Autres observations du 11 novembre :** jeu au clavier avec modification d’un pion et validation ; affichage simulé à 390 × 844 et 320 × 740 pixels, sans débordement horizontal observé. Ce sont des essais sur ordinateur, pas sur un téléphone physique. Le fichier autonome a été contrôlé via HTTP local ; sa commande d’ouverture a ensuite été lancée à la demande de l’étudiante, sans vérification complète de la partie ouverte. Le clic de téléchargement n’a pas été confirmé par l’outil : il reste non vérifié, ce qui ne prouve pas un échec du jeu.

**Mise à jour du 15 novembre :** ajout d’AGENTS.md et réorganisation du README pour conserver ces preuves et les étapes restantes. Le jeu n’est pas modifié. AGENTS.md n’existait pas lors de la création ni des premiers tests ; ses consignes s’appliquent aux travaux suivants et ne sont pas une preuve rétroactive de leur respect.

### Publication et vérifications en ligne du 15 novembre 2026

GitHub Pages publie `main`, dossier racine, en HTTPS. Le [premier déploiement](https://github.com/EleonoreDeLuca/mastermind/actions/runs/43717386943), issu de `8a1d0ee`, est terminé avec succès. Le jeu v1.0.0 n’a pas changé ; les ajouts de documentation suivants ne changent pas ses fichiers. Ces contrôles ont été effectués par Codex sur ordinateur Windows, avec Microsoft Edge ; ce ne sont ni l’essai smartphone de l’étudiante ni les tests de l’enseignant.

| Action sur la version publiée | Attendu | Observé |
| --- | --- | --- |
| Ouvrir l’[adresse publique](https://eleonoredeluca.github.io/mastermind/) | Page accessible sans compte, jeu affiché | Réponse HTTP 200, titre et interface du jeu visibles |
| Ouvrir les [contrôles de la page standard](https://eleonoredeluca.github.io/mastermind/tests/browser.html) | Les 18 contrôles passent sur le vrai jeu publié | 18/18 réussis, 0 échec : API conditionnelle, état initial, propositions, refus, copies, victoire/défaite et échanges API/écran |
| Ouvrir les [contrôles du fichier autonome](https://eleonoredeluca.github.io/mastermind/tests/browser.html?standalone=1) | Même comportement que la page standard | 18/18 réussis, 0 échec ; cadre du jeu chargé depuis `Code-secret-Mastermind.html?test=1` |
| Depuis le jeu, choisir rouge, bleu, vert ; tenter une validation ; ajouter jaune et valider | Indicateur 0 → 3 → 4 → 0 sur 4 ; refus à trois couleurs sans essai consommé ; un essai et une ligne après validation complète | Conforme : message « Choisissez une couleur pour chacun des quatre pions. », compteur à 0 après refus ; puis compteur à 1 et ligne rouge–bleu–vert–jaune conservée. Touches 2, 3 et 4 également utilisées. Le code aléatoire est inconnu : les indices 0 bien placée/1 mal placée observés ne constituent pas à eux seuls une vérification du score |
| Récupérer le [fichier autonome publié](https://eleonoredeluca.github.io/mastermind/Code-secret-Mastermind.html) via HTTP | Même fichier que la source distribuée | SHA-256 identique : `43104a517ef1d2956d0e7e0986ad5ba41438743d033acf14e058451ba9f64941`. Le clic du lien de téléchargement dans le navigateur et l’ouverture hors ligne restent à confirmer séparément |

## 4. Limites, questions et remises

- **GitHub Pages :** [site publié](https://eleonoredeluca.github.io/mastermind/) et API vérifiés le 15 novembre sur le même jeu, dans les deux sens. Configuration : Settings → Pages → Deploy from a branch → `main` → `/ (root)`. Après une modification, attendre le déploiement et vérifier la nouvelle version. Les chemins sont relatifs, compatibles avec un sous-dossier de dépôt. L’outil enseignant n’a pas été exécuté.
- **Smartphone réel :** non réalisé. Appareil et navigateur : à renseigner ; résultat : à observer. Essai prévu : sélectionner et modifier quatre couleurs au toucher, valider, lire les indices et l’historique, recommencer. La simulation mobile ne remplace pas cet essai.
- **Essai personnel complémentaire :** le scénario trois puis quatre pions est désormais vérifié par Codex sur Edge pour ordinateur (tableau ci-dessus). L’étudiante peut le refaire sur son smartphone et communiquer ses propres observations ; elles n’ont pas encore été recueillies.
- **Retour sur le jeu d’un camarade :** à réaliser et résumer ici. **Capsule individuelle de 4 à 5 minutes :** à enregistrer par l’étudiante avec son écran et sa voix ; montrer une règle, un test, la correction, un choix expliqué et une limite réelle. La vidéo reste sur Cyberlearn.
- **J1, 20 novembre 2026 :** poser le tag `jalon-1` sur la version remise et déposer `jalon1_nomdefamille.docx` avec liens du dépôt et du site, et tag ; pas de vidéo. **J2, 18 décembre 2026 :** tag `final`, `jalon2_nomdefamille.docx` avec ces mêmes éléments et vidéo séparée. Tags et Word de remise non créés à ce stade ; vérifier les heures sur Cyberlearn.
- Les extensions (robot de résolution, PWA, etc.) ne sont pas réalisées ; aucun bonus n’est requis pour cette version. Aucun compte ni classement en ligne n’est prévu. La validation finale appartient à l’enseignant ; les tests réussis ne garantissent pas l’absence de défaut.

Le dépôt public contient le jeu, ses tests et sa documentation. Le dossier local `documents-reference/` et les archives locales `dist/` sont exclus par `.gitignore`. Ne pas publier les conversations, les fichiers personnels, les supports de cours, les accès ou la capsule.
