import test from 'node:test';
import assert from 'node:assert/strict';
import { Story, storyCharacters } from '../src/story.js';
import { Match, makeArena, seededRandom } from '../src/engine.js';

function result(story, eliminated, survivor) {
  return { players: story.participants().map(player => ({ ...player, alive: player.id === survivor })),
    eliminationGroups: eliminated, winner: survivor ?? null };
}

function semifinal() {
  const story = new Story('renan', () => 0.5);
  for (let index = 0; index < 9; index++) {
    const opponent = story.participants().find(player => player.bot).id;
    assert.equal(story.resolve(result(story, [[opponent]], 'human')).kind, 'advance');
  }
  return story;
}

test('Modo história offers ten playable characters and nine unique duels before the two bosses', () => {
  assert.equal(storyCharacters().length, 10);
  assert.throws(() => new Story('lula'));
  assert.throws(() => new Story('flavio'));
  const story = new Story('renan', () => 0.5);
  assert.equal(story.totalStages, 11);
  assert.equal(new Set(story.order).size, 9);
  assert.ok(!story.order.some(id => ['renan', 'lula', 'flavio'].includes(id)));
  assert.deepEqual(semifinal().participants().map(player => player.character), ['renan', 'lula', 'flavio']);
});

test('eliminating Flávio first produces a Segundo turno against Lula, and reversing it produces Flávio', () => {
  for (const [first, second] of [['flavio', 'lula'], ['lula', 'flavio']]) {
    const story = semifinal();
    assert.equal(story.resolve(result(story, [[first], [second]], 'human')).kind, 'advance');
    assert.equal(story.final, true);
    assert.deepEqual(story.finalists, ['renan', second]);
  }
});

test('finishing second in the penultimate phase qualifies the player with three lives in a fresh final', () => {
  const story = semifinal();
  assert.equal(story.resolve(result(story, [['flavio'], ['human']], 'lula')).kind, 'advance');
  const match = new Match({ players: story.participants(), lives: 3 });
  assert.ok(match.snapshot().players.every(player => player.lives === 3 && player.alive));
  assert.deepEqual(story.finalists, ['lula', 'renan']);
});

test('third place fails, and choosing Assistir carries both computers into the Segundo turno', () => {
  const story = semifinal();
  const view = result(story, [['human'], ['flavio']], 'lula');
  assert.equal(story.eliminatedFirst(view), true);
  assert.equal(story.resolve(view).kind, 'defeat');
  assert.equal(story.semifinal, true);
  story.spectating = true;
  assert.equal(story.resolve(view).kind, 'advance');
  assert.deepEqual(story.finalists, ['lula', 'flavio']);
  assert.ok(story.participants().every(player => player.bot));
  assert.deepEqual(story.resolve(result(story, [['flavio']], 'lula')), { kind: 'complete', winner: 'lula' });
});

test('a simultaneous first elimination triggers a one-life playoff for the remaining final slot', () => {
  const story = semifinal();
  const view = result(story, [['human', 'flavio']], 'lula');
  assert.equal(story.eliminatedFirst(view), false);
  assert.equal(story.resolve(view).kind, 'tie');
  assert.deepEqual(story.participants().map(player => player.character), ['renan', 'flavio']);
  assert.equal(story.resolve(result(story, [['flavio']], 'human')).kind, 'advance');
  assert.deepEqual(story.finalists, ['lula', 'renan']);
});

test('losing a playoff still allows watching the correct two finalists', () => {
  const story = semifinal();
  story.resolve(result(story, [['human', 'flavio']], 'lula'));
  const view = result(story, [['human']], 'flavio');
  assert.equal(story.resolve(view).kind, 'defeat');
  story.spectating = true;
  assert.equal(story.resolve(view).kind, 'advance');
  assert.deepEqual(story.finalists, ['lula', 'flavio']);
});

