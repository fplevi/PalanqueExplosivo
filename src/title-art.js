import { CHARACTERS } from './characters.js';
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
  const slots = [76, 118, 160, 202, 247, 292, 338, 383, 428, 470, 512, 552];
  for (let index = 0; index < CHARACTERS.length; index++) {
    const scale = index === 4 || index === 5 || index === 6 || index === 7 ? 2 : 1.5;
    const y = 190 - 28 * scale;
    drawCharacter(ctx, CHARACTERS[index], slots[index] - 8 * scale, y, scale);
  }
  drawBomb(ctx, 20, 162, time, 2);
  drawBomb(ctx, 572, 158, time, 2.2);
  rect('#34435d', 91, 218, 458, 3);
}
