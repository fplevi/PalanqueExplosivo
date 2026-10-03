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
  for (let index = 0; index < 3; index++) {
    const opponents = story.participants().filter(player => player.bot).map(player => [player.id]);
    assert.equal(story.resolve(result(story, opponents, 'human')).kind, 'advance');
  }
  return story;
}

test('Modo história groups nine opponents into three four-player phases before the two bosses', () => {
  assert.equal(storyCharacters().length, 10);
  assert.throws(() => new Story('lula'));
  assert.throws(() => new Story('flavio'));
  const story = new Story('renan', () => 0.5);
  assert.equal(story.totalStages, 5);
  assert.equal(new Set(story.order).size, 9);
  assert.ok(!story.order.some(id => ['renan', 'lula', 'flavio'].includes(id)));
  const faced = [];
  for (let stage = 0; stage < 3; stage++) {
    const players = story.participants();
    assert.equal(players.length, 4);
    assert.equal(players.filter(player => player.bot).length, 3);
    assert.equal(new Set(players.map(player => `${player.x},${player.y}`)).size, 4);
    assert.equal(players.find(player => !player.bot).lives, 3);
    assert.ok(players.filter(player => player.bot).every(player => player.lives === 1));
    faced.push(...players.filter(player => player.bot).map(player => player.character));
    story.resolve(result(story, players.filter(player => player.bot).map(player => [player.id]), 'human'));
  }
  assert.equal(new Set(faced).size, 9);
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
  assert.equal(match.snapshot().players.find(player => player.id === 'human').lives, 3);
  assert.equal(match.snapshot().players.find(player => player.bot).lives, 3);
  assert.ok(match.snapshot().players.every(player => player.alive));
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
  assert.ok(story.participants().every(player => player.lives === 3));
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

test('Tentar novamente restarts the whole phase with a fresh arena, original lives and no prior eliminations', () => {
  const story = semifinal();
  story.resolve(result(story, [['human', 'flavio']], 'lula'));
  story.restart();
  const random = seededRandom(42);
  const match = new Match({ arena: makeArena(random), players: story.participants(), lives: 3, random });
  const view = match.snapshot();
  assert.equal(story.semifinal, true);
  assert.equal(story.tie, null);
  assert.equal(view.players.length, 3);
  assert.equal(view.players.find(player => player.id === 'human').lives, 3);
  assert.ok(view.players.filter(player => player.bot).every(player => player.lives === 1));
  assert.deepEqual(view.eliminationGroups, []);
  assert.equal(view.elapsed, 0); assert.equal(view.remaining, 150);
  assert.deepEqual(view.bombs, []); assert.deepEqual(view.flames, []);
});

test('saved campaign preserves character, shuffled order and finalists while restarting the current phase', () => {
  const story = semifinal();
  story.resolve(result(story, [['lula'], ['human']], 'flavio'));
  const restored = Story.restore(story.serialize());
  assert.equal(restored.character, 'renan');
  assert.equal(restored.stage, 4);
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
  assert.ok(restoredFinal.participants().every(player => player.lives === 3));
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
  assert.deepEqual(story.participants().map(player => player.lives), [3, 3]);
  assert.equal(story.resolve(result(story, [['human', 'lula']], null)).kind, 'tie');
  assert.deepEqual(story.participants().map(player => player.lives), [1, 1]);
  assert.equal(story.completed, false);
  assert.equal(story.resolve(result(story, [['human']], 'lula')).kind, 'defeat');
  story.restart();
  assert.equal(story.final, true);
  assert.deepEqual(story.participants().map(player => player.lives), [3, 3]);
  assert.deepEqual(story.resolve(result(story, [['lula']], 'human')), { kind: 'complete', winner: 'renan' });
});

test('a preliminary phase ends for the player immediately after elimination, even while three computers remain', () => {
  const story = new Story('renan');
  const view = { ...result(story, [['human']], null), status: 'running' };
  for (const player of view.players) player.alive = player.id !== 'human';
  assert.equal(story.failedDuringMatch(view), true);
  const bosses = semifinal();
  const secondPlace = { ...result(bosses, [['flavio'], ['human']], 'lula'), status: 'running' };
  assert.equal(bosses.failedDuringMatch(secondPlace), false);
});

test('all playoff participants have one life, including the human, and normal phases restore the original life counts', () => {
  const story = semifinal();
  assert.deepEqual(story.participants().map(player => player.lives), [3, 1, 1]);
  story.resolve(result(story, [['human', 'flavio']], 'lula'));
  assert.ok(story.participants().every(player => player.lives === 1));
  story.restart();
  assert.deepEqual(story.participants().map(player => player.lives), [3, 1, 1]);
});

test('saved eleven-phase campaigns migrate to five phases without losing character, opponents or finalists', () => {
  const story = new Story('renan', () => 0.5);
  const legacy = { ...JSON.parse(story.serialize()), version: 1 };
  for (const [oldStage, newStage] of [[0, 0], [2, 0], [3, 1], [8, 2], [9, 3], [10, 4]]) {
    const restored = Story.restore(JSON.stringify({ ...legacy, stage: oldStage,
      finalists: oldStage === 10 ? ['renan', 'lula'] : [] }));
    assert.ok(restored);
    assert.equal(restored.stage, newStage);
    assert.equal(restored.totalStages, 5);
    assert.equal(restored.character, 'renan');
    assert.deepEqual(restored.order, story.order);
    if (oldStage === 10) assert.deepEqual(restored.finalists, ['renan', 'lula']);
    assert.equal(JSON.parse(restored.serialize()).version, 2);
  }
});
