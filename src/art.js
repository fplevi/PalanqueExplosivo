import { characterFor } from './characters.js';
import { DIRECTIONS } from './engine.js';

export const TILE = 32;

function darken(color, factor) {
  return '#' + color.slice(1).match(/.{2}/g)
    .map(channel => Math.round(parseInt(channel, 16) * factor).toString(16).padStart(2, '0')).join('');
}

export function drawCharacter(ctx, character, x, y, scale = 1, facing = 2, step = 0, raisedArm = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const rect = (color, rx, ry, width, height) => { ctx.fillStyle = color; ctx.fillRect(rx, ry, width, height); };
  const dark = '#192c30';
  const noseColor = darken(character.skin, 0.88);
  const suitOutline = darken(character.suit, 0.82);
  const noseWidth = character.noseWidth ?? 2;
  const eyeColor = character.eyeColor ?? '#624735';
  const walk = step % 2;
  rect('rgba(9,34,23,0.26)', 1, 23, 14, 3);
  rect(suitOutline, 3, 12, 10, 10);
  rect(character.suit, 3, 12, 10, 1);
  rect(character.suit, 4, 13, 8, 8);
  const shortSleeves = character.outfit === 'tshirt';
  const collaredShirt = character.outfit === 'shirt';
  if (raisedArm === -1) {
    rect(character.suit, -2, 11, 6, 3);
    rect(character.skin, -3, 6, 3, 6);
  } else {
    rect(character.suit, 1, 14 + walk, 3, 6);
    rect(character.skin, 1, (shortSleeves ? 17 : 19) + walk, 3, shortSleeves ? 4 : 2);
  }
  if (raisedArm === 1) {
    rect(character.suit, 12, 11, 6, 3);
    rect(character.skin, 16, 6, 3, 6);
  } else {
    rect(character.suit, 12, 15 - walk, 3, 6);
    rect(character.skin, 12, (shortSleeves ? 18 : 20) - walk, 3, shortSleeves ? 4 : 2);
  }
  if (collaredShirt) {
    const seam = darken(character.suit, 0.88);
    const highlight = '#fff0f6';
    if (facing !== 0) {
      rect(seam, 7, 14, 2, 7);
      rect(highlight, 5, 13, 2, 1);
      rect(highlight, 6, 14, 1, 1);
      rect(highlight, 9, 13, 2, 1);
      rect(highlight, 9, 14, 1, 1);
      for (const buttonY of [16, 18, 20]) rect(highlight, 8, buttonY, 1, 1);
      rect(seam, 4, 16, 2, 1);
      rect(seam, 10, 16, 2, 1);
    }
    // Cuffs follow the sleeves during walking and the raised-arm poses.
    if (raisedArm === -1) rect(highlight, -2, 11, 1, 3);
    else rect(highlight, 1, 18 + walk, 3, 1);
    if (raisedArm === 1) rect(highlight, 17, 11, 1, 3);
    else rect(highlight, 12, 19 - walk, 3, 1);
  } else if (shortSleeves) {
    rect(character.skin, 6, 13, 4, 1);
  } else {
    rect('#e7e3ce', 6, 13, 4, 5);
    rect(character.color, 7, 14, 2, 6);
  }
  rect(dark, 4, 21, 3, 3 + walk);
  rect(dark, 9, 21, 3, 4 - walk);
  rect('#151f27', 3, 24 + walk, 5, 2);
  rect('#151f27', 9, 25 - walk, 5, 2);
  if (character.style === 'long' && facing === 0) rect(character.hair, 2, 3, 12, 12);
  if (character.style === 'afro') {
    rect(character.hair, 4, -2, 8, 2);
    rect(character.hair, 2, 0, 12, 2);
    rect(character.hair, 1, 2, 14, 2);
    rect(character.hair, 0, 4, 16, 5);
    rect(character.hair, 1, 9, 14, 2);
    rect(character.hair, 2, 11, 12, 1);
  }
  rect(noseColor, 3, 1, 10, 10);
  rect(noseColor, 2, 3, 12, 7);
  rect(character.skin, 3, 3, 10, 8);
  rect(character.skin, 5, 11, 6, 2);
  rect(character.hair, 3, 1, 10, 4);
  rect(character.hair, 2, 3, 2, 5);
  rect(character.hair, 12, 3, 2, 5);
  rect(character.hair, 4, 0, 7, 2);
  if (character.style === 'long' && facing !== 0) {
    rect(character.hair, 2, 7, 2, 8);
    rect(character.hair, 12, 7, 2, 8);
    rect(character.hair, 3, 10, 2, 7);
    rect(character.hair, 11, 10, 2, 7);
  }
  if (character.style === 'afro') {
    rect(character.hair, 1, 3, 3, 7);
    rect(character.hair, 12, 3, 3, 7);
    rect(character.hair, 2, 10, 2, 2);
    rect(character.hair, 12, 10, 2, 2);
    for (const [hx, hy] of [[4, -1], [8, -2], [11, 0], [2, 3], [13, 4], [1, 7], [14, 8]]) {
      rect('#ffffff12', hx, hy, 1, 1);
    }
  }
  if (character.style === 'side') {
    rect(character.hair, 9, 3, 4, 3);
    rect('#ffffff28', 4, 2, 5, 1);
  }
  if (facing === 0) {
    rect(character.hair, 3, 3, 10, 8);
    rect('#00000015', 4, 9, 8, 2);
    rect(character.suit, 5, 13, 6, 7);
  } else {
    rect(eyeColor, 5, 7, 1, 1);
    rect(eyeColor, 10, 7, 1, 1);
    if (facing === 1) {
      rect(noseColor, 13, 7, noseWidth, 2);
    } else if (facing === 3) {
      rect(noseColor, 3 - noseWidth, 7, noseWidth, 2);
    } else {
      rect(noseColor, Math.floor((16 - noseWidth) / 2), 8, noseWidth, 2);
    }
    if (character.glasses) {
      const glassesColor = character.glassesColor ?? '#304246';
      rect(glassesColor, 3, 5, 4, 1); rect(glassesColor, 9, 5, 4, 1);
      rect(glassesColor, 3, 8, 4, 1); rect(glassesColor, 9, 8, 4, 1);
      rect(glassesColor, 3, 6, 1, 2); rect(glassesColor, 6, 6, 1, 2);
      rect(glassesColor, 9, 6, 1, 2); rect(glassesColor, 12, 6, 1, 2);
      rect(glassesColor, 7, 6, 2, 1);
    }
    if (character.beard && character.beardStyle === 'stubble') {
      ctx.save();
      ctx.globalAlpha *= 0.2;
      for (const bx of [4, 6, 9, 11]) rect(character.beard, bx, 9, 1, 1);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= 0.32;
      for (const bx of [4, 11]) rect(character.beard, bx, 10, 1, 1);
      for (const bx of [4, 6, 8, 10]) rect(character.beard, bx, 11, 1, 1);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= 0.44;
      for (const bx of [5, 7, 9, 10]) rect(character.beard, bx, 12, 1, 1);
      ctx.restore();
      rect('#9b654e', 6, 10, 4, 1);
    } else if (character.beard) {
      rect(character.beard, 4, 9, 8, 3);
      rect(character.beard, 5, 12, 6, 1);
      rect('#715542', 7, 10, 3, 1);
    } else rect('#9b654e', 6, 10, 4, 1);
  }
  ctx.restore();
}

