import { Match, makeArena, seededRandom } from './engine.js';
import { CHARACTERS, characterFor } from './characters.js';
import { drawCharacter, renderArena } from './art.js';
import { drawTitleScene } from './title-art.js';

const $ = id => document.getElementById(id);
const arena = $('arena');
const ctx = arena.getContext('2d');
const titleCtx = $('title-scene').getContext('2d');
const dialog = $('help-dialog');
const pressed = new Map();
const routes = { home: 'inicio', selection: 'personagens', game: 'partida' };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let screen = 'home';
let selected = CHARACTERS[0];
let phase = 'idle';
let match = null;
let countdown = 3;
let countdownNumber = 0;
let muted = true;
let audio;
let helpPaused = false;
let previousTime = performance.now();
let seed = 2026;

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
  screen = target;
  pressed.clear();
  if (target !== 'game') { phase = 'idle'; match = null; helpPaused = false; }
  document.body.dataset.screen = target;
  for (const section of document.querySelectorAll('main > [data-screen]')) section.hidden = section.dataset.screen !== target;
  for (const step of document.querySelectorAll('[data-step]')) {
    if (step.dataset.step === target) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  }
  const hints = { home: 'Pressione Enter para começar', selection: 'Escolha e confirme seu personagem', game: 'A sua bomba também pega você' };
  $('screen-footer-hint').textContent = hints[target];
  const hash = '#' + routes[target];
  if (record || guarded) {
    const method = replace || guarded ? 'replaceState' : 'pushState';
    if (location.hash !== hash || replace || guarded) history[method]({ screen: target }, '', hash);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus) {
    const focusTarget = target === 'game' ? arena : $(target === 'home' ? 'home-title' : 'selection-title');
    focusTarget.focus({ preventScroll: true });
  }
  announce(target === 'home' ? 'Tela de início.' : target === 'selection' ? 'Seleção de personagens. Use as setas e Enter para jogar.' : 'Tela da partida.');
}

function paintAvatar(canvas, character, scale = 3) {
  const portrait = canvas.getContext('2d');
  portrait.clearRect(0, 0, canvas.width, canvas.height);
  portrait.imageSmoothingEnabled = false;
  drawCharacter(portrait, character, (canvas.width - 16 * scale) / 2, (canvas.height - 28 * scale) / 2, scale);
}

