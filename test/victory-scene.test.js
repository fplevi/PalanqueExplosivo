import test from 'node:test';
import assert from 'node:assert/strict';
import { VictoryAnimation, drawVictoryScene, VICTORY_MESSAGE, SpectatorEndingAnimation, drawSpectatorEndingScene } from '../src/victory-scene.js';

for (const [winner, loser] of [['lula', 'flavio'], ['flavio', 'lula']]) {
  test(`${winner} ends the opening joke by passing the bomb to ${loser}, who alone explodes`, () => {
    const animation = new SpectatorEndingAnimation(winner, loser);
    assert.deepEqual(animation.snapshot().characters.map(actor => actor.id), ['lula', 'flavio']);
    animation.update(0.5);
    assert.equal(animation.snapshot().holder, winner);
    assert.equal(animation.snapshot().recipient, loser);
    animation.update(0.9);
    assert.equal(animation.snapshot().holder, loser);
    assert.equal(animation.snapshot().recipient, winner);
    animation.update(0.9);
    assert.equal(animation.snapshot().holder, winner);
    assert.equal(animation.snapshot().recipient, loser);
    animation.update(1.4);
    const explosion = animation.snapshot();
    assert.equal(explosion.phase, 'exploding');
    assert.equal(explosion.holder, loser);
    assert.equal(explosion.message, null);
    animation.update(1);
    const final = animation.snapshot();
    assert.deepEqual(final.characters.map(actor => actor.id), [winner]);
    assert.equal(final.message, 'Você falhou em acabar com o ciclo do poder. O ciclo continua.');
    animation.update(100);
    assert.deepEqual(animation.snapshot(), final);
  });
}

test('spectator ending renders every phase and supports immediately showing the result', () => {
  const ctx = { globalAlpha: 1, clearRect() {}, fillRect() {}, save() {}, restore() {}, translate() {}, scale() {} };
  const animation = new SpectatorEndingAnimation('flavio', 'lula');
  for (const dt of [0, 0.5, 0.9, 0.9, 0.5, 0.9, 1]) {
    animation.update(dt);
    drawSpectatorEndingScene(ctx, animation.snapshot());
  }
  const reduced = new SpectatorEndingAnimation('lula', 'flavio');
  reduced.update(5.7);
  assert.deepEqual(reduced.snapshot().characters.map(actor => actor.id), ['lula']);
  assert.equal(reduced.snapshot().phase, 'complete');
});

test('the campaign winner arrives, throws a bomb, eliminates both bosses, then sees the victory message', () => {
  const animation = new VictoryAnimation('clariana');
  let scene = animation.snapshot();
  assert.equal(scene.phase, 'approaching');
  assert.equal(scene.winner.id, 'clariana');
  assert.equal(scene.pairVisible, true);
  assert.equal(scene.message, null);
  animation.update(2.8);
  scene = animation.snapshot();
  assert.equal(scene.phase, 'throwing');
  assert.ok(scene.thrownBomb.x > scene.winnerX);
  assert.ok(scene.thrownBomb.y < 143, 'A bomba viaja em arco');
  animation.update(0.8);
  assert.equal(animation.snapshot().phase, 'fuse');
  animation.update(0.8);
  scene = animation.snapshot();
  assert.equal(scene.phase, 'exploding');
  assert.ok(scene.pairOpacity < 1);
  assert.equal(scene.message, null);
  animation.update(2);
  scene = animation.snapshot();
  assert.equal(scene.phase, 'complete');
  assert.equal(scene.pairVisible, false);
  assert.equal(scene.winnerX, 320);
  assert.equal(scene.message, 'Quem diria? Você acabou com o ciclo do poder');
  animation.update(100);
  assert.deepEqual(animation.snapshot(), scene, 'A cena termina sem reiniciar ou explodir o vencedor');
});

test('both bosses exchange the original bomb before the winner intervenes', () => {
  const animation = new VictoryAnimation('samara');
  const initial = animation.snapshot().pairBomb;
  animation.update(1);
  const next = animation.snapshot().pairBomb;
  assert.equal(initial.from, next.to);
  assert.equal(initial.to, next.from);
});

test('reduced motion can immediately display the final result, and a fresh victory starts from the beginning', () => {
  const animation = new VictoryAnimation('zema');
  animation.update(5.7);
  assert.equal(animation.snapshot().message, VICTORY_MESSAGE);
  assert.equal(new VictoryAnimation('zema').snapshot().phase, 'approaching');
});

test('victory rendering removes Lula and Flávio after the explosion and preserves the winner', () => {
  const render = scene => {
    const actors = [];
    const stack = [];
    let actor = null;
    const ctx = {
      globalAlpha: 1, clearRect() {},
      save() { stack.push({ actor, alpha: this.globalAlpha }); },
      restore() { const saved = stack.pop(); actor = saved.actor; this.globalAlpha = saved.alpha; },
      translate() { actor = []; actors.push(actor); }, scale() {},
      fillRect(x, y, w, h) { actor?.push(this.fillStyle); },
    };
    drawVictoryScene(ctx, scene);
    return actors.filter(draws => draws.includes('#624735'));
  };
  const animation = new VictoryAnimation('hertz');
  assert.equal(render(animation.snapshot()).length, 3);
  animation.update(5.7);
  const actors = render(animation.snapshot());
  assert.equal(actors.length, 1);
  assert.ok(actors[0].includes(animation.snapshot().winner.skin));
});
