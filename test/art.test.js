import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCharacter } from '../src/art.js';
import { CHARACTERS, characterFor } from '../src/characters.js';

test('the neck has no stray dark head outline while shoulders keep their silhouette', () => {
  for (const character of CHARACTERS) {
    for (const facing of [0, 1, 2, 3]) {
      const pixels = new Map();
      const ctx = {
        globalAlpha: 1, save() {}, restore() {}, translate() {}, scale() {},
        fillRect(x, y, width, height) {
          for (let px = x; px < x + width; px++) {
            for (let py = y; py < y + height; py++) pixels.set(`${px},${py}`, this.fillStyle);
          }
        },
      };
      drawCharacter(ctx, character, 0, 0, 1, facing);
      for (const x of [4, 11]) {
        for (const y of [11, 12]) assert.notEqual(pixels.get(`${x},${y}`), '#192c30', character.id);
      }
      assert.ok(pixels.has('3,12'), 'Mantém o ombro esquerdo');
      assert.ok(pixels.has('12,12'), 'Mantém o ombro direito');
      for (const [position, color] of pixels) {
        const y = Number(position.split(',')[1]);
        if (y < 21) assert.notEqual(color, '#192c30', `${character.id}: contorno preto em ${position}`);
      }
      assert.ok(pixels.has('2,9'), 'Mantém a lateral esquerda da cabeça');
      assert.ok(pixels.has('13,9'), 'Mantém a lateral direita da cabeça');
    }
  }
});

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