function selectCharacter(character, focus = false) {
  selected = character;
  for (const button of $('roster').children) {
    const active = button.dataset.character === selected.id;
    button.setAttribute('aria-pressed', String(active));
    button.tabIndex = active ? 0 : -1;
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
  for (const player of view.players) {
    const character = characterFor(player.character);
    const card = document.createElement('div');
    card.className = 'participant'; card.dataset.player = player.id;
    const avatar = document.createElement('canvas');
    avatar.width = 48; avatar.height = 84; avatar.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = character.name;
    const tag = document.createElement('small'); tag.textContent = player.bot ? 'Bot' : 'Você';
    copy.append(name, tag); card.append(avatar, copy); $('participants').append(card);
    paintAvatar(avatar, character);
  }
}

function overlay(title, text, buttonText, allowSelection = false) {
  $('arena-overlay').hidden = false;
  $('arena-overlay').classList.toggle('countdown', phase === 'countdown');
  $('overlay-title').textContent = title;
  $('overlay-text').textContent = text;
  $('overlay-button').hidden = !buttonText;
  $('overlay-secondary').hidden = !allowSelection;
  if (buttonText) $('overlay-button').textContent = buttonText;
}

function start() {
  const random = seededRandom(++seed * 991);
  match = new Match({ arena: makeArena(random), players: participantConfig(random), random });
  phase = 'countdown'; countdown = 3; countdownNumber = 0;
  showScreen('game');
  drawParticipants(match.snapshot());
  $('match-state').textContent = 'Prepare-se';
  $('timer').textContent = '02:30'; $('timer').classList.remove('danger-timer');
  $('pause-button').disabled = true;
  setPauseButton(false);
  for (const [id, value] of [['bomb-stat', 1], ['range-stat', 2], ['speed-stat', 1]]) $(id).textContent = value;
  overlay('3', 'A partida já vai começar.');
  announce('A partida começa em três segundos.');
}

function setPauseButton(paused) {
  $('pause-button').replaceChildren(document.createTextNode(paused ? '▶ ' : 'Ⅱ '));
  const label = document.createElement('span'); label.textContent = paused ? 'Continuar' : 'Pausar';
  $('pause-button').append(label);
  $('pause-button').setAttribute('aria-label', paused ? 'Continuar partida' : 'Pausar partida');
}

function togglePause() {
  if (screen !== 'game' || phase !== 'playing') return;
  match.pause(); pressed.clear();
  const view = match.snapshot();
  const paused = view.status === 'paused';
  setPauseButton(paused);
  $('match-state').textContent = paused ? 'Partida pausada' : view.players[0].alive ? 'Valendo' : 'Você caiu. Assista aos bots.';
  if (paused) overlay('Pausa', 'A partida está esperando por você.', 'Continuar');
  else { $('arena-overlay').hidden = true; arena.focus({ preventScroll: true }); }
  announce(paused ? 'Partida pausada.' : 'Partida retomada.');
}

function finish(view) {
  phase = 'result'; pressed.clear(); $('pause-button').disabled = true;
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
  pressed.clear(); dialog.showModal();
}

$('home-button').addEventListener('click', () => showScreen('home'));
$('begin-button').addEventListener('click', () => showScreen('selection'));
$('selection-back').addEventListener('click', () => showScreen('home'));
$('game-back').addEventListener('click', () => showScreen('selection'));
$('start-button').addEventListener('click', start);
$('pause-button').addEventListener('click', togglePause);
$('overlay-button').addEventListener('click', () => phase === 'result' ? start() : togglePause());
$('overlay-secondary').addEventListener('click', () => showScreen('selection'));
$('help-button').addEventListener('click', openHelp);
$('home-help').addEventListener('click', openHelp);
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

const movement = new Map([['arrowup', [0, -1]], ['w', [0, -1]], ['arrowright', [1, 0]], ['d', [1, 0]], ['arrowdown', [0, 1]], ['s', [0, 1]], ['arrowleft', [-1, 0]], ['a', [-1, 0]]]);
window.addEventListener('keydown', event => {
  if (dialog.open) return;
  const key = event.key.toLowerCase();
  const onButton = event.target instanceof Element && event.target.closest('button');
  if (screen === 'home') {
    if (key === 'enter' && (!onButton || event.target === $('begin-button'))) { event.preventDefault(); showScreen('selection'); }
    return;
  }
  if (screen === 'selection') {
    if (key === 'escape') { event.preventDefault(); showScreen('home'); return; }
    if (key.startsWith('arrow') && movement.has(key)) {
      event.preventDefault();
      const columns = window.matchMedia('(max-width: 740px)').matches ? 3 : 4;
      const offsets = { arrowleft: -1, arrowright: 1, arrowup: -columns, arrowdown: columns };
      const next = (CHARACTERS.indexOf(selected) + offsets[key] + CHARACTERS.length) % CHARACTERS.length;
      selectCharacter(CHARACTERS[next], true);
    } else if (key === 'enter' && (!onButton || event.target.closest('.character-card'))) { event.preventDefault(); start(); }
    return;
  }
  if (phase !== 'playing') return;
  if (key === ' ' && onButton) return;
  if (movement.has(key) || key === ' ' || key === 'p' || key === 'escape') event.preventDefault();
  if ((key === 'p' || key === 'escape') && !event.repeat) togglePause();
  if (match.snapshot().status !== 'running') return;
  if (movement.has(key) && !event.repeat) { pressed.set(key, performance.now()); match.move('human', ...movement.get(key)); }
  if (key === ' ' && !event.repeat) match.placeBomb('human');
});
window.addEventListener('keyup', event => pressed.delete(event.key.toLowerCase()));
function suspendOnBlur() { pressed.clear(); if (screen === 'game' && phase === 'playing' && match.snapshot().status === 'running') togglePause(); }
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
  const latest = [...pressed].sort((a, b) => b[1] - a[1])[0];
  if (latest) match.move('human', ...movement.get(latest[0]));
  match.update(dt);
  const view = match.snapshot();
  for (const event of match.takeEvents()) {
    sound(event.type);
    if (event.type === 'eliminated') {
      const card = document.querySelector('[data-player="' + event.id + '"]');
      card?.classList.add('dead');
      if (card) card.querySelector('small').textContent = 'Eliminado';
      if (event.id === 'human') { $('match-state').textContent = 'Você caiu. Assista aos bots.'; announce('Você foi eliminado. Assista aos bots ou volte para a seleção.'); }
    }
  }
  const seconds = Math.ceil(view.remaining);
  $('timer').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  $('timer').classList.toggle('danger-timer', seconds <= 30);
  const human = view.players[0];
  $('bomb-stat').textContent = human.capacity; $('range-stat').textContent = human.range; $('speed-stat').textContent = human.speed;
  if (view.status === 'finished') finish(view);
}

function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (screen === 'home') drawTitleScene(titleCtx, reducedMotion.matches ? 0 : now / 1000);
  else if (screen === 'game' && match) { updateGame(dt); renderArena(ctx, match.snapshot(), now / 1000); }
  requestAnimationFrame(frame);
}

selectCharacter(selected);
const initial = Object.keys(routes).find(name => '#' + routes[name] === location.hash) ?? 'home';
showScreen(initial, { replace: true, focus: false });
requestAnimationFrame(frame);
