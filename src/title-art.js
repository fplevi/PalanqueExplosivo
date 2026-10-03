import { drawCharacter, drawBomb } from './art.js';
import { TitleAnimation } from './title-animation.js';

const stillScene = new TitleAnimation(() => 0.5).snapshot();

export function drawTitleScene(ctx, time = 0, scene = stillScene) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 640, 224);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const sky = '#38435f';
  rect(sky, 68, 49, 504, 112);
  rect('#546078', 80, 80, 480, 66);
  rect('#8b7c8d', 100, 108, 440, 40);
  rect('#bb9291', 126, 129, 388, 20);
  for (const [x, y, width] of [[107, 93, 52], [410, 91, 57], [491, 116, 49]]) {
    rect('#626984', x, y, width, 5);
    rect('#626984', x + 9, y - 5, width - 18, 5);
    rect('#626984', x + 17, y - 9, width - 34, 4);
  }
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
  for (const x of [159, 454]) {
    rect('#233c45', x, 112, 3, 42);
    rect('#26674e', x - 25, 111, 25, 17);
    rect('#edc25c', x - 19, 116, 13, 7);
    rect('#29476a', x - 15, 116, 5, 7);
  }
  rect('#1b2b3c', 47, 153, 546, 53);
  rect('#537467', 56, 156, 528, 39);
  rect('#6d8a6b', 56, 156, 528, 4);
  for (let x = 56; x < 584; x += 24) {
    rect('#79918a', x, 191, 22, 19);
    rect('#adbbb0', x, 191, 22, 3);
    rect('#435967', x + 19, 194, 3, 16);
    rect('#3a5260', x, 207, 22, 3);
  }
  const holder = scene.characters.find(character => character.id === scene.holder);
  const recipient = scene.characters.find(character => character.id === scene.recipient);
  const passing = scene.phase === 'passing';
  const direction = recipient ? Math.sign(recipient.x - holder.x) : holder.x < 320 ? 1 : -1;
  const startX = holder.x + direction * 16;
  const endX = recipient ? recipient.x - direction * 16 : startX;
  const arcHeight = Math.min(55, 18 + Math.abs(endX - startX) * 0.13);
  if (passing) {
    for (let t = 0.1; t < 1; t += 0.1) {
      rect('#e1dfd0', Math.round(startX + (endX - startX) * t), Math.round(143 - Math.sin(t * Math.PI) * arcHeight), 3, 2);
    }
  }
  for (const character of scene.characters) {
    const active = character.id === scene.holder || character.id === scene.recipient;
    const facing = active ? (character.id === scene.holder ? direction : -direction) > 0 ? 1 : 3 : 2;
    ctx.save();
    if (scene.phase === 'exploding' && character.id === scene.holder) ctx.globalAlpha *= 1 - scene.progress;
    drawCharacter(ctx, character, character.x - 12, 148, 1.5, facing);
    if (active && scene.phase !== 'exploding') {
      const armDirection = character.id === scene.holder ? direction : -direction;
      rect(character.suit, character.x + (armDirection > 0 ? 10 : -16), 164, 6, 5);
      rect(character.skin, character.x + (armDirection > 0 ? 14 : -18), 157, 4, 8);
    }
    ctx.restore();
  }
  if (scene.phase === 'exploding') {
    const radius = 8 + Math.sin(scene.progress * Math.PI) * 25;
    rect('#ed704b', holder.x - radius, 168, radius * 2, 9);
    rect('#ed704b', holder.x - 5, 172 - radius, 10, radius * 2);
    rect('#f6c46c', holder.x - radius * 0.65, 170, radius * 1.3, 5);
    rect('#f6c46c', holder.x - 3, 172 - radius * 0.65, 6, radius * 1.3);
    rect('#fff0bc', holder.x - 5, 167, 10, 10);
  } else {
    const progress = passing ? scene.progress : 0;
    const bombX = startX + (endX - startX) * progress;
    const bombY = 143 - Math.sin(progress * Math.PI) * arcHeight;
    drawBomb(ctx, bombX - 10, bombY, time, 0.85);
  }
  for (const x of [35, 595]) {
    rect('#162c38', x, 180, 11, 31);
    rect('#f6c46c', x + 2, 181, 7, 7);
    rect('#e1dfd0', x + 3, 182, 5, 3);
  }
  rect('#34435d', 91, 218, 458, 3);
}