export function drawBomb(ctx, x, y, time = 0, scale = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
  const r = (color, rx, ry, w, h) => { ctx.fillStyle = color; ctx.fillRect(rx, ry, w, h); };
  r('#0c2023', 4, 8, 15, 13); r('#0c2023', 7, 5, 9, 18);
  r('#30454a', 6, 9, 11, 10); r('#53676a', 7, 8, 6, 4);
  r('#a9bec2', 7, 9, 3, 3); r('#182e33', 14, 12, 3, 7);
  r('#172c31', 10, 3, 6, 3); r('#e6be68', 14, 0, 2, 4);
  r(Math.floor(time * 12) % 2 ? '#ffd97b' : '#ee774d', 16, -2, 3, 3);
  ctx.restore();
}

function drawWall(ctx, x, y, border) {
  ctx.fillStyle = '#354d54'; ctx.fillRect(x, y, 32, 32);
  ctx.fillStyle = border ? '#81999b' : '#98abaa'; ctx.fillRect(x + 1, y + 1, 29, 27);
  ctx.fillStyle = '#c5d2c6'; ctx.fillRect(x + 1, y + 1, 29, 3); ctx.fillRect(x + 1, y + 4, 3, 23);
  ctx.fillStyle = '#657e85'; ctx.fillRect(x + 27, y + 5, 3, 23); ctx.fillRect(x + 4, y + 25, 26, 4);
  ctx.fillStyle = '#a9bcb7'; ctx.fillRect(x + 7, y + 7, 15, 14);
  ctx.fillStyle = '#738d90'; ctx.fillRect(x + 29, y + 29, 3, 3);
}

