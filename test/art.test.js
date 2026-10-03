import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCharacter } from '../src/art.js';
import { characterFor } from '../src/characters.js';

for (const id of ['lula', 'edmilson']) {
  for (const raisedArm of [-1, 1]) {
    test(`${id} raises one arm for a pass without leaving a second hand below it (${raisedArm})`, () => {
      const pixels = new Map();
      const ctx = {
        globalAlpha: 1, save() {}, restore() {}, translate() {}, scale() {},
        fillRect(x, y, width, height) {
          for (let px = x; px < x + width; px++) {
            for (let py = y; py < y + height; py++) pixels.set(`${px},${py}`, this.fillStyle);
          }
        },
      };
      const character = characterFor(id);
      drawCharacter(ctx, character, 0, 0, 1, raisedArm > 0 ? 1 : 3, 0, raisedArm);
      const loweredX = raisedArm > 0 ? 13 : 2;
      const oppositeX = raisedArm > 0 ? 2 : 13;
      assert.notEqual(pixels.get(`${loweredX},20`), character.skin, 'Remove a mão abaixada do lado levantado');
      assert.equal(pixels.get(`${raisedArm > 0 ? 17 : -2},7`), character.skin, 'Mostra a mão levantada');
      assert.equal(pixels.get(`${oppositeX},20`), character.skin, 'Mantém o outro braço');
    });
  }
}
