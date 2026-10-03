import { CHARACTERS, characterFor } from './characters.js';
import { drawCharacter, drawBomb } from './art.js';

export function drawTitleScene(ctx, time = 0) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 640, 224);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const sky = '#38435f';
  rect(sky, 68, 49, 504, 112);
  rect('#546078', 80, 80, 480, 66);
  rect('#8b7c8d', 100, 108, 440, 40);
  rect('#bb9291', 126, 129, 388, 20);
  rect('#f6c46c', 478, 58, 26, 26);
  rect(sky, 475, 55, 9, 9); rect(sky, 503, 75, 6, 12);
  for (const [x, y] of [[122,63], [163,84], [435,65], [386,79], [521,104]]) {
    rect('#c4c5bf', x, y, 2, 6); rect('#c4c5bf', x - 2, y + 2, 6, 2);
  }
  rect('#b9c6c9', 280, 55, 17, 95); rect('#b9c6c9', 306, 55, 17, 95);
  rect('#e1dfd0', 280, 55, 4, 95); rect('#e1dfd0', 306, 55, 4, 95);
  for (let y = 60; y < 148; y += 7) { rect('#7c93a3', 286, y, 10, 2); rect('#7c93a3', 312, y, 10, 2); }
  rect('#d8dad0', 216, 125, 49, 19); rect('#d8dad0', 222, 119, 37, 6); rect('#d8dad0', 230, 115, 21, 4);
  rect('#c0cccd', 337, 120, 60, 8); rect('#c0cccd', 343, 128, 48, 7); rect('#c0cccd', 350, 135, 34, 7); rect('#c0cccd', 358, 142, 18, 6);
  rect('#78919f', 205, 147, 207, 5);
  rect('#1b2b3c', 47, 153, 546, 53);
  rect('#537467', 56, 156, 528, 39);
  rect('#6d8a6b', 56, 156, 528, 4);
  for (let x = 56; x < 584; x += 24) {
    rect('#79918a', x, 191, 22, 19);
    rect('#adbbb0', x, 191, 22, 3);
    rect('#435967', x + 19, 194, 3, 16);
    rect('#3a5260', x, 207, 22, 3);
  }
  const runners = CHARACTERS.filter(character => character.id !== 'lula' && character.id !== 'flavio')
    .map((character, index, roster) => {
      const angle = time * 0.65 + index * Math.PI * 2 / roster.length;
      const depth = Math.sin(angle);
      const scale = 1.35 + depth * 0.15;
      return {
        character, depth, scale,
        x: 320 + Math.cos(angle) * 218 - 8 * scale,
        y: 173 + depth * 17 - 28 * scale + Math.sin(time * 12 + index) * 1.5,
        facing: depth < 0 ? 1 : 3,
        step: Math.floor(time * 10 + index),
      };
    }).sort((a, b) => a.depth - b.depth);
  const drawRunner = runner => drawCharacter(ctx, runner.character, runner.x, runner.y, runner.scale, runner.facing, runner.step);
  for (const runner of runners.filter(runner => runner.depth < 0)) drawRunner(runner);
  drawCharacter(ctx, characterFor('lula'), 272, 111, 2.5, 1);
  drawCharacter(ctx, characterFor('flavio'), 328, 111, 2.5, 3);
  for (const runner of runners.filter(runner => runner.depth >= 0)) drawRunner(runner);
  drawBomb(ctx, 20, 162, time, 2);
  drawBomb(ctx, 572, 158, time, 2.2);
  rect('#34435d', 91, 218, 458, 3);
}
