import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCharacter, renderArena } from '../src/art.js';
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

test('renderArena draws 3-segment life bar under character indicating player lives', () => {
  const character = characterFor('lula');
  for (const lives of [3, 2, 1]) {
    const pixels = new Map();
    const ctx = {
      imageSmoothingEnabled: false,
      fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
      save() {}, restore() {}, translate() {}, scale() {}, strokeRect() {},
      fillRect(x, y, width, height) {
        for (let px = x; px < x + width; px++) {
          for (let py = y; py < y + height; py++) pixels.set(`${px},${py}`, this.fillStyle);
        }
      },
    };
    const view = {
      arena: Array.from({ length: 13 }, () => Array.from({ length: 15 }, () => 'floor')),
      items: [], bombs: [], flames: [],
      players: [{
        id: 'human', character: 'lula', x: 2, y: 2, fromX: 2, fromY: 2,
        cooldown: 0, moveDuration: 0.25, facing: 2, alive: true, lives
      }],
      elapsed: 0, remaining: 150, status: 'running'
    };
    renderArena(ctx, view, 0);

    // px = 2 * 32 + 8 = 72; py = 2 * 32 + 3 = 67; barY = 67 + 29 = 96; barX = 72 + 3 = 75
    // 3 segments of 3px with 1px gap: [75..77], gap at 78, [79..81], gap at 82, [83..85]
    const segment0 = pixels.get('75,96');
    const gap0 = pixels.get('78,96');
    const segment1 = pixels.get('79,96');
    const gap1 = pixels.get('82,96');
    const segment2 = pixels.get('83,96');

    // Segments corresponding to remaining lives are drawn in character.color
    if (lives >= 1) assert.equal(segment0, character.color, `Vida 1 ativa para ${lives} vidas`);
    if (lives >= 2) assert.equal(segment1, character.color, `Vida 2 ativa para ${lives} vidas`);
    else assert.notEqual(segment1, character.color, `Vida 2 esgotada para ${lives} vidas`);
    if (lives >= 3) assert.equal(segment2, character.color, `Vida 3 ativa para ${lives} vidas`);
    else assert.notEqual(segment2, character.color, `Vida 3 esgotada para ${lives} vidas`);

    // Gaps between segments are separated (not filled with character.color)
    assert.notEqual(gap0, character.color, 'Espaço entre vida 1 e 2');
    assert.notEqual(gap1, character.color, 'Espaço entre vida 2 e 3');
  }
});
