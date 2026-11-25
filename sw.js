/* Incrémenter cette version à chaque modification d'un fichier de APP_FILES.
 * Un ensemble complet est installé avant activation ; aucune mise à jour forcée
 * pendant une partie. Le nouveau worker attend la fermeture des fenêtres du jeu.
 */
'use strict';
const CACHE_PREFIX = 'code-secret:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + 'v1.1.0';
const APP_FILES = [
  './index.html', './style.css', './game.js', './app.js', './pwa.js',
  './icon.svg', './manifest.webmanifest', './icons/apple-touch-icon.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './qr-code.png', './Code-secret-Mastermind.html'
];
const APP_URLS = new Set(APP_FILES.map(file => new URL(file, self.registration.scope).href));
const HOME_URL = new URL('./', self.registration.scope).href;
const INDEX_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // cache.addAll est atomique : un fichier manquant fait échouer l'installation.
    await cache.addAll(APP_FILES.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' })));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Les paramètres restent dans l'adresse du navigateur : ?test=1 garde son effet.
  // Seule la copie HTML est commune ; aucune donnée de partie n'est mise en cache.
  const isHome = url.origin + url.pathname === HOME_URL || url.origin + url.pathname === INDEX_URL;
  const key = isHome ? INDEX_URL : url.href;
  if (!APP_URLS.has(key)) return; // Ne pas intercepter les tests ni d'autres sites.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(key) || fetch(event.request);
  })());
});
