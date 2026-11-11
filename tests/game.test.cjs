const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { Game, score } = require('../game.js');
const colors = ['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet'];
const R = 'rouge', B = 'bleu', V = 'vert', J = 'jaune', O = 'orange', Vi = 'violet';
const red = [R,R,R,R], blue = [B,B,B,B];
test('T01–T09 : exemples du contrat 0.2', () => {
  const cases = [
    [[R,B,V,J],[R,V,B,O],1,2], [[R,B,V,J],[O,Vi,R,B],0,2],
    [[R,B,V,J],[B,R,J,V],0,4], [[R,B,V,J],[R,B,J,V],2,2],
    [[R,B,V,J],[R,B,V,J],4,0], [[R,R,B,V],red,2,0],
    [[R,R,B,V],[R,B,R,V],2,2], [[R,R,B,V],[R,R,B,V],4,0],
    [[R,R,B,V],[R,B,R,R],1,2]
  ];
  for (const [secret, guess, wellPlaced, misplaced] of cases) {
    const game = new Game(); game.startGame({secret}); const s = game.submitGuess(guess);
    assert.deepEqual(s.lastResult, {wellPlaced, misplaced});
    assert.equal(s.attempts, 1); assert.equal(s.history.length,1);
    assert.equal(s.status,wellPlaced === 4 ? 'won' : 'playing'); assert.equal(s.lastError,null);
  }
});
test('Victoire au dixième, refus à neuf, refus après la fin, redémarrage', () => {
  const game = new Game();
  assert.equal(game.submitGuess(null).lastError.code,'game-not-started');
  game.startGame({secret:red});
  for(let i=0;i<9;i++) game.submitGuess(blue);
  assert.equal(game.submitGuess([R]).lastError.code,'invalid-length');
  assert.equal(game.getState().attempts,9);
  assert.equal(game.submitGuess(red).status,'won');
  const done = game.getState(); assert.equal(done.attempts,10);
  const rejected = game.submitGuess(null); assert.equal(rejected.lastError.code,'game-finished');
  assert.deepEqual({...rejected,lastError:null},done);
  const restart = game.startGame({secret:red});
  assert.deepEqual(restart,{status:'playing',attempts:0,history:[],lastGuess:null,lastResult:null,lastError:null});
});
test('Défaite à dix et redémarrage depuis lost', () => {
  const game = new Game(); game.startGame({secret:red});
  for(let i=0;i<10;i++) game.submitGuess(blue);
  assert.equal(game.getState().status,'lost');
  assert.deepEqual(game.getState().lastResult,{wellPlaced:0,misplaced:0});
  assert.equal(game.submitGuess(red).lastError.code,'game-finished');
  assert.equal(game.startGame().status,'playing');
});
test('Refus : type avant longueur avant couleur, tableaux creux et identifiants exacts', () => {
  const game = new Game(); game.startGame({secret:red});
  for(const [guess,code] of [[null,'invalid-type'],['rouge','invalid-type'],[[R,null],'invalid-type'],
    [new Array(4),'invalid-type'],[[R],'invalid-length'],[['purple'],'invalid-length'],
    [[R,B,V,'Violet'],'invalid-color'],[[R,B,V,'violet '],'invalid-color'],[[R,B,V,'purple'],'invalid-color']]) {
    const before = game.getState(); const after = game.submitGuess(guess);
    assert.equal(after.lastError.code,code);
    assert.deepEqual({...after,lastError:before.lastError},before);
  }
  assert.equal(game.submitGuess([Vi,Vi,Vi,Vi]).lastError,null);
});
test('Options invalides : rejet sans changement de l’état, même lastError', () => {
  const game = new Game(); game.startGame({secret:red}); game.submitGuess(null);
  const before = game.getState();
  for (const [options,code] of [[null,'invalid-options'],[[],'invalid-options'],[1,'invalid-options'],
    [new Date(),'invalid-options'],[{extra:true,secret:null},'invalid-options'],
    [{secret:undefined},'invalid-type'],[{secret:null},'invalid-type'],[{secret:new Array(4)},'invalid-type'],
    [{secret:[R]},'invalid-length'],[{secret:[R,R,R,'Red']},'invalid-color']]) {
    assert.throws(()=>game.startGame(options),e=>e instanceof Error && e.code === code && Boolean(e.message));
    assert.deepEqual(game.getState(),before);
  }
  for(const options of [undefined,{}]) assert.equal(game.startGame(options).status,'playing');
});
test('Options ordinaires provenant d’une autre fenêtre ou d’un autre contexte', () => {
  const game = new Game();
  const options = vm.runInNewContext('({secret:["rouge","rouge","bleu","vert"]})');
  assert.equal(game.startGame(options).status,'playing');
  assert.deepEqual(game.submitGuess([R,B,R,V]).lastResult,{wellPlaced:2,misplaced:2});
});
test('Entrées et résultats indépendants ; code caché ; configuration indépendante', () => {
  const game = new Game(); const secret = [R,R,B,V]; game.startGame({secret}); secret.fill(J);
  const guess = [R,B,R,V]; const s = game.submitGuess(guess); guess.fill(J);
  assert.deepEqual(s.lastResult,{wellPlaced:2,misplaced:2});
  const before = game.getState(); s.history[0].guess.fill(O); s.lastGuess.fill(O); s.lastResult.wellPlaced = 42;
  assert.deepEqual(game.getState(),before);
  const config = game.getConfig(); config.colors.fill('nope'); assert.deepEqual(game.getConfig().colors,colors);
  assert.ok(!('secret' in before)); assert.ok(!('solution' in before));
});
test('Tous les couples de codes : comparaison avec un calcul indépendant (1 679 616)', () => {
  const codes = [];
  for(const a of colors) for(const b of colors) for(const c of colors) for(const d of colors) codes.push([a,b,c,d]);
  for(const secret of codes) for(const guess of codes) {
    const wellPlaced = secret.reduce((n,c,i)=>n+Number(c === guess[i]),0);
    // Une référence différente : total des intersections de fréquences, moins les positions exactes.
    const total = colors.reduce((n,c)=>n+Math.min(secret.filter(v=>v===c).length,guess.filter(v=>v===c).length),0);
    const actual = score(secret,guess);
    assert.equal(actual.wellPlaced,wellPlaced); assert.equal(actual.misplaced,total-wellPlaced);
  }
});
