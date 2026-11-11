(async function () {
  const frame = document.getElementById('game'), normal = document.getElementById('normal');
  if (new URLSearchParams(location.search).get('standalone') === '1') {
    frame.src = '../Code-secret-Mastermind.html?test=1';
    normal.src = '../Code-secret-Mastermind.html';
  }
  function ready(f) { return new Promise(resolve => { if(f.contentDocument.URL !== 'about:blank' && f.contentDocument.readyState === 'complete') resolve(); else f.addEventListener('load',resolve,{once:true}); }); }
  await Promise.all([ready(frame),ready(normal)]);
  const api = frame.contentWindow.codeSecretTest, doc = frame.contentDocument;
  const R='rouge',B='bleu',V='vert'; let failures=0,checks=0;
  const check=(name,condition)=>{checks++;const item=document.createElement('li');item.className=condition?'pass':'fail';item.textContent=`${condition?'OK':'ÉCHEC'} — ${name}`;document.getElementById('results').append(item);if(!condition) failures++;};
  try {
    check('API 0.2 disponible uniquement avec ?test=1',api?.version==='0.2' && normal.contentWindow.codeSecretTest===undefined);
    check('État initial not-started sans essai',api.getState().status==='not-started' && api.getState().attempts===0);
    check('Configuration exacte',JSON.stringify(api.getConfig())===JSON.stringify({apiVersion:'0.2',rulesVersion:'code-couleurs-1.0',secretLength:4,maxAttempts:10,allowDuplicates:true,colors:[R,B,V,'jaune','orange','violet']}));
    check('Refus avant démarrage', (await api.submitGuess(null)).lastError.code==='game-not-started');
    const promise=api.startGame({secret:[R,R,B,V]}); check('startGame renvoie une promesse',typeof promise.then==='function');await promise;
    const guessPromise=api.submitGuess([R,B,R,V]);check('submitGuess renvoie une promesse',typeof guessPromise.then==='function');
    const s=await guessPromise;
    check('API → écran : résultat 2/2, un essai affiché',s.lastResult.wellPlaced===2 && s.lastResult.misplaced===2 && doc.querySelectorAll('.history-row').length===1 && doc.getElementById('counter').textContent==='1 / 10 essais' && doc.querySelector('.result').textContent==='● 2○ 2');
    await api.startGame({secret:[R,R,B,V]});
    const slots=doc.querySelectorAll('.slot'),palette=doc.querySelectorAll('.color-button');
    slots[0].click();palette[0].click();slots[1].click();palette[1].click();slots[2].click();palette[0].click();slots[3].click();palette[2].click();
    // Modification d'un pion avant validation : rouge -> jaune -> rouge.
    slots[0].click();palette[3].click();slots[0].click();palette[0].click();
    doc.getElementById('submit').click(); await Promise.resolve();
    check('Écran → API : proposition modifiable, un seul essai, indices 2/2',JSON.stringify(api.getState().lastGuess)===JSON.stringify([R,B,R,V]) && api.getState().attempts===1 && api.getState().lastResult.misplaced===2);
    const before=api.getState();doc.getElementById('submit').click();await Promise.resolve();
    check('Proposition incomplète : explication visible et aucun essai consommé',api.getState().lastError.code==='invalid-type' && api.getState().attempts===before.attempts && Boolean(doc.getElementById('feedback').textContent));
    const html=doc.body.innerHTML, snapshot=JSON.stringify(api.getState());let error;
    try {await api.startGame({secret:[R]});}catch(e){error=e;}
    check('Démarrage invalide : rejet, écran et état intégralement inchangés',error?.code==='invalid-length' && doc.body.innerHTML===html && JSON.stringify(api.getState())===snapshot);
    const input=[R,R,R,R]; await api.startGame({secret:input}); input.fill(B);
    for(let i=0;i<9;i++)await api.submitGuess([B,B,B,B]);
    await api.submitGuess([R]);check('Refus à neuf essais : compteur inchangé',api.getState().attempts===9 && doc.getElementById('counter').textContent==='9 / 10 essais');
    await api.submitGuess([R,R,R,R]);
    check('Victoire au dixième : API et écran cohérents',api.getState().status==='won' && api.getState().attempts===10 && doc.querySelectorAll('.history-row').length===10 && doc.getElementById('status-title').textContent.includes('Bravo') && doc.getElementById('submit').disabled);
    const done=api.getState();await api.submitGuess(null);check('Après la fin : refus prioritaire sans nouvel essai',api.getState().lastError.code==='game-finished' && api.getState().attempts===done.attempts);
    await api.startGame({secret:[R,R,R,R]});for(let i=0;i<10;i++)await api.submitGuess([B,B,B,B]);
    check('Défaite à dix : écran bloqué et historique conservé',api.getState().status==='lost' && doc.getElementById('submit').disabled && doc.querySelectorAll('.history-row').length===10);
    doc.getElementById('new-game').click();await Promise.resolve();
    check('Nouvelle partie depuis l’écran remet aussi l’API à zéro',api.getState().status==='playing' && api.getState().attempts===0 && api.getState().lastError===null && doc.querySelectorAll('.history-row').length===0);
    const detached=api.getState();detached.history.push({});check('État retourné indépendant',api.getState().history.length===0);
    const config=api.getConfig();config.colors.fill('nope');check('Configuration retournée indépendante',api.getConfig().colors[0]===R);
    await api.startGame({secret:[R,R,B,V]});await api.submitGuess([R,B,R,R]);
    check('T09 dans le véritable navigateur : 1 bien placée, 2 mal placées',api.getState().lastResult.wellPlaced===1 && api.getState().lastResult.misplaced===2);
  } catch(e) {check(`Exception inattendue : ${e.message}`,false);}
  const summary=document.getElementById('summary');summary.textContent=`${checks-failures}/${checks} contrôles réussis. ${failures} échec(s).`;summary.dataset.done='true';summary.dataset.failures=String(failures);
})();
