import { bindTouchControls } from './touch-controls.js';
import { Match, makeArena, seededRandom } from './engine.js';
import { CHARACTERS, characterFor } from './characters.js';
import { drawCharacter, renderArena } from './art.js';
import { drawTitleScene } from './title-art.js';
import { TitleAnimation } from './title-animation.js';
import { VictoryAnimation, drawVictoryScene, SpectatorEndingAnimation, drawSpectatorEndingScene } from './victory-scene.js';
import { Story, BOSSES, STORY_SAVE_KEY, storyCharacters } from './story.js';

const $ = id => document.getElementById(id);
const arena = $('arena');
const ctx = arena.getContext('2d');
const titleCtx = $('title-scene').getContext('2d');
const titleAnimation = new TitleAnimation();
const victoryCtx = $('victory-scene').getContext('2d');
let victoryAnimation = null;
let victoryRevealed = false;
let lastVictoryWinner = null;
let lastVictoryLoser = null;
const dialog = $('help-dialog');
const pressed = new Map();
const routes = { home: 'inicio', selection: 'personagens', game: 'partida', victory: 'vitoria' };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let screen = 'home';
let selected = CHARACTERS[0];
let phase = 'idle';
let match = null;
let spectatorSpeed = 1;
let countdown = 3;
let countdownNumber = 0;
let muted = true;
let audio;
let helpPaused = false;
let previousTime = performance.now();
let seed = 2026;
let mode = 'quick';
let story = null;
let primaryAction = null;
let secondaryAction = null;
let watchAction = null;
let storageAvailable = true;
let savedStory = readStory();
let toastTimer = null;
let toastLeaveTimer = null;

function showToast() {
  const toast = $('toast');
  if (!toast) return;
  if (toastTimer) clearTimeout(toastTimer);
  if (toastLeaveTimer) clearTimeout(toastLeaveTimer);

  toast.hidden = false;
  toast.removeAttribute('data-leaving');
  void toast.offsetWidth;

  toastTimer = setTimeout(() => {
    toast.setAttribute('data-leaving', 'true');
    toastLeaveTimer = setTimeout(() => {
      toast.hidden = true;
      toast.removeAttribute('data-leaving');
    }, 180);
  }, 2800);
}

async function copyGameLink() {
  const url = `${window.location.origin}${window.location.pathname}`;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch {
    // fallback below
  }

  if (!copied) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      copied = false;
    }
  }

  if (copied) {
    showToast();
    sound('pickup');
    announce('Link do jogo copiado para a área de transferência.');
  }
}

function readStory() {
  try { return Story.restore(localStorage.getItem(STORY_SAVE_KEY)); }
  catch { storageAvailable = false; return null; }
}

function refreshSave() {
  $('resume-story').hidden = !savedStory;
  if (savedStory) $('resume-story').textContent = `Retomar: ${characterFor(savedStory.character).name} · Fase ${savedStory.stage + 1}/${savedStory.totalStages}`;
  $('save-notice').hidden = storageAvailable;
  $('save-notice').textContent = 'Este navegador não permitiu salvar o progresso. A história continua enquanto o jogo estiver aberto.';
}

function saveStory() {
  savedStory = story.completed ? null : Story.restore(story.serialize());
  try {
    if (story.completed) localStorage.removeItem(STORY_SAVE_KEY);
    else localStorage.setItem(STORY_SAVE_KEY, story.serialize());
  } catch { storageAvailable = false; }
  refreshSave();
}

function chooseMode(value) {
  mode = value; story = null;
  $('mode-label').textContent = mode === 'story' ? 'Modo história' : 'Jogo rápido';
  $('selection-hint').textContent = mode === 'story'
    ? '5 fases · Você: 3 vidas · Computadores: 1 vida. Na final, ambos têm 3 vidas. Lula e Flávio são os chefões.'
    : 'Uma partida contra três computadores.';
  for (const button of $('roster').children) {
    const locked = mode === 'story' && BOSSES.includes(button.dataset.character);
    button.disabled = locked;
    const character = characterFor(button.dataset.character);
    button.setAttribute('aria-label', locked ? character.name + ', chefão exclusivo do Modo história' : 'Selecionar ' + character.fullName + ', ' + character.party);
    button.querySelector('small').textContent = locked ? 'Chefão' : character.party;
  }
  if (mode === 'story' && BOSSES.includes(selected.id)) selectCharacter(storyCharacters()[0]);
  else selectCharacter(selected);
  showScreen('selection');
}

