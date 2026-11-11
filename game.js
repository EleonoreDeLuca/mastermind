/* Moteur commun à l'écran et à l'API 0.2. Aucune dépendance externe. */
(function (root) {
  'use strict';
  const COLORS = ['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet'];
  const CONFIG = { apiVersion: '0.2', rulesVersion: 'code-couleurs-1.0', secretLength: 4,
    maxAttempts: 10, allowDuplicates: true, colors: COLORS };
  const MESSAGES = {
    'game-not-started': 'Commencez une partie avant de proposer des couleurs.',
    'game-finished': 'La partie est terminée. Lancez une nouvelle partie pour rejouer.',
    'invalid-options': 'Les options doivent être un objet contenant uniquement la clé secret, si nécessaire.',
    'invalid-type': 'Choisissez une couleur pour chacun des quatre pions.',
    'invalid-length': 'Une proposition doit contenir exactement quatre couleurs.',
    'invalid-color': 'La couleur proposée n’est pas autorisée.'
  };
  const copy = value => JSON.parse(JSON.stringify(value));
  function validateCode(code) {
    if (!Array.isArray(code)) return 'invalid-type';
    for (let i = 0; i < code.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(code, i) || typeof code[i] !== 'string') return 'invalid-type';
    }
    if (code.length !== 4) return 'invalid-length';
    if (code.some(color => !COLORS.includes(color))) return 'invalid-color';
    return null;
  }
  function score(secret, guess) {
    let wellPlaced = 0;
    const remainingSecret = {}, remainingGuess = {};
    for (let i = 0; i < 4; i++) {
      if (secret[i] === guess[i]) wellPlaced++;
      else {
        remainingSecret[secret[i]] = (remainingSecret[secret[i]] || 0) + 1;
        remainingGuess[guess[i]] = (remainingGuess[guess[i]] || 0) + 1;
      }
    }
    const misplaced = COLORS.reduce((sum, color) => sum + Math.min(remainingSecret[color] || 0, remainingGuess[color] || 0), 0);
    return { wellPlaced, misplaced };
  }
  function randomSecret() {
    return Array.from({ length: 4 }, () => {
      const byte = new Uint8Array(1);
      do { root.crypto.getRandomValues(byte); } while (byte[0] >= 252);
      return COLORS[byte[0] % 6];
    });
  }
  class Game {
    #secret = null;
    #state = { status: 'not-started', attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null };
    getConfig() { return copy(CONFIG); }
    getState() { return copy(this.#state); }
    startGame(options = {}) {
      let code = null;
      const prototype = options !== null && typeof options === 'object' ? Object.getPrototypeOf(options) : undefined;
      // Un outil enseignant peut créer l'objet dans une autre fenêtre :
      // son Object.prototype est différent, mais son constructeur reste Object natif.
      const validObject = options !== null && typeof options === 'object' && !Array.isArray(options)
        && (prototype === null || (Object.prototype.hasOwnProperty.call(prototype, 'constructor')
          && typeof prototype.constructor === 'function'
          && Function.prototype.toString.call(prototype.constructor) === Function.prototype.toString.call(Object)));
      if (!validObject || Reflect.ownKeys(options).some(key => key !== 'secret')) code = 'invalid-options';
      else if (Object.prototype.hasOwnProperty.call(options, 'secret')) code = validateCode(options.secret);
      if (code) throw Object.assign(new Error(MESSAGES[code]), { code });
      this.#secret = Object.prototype.hasOwnProperty.call(options, 'secret') ? options.secret.slice() : randomSecret();
      this.#state = { status: 'playing', attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null };
      return this.getState();
    }
    submitGuess(guess) {
      let code = this.#state.status === 'not-started' ? 'game-not-started'
        : this.#state.status !== 'playing' ? 'game-finished' : validateCode(guess);
      if (code) {
        this.#state.lastError = { code, message: MESSAGES[code] };
        return this.getState();
      }
      const result = score(this.#secret, guess);
      const entry = { guess: guess.slice(), result };
      this.#state.history.push(entry);
      this.#state.attempts++;
      this.#state.lastGuess = guess.slice();
      this.#state.lastResult = { ...result };
      this.#state.lastError = null;
      this.#state.status = result.wellPlaced === 4 ? 'won' : this.#state.attempts === 10 ? 'lost' : 'playing';
      return this.getState();
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { Game, score };
  else root.CodeSecretGame = Game;
})(globalThis);