test('Tentar novamente restarts the whole phase with a fresh arena, three lives and no prior eliminations', () => {
  const story = semifinal();
  story.resolve(result(story, [['human', 'flavio']], 'lula'));
  story.restart();
  const random = seededRandom(42);
  const match = new Match({ arena: makeArena(random), players: story.participants(), lives: 3, random });
  const view = match.snapshot();
  assert.equal(story.semifinal, true);
  assert.equal(story.tie, null);
  assert.equal(view.players.length, 3);
  assert.ok(view.players.every(player => player.lives === 3));
  assert.deepEqual(view.eliminationGroups, []);
  assert.equal(view.elapsed, 0); assert.equal(view.remaining, 150);
  assert.deepEqual(view.bombs, []); assert.deepEqual(view.flames, []);
});

test('saved campaign preserves character, shuffled order and finalists while restarting the current phase', () => {
  const story = semifinal();
  story.resolve(result(story, [['lula'], ['human']], 'flavio'));
  const restored = Story.restore(story.serialize());
  assert.equal(restored.character, 'renan');
  assert.equal(restored.stage, 10);
  assert.deepEqual(restored.order, story.order);
  assert.deepEqual(restored.finalists, ['flavio', 'renan']);
  assert.equal(restored.tie, null);
  assert.deepEqual(restored.resolve(result(restored, [['flavio']], 'human')), { kind: 'complete', winner: 'renan' });
  assert.equal(Story.restore(restored.serialize()), null);
});

test('corrupt or incompatible saved campaigns are ignored', () => {
  for (const value of [null, '', 'invalid', '{}', '{"version":1,"character":"lula"}']) assert.equal(Story.restore(value), null);
  const story = new Story('renan');
  const data = JSON.parse(story.serialize()); data.order[0] = 'lula';
  assert.equal(Story.restore(JSON.stringify(data)), null);
});

test('reloading while watching the penultimate phase restarts it as a playable phase, while the final stays spectator-only', () => {
  const story = semifinal();
  story.spectating = true;
  const restoredSemifinal = Story.restore(story.serialize());
  assert.equal(restoredSemifinal.spectating, false);
  assert.equal(restoredSemifinal.participants().find(player => player.id === 'human').bot, false);
  story.resolve(result(story, [['human'], ['flavio']], 'lula'));
  const restoredFinal = Story.restore(story.serialize());
  assert.equal(restoredFinal.final, true);
  assert.equal(restoredFinal.spectating, true);
  assert.deepEqual(restoredFinal.participants().map(player => player.character), ['lula', 'flavio']);
  assert.ok(restoredFinal.participants().every(player => player.bot));
});

test('a three-way elimination can require repeated playoffs without arbitrarily assigning a final slot', () => {
  const story = semifinal();
  assert.equal(story.resolve(result(story, [['human', 'lula', 'flavio']], null)).kind, 'tie');
  assert.equal(story.resolve(result(story, [['human', 'lula', 'flavio']], null)).kind, 'tie');
  assert.equal(story.resolve(result(story, [['flavio'], ['lula']], 'human')).kind, 'advance');
  assert.deepEqual(story.finalists, ['renan', 'lula']);
});

test('ordinary defeat keeps the current phase, and a tied final requires a winner before campaign completion', () => {
  const early = new Story('renan');
  const opponent = early.participants()[1].id;
  assert.equal(early.resolve(result(early, [['human']], opponent)).kind, 'defeat');
  assert.equal(early.stage, 0);
  const story = semifinal();
  story.resolve(result(story, [['flavio'], ['lula']], 'human'));
  assert.equal(story.resolve(result(story, [['human', 'lula']], null)).kind, 'tie');
  assert.equal(story.completed, false);
  assert.equal(story.resolve(result(story, [['human']], 'lula')).kind, 'defeat');
  story.restart();
  assert.equal(story.final, true);
  assert.deepEqual(story.resolve(result(story, [['lula']], 'human')), { kind: 'complete', winner: 'renan' });
});