const announce = text => { $('announcement').textContent = text; };

function tone(frequency, duration, type = 'square', delay = 0) {
  if (muted) return;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') audio.resume();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (type === 'triangle') oscillator.frequency.exponentialRampToValueAtTime(30, start + duration);
  gain.gain.setValueAtTime(0.025, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start); oscillator.stop(start + duration);
}

function sound(type) {
  if (type === 'explosion') tone(150, 0.2, 'triangle');
  else if (type === 'pickup') { tone(660, 0.08); tone(880, 0.12, 'square', 0.08); }
  else if (type === 'bomb') tone(280, 0.045);
  else if (type === 'finished') { tone(440, 0.12); tone(660, 0.12, 'square', 0.14); tone(880, 0.2, 'square', 0.28); }
}

function showScreen(target, { record = true, replace = false, focus = true } = {}) {
  const guarded = target === 'game' && !match;
  if (guarded) target = 'selection';
  if (target === 'victory' && !victoryAnimation && lastVictoryWinner) prepareVictory(lastVictoryWinner, lastVictoryLoser);
  const missingVictory = target === 'victory' && !victoryAnimation;
  if (missingVictory) target = 'home';
  if (target !== 'victory') victoryAnimation = null;
  screen = target;
  clearControls();
  if (target !== 'game') { phase = 'idle'; match = null; helpPaused = false; }
  if (target === 'home') { refreshSave(); titleAnimation.reset(); }
  document.body.dataset.screen = target;
  for (const section of document.querySelectorAll('main > [data-screen]')) section.hidden = section.dataset.screen !== target;
  const hash = '#' + routes[target];
  if (record || guarded || missingVictory) {
    const method = replace || guarded || missingVictory ? 'replaceState' : 'pushState';
    if (location.hash !== hash || replace || guarded || missingVictory) history[method]({ screen: target }, '', hash);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus) {
    const focusTarget = target === 'game' ? arena : $(target === 'home' ? 'home-title' : target === 'victory' ? 'victory-title' : 'selection-title');
    focusTarget.focus({ preventScroll: true });
  }
  announce(target === 'home' ? 'Tela de início.' : target === 'selection' ? 'Seleção de personagens. Use as setas e Enter para jogar.' : target === 'victory' ? $('victory-title').textContent + ' ' + $('victory-winner').textContent : 'Tela da partida.');
}

function prepareVictory(winner, loser = null) {
  lastVictoryWinner = winner;
  lastVictoryLoser = loser;
  victoryAnimation = loser ? new SpectatorEndingAnimation(winner, loser) : new VictoryAnimation(winner);
  victoryRevealed = false;
  $('victory-title').textContent = loser ? 'O ciclo continua' : 'Vitória!';
  $('victory-winner').textContent = victoryAnimation.winner.name + (loser ? ' venceu o segundo turno' : ' venceu');
  $('victory-restart').lastChild.textContent = loser ? 'Tentar novamente' : 'Nova história';
  $('victory-scene').setAttribute('aria-label', loser
    ? `${victoryAnimation.winner.name} e ${victoryAnimation.loser.name} trocam uma bomba. O vencedor lança a bomba no derrotado, que explode.`
    : 'O vencedor encontra Lula e Flávio trocando uma bomba, lança outra bomba e elimina os dois');
  $('victory-message').hidden = true;
  $('arena-overlay').hidden = true;
}

function showVictory(winner, loser = null) {
  prepareVictory(winner, loser);
  showScreen('victory');
  renderVictory(0);
}

function renderVictory(dt) {
  if (reducedMotion.matches) victoryAnimation.update(5.7);
  else if (!dialog.open) victoryAnimation.update(dt);
  const scene = victoryAnimation.snapshot();
  if (scene.loser) drawSpectatorEndingScene(victoryCtx, scene);
  else drawVictoryScene(victoryCtx, scene);
  if (scene.message && !victoryRevealed) {
    victoryRevealed = true;
    $('victory-message').textContent = scene.message;
    $('victory-message').hidden = false;
    announce(scene.message);
  }
}

