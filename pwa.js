/* Installation et disponibilité hors ligne ; aucun accès à l'état de la partie. */
(function () {
  'use strict';
  const status = document.getElementById('offline-status');
  const update = document.getElementById('update-status');
  if (!status) return;
  if (!('serviceWorker' in navigator) || !window.isSecureContext || location.protocol === 'file:') {
    status.textContent = 'Pour préparer le jeu hors ligne, ouvrez son adresse HTTPS dans Safari ou un navigateur compatible.';
    return;
  }
  // Le script n'est inclus que dans la page web, pas dans le fichier autonome.
  async function prepare() {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      function showUpdate() {
        if (registration.waiting) update.hidden = false;
      }
      showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', showUpdate);
      });
      let timeout;
      try {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => { timeout = window.setTimeout(() => reject(new Error('Préparation trop longue.')), 30000); })
        ]);
      } finally {
        window.clearTimeout(timeout);
      }
      status.textContent = 'Jeu prêt hors ligne sur cet appareil. Vous pouvez couper Internet et le rouvrir.';
    } catch (error) {
      status.textContent = 'Le jeu reste jouable en ligne. La préparation hors ligne a échoué ; réessayez avec Internet en rechargeant la page.';
      console.warn('Préparation hors ligne indisponible.', error);
    }
  }
  if (document.readyState === 'complete') prepare();
  else window.addEventListener('load', prepare, { once: true });
})();
