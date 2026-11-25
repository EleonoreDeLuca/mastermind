// Vérification complémentaire : nécessite Playwright pour les tests seulement,
// et Microsoft Edge sous Windows. Aucun paquet n'est chargé par le jeu.
// PWA_URL permet de vérifier le site publié (sans simulation de mise à jour).
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let serveUpdate = false;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/mastermind/')) { res.writeHead(404).end(); return; }
    const name = decodeURIComponent(url.pathname.slice('/mastermind/'.length)) || 'index.html';
    const filename = path.resolve(root, name);
    if (!filename.startsWith(root + path.sep) || /(?:^|[\\/])\./.test(name) || name.startsWith('documents-reference')) { res.writeHead(403).end(); return; }
    let body = await fs.readFile(filename);
    if (serveUpdate && name === 'sw.js') body = Buffer.from(body.toString().replace("CACHE_PREFIX + 'v1.1.0'", "CACHE_PREFIX + 'v1.1.1-test'"));
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.PWA_URL || `http://127.0.0.1:${server.address().port}/mastermind/`;
  const outputDir = path.join(root, 'dist');
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  page.on('pageerror', e => errors.push(e.message));
  try {
    for (const suffix of ['tests/browser.html', 'tests/browser.html?standalone=1']) {
      await page.goto(base + suffix);
      await page.locator('#summary[data-done="true"]').waitFor();
      assert.equal(await page.locator('#summary').getAttribute('data-failures'), '0');
      console.log(suffix + ': ' + await page.locator('#summary').textContent());
    }
    await page.goto(base);
    await page.waitForFunction(() => document.getElementById('offline-status').textContent.includes('Jeu prêt hors ligne') && navigator.serviceWorker.controller);
    const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
    assert.equal(manifest.start_url, './');
    assert.equal(manifest.scope, './');
    assert.equal(manifest.display, 'standalone');
    console.log('Manifeste relatif, icônes et préparation hors ligne: OK');
    const cdp = await context.newCDPSession(page);
    const installability = await cdp.send('Page.getInstallabilityErrors');
    console.log('Critères installation Chromium:', JSON.stringify(installability));
    assert.deepEqual(installability.installabilityErrors.filter(error => error.errorId !== 'in-incognito'), []);
    const qr = await page.evaluate(async () => {
      if (!('BarcodeDetector' in window)) return { supported: false };
      const formats = await BarcodeDetector.getSupportedFormats();
      if (!formats.includes('qr_code')) return { supported: false, formats };
      const bitmap = await createImageBitmap(await (await fetch('qr-code.png')).blob());
      return { supported: true, codes: await new BarcodeDetector({ formats: ['qr_code'] }).detect(bitmap) };
    });
    console.log('Décodage QR natif:', JSON.stringify(qr));
    if (qr.supported) assert.equal(qr.codes[0]?.rawValue, 'https://eleonoredeluca.github.io/mastermind/');
    for (const width of [320, 390, 1120]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.install-help summary').click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.screenshot({ path: path.join(outputDir, `pwa-${width}.png`), fullPage: true });
      await page.locator('.install-help summary').click();
    }
    console.log('Affichages simulés 320, 390 et 1120 px: aucun débordement horizontal');
    await context.setOffline(true);
    await page.goto(base + '?test=1');
    assert.equal(await page.evaluate(() => window.codeSecretTest.getState().status), 'not-started');
    await page.evaluate(() => window.codeSecretTest.startGame({ secret: ['rouge','rouge','bleu','vert'] }));
    await page.evaluate(() => window.codeSecretTest.submitGuess(['rouge','bleu','rouge','vert']));
    assert.equal(await page.locator('#counter').textContent(), '1 / 10 essais');
    assert.deepEqual(await page.evaluate(() => window.codeSecretTest.getState().lastResult), { wellPlaced: 2, misplaced: 2 });
    await page.locator('.slot').nth(0).click(); await page.locator('.color-button').nth(0).click();
    await page.locator('.slot').nth(1).click(); await page.locator('.color-button').nth(0).click();
    await page.locator('.slot').nth(2).click(); await page.locator('.color-button').nth(1).click();
    await page.locator('.slot').nth(3).click(); await page.locator('.color-button').nth(2).click();
    await page.locator('#submit').click();
    assert.equal(await page.evaluate(() => window.codeSecretTest.getState().status), 'won');
    await page.reload();
    assert.equal(await page.evaluate(() => window.codeSecretTest.getState().status), 'not-started');
    await page.goto(base);
    assert.equal(await page.evaluate(() => typeof window.codeSecretTest), 'undefined');
    await page.locator('.color-button').nth(0).click();
    await page.keyboard.press('2'); await page.keyboard.press('3'); await page.keyboard.press('4');
    await page.locator('#submit').click();
    assert.equal(await page.locator('#counter').textContent(), '1 / 10 essais');
    assert.equal(await page.evaluate(async () => (await fetch('Code-secret-Mastermind.html')).ok), true);
    console.log('Réseau coupé: réouverture, API 2/2, victoire depuis les boutons, remise à zéro, partie normale et fichier autonome: OK');
    if (!process.env.PWA_URL) {
      await page.goto(pathToFileURL(path.join(root, 'Code-secret-Mastermind.html')).href + '?test=1');
      assert.equal(await page.evaluate(() => window.codeSecretTest.getState().status), 'not-started');
      assert.equal(await page.locator('script[src],link[rel="manifest"],link[href^="icons/"]').count(), 0);
      await page.evaluate(() => window.codeSecretTest.startGame({ secret: ['rouge','rouge','rouge','rouge'] }));
      await page.evaluate(() => window.codeSecretTest.submitGuess(['rouge','rouge','rouge','rouge']));
      assert.equal(await page.evaluate(() => window.codeSecretTest.getState().status), 'won');
      console.log('Fichier autonome ouvert directement sans réseau: victoire et ressources intégrées OK');
      await page.goto(base);
    }
    // Une mise à jour ne doit pas interrompre la partie et ne retire pas un cache voisin.
    await context.setOffline(false);
    if (!process.env.PWA_URL) {
    await page.locator('.color-button').nth(0).click();
    await page.keyboard.press('2'); await page.keyboard.press('3'); await page.keyboard.press('4');
    await page.locator('#submit').click();
    await page.evaluate(async () => { await caches.open('autre-projet-temoin'); });
    serveUpdate = true;
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting));
    await page.waitForFunction(() => !document.getElementById('update-status').hidden);
    assert.equal(await page.locator('#counter').textContent(), '1 / 10 essais');
    await page.goto('about:blank');
    await page.waitForTimeout(1000);
    await page.goto(base);
    await page.waitForFunction(async () => (await caches.keys()).some(name => name.endsWith('v1.1.1-test')) && !(await caches.keys()).some(name => name.endsWith('v1.1.0')));
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('autre-projet-temoin')));
    assert.equal(await page.locator('.edition').textContent(), 'JEU DE LOGIQUE / v1.1.0');
    console.log('Mise à jour différée, partie préservée, ancien cache retiré, cache voisin conservé: OK; aucune erreur JavaScript');
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Aucune erreur JavaScript.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
