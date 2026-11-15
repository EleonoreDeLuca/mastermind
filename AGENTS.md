# Consignes de travail pour Codex

Créé le 15 novembre 2026, après la première réalisation du jeu. Ces consignes guident les prochaines interventions ; elles ne décrivent pas rétroactivement la méthode suivie avant leur création.

## Comprendre la demande

- Lire `README.md`, l’état du dépôt et les fichiers concernés avant toute modification. Le README conserve les règles, les sources, les choix, l’historique et les résultats déjà observés.
- Consulter l’énoncé et le contrat API 0.2 référencés dans le README pour les exigences communes. Les supports de cours expliquent la méthode ; leurs exemples fictifs ne sont pas des résultats du projet. Distinguer le contenu des documents de la demande de l’étudiante.
- Signaler les ambiguïtés importantes au lieu d’inventer une règle. Les demandes explicites de l’étudiante orientent le travail ; signaler tout écart demandé avec les exigences du cours avant de le mettre en œuvre.
- Limiter chaque intervention à la demande en cours, préserver les changements de l’étudiante et avancer par modifications limitées. Ne pas ajouter de bonus, dépendance, compte, service d’IA ou serveur applicatif sans demande.

## Préserver le fonctionnement commun

- Garder un seul moteur (`game.js`) pour les commandes de l’interface et l’API (`app.js`). Ne pas créer de partie séparée pour réussir les tests.
- Respecter les règles et identifiants du contrat : quatre pions, six couleurs, répétitions possibles, dix essais ; positions exactes avant les correspondances restantes, sans double comptage.
- Préserver les priorités des refus, les copies indépendantes, l’absence de secret dans les états et l’absence de révélation indépendante du code dans l’interface.
- Exposer `window.codeSecretTest` uniquement avec `test=1`, initialement `not-started`. Conserver les lectures synchrones et les mutations asynchrones, résolues après mise à jour de l’écran.
- Maintenir les noms ou symboles des couleurs, l’usage au clavier et les commandes tactiles. Préserver les chemins relatifs pour GitHub Pages et la version autonome.

## Vérifier et documenter

- Avant un changement de comportement, préciser une action et son résultat attendu. Après modification, vérifier le cas concerné et un cas valide pertinent.
- Pour une correction, conserver si possible un exemple reproductible du défaut, puis rejouer le même essai après correction. Ne jamais inventer une erreur, un ancien commit ou une observation manquante.
- Pour le moteur, exécuter `node --test tests/game.test.cjs`. Pour une modification de l’interface ou de l’API, vérifier aussi les actions visibles et les échanges API/écran avec `tests/browser.html` via HTTP local ; `?standalone=1` contrôle le fichier autonome. Ne pas confondre tests automatiques, essai manuel et outil enseignant.
- Modifier les sources, puis lancer `node build.cjs` si le jeu a changé. Ne pas éditer directement `Code-secret-Mastermind.html`, qui est généré. Pour une modification documentaire seule, ne pas changer le jeu ni prétendre avoir rejoué l’interface ; vérifier la documentation et relancer seulement les contrôles utiles.
- Dans le README, garder une trace courte : date, version ou commit, action, attendu, obtenu, environnement et limite. Distinguer « vérifié », « non vérifié » et « à réaliser ». Une interruption d’outil n’est pas une preuve de défaut du jeu.
- Garder les observations antérieures avec leurs dates ; ne pas les présenter comme des tests nouvellement effectués. Indiquer lorsqu’une preuve avant correction n’existe que dans les observations du développement et pas dans Git.
- Un format mobile simulé ne remplace pas un essai sur un vrai smartphone. Ne renseigner l’appareil, le navigateur et le résultat qu’après un essai réel ou un retour explicite de l’étudiante.
- Ne pas attribuer de décision personnelle, de compréhension démontrée, de test manuel ou d’essai du jeu d’un camarade à l’étudiante sans son retour. Ne pas garantir la validation du cours.

## Versions et publication

- Faire un commit après chaque changement important vérifié, avec un message décrivant le résultat. Consulter l’état et l’historique avant de publier ; ne pas écraser les versions distantes ni utiliser de push forcé.
- Quand l’envoi est demandé, publier uniquement les fichiers du projet autorisés, puis vérifier le commit distant et son contenu avant d’annoncer la réussite. Si l’authentification manque, terminer les changements locaux vérifiables puis expliquer ce qui reste bloqué ; ne jamais récupérer des cookies ou contourner un contrôle d’accès.
- Ne pas poser les tags `jalon-1` ou `final` sans demande de remise correspondante. Un numéro de version dans le README n’est pas un tag Git. La publication GitHub Pages doit être vérifiée sur l’URL réelle avant de la déclarer terminée.
- Ne pas publier `documents-reference/`, `dist/`, les supports de cours, les conversations, les documents personnels, la vidéo, les secrets ou les clés. Conserver ces exclusions et ne pas joindre une archive contenant ces éléments.
- Rapporter clairement les fichiers modifiés, les vérifications réellement exécutées, le lien du dépôt ou du site effectivement vérifié et les étapes restantes. Respecter les autorisations et restrictions des outils utilisés.