function drawBlock(ctx, x, y) {
  ctx.fillStyle = '#733f36'; ctx.fillRect(x + 1, y + 1, 30, 30);
  ctx.fillStyle = '#d39764'; ctx.fillRect(x + 2, y + 2, 28, 27);
  for (let row = 0; row < 3; row++) {
    const top = y + 3 + row * 9;
    ctx.fillStyle = '#ebbb82'; ctx.fillRect(x + 3, top, 26, 2);
    ctx.fillStyle = '#b87350'; ctx.fillRect(x + 3, top + 7, 26, 2);
    const seam = x + (row % 2 ? 10 : 20);
    ctx.fillStyle = '#81483a'; ctx.fillRect(seam, top, 2, 9);
  }
  ctx.fillStyle = '#864d3b'; ctx.fillRect(x + 29, y + 3, 2, 28);
}

function drawItem(ctx, item, time) {
  const x = item.x * TILE + 6;
  const y = item.y * TILE + 6 + Math.round(Math.sin(time * 4) * 1);
  drawItemSprite(ctx, item.type, x, y, time);
}

export function drawItemSprite(ctx, type, x, y, time = 0) {
  ctx.fillStyle = '#244535'; ctx.fillRect(x - 1, y - 1, 22, 22);
  ctx.fillStyle = { bomb: '#80cad0', range: '#ffc768', speed: '#c2aadf', kick: '#7fd49d' }[type];
  ctx.fillRect(x, y, 20, 20);
  ctx.fillStyle = '#fffae1'; ctx.fillRect(x + 2, y + 2, 16, 2);
  if (type === 'bomb') drawBomb(ctx, x + 3, y + 5, time, 0.6);
  else if (type === 'range') {
    ctx.fillStyle = '#e86338'; ctx.fillRect(x + 8, y + 5, 6, 11); ctx.fillRect(x + 5, y + 9, 12, 6);
    ctx.fillStyle = '#fff0a6'; ctx.fillRect(x + 9, y + 9, 4, 7);
  } else if (type === 'kick') {
    drawBomb(ctx, x + 1, y + 4, time, 0.45);
    ctx.fillStyle = '#41272a'; ctx.fillRect(x + 12, y + 6, 4, 8); ctx.fillRect(x + 8, y + 12, 9, 5);
    ctx.fillStyle = '#ee8544'; ctx.fillRect(x + 13, y + 7, 2, 6); ctx.fillRect(x + 9, y + 13, 6, 3);
    ctx.fillStyle = '#fffae1'; ctx.fillRect(x + 7, y + 17, 11, 2);
    ctx.fillStyle = '#ffc768'; ctx.fillRect(x + 9, y + 6, 2, 2); ctx.fillRect(x + 7, y + 8, 2, 2);
  } else {
    ctx.fillStyle = '#4b4770'; ctx.fillRect(x + 8, y + 5, 6, 8); ctx.fillRect(x + 4, y + 12, 12, 4);
    ctx.fillStyle = '#f3e7d5'; ctx.fillRect(x + 3, y + 16, 14, 2);
  }
}