function paintAvatar(canvas, character, scale = 3) {
  const portrait = canvas.getContext('2d');
  portrait.clearRect(0, 0, canvas.width, canvas.height);
  portrait.imageSmoothingEnabled = false;
  drawCharacter(portrait, character, (canvas.width - 16 * scale) / 2, (canvas.height - 28 * scale) / 2, scale);
}

function selectCharacter(character, focus = false) {
  if (mode === 'story' && BOSSES.includes(character.id)) return;
  selected = character;
  for (const button of $('roster').children) {
    const active = button.dataset.character === selected.id;
    button.setAttribute('aria-pressed', String(active));
    button.tabIndex = active && !button.disabled ? 0 : -1;
    if (active && focus) button.focus({ preventScroll: true });
  }
  $('selected-name').textContent = character.name;
  $('selected-full-name').textContent = character.fullName;
  $('selected-full-name').hidden = character.fullName === character.name;
  $('selected-party').textContent = character.party;
  $('start-label').textContent = 'Jogar com ' + character.name;
  paintAvatar($('selected-avatar'), character, 8);
  announce(character.name + ', ' + character.party + ', selecionado.');
}

for (const character of CHARACTERS) {
  const button = document.createElement('button');
  button.className = 'character-card'; button.dataset.character = character.id;
  button.style.setProperty('--character-color', character.color);
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Selecionar ' + character.fullName + ', ' + character.party);
  const avatar = document.createElement('canvas');
  avatar.width = 48; avatar.height = 84; avatar.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  const name = document.createElement('strong'); name.textContent = character.name;
  const party = document.createElement('small'); party.textContent = character.party;
  copy.append(name, party); button.append(avatar, copy);
  button.addEventListener('click', () => selectCharacter(character));
  $('roster').append(button); paintAvatar(avatar, character);
}

function participantConfig(random) {
  const pool = CHARACTERS.filter(character => character.id !== selected.id);
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return [
    { id: 'human', character: selected.id, x: 1, y: 1 },
    { id: 'bot1', character: pool[0].id, x: 13, y: 11, bot: true },
    { id: 'bot2', character: pool[1].id, x: 13, y: 1, bot: true },
    { id: 'bot3', character: pool[2].id, x: 1, y: 11, bot: true },
  ];
}

function drawParticipants(view) {
  $('participants').replaceChildren();
  $('participants').style.setProperty('--participant-count', view.players.length);
  for (const player of view.players) {
    const character = characterFor(player.character);
    const card = document.createElement('div');
    card.className = 'participant'; card.dataset.player = player.id;
    const avatar = document.createElement('canvas');
    avatar.width = 48; avatar.height = 84; avatar.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = character.name;
    const tag = document.createElement('small');
    tag.textContent = `${player.bot ? 'Computador' : 'Você'} · ${player.lives} ${player.lives === 1 ? 'vida' : 'vidas'}`;
    copy.append(name, tag); card.append(avatar, copy); $('participants').append(card);
    paintAvatar(avatar, character);
  }
}

function overlay(title, text, buttonText, allowSelection = false, actions = {}) {
  primaryAction = actions.primary ?? null;
  secondaryAction = actions.secondary ?? (() => showScreen('selection'));
  watchAction = actions.watch ?? null;
  $('arena-overlay').hidden = false;
  $('arena-overlay').classList.toggle('countdown', phase === 'countdown');
  $('overlay-title').textContent = title;
  $('overlay-text').textContent = text;
  $('overlay-button').hidden = !buttonText;
  $('overlay-secondary').hidden = !allowSelection;
  $('overlay-secondary').textContent = actions.secondaryLabel ?? 'Trocar personagem';
  $('overlay-watch').hidden = !watchAction;
  $('arena-overlay').classList.toggle('game-over', title === 'GAME OVER');
  if (buttonText) $('overlay-button').textContent = buttonText;
}

function start() {
  if (mode === 'story') {
    story = new Story(selected.id, seededRandom(++seed * 991));
    saveStory();
  }
  startMatch();
}

