import { Match, makeArena, seededRandom } from './engine.js';
import { CHARACTERS, characterFor } from './characters.js';
import { drawCharacter, renderArena } from './art.js';

const $ = id => document.getElementById(id);
const arena = $('arena');
const ctx = arena.getContext('2d');
const dialog = $('help-dialog');
const pressed = new Map();
let selected = CHARACTERS[0];
let phase = 'lobby';
let match;
let preview;
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

function paintAvatar(canvas, character, scale = 3) {
  const portrait = canvas.getContext('2d');
  portrait.clearRect(0, 0, canvas.width, canvas.height);
  portrait.imageSmoothingEnabled = false;
  drawCharacter(portrait, character, (canvas.width - 16 * scale) / 2, (canvas.height - 28 * scale) / 2, scale);
}

function makePreview() {
  const random = seededRandom(25);
  preview = new Match({ arena: makeArena(random), players: participantConfig(random), random }).snapshot();
  preview.items = [{ x: 3, y: 3, type: 'bomb' }, { x: 11, y: 3, type: 'range' }, { x: 3, y: 9, type: 'speed' }];
  preview.bombs = [{ x: 5, y: 3, fuse: 2 }, { x: 11, y: 9, fuse: 1.2 }];
  preview.flames = [{ x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 }, { x: 6, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }];
  for (const cell of [...preview.bombs, ...preview.flames]) preview.arena[cell.y][cell.x] = 'floor';
  drawParticipants(preview);
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
    const tag = document.createElement('small'); tag.textContent = player.bot ? 'BOT' : 'VOCÊ';
    copy.append(name, tag); card.append(avatar, copy); $('participants').append(card);
    paintAvatar(avatar, character);
  }
}

function selectCharacter(character) {
  if (phase === 'playing' || phase === 'countdown') return;
  selected = character;
  for (const button of $('roster').children) button.setAttribute('aria-pressed', String(button.dataset.character === selected.id));
  $('selected-name').textContent = character.name;
  $('selected-party').textContent = character.party;
  paintAvatar($('selected-avatar'), character, 4);
  phase = 'lobby';
  $('arena-overlay').hidden = true;
  $('match-state').innerHTML = '<span class="live-dot"></span> PRONTO PRA JOGAR';
  $('timer').textContent = '02:30';
  $('timer').classList.remove('danger-timer');
  $('start-label').textContent = 'BORA JOGAR';
  for (const [id, value] of [['bomb-stat', 1], ['range-stat', 2], ['speed-stat', 1]]) $(id).textContent = value;
  makePreview();
  announce(`${character.name}, ${character.party}, selecionado.`);
}

for (const character of CHARACTERS) {
  const button = document.createElement('button');
  button.className = 'character-card'; button.dataset.character = character.id;
  button.style.setProperty('--character-color', character.color);
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', `Selecionar ${character.fullName}, ${character.party}`);
  const avatar = document.createElement('canvas');
  avatar.width = 48; avatar.height = 84; avatar.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  const name = document.createElement('strong'); name.textContent = character.name;
  const party = document.createElement('small');
  const dot = document.createElement('span'); dot.className = 'party-dot';
  party.append(dot, document.createTextNode(character.party));
  copy.append(name, party); button.append(avatar, copy);
  button.addEventListener('click', () => selectCharacter(character));
  $('roster').append(button); paintAvatar(avatar, character);
}

function overlay(title, text, buttonText) {
  $('arena-overlay').hidden = false;
  $('arena-overlay').classList.toggle('countdown', phase === 'countdown');
  $('overlay-title').textContent = title;
  $('overlay-text').textContent = text;
  $('overlay-button').hidden = !buttonText;
  if (buttonText) $('overlay-button').textContent = buttonText;
}

function start() {
  pressed.clear();
  const random = seededRandom(++seed * 991);
  match = new Match({ arena: makeArena(random), players: participantConfig(random), random });
  phase = 'countdown'; countdown = 3; countdownNumber = 0;
  $('start-label').textContent = 'NOVA PARTIDA';
  $('pause-button').disabled = true;
  for (const button of $('roster').children) button.disabled = true;
  drawParticipants(match.snapshot());
  $('match-state').textContent = 'PREPARE-SE';
  $('timer').textContent = '02:30';
  $('timer').classList.remove('danger-timer');
  if (!muted) tone(440, 0.07);
  overlay('3', 'Escolha um caminho. Solte a bomba. Fuja.');
  announce('A partida começa em três segundos.');
  arena.focus({ preventScroll: true });
}

function togglePause() {
  if (phase !== 'playing') return;
  match.pause(); pressed.clear();
  const view = match.snapshot();
  const paused = view.status === 'paused';
  $('pause-button').textContent = paused ? '▶' : 'Ⅱ';
  $('pause-button').setAttribute('aria-label', paused ? 'Continuar partida' : 'Pausar partida');
  $('match-state').textContent = paused ? 'PARTIDA PAUSADA' : view.players[0].alive ? 'PARTIDA EM ANDAMENTO' : 'MODO ESPECTADOR';
  if (paused) overlay('PAUSA', 'Respira. A arena espera por você.', 'CONTINUAR');
  else { $('arena-overlay').hidden = true; arena.focus({ preventScroll: true }); }
  announce(paused ? 'Partida pausada.' : 'Partida retomada.');
}