export function renderArena(ctx, view, time, { lobby = false } = {}) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2b7350'; ctx.fillRect(0, 0, 480, 416);
  for (let y = 0; y < view.arena.length; y++) {
    for (let x = 0; x < view.arena[y].length; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const cell = view.arena[y][x];
      if (cell === 'wall' || cell === 'crushed') {
        drawWall(ctx, px, py, x === 0 || y === 0 || x === 14 || y === 12);
        if (cell === 'crushed') {
          ctx.fillStyle = '#f57962'; ctx.fillRect(px + 5, py + 5, 22, 3);
          ctx.fillStyle = '#353b52'; ctx.fillRect(px + 13, py + 10, 6, 16);
        }
      }
      else {
        ctx.fillStyle = (x + y) % 2 ? '#398a56' : '#358452'; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#2d774b'; ctx.fillRect(px, py + 30, TILE, 2);
        if ((x * 7 + y * 3) % 5 === 0) {
          ctx.fillStyle = '#47945e'; ctx.fillRect(px + 5, py + 9, 2, 3); ctx.fillRect(px + 8, py + 10, 2, 2);
        }
        if (cell === 'block') drawBlock(ctx, px, py);
      }
    }
  }
  if (view.nextBlock) {
    const { x, y } = view.nextBlock;
    ctx.fillStyle = Math.floor(time * 8) % 2 ? '#f5796280' : '#f6c46c60';
    ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#ffdcc0'; ctx.lineWidth = 2;
    ctx.strokeRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
  }
  for (const item of view.items) if ((item.revealAt ?? 0) <= view.elapsed) drawItem(ctx, item, time);
  for (const bomb of view.bombs) {
    const pulse = bomb.fuse < 0.65 && Math.floor(time * 14) % 2;
    const direction = DIRECTIONS[bomb.slideDirection];
    const progress = bomb.slideProgress ?? 0;
    const x = bomb.x + (direction?.[0] ?? 0) * progress;
    const y = bomb.y + (direction?.[1] ?? 0) * progress;
    drawBomb(ctx, x * TILE + 5, y * TILE + 5 - Number(pulse), time);
  }
  for (const flame of view.flames) {
    const x = flame.x * TILE; const y = flame.y * TILE;
    const jitter = Math.floor(time * 16 + x) % 3;
    const horizontal = view.flames.some(other => other.y === flame.y && Math.abs(other.x - flame.x) === 1);
    const vertical = view.flames.some(other => other.x === flame.x && Math.abs(other.y - flame.y) === 1);
    if (horizontal) {
      ctx.fillStyle = '#e6612d'; ctx.fillRect(x, y + 6, 32, 20);
      ctx.fillStyle = '#ffad3b'; ctx.fillRect(x, y + 9, 32, 14);
      ctx.fillStyle = '#ffe47b'; ctx.fillRect(x, y + 12, 32, 8);
    }
    if (vertical) {
      ctx.fillStyle = '#e6612d'; ctx.fillRect(x + 6, y, 20, 32);
      ctx.fillStyle = '#ffad3b'; ctx.fillRect(x + 9, y, 14, 32);
      ctx.fillStyle = '#ffe47b'; ctx.fillRect(x + 12, y, 8, 32);
    }
    ctx.fillStyle = '#e6612d'; ctx.fillRect(x + 2, y + 5, 28, 23); ctx.fillRect(x + 5, y + 2, 23, 28);
    ctx.fillStyle = '#ffad3b'; ctx.fillRect(x + 4, y + 8, 24, 16); ctx.fillRect(x + 8, y + 4, 16, 24);
    ctx.fillStyle = '#ffe47b'; ctx.fillRect(x + 7 + jitter, y + 11, 18 - jitter * 2, 10); ctx.fillRect(x + 11, y + 7 + jitter, 10, 18 - jitter * 2);
    ctx.fillStyle = '#fff6cd'; ctx.fillRect(x + 12, y + 12, 8, 8);
  }
  for (const player of [...view.players].sort((a, b) => a.y - b.y)) {
    if (!player.alive || player.respawning || (player.invulnerable > 0 && Math.floor(time * 10) % 2)) continue;
    const progress = 1 - player.cooldown / player.moveDuration;
    const x = player.fromX + (player.x - player.fromX) * progress;
    const y = player.fromY + (player.y - player.fromY) * progress;
    const character = characterFor(player.character);
    const px = x * TILE + 8; const py = y * TILE + 3;
    const lives = Math.max(0, Math.min(3, player.lives ?? 1));
    const barX = Math.round(px) + 3;
    const barY = Math.round(py) + 29;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? character.color : darken(character.color, 0.28);
      ctx.fillRect(barX + i * 4, barY, 3, 2);
    }
    drawCharacter(ctx, character, px, py, 1, player.facing, player.cooldown > 0 ? Math.floor(time * 10) : 0);
    if (player.id === 'human' && !lobby) {
      ctx.fillStyle = '#ffe198'; ctx.fillRect(Math.round(px) + 6, Math.round(py) - 5, 5, 2); ctx.fillRect(Math.round(px) + 7, Math.round(py) - 3, 3, 2);
    }
  }
  if (view.nextBlock && view.nextBlock.in <= 0.25) {
    const { x, y, in: delay } = view.nextBlock;
    const height = Math.round(delay / 0.25 * 160);
    ctx.save(); ctx.globalAlpha = 0.9;
    drawWall(ctx, x * TILE, y * TILE - height, false);
    ctx.fillStyle = '#f57962'; ctx.fillRect(x * TILE + 5, y * TILE - height + 5, 22, 3);
    ctx.restore();
  }
}
