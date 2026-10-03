import { characterFor } from './characters.js';
import { drawCharacter, drawBomb } from './art.js';
import { drawTitleBackdrop } from './title-art.js';

export const VICTORY_MESSAGE = 'Quem diria? Você acabou com o ciclo do poder';

export class VictoryAnimation {
  constructor(winner) {
    this.winner = characterFor(winner);
    this.time = 0;
  }

  update(dt) { this.time = Math.min(5.7, this.time + Math.max(0, dt)); }

  snapshot() {
    const t = this.time;
    const phase = t < 2.6 ? 'approaching' : t < 3.4 ? 'throwing' : t < 4.2 ? 'fuse'
      : t < 4.9 ? 'exploding' : t < 5.7 ? 'celebrating' : 'complete';
    const arrival = Math.min(1, t / 2.6);
    const celebration = Math.min(1, Math.max(0, (t - 4.9) / 0.8));
    const flight = Math.min(1, Math.max(0, (t - 2.6) / 0.8));
    const turn = Math.floor(t / 0.9) % 2;
    return {
      time: t, phase, winner: this.winner,
      winnerX: 100 + 130 * arrival + 90 * celebration,
      pairVisible: t < 4.9,
      pairOpacity: t < 4.2 ? 1 : Math.max(0, 1 - (t - 4.2) / 0.7),
      pairBomb: { from: turn === 0 ? 299 : 341, to: turn === 0 ? 341 : 299, progress: Math.min(1, (t % 0.9) / 0.55) },
      thrownBomb: t >= 2.6 && t < 4.2 ? { x: 248 + 72 * flight, y: 143 + 22 * flight - Math.sin(flight * Math.PI) * 45 } : null,
      explosionProgress: Math.max(0, (t - 4.2) / 0.7),
      message: phase === 'complete' ? VICTORY_MESSAGE : null,
    };
  }
}

export function drawVictoryScene(ctx, scene) {
  drawTitleBackdrop(ctx);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  if (scene.pairVisible) {
    ctx.save();
    ctx.globalAlpha *= scene.pairOpacity;
    drawCharacter(ctx, characterFor('lula'), 287, 148, 1.5, 1, 0, 1);
    drawCharacter(ctx, characterFor('flavio'), 329, 148, 1.5, 3, 0, -1);
    if (scene.phase !== 'exploding') {
      const { from, to, progress } = scene.pairBomb;
      const direction = Math.sign(to - from);
      const x = from + direction * 16 + (to - from - direction * 32) * progress;
      drawBomb(ctx, x - 10, 143 - Math.sin(progress * Math.PI) * 20, scene.time, 0.85);
    }
    ctx.restore();
  }
  const walking = scene.phase === 'approaching';
  const throwing = scene.phase === 'throwing' || scene.phase === 'fuse';
  const facing = walking || throwing ? 1 : 2;
  drawCharacter(ctx, scene.winner, scene.winnerX - 12, 148, 1.5, facing, walking ? Math.floor(scene.time * 8) : 0, throwing ? 1 : 0);
  if (scene.thrownBomb) drawBomb(ctx, scene.thrownBomb.x - 10, scene.thrownBomb.y, scene.time, 0.85);
  if (scene.phase === 'exploding') {
    const radius = 20 + Math.sin(scene.explosionProgress * Math.PI) * 28;
    for (const x of [299, 341]) {
      rect('#ed704b', x - radius, 168, radius * 2, 10);
      rect('#ed704b', x - 5, 173 - radius, 10, radius * 2);
      rect('#f6c46c', x - radius * 0.6, 170, radius * 1.2, 6);
      rect('#fff0bc', x - 5, 168, 10, 10);
    }
  }
}
