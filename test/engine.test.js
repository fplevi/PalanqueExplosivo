import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, makeArena, seededRandom } from '../src/engine.js';

const emptyArena = () => Array.from({ length: 7 }, (_, y) =>
  Array.from({ length: 7 }, (_, x) => x === 0 || y === 0 || x === 6 || y === 6 ? 'wall' : 'floor'));
const players = () => [{ id: 'human', x: 1, y: 1 }, { id: 'bot', x: 5, y: 5 }];

test('arena keeps the four starting corners and their escape routes free', () => {
  const arena = makeArena(() => 0);
  for (const [x, y] of [[1,1], [2,1], [1,2], [13,1], [12,1], [13,2], [1,11], [2,11], [1,10], [13,11], [12,11], [13,10]]) {
    assert.equal(arena[y][x], 'floor');
  }
  assert.equal(arena[2][2], 'wall');
});

test('movement respects walls and a participant can leave but cannot reenter a placed bomb', () => {
  const match = new Match({ arena: emptyArena(), players: players() });
  assert.equal(match.move('human', -1, 0), false);
  assert.equal(match.placeBomb('human'), true);
  assert.equal(match.move('human', 1, 0), true);
  match.update(0.3);
  assert.equal(match.move('human', -1, 0), false);
});

test('blast stops at walls and the first destructible block', () => {
  const arena = emptyArena();
  arena[3][4] = 'block';
  arena[2][3] = 'wall';
  const match = new Match({ arena, players: [{ id: 'human', x: 3, y: 3, range: 4 }, { id: 'bot', x: 5, y: 5 }], random: () => 1 });
  match.placeBomb('human');
  match.update(2.01);
  const view = match.snapshot();
  assert.equal(view.arena[3][4], 'floor');
  const cells = view.flames.map(flame => `${flame.x},${flame.y}`);
  assert.ok(cells.includes('4,3'));
  assert.ok(!cells.includes('5,3'));
  assert.ok(!cells.includes('3,2'));
  assert.ok(!cells.includes('3,1'));
});

test('a collected improvement increases capacity and disappears from the arena', () => {
  const match = new Match({ arena: emptyArena(), players: players(), items: [{ x: 2, y: 1, type: 'bomb' }] });
  match.move('human', 1, 0);
  const view = match.snapshot();
  assert.equal(view.players[0].capacity, 2);
  assert.equal(view.items.length, 0);
});

test('another bomb detonates in a chain before its own fuse finishes, eliminating both participants together', () => {
  const match = new Match({ arena: emptyArena(), players: [{ id: 'a', x: 1, y: 1 }, { id: 'b', x: 3, y: 1 }] });
  match.placeBomb('a'); match.update(0.6); match.placeBomb('b'); match.update(1.41);
  const view = match.snapshot();
  assert.equal(view.bombs.length, 0);
  assert.equal(view.status, 'finished'); assert.equal(view.winner, null);
  assert.ok(view.players.every(player => !player.alive));
  assert.ok(view.flames.some(flame => flame.x === 3 && flame.y === 3));
});

test('pausing freezes the bomb fuse and timer and resuming allows the explosion', () => {
  const match = new Match({ arena: emptyArena(), players: players() });
  match.placeBomb('human'); match.pause(); match.update(8);
  assert.equal(match.snapshot().remaining, 150); assert.equal(match.snapshot().bombs[0].fuse, 2);
  assert.equal(match.move('human', 1, 0), false); assert.equal(match.placeBomb('bot'), false);
  match.pause(); match.update(2.01);
  assert.equal(match.snapshot().winner, 'bot');
});

test('time expiring starts Morte súbita and a falling block eliminates the participant below it', () => {
  const match = new Match({ arena: emptyArena(), players: [{ id: 'human', x: 1, y: 1 }, { id: 'bot', x: 3, y: 3 }], duration: 1 });
  match.update(1.1);
  const view = match.snapshot();
  assert.equal(view.suddenDeath, true);
  assert.equal(view.arena[1][1], 'crushed');
  assert.equal(view.status, 'finished'); assert.equal(view.winner, 'bot');
  assert.equal(match.move('human', 1, 0), false);
});

