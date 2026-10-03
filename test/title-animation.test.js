import test from 'node:test';
import assert from 'node:assert/strict';
import { TitleAnimation } from '../src/title-animation.js';
import { seededRandom } from '../src/engine.js';

test('the lineup starts complete, with Lula and Flávio in the middle, and resets after eliminations', () => {
  const animation = new TitleAnimation(seededRandom(2026));
  const initial = animation.snapshot();
  assert.equal(initial.characters.length, 12);
  assert.deepEqual(initial.characters.slice(5, 7).map(character => character.id), ['lula', 'flavio']);
  animation.update(15);
  assert.ok(animation.snapshot().characters.length < 12);
  animation.reset();
  const reset = animation.snapshot();
  assert.equal(reset.time, 0);
  assert.equal(reset.phase, 'holding');
  assert.deepEqual(reset.characters.map(character => character.id), initial.characters.map(character => character.id));
  assert.deepEqual(reset.characters.map(character => character.x), initial.characters.map(character => character.x));
});

test('random passes reach different living recipients, and an explosion eliminates only its holder', () => {
  const animation = new TitleAnimation(seededRandom(71));
  const recipients = new Set();
  let previous = animation.snapshot();
  let eliminated = 0;
  for (let frame = 0; frame < 5000; frame++) {
    animation.update(0.05);
    const scene = animation.snapshot();
    if (scene.phase === 'passing') {
      assert.notEqual(scene.holder, scene.recipient);
      assert.ok(scene.characters.some(character => character.id === scene.recipient));
      recipients.add(scene.recipient);
    }
    if (scene.characters.length < previous.characters.length) {
      assert.equal(previous.phase, 'exploding');
      assert.equal(previous.characters.length - scene.characters.length, 1);
      assert.ok(!scene.characters.some(character => character.id === previous.holder));
      eliminated++;
    }
    assert.ok(scene.characters.some(character => character.id === 'lula'));
    assert.ok(scene.characters.some(character => character.id === 'flavio'));
    previous = scene;
  }
  assert.ok(recipients.size > 5);
  assert.equal(eliminated, 10);
  assert.deepEqual(previous.characters.map(character => character.id), ['lula', 'flavio']);
  assert.deepEqual(previous.characters.map(character => character.x), [299, 341]);
});

test('the final pair keep exchanging the bomb indefinitely without another explosion', () => {
  const animation = new TitleAnimation(seededRandom(13));
  animation.update(120);
  const holders = new Set();
  for (let frame = 0; frame < 600; frame++) {
    animation.update(0.1);
    const scene = animation.snapshot();
    assert.equal(scene.characters.length, 2);
    assert.notEqual(scene.phase, 'exploding');
    holders.add(scene.holder);
  }
  assert.deepEqual([...holders].sort(), ['flavio', 'lula']);
});

test('animation results do not depend on frame rate', () => {
  const fine = new TitleAnimation(seededRandom(9));
  const coarse = new TitleAnimation(seededRandom(9));
  for (let frame = 0; frame < 1000; frame++) fine.update(0.01);
  coarse.update(10);
  const a = fine.snapshot();
  const b = coarse.snapshot();
  assert.equal(a.phase, b.phase);
  assert.equal(a.holder, b.holder);
  assert.deepEqual(a.characters.map(character => character.id), b.characters.map(character => character.id));
});
