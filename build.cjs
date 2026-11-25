// Génère la version autonome téléchargeable, sans outil ni paquet supplémentaire.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root,name),'utf8');
let html = read('index.html');
// Le fichier autonome reste indépendant, même ouvert directement hors connexion.
html = html.replace(/\s*<!-- PWA:START -->[\s\S]*?<!-- PWA:END -->/, '');
html = html.replace(/^[ \t]*<link rel="manifest" href="manifest.webmanifest">\r?\n/m, '');
html = html.replace(/^[ \t]*<script src="pwa.js" defer><\/script>\r?\n/m, '');
html = html.replace('<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" sizes="180x180">',
  '<link rel="apple-touch-icon" href="data:image/png;base64,' + fs.readFileSync(path.join(root, 'icons/apple-touch-icon.png')).toString('base64') + '" sizes="180x180">');
html = html.replace('<link rel="icon" href="icon.svg" type="image/svg+xml">', '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(read('icon.svg')) + '" type="image/svg+xml">');
html = html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>\n${read('style.css')}\n</style>`);
html = html.replace('<script src="game.js" defer></script>','').replace('<script src="app.js" defer></script>','');
html = html.replace('</body>',()=>`<script>\n${read('game.js')}\n${read('app.js')}\n</script>\n</body>`);
fs.writeFileSync(path.join(root,'Code-secret-Mastermind.html'),html,'utf8');
console.log('Code-secret-Mastermind.html créé.');