function startMatch() {
  if (mode !== 'story' || !story.spectating) spectatorSpeed = 1;
  $('spectator-speed').value = String(spectatorSpeed);
  const random = seededRandom(++seed * 991);
  match = new Match({ arena: makeArena(random), players: mode === 'story' ? story.participants() : participantConfig(random), random,
    lives: 1, difficulty: mode === 'story' ? 0.2 + story.stage / (story.totalStages - 1) * 0.8 : 1 });
  phase = 'countdown'; countdown = 3; countdownNumber = 0;
  refreshSpectatorSpeed(match.snapshot());
  showScreen('game');
  drawParticipants(match.snapshot());
  $('game-title').textContent = mode === 'story' ? story.title : 'Jogo rápido · Praça da Disputa';
  $('game-back').lastChild.textContent = mode === 'story' ? ' Sair' : ' Personagens';
  $('match-state').textContent = 'Prepare-se';
  $('timer').textContent = '02:30'; $('timer').classList.remove('danger-timer');
  $('pause-button').disabled = true;
  setPauseButton(false);
  for (const [id, value] of [['bomb-stat', 1], ['range-stat', 2], ['speed-stat', 1]]) $(id).textContent = value;
  overlay('3', 'A partida já vai começar.');
  announce('A partida começa em três segundos.');
}

function retryStory() {
  if (story.spectating) {
    story.stage = story.preliminaryStages;
    story.finalists = [];
  }
  story.restart(); saveStory(); startMatch();
}

function failStory() {
  phase = 'failure'; clearControls(); $('pause-button').disabled = true;
  overlay('GAME OVER', 'Você falhou em acabar com o ciclo do poder', 'Tentar novamente', true, {
    primary: retryStory, secondary: () => showScreen('home'), secondaryLabel: 'Sair',
    watch: story.semifinal ? () => {
      story.spectating = true;
      saveStory();
      phase = 'playing'; $('arena-overlay').hidden = true; $('pause-button').disabled = false;
      arena.focus({ preventScroll: true });
      if (match.snapshot().status === 'finished') finishStory(match.snapshot());
    } : null,
  });
  $('match-state').textContent = 'Fim de jogo';
  $('overlay-button').focus({ preventScroll: true });
  announce('Game over. Você falhou em acabar com o ciclo do poder.');
}

function finishStory(view) {
  const outcome = story.resolve(view);
  if (outcome.kind === 'defeat') { failStory(); return; }
  phase = 'result'; clearControls(); $('pause-button').disabled = true;
  if (outcome.kind === 'complete') {
    saveStory();
    if (!story.spectating) { showVictory(outcome.winner); return; }
    showVictory(outcome.winner, story.finalists.find(id => id !== outcome.winner));
    return;
  } else {
    saveStory();
    if (story.spectating) { startMatch(); return; }
    const title = outcome.kind === 'tie' ? 'Desempate!' : story.final ? 'Segundo turno!' : 'Fase vencida!';
    const opponents = story.participants().filter(player => player.character !== selected.id).map(player => characterFor(player.character).name).join(' e ');
    const text = outcome.kind === 'tie' ? 'A vaga ficou empatada. Nova arena, uma vida por participante.'
      : story.final ? `Você se classificou. A final será contra ${opponents}. Ambos começam com três vidas.` : `Próximo confronto: ${opponents}. Você tem três vidas; cada computador tem uma.`;
    overlay(title, text, outcome.kind === 'tie' ? 'Jogar desempate' : 'Próxima fase', true, {
      primary: startMatch, secondary: () => showScreen('home'), secondaryLabel: 'Sair',
    });
  }
  $('match-state').textContent = 'Partida encerrada';
  $('overlay-button').focus({ preventScroll: true });
  announce($('overlay-title').textContent + ' ' + $('overlay-text').textContent);
}

function isWatching(view) {
  return (mode === 'story' && story.spectating)
    || !view.players.some(player => player.id === 'human' && player.alive && !player.bot);
}

function refreshSpectatorSpeed(view) {
  const available = phase === 'playing' && isWatching(view)
    && (view.status === 'running' || view.status === 'paused');
  $('spectator-speed').hidden = !available;
  $('spectator-speed').disabled = !available;
}

