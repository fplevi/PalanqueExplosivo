import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../src/engine.js';

const emptyArena = (size = 9) => Array.from({ length: size }, (_, y) =>
  Array.from({ length: size }, (_, x) => x === 0 || y === 0 || x === size - 1 || y === size - 1 ? 'wall' : 'floor'));

test('collecting chute grants one persistent ability and leaves repeated items for other participants', () => {
  const match = new Match({ arena: emptyArena(), players: [
    { id: 'human', x: 1, y: 1 }, { id: 'other', x: 3, y: 2 },
  ], items: [{ type: 'kick', x: 2, y: 1 }, { type: 'kick', x: 3, y: 1 }] });
  match.move('human', 1, 0);
  assert.equal(match.snapshot().players[0].kick, true);
  match.update(0.2);
  match.move('human', 1, 0);
  assert.deepEqual(match.snapshot().items.map(item => [item.type, item.x, item.y]), [['kick', 3, 1]]);
  match.move('other', 0, -1);
  assert.equal(match.snapshot().players[1].kick, true);
  assert.equal(match.snapshot().items.length, 0);
  assert.equal(match.takeEvents().filter(event => event.type === 'pickup').length, 2);
});

function kickMatch({ arena = emptyArena(), extraPlayers = [] } = {}) {
  const match = new Match({ arena, players: [
    { id: 'kicker', x: 2, y: 3, kick: true },
    { id: 'owner', x: 3, y: 3 }, ...extraPlayers,
  ], random: () => 1 });
  match.placeBomb('owner');
  match.move('owner', 0, 1);
  match.update(0.2);
  return match;
}

test('contact starts an automatic chute at eight cells per second without resetting the fuse', () => {
  const match = kickMatch();
  match.move('kicker', 1, 0);
  match.update(0.125);
  let view = match.snapshot();
  assert.deepEqual([view.bombs[0].x, view.bombs[0].y], [4, 3]);
  assert.ok(Math.abs(view.bombs[0].fuse - 1.675) < 0.000001);
  assert.equal(match.move('kicker', 1, 0), true, 'The vacated cell is walkable');
  match.update(0.125);
  view = match.snapshot();
  assert.deepEqual([view.bombs[0].x, view.bombs[0].y], [5, 3]);
  assert.equal(match.takeEvents().filter(event => event.type === 'kick').length, 1);
});

for (const obstacle of ['wall', 'block', 'bomb', 'player']) {
  test(`a bomba chutada stops before a ${obstacle} and can be kicked again after the path clears`, () => {
    const arena = emptyArena();
    if (obstacle === 'wall' || obstacle === 'block') arena[3][6] = obstacle;
    const extraPlayers = obstacle === 'player' || obstacle === 'bomb' ? [{ id: 'obstacle', x: 6, y: 3 }] : [];
    const match = kickMatch({ arena, extraPlayers });
    if (obstacle === 'bomb') {
      match.placeBomb('obstacle');
      match.move('obstacle', 0, 1);
    }
    match.move('kicker', 1, 0);
    match.update(0.5);
    assert.deepEqual([match.snapshot().bombs[0].x, match.snapshot().bombs[0].y], [5, 3]);
    match.move('kicker', 1, 0); match.update(0.2);
    match.move('kicker', 1, 0); match.update(0.2);
    match.move('kicker', 0, 1); match.update(0.2);
    match.move('kicker', 1, 0); match.update(0.2);
    match.move('kicker', 0, -1); match.update(0.125);
    assert.deepEqual([match.snapshot().bombs[0].x, match.snapshot().bombs[0].y], [5, 2], 'A stopped bomb accepts a new direction');
  });
}

test('a rare chute appears below two percent and waits for the explosion to clear', () => {
  for (const [roll, expected] of [[0.019, 'kick'], [0.02, 'bomb']]) {
    const arena = emptyArena(); arena[3][4] = 'block';
    const match = new Match({ arena, lives: 3, players: [{ id: 'human', x: 3, y: 3 }, { id: 'other', x: 7, y: 7 }], random: () => roll });
    match.placeBomb('human'); match.update(2.01);
    let view = match.snapshot();
    assert.equal(view.items[0]?.type, expected);
    assert.ok(view.items[0].revealAt > view.elapsed);
    match.update(0.6);
    view = match.snapshot();
    assert.ok(view.items[0].revealAt <= view.elapsed);
  }
});