function finish(view) {
  phase = 'result';
  pressed.clear();
  $('pause-button').disabled = true;
  for (const button of $('roster').children) button.disabled = false;
  const winner = view.players.find(player => player.id === view.winner);
  const title = winner ? winner.id === 'human' ? 'VOCÊ VENCEU!' : 'FIM DE JOGO' : 'EMPATE!';
  const copy = winner ? `${characterFor(winner.character).name} foi o último de pé. Bora mais uma?` : 'A arena não teve um vencedor. A próxima disputa é sua.';
  overlay(title, copy, 'JOGAR DE NOVO');
  $('match-state').textContent = winner ? 'DISPUTA ENCERRADA' : 'PARTIDA EMPATADA';
  announce(`${title} ${copy}`);
}

$('start-button').addEventListener('click', start);
$('pause-button').addEventListener('click', togglePause);
$('overlay-button').addEventListener('click', () => phase === 'result' ? start() : togglePause());
$('sound-button').addEventListener('click', () => {
  muted = !muted;
  $('sound-button').setAttribute('aria-pressed', String(!muted));
  $('sound-button').setAttribute('aria-label', muted ? 'Ativar som' : 'Silenciar som');
  $('sound-mark').setAttribute('d', muted ? 'm16 9 5 6m0-6-5 6' : 'M15 8c3 2 3 6 0 8m3-11c5 3 5 11 0 14');
  if (!muted) tone(660, 0.07);
});
$('help-button').addEventListener('click', () => {
  helpPaused = phase === 'playing' && match.snapshot().status === 'running';
  if (helpPaused) togglePause();
  dialog.showModal();
});
const closeHelp = () => dialog.close();
$('close-help').addEventListener('click', closeHelp);
$('help-ok').addEventListener('click', closeHelp);
dialog.addEventListener('close', () => { if (helpPaused) togglePause(); helpPaused = false; });

const movement = new Map([['arrowup', [0, -1]], ['w', [0, -1]], ['arrowright', [1, 0]], ['d', [1, 0]], ['arrowdown', [0, 1]], ['s', [0, 1]], ['arrowleft', [-1, 0]], ['a', [-1, 0]]]);
window.addEventListener('keydown', event => {
  if (dialog.open || phase !== 'playing') return;
  const key = event.key.toLowerCase();
  if (movement.has(key) || key === ' ' || key === 'p' || key === 'escape') event.preventDefault();
  if ((key === 'p' || key === 'escape') && !event.repeat) togglePause();
  if (match.snapshot().status !== 'running') return;
  if (movement.has(key) && !event.repeat) {
    pressed.set(key, performance.now());
    match.move('human', ...movement.get(key));
  }
  if (key === ' ' && !event.repeat) match.placeBomb('human');
});
window.addEventListener('keyup', event => pressed.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { pressed.clear(); if (phase === 'playing' && match.snapshot().status === 'running') togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'playing' && match.snapshot().status === 'running') togglePause(); });

function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  const time = now / 1000;
  if (phase === 'countdown' && !dialog.open) {
    countdown -= dt;
    const number = Math.max(1, Math.ceil(countdown));
    if (number !== countdownNumber) { countdownNumber = number; overlay(String(number), 'Escolha um caminho. Solte a bomba. Fuja.'); tone(440, 0.07); }
    if (countdown <= 0) {
      phase = 'playing'; $('arena-overlay').hidden = true;
      $('pause-button').disabled = false; $('pause-button').textContent = 'Ⅱ';
      $('pause-button').setAttribute('aria-label', 'Pausar partida');
      $('match-state').textContent = 'PARTIDA EM ANDAMENTO';
      tone(880, 0.12); announce('Valendo!');
    }
  }
  if (phase === 'playing') {
    const latest = [...pressed].sort((a, b) => b[1] - a[1])[0];
    if (latest) match.move('human', ...movement.get(latest[0]));
    match.update(dt);
    const view = match.snapshot();
    for (const event of match.takeEvents()) {
      sound(event.type);
      if (event.type === 'eliminated') {
        const card = document.querySelector(`[data-player="${event.id}"]`);
        card?.classList.add('dead');
        if (card) card.querySelector('small').textContent = 'ELIMINADO';
        if (event.id === 'human') { $('match-state').textContent = 'MODO ESPECTADOR'; announce('Você foi eliminado. Assista à partida ou clique em Nova partida.'); }
      }
    }
    const seconds = Math.ceil(view.remaining);
    $('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    $('timer').classList.toggle('danger-timer', seconds <= 30);
    const human = view.players[0];
    $('bomb-stat').textContent = human.capacity;
    $('range-stat').textContent = human.range;
    $('speed-stat').textContent = human.speed;
    if (view.status === 'finished') finish(view);
  }
  renderArena(ctx, phase === 'lobby' ? preview : match.snapshot(), time, { lobby: phase === 'lobby' });
  requestAnimationFrame(frame);
}

selectCharacter(selected);
requestAnimationFrame(frame);
