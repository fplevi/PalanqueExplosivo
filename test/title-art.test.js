import test from 'node:test';
import assert from 'node:assert/strict';
import { drawTitleScene } from '../src/title-art.js';

for (const time of [0, 1, 5]) {
  test(`title lineup shows both eyes at ${time}s`, () => {
    const actors = [];
    const stack = [];
    let actor = null;
    const ctx = {
      globalAlpha: 1,
      clearRect() {},
      save() { stack.push({ actor, fillStyle: this.fillStyle, globalAlpha: this.globalAlpha }); },
      restore() {
        const saved = stack.pop();
        actor = saved.actor;
        this.fillStyle = saved.fillStyle;
        this.globalAlpha = saved.globalAlpha;
      },
      translate() { actor = []; actors.push(actor); },
      scale() {},
      fillRect(x, y, width, height) {
        actor?.push({ x, y, width, height, color: this.fillStyle });
      },
    };
    drawTitleScene(ctx, time);
    const characters = actors.filter(draws => draws.some(draw => draw.color === '#624735'));
    assert.equal(characters.length, 12);
    for (const draws of characters) {
      const eyes = draws.filter(draw => draw.color === '#624735');
      assert.equal(eyes.length, 2, 'A face deve mostrar os dois olhos');
      assert.ok(eyes.every(eye => eye.width === 1 && eye.height === 1));
    }
  });
}