test('Modo história loses three lives before elimination, with protected respawns in the same arena', () => {
  const match = new Match({ arena: emptyArena(), players: players(), lives: 3 });
  match.placeBomb('human'); match.update(2.1);
  let human = match.snapshot().players[0];
  assert.equal(human.lives, 2); assert.equal(human.alive, true);
  assert.ok(human.invulnerable > 0);
  assert.deepEqual(match.snapshot().eliminationGroups, []);
  match.placeBomb('human'); match.update(2.2);
  human = match.snapshot().players[0];
  assert.equal(human.lives, 1); assert.equal(human.alive, true);
  match.placeBomb('human'); match.update(2.2);
  assert.equal(match.snapshot().players[0].alive, false);
  assert.equal(match.snapshot().winner, 'bot');
  assert.deepEqual(match.snapshot().eliminationGroups, [['human']]);
});

test('falling blocks ignore temporary protection and remain indestructible to bombs', () => {
  const match = new Match({ arena: emptyArena(), players: [{ id: 'human', x: 1, y: 1, invulnerable: 50 }, { id: 'bot', x: 3, y: 3 }], lives: 3, duration: 1 });
  match.update(1.01);
  const view = match.snapshot();
  assert.equal(view.players[0].lives, 2);
  assert.equal(view.players[0].alive, true);
  assert.notDeepEqual([view.players[0].x, view.players[0].y], [1, 1]);
  assert.equal(view.arena[1][1], 'crushed');
  assert.equal(match.move('human', -1, -1), false);
  assert.ok(!match.blastCells({ x: 2, y: 1, range: 5 }).some(cell => cell.x === 1 && cell.y === 1));
});

test('Morte súbita keeps the match running until elimination and closes the arena from the border inward', () => {
  const match = new Match({ arena: emptyArena(), players: [{ id: 'human', x: 2, y: 2 }, { id: 'bot', x: 3, y: 3 }], duration: 1 });
  match.update(1.01);
  assert.equal(match.snapshot().status, 'running');
  assert.deepEqual(match.snapshot().nextBlock, { x: 2, y: 1, in: match.snapshot().nextBlock.in });
  match.update(0.5);
  assert.equal(match.snapshot().arena[1][2], 'crushed');
  assert.equal(match.snapshot().arena[2][2], 'floor');
  match.update(30);
  assert.equal(match.snapshot().status, 'finished');
});

test('eliminations in one explosion are recorded as a tied group', () => {
  const match = new Match({ arena: emptyArena(), players: [{ id: 'human', x: 1, y: 1 }, { id: 'a', x: 3, y: 1 }, { id: 'b', x: 5, y: 5 }] });
  match.placeBomb('human'); match.update(2.01);
  assert.deepEqual(match.snapshot().eliminationGroups, [['human', 'a']]);
  assert.equal(match.snapshot().winner, 'b');
});

test('a crushed participant is eliminated when the only remaining floor is occupied, preserving elimination order', () => {
  const arena = emptyArena().map(row => row.map(() => 'wall'));
  arena[1][1] = 'floor'; arena[1][2] = 'floor';
  const match = new Match({ arena, players: [{ id: 'human', x: 1, y: 1 }, { id: 'bot', x: 2, y: 1 }], lives: 3, duration: 1 });
  match.update(1.01);
  const view = match.snapshot();
  assert.equal(view.players[0].alive, false);
  assert.equal(view.players[1].lives, 3);
  assert.equal(view.winner, 'bot');
  assert.deepEqual(view.eliminationGroups, [['human']]);
});

test('a revealed improvement stays hidden during the blast and is collected afterward', () => {
  const arena = emptyArena(); arena[1][3] = 'block';
  const match = new Match({ arena, players: players(), random: () => 0.02 });
  match.placeBomb('human'); match.move('human', 1, 0); match.update(0.2); match.move('human', 0, 1);
  match.update(1.81);
  const hidden = match.snapshot().items.find(item => item.x === 3 && item.y === 1);
  assert.ok(hidden.revealAt > match.snapshot().elapsed);
  match.update(0.6); match.move('human', 1, 0); match.update(0.2); match.move('human', 0, -1);
  assert.equal(match.snapshot().players[0].capacity, 2);
  assert.equal(match.snapshot().items.some(item => item.x === 3 && item.y === 1), false);
});

test('bots use the same rules, open paths and survive their first bombs across multiple arenas', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const random = seededRandom(seed);
    const match = new Match({ arena: makeArena(random), random });
    for (let tick = 0; tick < 190; tick++) match.update(1 / 60);
    assert.ok(match.snapshot().players.filter(player => player.bot).every(bot => bot.alive), `Bots should escape early bombs in arena ${seed}`);
    assert.ok(match.takeEvents().some(event => event.type === 'explosion'), `Bots should place bombs in arena ${seed}`);
  }
});
