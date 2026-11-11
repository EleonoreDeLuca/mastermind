# Code secret — Mastermind

Version **1.0.0**, créée le 11 novembre 2026 avec Codex pour le séminaire sur les technologies émergentes, HEG-Genève.

## Télécharger et jouer

Ouvrir **Code-secret-Mastermind.html** par double-clic dans un navigateur récent. Ce fichier autonome contient le jeu entier : aucune installation, connexion ou dépendance n’est nécessaire. Avec l’archive du projet, extraire d’abord tous les fichiers ; `index.html` est une autre entrée vers le même jeu.

Sélectionner un pion puis une couleur. Les quatre choix restent modifiables avant « Valider la proposition ». Au clavier : Tab et Maj+Tab pour parcourir les commandes, Espace pour activer un bouton, flèches gauche/droite pour choisir un pion, touches 1 à 6 pour les couleurs, Entrée depuis les pions ou la palette pour valider. Sur smartphone, toucher les pions et les couleurs ; faire défiler pour consulter les essais. « Nouvelle partie » remet tout à zéro sans demander de confirmation.

## Règles et sources

Quatre couleurs ordonnées parmi rouge, bleu, vert, jaune, orange et violet, avec répétitions ; dix essais. Compter d’abord les positions exactes, puis les correspondances restantes. Chaque occurrence compte au plus une fois. Une proposition invalide ne consomme aucun essai. Une victoire au dixième essai prime sur la défaite. Le code demeure caché, même après la fin.

Références du cours : [énoncé, édition 2.2](https://docs.google.com/document/d/17RUqUnEvIilitiNSY1kbK0QT7vBVcUeAT3L6ONJN8XU/edit) et [API commune, contrat 0.2](https://docs.google.com/document/d/1hxqc3QfG0PTknulNIisBvg-0h0W7CjRe6eHC1q_jBYU/edit), règles `code-couleurs-1.0`. Les nuances visuelles sont libres ; noms et lettres identifient aussi chaque couleur.

## Choix faits avec Codex

Choix principal : un seul moteur pour l’écran et l’API. Cela évite qu’un résultat évalué par le professeur diffère du jeu visible. Le code secret est dans un champ privé du moteur, absent des états retournés. L’interface est en français, sans ressource externe ni police à télécharger. Le jeu ne contient ni compte, ni données personnelles, ni service d’IA, ni serveur applicatif. Aucune partie n’est enregistrée ; recharger la page recommence le jeu. La PWA est facultative et n’est pas ajoutée.

## API commune 0.2

Ouvrir `index.html?test=1` sur le site (ou le fichier autonome avec ce même paramètre). L’objet `window.codeSecretTest` est disponible après chargement ; l’état initial est `not-started`. Sans `test=1`, cet objet est absent. L’API agit sur la partie visible. Les fonctions de lecture sont synchrones ; les mutations renvoient des promesses. Les erreurs de `startGame` rejettent sans changer l’écran ou l’état ; les refus de `submitGuess` se lisent dans `lastError`.

```js
const api = window.codeSecretTest;
api.getConfig();
await api.startGame({ secret: ["rouge", "rouge", "bleu", "vert"] });
const state = await api.submitGuess(["rouge", "bleu", "rouge", "vert"]);
console.assert(state.lastResult.wellPlaced === 2);
console.assert(state.lastResult.misplaced === 2);
api.getState(); // même essai et mêmes indices que l’écran
```

## Vérifications et correction

Vérifications locales le 11 novembre 2026 : **8 groupes de tests du moteur réussis**, dont les exemples T01 à T09, erreurs et priorités, copies indépendantes, redémarrage, victoire et défaite. Un calcul indépendant a confirmé les indices pour **1 679 616 couples** secret/proposition. Exécution reproductible avec Node.js : `node --test tests/game.test.cjs`.

**18 contrôles d’intégration réussis** dans le navigateur de l’application ChatGPT sous Windows, pour la page standard et pour le fichier autonome. Ils vérifient les promesses, l’exposition conditionnelle de l’API, les allers-retours API/écran, les propositions incomplètes, les modifications avant validation, les fins de partie et le redémarrage. Ouvrir `tests/browser.html` via un serveur de fichiers statiques pour les reproduire ; ajouter `?standalone=1` pour contrôler le fichier autonome. Cette page pilote la vraie application dans un cadre. Un serveur statique n’est nécessaire que pour ces contrôles entre cadres, pas pour jouer au fichier autonome.

Correction observée : un `startGame({secret: ...})` appelé depuis un cadre parent rejetait à tort `invalid-options`, parce que son `Object.prototype` venait d’une autre fenêtre. **Avant :** 5 contrôles d’intégration sur 6 exécutés réussis, puis interruption sur ce refus. **Après :** détection d’un objet ordinaire indépendante de sa fenêtre d’origine, 18/18 contrôles réussis. Un test spécifique protège cette correction. Le vérificateur a aussi été corrigé pour attendre le chargement du jeu plutôt que le document vide initial du cadre.

## Smartphone et limites

**Vérifié :** affichage simulé à 390 × 844 et 320 × 740 pixels ; contrôles au clavier avec modification d’un pion avant validation ; noms et symboles présents. Ces vérifications sur ordinateur ne constituent pas un essai sur un smartphone physique.

Le fichier autonome a été vérifié via HTTP local. L’ouverture directe par double-clic et le clic de téléchargement restent à confirmer manuellement : le navigateur de vérification bloque les URL de fichiers locaux et n’a pas confirmé l’événement de téléchargement. Le fichier est bien présent dans l’archive et ne charge aucune ressource externe.

**À compléter après un essai réel :** appareil et navigateur : non renseignés ; résultat : non réalisé. Sur le téléphone, ouvrir la version publiée, composer et modifier une proposition, valider, consulter les indices et recommencer une partie ; noter ici l’appareil et le résultat.

La version n’a pas encore été publiée sur GitHub Pages ni testée par l’outil du professeur. L’essai du jeu d’un camarade et le retour personnel restent à faire. La capsule avec la voix de l’étudiante reste à réaliser et à remettre sur Cyberlearn, jamais dans le dépôt public.

## Reprendre et publier

Fichiers : `game.js` (règles), `app.js` (interface et API), `style.css` (présentation), `index.html` (page), `tests/` (vérifications). Après modification, exécuter les tests concernés et `node build.cjs` pour régénérer `Code-secret-Mastermind.html`. Ce dernier est un fichier généré : modifier les sources plutôt que sa copie.

Pour GitHub Pages : créer un dépôt dédié, y déposer les fichiers du projet, puis activer **Settings → Pages → Deploy from a branch → main → / (root)**. Tous les chemins sont relatifs et compatibles avec un sous-dossier de dépôt. Le téléchargement est proposé au bas de la page. Le projet peut être téléchargé via **Code → Download ZIP**, et le fichier autonome peut être joint à une Release.

Liens du dépôt et du jeu publié : **à renseigner après publication**. Les tags `jalon-1` et `final` restent à poser aux remises correspondantes ; la version actuelle ne prétend pas être l’un de ces rendus. Ne pas publier les conversations, les informations de connexion ou le dossier personnel contenant les documents du cours.