function setPauseButton(paused) {
  $('pause-button').replaceChildren(document.createTextNode(paused ? '▶ ' : 'Ⅱ '));
  const label = document.createElement('span'); label.textContent = paused ? 'Continuar' : 'Pausar';
  $('pause-button').append(label);
  $('pause-button').setAttribute('aria-label', paused ? 'Continuar partida' : 'Pausar partida');
}

function togglePause() {
  if (screen !== 'game' || phase !== 'playing') return;
  match.pause(); clearControls();
  const view = match.snapshot();
  const paused = view.status === 'paused';
  setPauseButton(paused);
  $('match-state').textContent = paused ? 'Partida pausada' : view.suddenDeath ? 'Morte súbita' : view.players.some(player => player.id === 'human' && player.alive && !player.bot) ? 'Valendo' : 'Assistindo à disputa';
  if (paused) overlay('Pausa', 'A partida está esperando por você.', 'Continuar');
  else { $('arena-overlay').hidden = true; arena.focus({ preventScroll: true }); }
  announce(paused ? 'Partida pausada.' : 'Partida retomada.');
}

function finish(view) {
  if (mode === 'story') { finishStory(view); return; }
  phase = 'result'; clearControls(); $('pause-button').disabled = true;
  const winner = view.players.find(player => player.id === view.winner);
  const title = winner ? winner.id === 'human' ? 'Vitória!' : 'Fim de jogo' : 'Empate!';
  const copy = winner ? characterFor(winner.character).name + ' foi o último de pé.' : 'Ninguém levou esta partida.';
  overlay(title, copy, 'Jogar novamente', true);
  $('match-state').textContent = 'Partida encerrada';
  $('overlay-button').focus({ preventScroll: true });
  announce(title + ' ' + copy);
}

function openHelp() {
  helpPaused = screen === 'game' && phase === 'playing' && match.snapshot().status === 'running';
  if (helpPaused) togglePause();
  clearControls(); dialog.showModal();
}

$('home-button').addEventListener('click', () => showScreen('home'));
$('begin-button').addEventListener('click', () => chooseMode('quick'));
$('story-button').addEventListener('click', () => chooseMode('story'));
$('share-button').addEventListener('click', copyGameLink);
function restartFromEnding() {
  if (lastVictoryLoser && story?.spectating) retryStory();
  else chooseMode('story');
}

$('victory-restart').addEventListener('click', restartFromEnding);
$('victory-exit').addEventListener('click', () => showScreen('home'));
$('resume-story').addEventListener('click', () => {
  if (!savedStory) return;
  const restored = Story.restore(savedStory.serialize());
  chooseMode('story'); story = restored; selectCharacter(characterFor(story.character)); startMatch();
});
$('selection-back').addEventListener('click', () => showScreen('home'));
$('game-back').addEventListener('click', () => showScreen(mode === 'story' ? 'home' : 'selection'));
$('start-button').addEventListener('click', start);
$('pause-button').addEventListener('click', togglePause);
$('spectator-speed').addEventListener('change', () => {
  const speed = Number($('spectator-speed').value);
  if ($('spectator-speed').disabled || ![1, 1.5, 2, 2.5, 3].includes(speed)) return;
  spectatorSpeed = speed;
  announce(`Velocidade ao assistir: ${$('spectator-speed').selectedOptions[0].textContent}.`);
});
$('overlay-button').addEventListener('click', () => primaryAction ? primaryAction() : phase === 'result' ? startMatch() : togglePause());
$('overlay-secondary').addEventListener('click', () => secondaryAction?.());
$('overlay-watch').addEventListener('click', () => watchAction?.());
$('help-button').addEventListener('click', openHelp);
$('close-help').addEventListener('click', () => dialog.close());
$('help-ok').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (helpPaused && screen === 'game' && phase === 'playing') togglePause();
  helpPaused = false;
});
$('sound-button').addEventListener('click', () => {
  muted = !muted;
  $('sound-button').setAttribute('aria-pressed', String(!muted));
  $('sound-button').setAttribute('aria-label', muted ? 'Ativar som' : 'Silenciar som');
  $('sound-mark').setAttribute('d', muted ? 'm16 9 5 6m0-6-5 6' : 'M15 8c3 2 3 6 0 8m3-11c5 3 5 11 0 14');
  if (!muted) tone(660, 0.07);
});

