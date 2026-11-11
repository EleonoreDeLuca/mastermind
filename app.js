(function () {
  'use strict';
  const game = new window.CodeSecretGame();
  const colors = game.getConfig().colors;
  const symbols = ['R', 'B', 'V', 'J', 'O', 'Vi'];
  const $ = id => document.getElementById(id);
  const testMode = new URLSearchParams(window.location.search).get('test') === '1';
  let draft = [null, null, null, null], selected = 0;
  const slotButtons = [], paletteButtons = [];
  function peg(color, className = '') {
    const node = document.createElement('span');
    node.className = `peg ${color || 'unfilled'} ${className}`;
    node.textContent = color ? symbols[colors.indexOf(color)] : '＋';
    return node;
  }
  function selectSlot(index, focus = false) {
    selected = (index + 4) % 4;
    renderDraft();
    if (focus) slotButtons[selected].focus();
  }
  function chooseColor(color) {
    if (game.getState().status !== 'playing') return;
    draft[selected] = color;
    // Avancer vers le prochain pion vide ; une proposition complète reste modifiable.
    for (let step = 1; step < 4; step++) {
      const next = (selected + step) % 4;
      if (draft[next] === null) { selected = next; break; }
    }
    renderDraft();
    $('feedback').textContent = draft.every(Boolean) ? 'Votre proposition est prête à être validée.' : '';
    $('feedback').classList.remove('error');
  }
  for (let i = 0; i < 4; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slot';
    button.addEventListener('click', () => selectSlot(i));
    slotButtons.push(button);
    $('slots').append(button);
  }
  colors.forEach((color, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'color-button';
    button.setAttribute('aria-label', `${color}, touche ${i + 1}`);
    const name = document.createElement('span'); name.textContent = color;
    const key = document.createElement('kbd'); key.textContent = String(i + 1); key.setAttribute('aria-hidden', 'true');
    button.append(peg(color), name, key);
    button.addEventListener('click', () => chooseColor(color));
    paletteButtons.push(button); $('palette').append(button);
  });
  function renderDraft() {
    const playing = game.getState().status === 'playing';
    slotButtons.forEach((button, i) => {
      button.replaceChildren(peg(draft[i]));
      const caption = document.createElement('span');
      caption.className = 'slot-caption'; caption.textContent = draft[i] || `Pion ${i + 1}`;
      button.append(caption);
      button.classList.toggle('selected', i === selected);
      button.setAttribute('aria-pressed', String(i === selected));
      button.setAttribute('aria-label', `Pion ${i + 1} : ${draft[i] || 'sans couleur'}`);
      button.disabled = !playing;
    });
    paletteButtons.forEach((button, i) => {
      button.disabled = !playing;
      button.setAttribute('aria-pressed', String(draft[selected] === colors[i]));
    });
    $('filled-count').textContent = `${draft.filter(Boolean).length} sur 4`;
    $('selection-help').textContent = playing ? `Pion ${selected + 1} sélectionné · choisissez sa couleur` : 'Lancez une nouvelle partie pour jouer.';
    $('submit').disabled = !playing;
  }
  function render() {
    const state = game.getState(), playing = state.status === 'playing';
    const headings = { 'not-started': 'Prêt à décrypter ?', playing: 'À vous de jouer', won: 'Code décrypté. Bravo !', lost: 'Les 10 essais sont écoulés.' };
    $('status-title').textContent = headings[state.status];
    $('status-text').textContent = state.status === 'won' ? `Vous avez trouvé la combinaison en ${state.attempts} essai${state.attempts > 1 ? 's' : ''}.`
      : state.status === 'lost' ? 'Une nouvelle énigme vous attend. Prêt à retenter votre chance ?'
      : playing ? 'Sélectionnez un pion, puis sa couleur.' : 'Cliquez sur « Commencer une partie » pour démarrer.';
    $('counter').textContent = `${state.attempts} / 10 essais`;
    $('remaining').textContent = state.status === 'won' ? 'Code trouvé' : `${10 - state.attempts} disponible${10 - state.attempts > 1 ? 's' : ''}`;
    $('progress-fill').style.width = `${state.attempts * 10}%`;
    $('guess-title').textContent = playing ? `Proposition ${state.attempts + 1}` : 'Votre proposition';
    $('new-game').textContent = state.status === 'not-started' ? 'Commencer une partie →' : '↻ Nouvelle partie';
    document.body.dataset.status = state.status;
    $('history').replaceChildren();
    state.history.forEach((entry, i) => {
      const row = document.createElement('li'); row.className = 'history-row';
      const number = document.createElement('span'); number.className = 'attempt-number'; number.textContent = String(i + 1).padStart(2, '0');
      const pegs = document.createElement('div'); pegs.className = 'history-pegs';
      pegs.setAttribute('aria-label', entry.guess.join(', '));
      entry.guess.forEach(color => { const p = peg(color); p.setAttribute('aria-hidden', 'true'); pegs.append(p); });
      const result = document.createElement('div'); result.className = 'result';
      result.setAttribute('aria-label', `${entry.result.wellPlaced} bien placées, ${entry.result.misplaced} mal placées`);
      result.innerHTML = `<span title="Bien placées">● <b>${entry.result.wellPlaced}</b></span><span title="Mal placées">○ <b>${entry.result.misplaced}</b></span>`;
      row.append(number, pegs, result); $('history').append(row);
    });
    $('empty-history').hidden = state.history.length !== 0;
    const error = state.lastError;
    $('feedback').classList.toggle('error', Boolean(error));
    $('feedback').textContent = error ? error.message : state.lastResult
      ? `${state.lastResult.wellPlaced} bien placée${state.lastResult.wellPlaced > 1 ? 's' : ''} · ${state.lastResult.misplaced} mal placée${state.lastResult.misplaced > 1 ? 's' : ''}${state.status === 'won' ? '. Partie gagnée !' : state.status === 'lost' ? '. Partie terminée.' : '.'}` : '';
    renderDraft();
  }
  async function startGame(options) {
    game.startGame(options); // En cas de refus, ne rien modifier, même dans l'interface.
    draft = [null, null, null, null]; selected = 0;
    render();
    return game.getState();
  }
  async function submitGuess(guess) {
    const before = game.getState().attempts;
    const state = game.submitGuess(guess);
    if (state.attempts > before) { draft = [null, null, null, null]; selected = 0; }
    render();
    return game.getState();
  }
  $('submit').addEventListener('click', async () => {
    await submitGuess(draft.slice());
    if (game.getState().status === 'playing' && !game.getState().lastError) slotButtons[0].focus();
  });
  $('new-game').addEventListener('click', async () => { await startGame(); slotButtons[0].focus(); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || game.getState().status !== 'playing') return;
    if (/^[1-6]$/.test(event.key)) { event.preventDefault(); chooseColor(colors[Number(event.key) - 1]); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); selectSlot(selected + (event.key === 'ArrowLeft' ? -1 : 1), true);
    } else if (event.key === 'Enter' && (slotButtons.includes(document.activeElement) || paletteButtons.includes(document.activeElement))) {
      event.preventDefault(); $('submit').click();
    }
  });
  if (testMode) {
    $('test-label').hidden = false;
    render();
    window.codeSecretTest = Object.freeze({ version: '0.2', getConfig: () => game.getConfig(),
      getState: () => game.getState(), startGame, submitGuess });
  } else startGame();
})();