test('the chute drop budget counts destroyed items and never exceeds the initial participants', () => {
  for (const count of [2, 4]) {
    const arena = emptyArena();
    for (const [x, y] of [[4, 3], [5, 3], [2, 3], [1, 3], [3, 2], [3, 1], [3, 4], [3, 5]]) arena[y][x] = 'block';
    const players = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, x: i ? 7 : 3, y: i ? 7 : 3, invulnerable: 100, range: 6 }));
    const match = new Match({ arena, players, random: () => 0 });
    match.placeBomb('p0'); match.update(2.6);
    assert.equal(match.snapshot().items.filter(item => item.type === 'kick').length, count);
    match.placeBomb('p0'); match.update(2.6);
    assert.equal(match.snapshot().items.length, 0, 'Destroyed rare items do not replenish the budget');
    assert.equal(match.snapshot().arena[3][5], 'floor', 'A second wave of blocks was destroyed');
  }
});

test('chute survives a lost life but starts disabled in a new partida', () => {
  const match = new Match({ arena: emptyArena(), lives: 3, players: [{ id: 'human', x: 1, y: 1 }, { id: 'other', x: 7, y: 7 }], items: [{ type: 'kick', x: 2, y: 1 }] });
  match.move('human', 1, 0); match.placeBomb('human'); match.update(2.1);
  assert.equal(match.snapshot().players[0].lives, 2);
  assert.equal(match.snapshot().players[0].kick, true);
  const nextMatch = new Match({ arena: emptyArena() });
  assert.ok(nextMatch.snapshot().players.every(player => player.kick === false));
});

test('a bomba chutada entering an existing explosion detonates immediately in a chain', () => {
  const match = new Match({ arena: emptyArena(), players: [
    { id: 'source', x: 5, y: 3, range: 1, invulnerable: 100 },
    { id: 'owner', x: 3, y: 3, range: 1, invulnerable: 100 },
    { id: 'kicker', x: 2, y: 3, kick: true, invulnerable: 100 },
  ] });
  match.placeBomb('source'); match.move('source', 0, 1); match.update(1.5);
  match.placeBomb('owner'); match.move('owner', 0, 1); match.update(0.51);
  assert.equal(match.snapshot().bombs.length, 1);
  match.move('kicker', 1, 0); match.update(0.125);
  assert.equal(match.snapshot().bombs.length, 0);
  assert.equal(match.takeEvents().filter(event => event.type === 'explosion').length, 2);
});

test('a computer with chute can clear an adjacent bomb even when its escape route is blocked', () => {
  const arena = emptyArena();
  for (const [x, y] of [[1, 3], [2, 2], [2, 4]]) arena[y][x] = 'wall';
  const match = new Match({ arena, players: [
    { id: 'bot', x: 2, y: 3, bot: true, kick: true, invulnerable: 100 },
    { id: 'owner', x: 3, y: 3, invulnerable: 100 },
  ], random: () => 1 });
  match.placeBomb('owner'); match.move('owner', 0, 1); match.update(0.2);
  assert.ok(match.snapshot().bombs[0].x >= 4);
  assert.ok(match.takeEvents().some(event => event.type === 'kick' && event.id === 'bot'));
});

test('pausing freezes a bomba chutada and its fuse, and updates are independent of frame size', () => {
  const paused = kickMatch();
  paused.move('kicker', 1, 0); paused.update(0.06); paused.pause();
  const before = paused.snapshot();
  paused.update(10);
  assert.deepEqual(paused.snapshot(), before);
  paused.pause(); paused.update(0.065);
  assert.equal(paused.snapshot().bombs[0].x, 4);

  const slow = kickMatch(), fast = kickMatch();
  for (const match of [slow, fast]) match.move('kicker', 1, 0);
  slow.update(0.5);
  for (let i = 0; i < 30; i++) fast.update(1 / 60);
  assert.equal(slow.snapshot().bombs[0].x, 7);
  assert.equal(fast.snapshot().bombs[0].x, 7);
  assert.ok(Math.abs(slow.snapshot().bombs[0].fuse - fast.snapshot().bombs[0].fuse) < 0.000001);
});