function canControlPlayer() {
  if (screen !== 'game' || phase !== 'playing' || dialog.open || !match) return false;
  const view = match.snapshot();
  return view.status === 'running' && !(mode === 'story' && story.spectating)
    && view.players.some(player => player.id === 'human' && player.alive && !player.respawning);
}

let touchControls = null;
function clearControls() {
  pressed.clear();
  touchControls?.clear();
}

const movement = new Map([['arrowup', [0, -1]], ['w', [0, -1]], ['arrowright', [1, 0]], ['d', [1, 0]], ['arrowdown', [0, 1]], ['s', [0, 1]], ['arrowleft', [-1, 0]], ['a', [-1, 0]]]);
touchControls = bindTouchControls($('play-layout'), {
  canPlay: canControlPlayer,
  startDirection(id, key) {
    const direction = movement.get(key);
    pressed.set(`touch:${id}`, { direction, time: performance.now() });
    match.move('human', ...direction);
  },
  endDirection: id => pressed.delete(`touch:${id}`),
  placeBomb: () => match.placeBomb('human'),
});
const touchDevice = window.matchMedia('(any-pointer: coarse)');
function refreshTouchLayout() {
  clearControls();
  const hasTouch = touchDevice.matches || (navigator.maxTouchPoints ?? 0) > 0;
  document.body.classList.toggle('touch-device', hasTouch);
}
touchDevice.addEventListener('change', refreshTouchLayout);
window.addEventListener('resize', () => {
  clearControls();
  refreshTouchLayout();
});
window.addEventListener('orientationchange', () => {
  clearControls();
  refreshTouchLayout();
});
window.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch' && !document.body.classList.contains('touch-device')) {
    document.body.classList.add('touch-device');
  }
}, { passive: true });
refreshTouchLayout();

window.addEventListener('keydown', event => {
  if (dialog.open) return;
  if (event.target instanceof Element && event.target.closest('select')) return;
  const key = event.key.toLowerCase();
  const onButton = event.target instanceof Element && event.target.closest('button');
  if (screen === 'victory') {
    if (key === 'escape') { event.preventDefault(); showScreen('home'); }
    else if (key === 'enter' && !onButton) { event.preventDefault(); restartFromEnding(); }
    return;
  }
  if (screen === 'home') {
    if (key === 'enter' && !onButton) { event.preventDefault(); chooseMode('quick'); }
    return;
  }
  if (screen === 'selection') {
    if (key === 'escape') { event.preventDefault(); showScreen('home'); return; }
    if (key.startsWith('arrow') && movement.has(key)) {
      event.preventDefault();
      const columns = window.matchMedia('(max-width: 740px)').matches ? 3 : 4;
      const offsets = { arrowleft: -1, arrowright: 1, arrowup: -columns, arrowdown: columns };
      let next = CHARACTERS.indexOf(selected);
      do { next = (next + offsets[key] + CHARACTERS.length) % CHARACTERS.length; }
      while (mode === 'story' && BOSSES.includes(CHARACTERS[next].id));
      selectCharacter(CHARACTERS[next], true);
    } else if (key === 'enter' && (!onButton || event.target.closest('.character-card'))) { event.preventDefault(); start(); }
    return;
  }
  if (phase !== 'playing') return;
  if (key === ' ' && onButton) return;
  if (movement.has(key) || key === ' ' || key === 'p' || key === 'escape') event.preventDefault();
  if ((key === 'p' || key === 'escape') && !event.repeat) togglePause();
  if (match.snapshot().status !== 'running') return;
  if (mode === 'story' && story.spectating) return;
  if (movement.has(key) && !event.repeat) { pressed.set(key, { direction: movement.get(key), time: performance.now() }); match.move('human', ...movement.get(key)); }
  if (key === ' ' && !event.repeat) match.placeBomb('human');
});
window.addEventListener('keyup', event => pressed.delete(event.key.toLowerCase()));
function suspendOnBlur() { clearControls(); if (screen === 'game' && phase === 'playing' && match.snapshot().status === 'running') togglePause(); }
window.addEventListener('blur', suspendOnBlur);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspendOnBlur(); });
window.addEventListener('popstate', () => {
  const target = Object.keys(routes).find(name => '#' + routes[name] === location.hash) ?? 'home';
  showScreen(target, { record: false });
});

function updateGame(dt) {
  if (phase === 'countdown' && !dialog.open) {
    countdown -= dt;
    const number = Math.max(1, Math.ceil(countdown));
    if (number !== countdownNumber) { countdownNumber = number; overlay(String(number), 'A partida já vai começar.'); tone(440, 0.07); }
    if (countdown <= 0) {
      phase = 'playing'; $('arena-overlay').hidden = true; $('pause-button').disabled = false;
      $('match-state').textContent = 'Valendo'; tone(880, 0.12); announce('Valendo!');
    }
  }
  if (phase !== 'playing') return;
  const latest = [...pressed.values()].sort((a, b) => b.time - a.time)[0];
  if (latest && (mode !== 'story' || !story.spectating)) match.move('human', ...latest.direction);
  match.update(dt * (isWatching(match.snapshot()) ? spectatorSpeed : 1));
  const view = match.snapshot();
  for (const event of match.takeEvents()) {
    sound(event.type);
    if (event.type === 'eliminated') {
      const card = document.querySelector('[data-player="' + event.id + '"]');
      card?.classList.add('dead');
      if (card) card.querySelector('small').textContent = 'Eliminado';
      if (event.id === 'human') {
        const copy = mode === 'story' ? 'Aguardando a classificação do primeiro turno.' : 'Você caiu. Assista aos bots.';
        $('match-state').textContent = copy; announce(copy);
      }
    }
    if (event.type === 'life-lost' && event.id === 'human' && event.lives > 0) announce(`Você perdeu uma vida. Restam ${event.lives}.`);
    if (event.type === 'sudden-death-warning') { $('match-state').textContent = 'Morte súbita em 5 segundos!'; announce('Morte súbita em cinco segundos. Fuja dos blocos sinalizados.'); }
    if (event.type === 'sudden-death') { $('match-state').textContent = 'Morte súbita!'; announce('Morte súbita! Os blocos estão caindo.'); }
  }
  for (const player of view.players) {
    const card = document.querySelector('[data-player="' + player.id + '"]');
    if (card && player.alive) card.querySelector('small').textContent = `${player.bot ? 'Computador' : 'Você'} · ${player.lives} ${player.lives === 1 ? 'vida' : 'vidas'}${player.respawning ? ' · Voltando' : ''}`;
  }
  const seconds = Math.ceil(view.remaining);
  $('timer').textContent = view.suddenDeath ? 'SÚBITA' : String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  $('timer').classList.toggle('danger-timer', seconds <= 30);
  const human = view.players.find(player => player.id === 'human');
  $('bomb-stat').textContent = human?.capacity ?? '—'; $('range-stat').textContent = human?.range ?? '—'; $('speed-stat').textContent = human?.speed ?? '—';
  if (mode === 'story' && story.failedDuringMatch(view)) { failStory(); return; }
  if (view.status === 'finished') finish(view);
}

function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (screen === 'home') {
    if (!reducedMotion.matches) titleAnimation.update(dt);
    const scene = reducedMotion.matches ? undefined : titleAnimation.snapshot();
    drawTitleScene(titleCtx, reducedMotion.matches ? 0 : scene.time, scene);
  }
  else if (screen === 'victory' && victoryAnimation) renderVictory(dt);
  else if (screen === 'game' && match) {
    updateGame(dt);
    if (screen === 'game' && match) {
      const view = match.snapshot();
      refreshSpectatorSpeed(view);
      renderArena(ctx, view, now / 1000);
    }
  }
  touchControls?.refresh();
  requestAnimationFrame(frame);
}

selectCharacter(selected);
const initial = Object.keys(routes).find(name => '#' + routes[name] === location.hash) ?? 'home';
showScreen(initial, { replace: true, focus: false });
requestAnimationFrame(frame);