for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
  test(`chute follows the contact direction (${dx}, ${dy})`, () => {
    const match = new Match({ arena: emptyArena(), players: [
      { id: 'kicker', x: 4 - dx, y: 4 - dy, kick: true },
      { id: 'owner', x: 4, y: 4 },
    ] });
    match.placeBomb('owner'); match.move('owner', dy, -dx); match.update(0.2);
    match.move('kicker', dx, dy); match.update(0.125);
    assert.deepEqual([match.snapshot().bombs[0].x, match.snapshot().bombs[0].y], [4 + dx, 4 + dy]);
  });
}

test('a blocked chute neither starts moving nor resets the fuse and a participant without it cannot kick', () => {
  const arena = emptyArena(); arena[3][4] = 'block';
  const match = kickMatch({ arena });
  match.move('kicker', 1, 0); match.update(0.2);
  assert.deepEqual([match.snapshot().bombs[0].x, match.snapshot().bombs[0].y], [3, 3]);
  assert.ok(!match.takeEvents().some(event => event.type === 'kick'));
  const noKick = new Match({ arena: emptyArena(), players: [{ id: 'human', x: 2, y: 3 }, { id: 'owner', x: 3, y: 3 }] });
  noKick.placeBomb('owner'); noKick.move('owner', 0, 1); noKick.update(0.2);
  assert.equal(noKick.move('human', 1, 0), false);
  noKick.update(0.5);
  assert.equal(noKick.snapshot().bombs[0].x, 3);
});

test('a bomba chutada explodes on its reached square when the original fuse expires mid-slide', () => {
  const match = kickMatch(); match.update(1.6);
  match.move('kicker', 1, 0); match.update(0.21);
  assert.equal(match.snapshot().bombs.length, 0);
  assert.ok(match.takeEvents().some(event => event.type === 'explosion' && event.x === 4 && event.y === 3));
});

test('morte súbita blocks a bomba chutada and crushes it when its square falls', () => {
  const match = new Match({ arena: emptyArena(), duration: 0.25, players: [
    { id: 'kicker', x: 4, y: 1, kick: true, invulnerable: 100 },
    { id: 'owner', x: 3, y: 1, invulnerable: 100 },
  ] });
  match.placeBomb('owner'); match.move('owner', 0, 1); match.update(0.2);
  match.move('kicker', -1, 0); match.update(0.4);
  assert.equal(match.snapshot().arena[1][1], 'crushed');
  assert.equal(match.snapshot().bombs[0].x, 2);
  match.update(0.2);
  assert.equal(match.snapshot().bombs.length, 0);
  assert.equal(match.snapshot().arena[1][2], 'crushed');
});

test('two bombas chutadas cannot slide into the same square at the same time', () => {
  const match = new Match({ arena: emptyArena(), players: [
    { id: 'a', x: 2, y: 4, kick: true }, { id: 'b', x: 4, y: 2, kick: true },
    { id: 'ownerA', x: 3, y: 4 }, { id: 'ownerB', x: 4, y: 3 },
  ] });
  match.placeBomb('ownerA'); match.move('ownerA', 0, 1);
  match.placeBomb('ownerB'); match.move('ownerB', 1, 0); match.update(0.2);
  match.move('a', 1, 0); match.move('b', 0, 1); match.update(0.1);
  assert.equal(match.takeEvents().filter(event => event.type === 'kick').length, 1, 'Only one bomb can reserve the shared destination');
  assert.equal(match.snapshot().bombs[1].slideProgress ?? 0, 0);
  match.update(0.15);
  match.move('b', 0, 1); match.update(0.125);
  assert.deepEqual([match.snapshot().bombs[1].x, match.snapshot().bombs[1].y], [4, 4], 'The second bomb can be kicked once the path is free');
});
