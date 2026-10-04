export const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const ARENA_WIDTH = 15;
export const ARENA_HEIGHT = 13;
const FLAME_DURATION = 0.55;
const KICK_SPEED = 8;

function fallingBlockPath(arena) {
  const cells = [];
  let left = 1, top = 1, right = arena[0].length - 2, bottom = arena.length - 2;
  const add = (x, y) => { if (arena[y][x] !== 'wall') cells.push({ x, y }); };
  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x++) add(x, top);
    for (let y = top + 1; y <= bottom; y++) add(right, y);
    if (top < bottom) for (let x = right - 1; x >= left; x--) add(x, bottom);
    if (left < right) for (let y = bottom - 1; y > top; y--) add(left, y);
    left++; top++; right--; bottom--;
  }
  return cells;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function makeArena(random = Math.random) {
  return Array.from({ length: ARENA_HEIGHT }, (_, y) => Array.from({ length: ARENA_WIDTH }, (_, x) => {
    if (x === 0 || y === 0 || x === ARENA_WIDTH - 1 || y === ARENA_HEIGHT - 1 || (x % 2 === 0 && y % 2 === 0)) return 'wall';
    const corner = Math.min(x, ARENA_WIDTH - 1 - x) <= 3 && Math.min(y, ARENA_HEIGHT - 1 - y) <= 3;
    return corner || random() > 0.68 ? 'floor' : 'block';
  }));
}

export class Match {
  constructor({ arena = makeArena(), players, random = Math.random, duration = 150, items = [], lives = 1, difficulty = 1 } = {}) {
    this.arena = arena.map(row => [...row]);
    this.random = random;
    this.players = (players ?? [
      { id: 'human', x: 1, y: 1 }, { id: 'bot1', x: 13, y: 11, bot: true },
      { id: 'bot2', x: 13, y: 1, bot: true }, { id: 'bot3', x: 1, y: 11, bot: true },
    ]).map(player => ({
      alive: true, lives, capacity: 1, range: 2, speed: 1, kick: false, cooldown: 0, facing: 2,
      spawnX: player.x, spawnY: player.y, invulnerable: 0, respawning: false,
      fromX: player.x, fromY: player.y, moveDuration: 0.18, thinkIn: 0, ...player,
    }));
    this.bombs = [];
    this.flames = [];
    this.items = items.map(item => ({ ...item }));
    this.kickItemsGenerated = this.items.filter(item => item.type === 'kick').length;
    this.events = [];
    this.remaining = duration;
    this.elapsed = 0;
    this.status = 'running';
    this.winner = null;
    this.nextBomb = 0;
    this.difficulty = Math.max(0, Math.min(1, difficulty));
    this.eliminationGroups = [];
    this.fallingBlocks = fallingBlockPath(this.arena);
    this.fallIndex = 0;
    this.nextFallAt = duration;
    this.suddenDeathAt = duration;
    this.suddenDeath = false;
    this.warnedSuddenDeath = false;
  }

  walkable(x, y) {
    return this.arena[y]?.[x] === 'floor' && !this.bombs.some(bomb => {
      if (bomb.x === x && bomb.y === y) return true;
      const direction = DIRECTIONS[bomb.slideDirection];
      return direction && bomb.x + direction[0] === x && bomb.y + direction[1] === y;
    });
  }

  canSlideBomb(bomb, dx, dy) {
    const x = bomb.x + dx, y = bomb.y + dy;
    return this.arena[y]?.[x] === 'floor'
      && !this.bombs.some(other => other !== bomb && other.x === x && other.y === y)
      && !this.players.some(player => player.alive && !player.respawning && player.x === x && player.y === y);
  }

  kickBomb(player, bomb, dx, dy) {
    if (!player.kick || DIRECTIONS[bomb.slideDirection] || !this.canSlideBomb(bomb, dx, dy)) return false;
    bomb.slideDirection = DIRECTIONS.findIndex(([x, y]) => x === dx && y === dy);
    bomb.slideProgress = 0;
    this.events.push({ type: 'kick', id: player.id, x: bomb.x, y: bomb.y });
    return true;
  }

  slideBombs(dt) {
    for (const bomb of this.bombs) {
      const direction = DIRECTIONS[bomb.slideDirection];
      if (!direction) continue;
      const [dx, dy] = direction;
      bomb.slideProgress += Math.min(dt, Math.max(0, bomb.fuse)) * KICK_SPEED;
      while (bomb.slideProgress + 0.000001 >= 1) {
        if (!this.canSlideBomb(bomb, dx, dy)) break;
        bomb.x += dx; bomb.y += dy;
        bomb.slideProgress = Math.max(0, bomb.slideProgress - 1);
      }
      if (!this.canSlideBomb(bomb, dx, dy)) {
        bomb.slideDirection = -1;
        bomb.slideProgress = 0;
      }
    }
  }

  move(id, dx, dy) {
    const player = this.players.find(candidate => candidate.id === id);
    if (this.status !== 'running' || !player?.alive || player.respawning || Math.abs(dx) + Math.abs(dy) !== 1) return false;
    player.facing = DIRECTIONS.findIndex(([x, y]) => x === dx && y === dy);
    if (player.cooldown > 0) return false;
    const bomb = this.bombs.find(candidate => candidate.x === player.x + dx && candidate.y === player.y + dy);
    if (bomb) this.kickBomb(player, bomb, dx, dy);
    if (!this.walkable(player.x + dx, player.y + dy)) return false;
    player.fromX = player.x;
    player.fromY = player.y;
    player.x += dx;
    player.y += dy;
    player.moveDuration = Math.max(0.1, 0.18 - (player.speed - 1) * 0.018);
    player.cooldown = player.moveDuration;
    const itemIndex = this.items.findIndex(item => item.x === player.x && item.y === player.y
      && (item.revealAt ?? 0) <= this.elapsed && (item.type !== 'kick' || !player.kick));
    if (itemIndex >= 0) {
      const [item] = this.items.splice(itemIndex, 1);
      const stat = { bomb: 'capacity', range: 'range', speed: 'speed' }[item.type];
      if (stat) player[stat] = Math.min(player[stat] + 1, { capacity: 5, range: 6, speed: 5 }[stat]);
      if (item.type === 'kick') player.kick = true;
      this.events.push({ type: 'pickup', id, item: item.type, x: player.x, y: player.y });
    }
    return true;
  }

  placeBomb(id) {
    const player = this.players.find(candidate => candidate.id === id);
    if (this.status !== 'running' || !player?.alive || player.respawning) return false;
    if (this.bombs.some(bomb => bomb.x === player.x && bomb.y === player.y)) return false;
    if (this.bombs.filter(bomb => bomb.owner === id).length >= player.capacity) return false;
    this.bombs.push({ id: this.nextBomb++, owner: id, x: player.x, y: player.y, range: player.range, fuse: 2 });
    this.events.push({ type: 'bomb', x: player.x, y: player.y });
    return true;
  }

  update(dt) {
    if (this.status !== 'running' || !Number.isFinite(dt) || dt <= 0) return;
    while (dt > 0.000001 && this.status === 'running') {
      const step = Math.min(dt, 0.05);
      this.tick(step);
      dt -= step;
    }
  }

  tick(dt) {
    this.elapsed += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    this.tickDeaths = [];
    for (const player of this.players) {
      player.cooldown = Math.max(0, player.cooldown - dt);
      player.invulnerable = Math.max(0, player.invulnerable - dt);
    }
    for (const flame of this.flames) flame.life -= dt;
    this.flames = this.flames.filter(flame => flame.life > 0);
    this.slideBombs(dt);
    for (const bomb of this.bombs) bomb.fuse -= dt;
    const due = this.bombs.filter(bomb => bomb.fuse <= 0.000001
      || this.flames.some(flame => flame.x === bomb.x && flame.y === bomb.y));
    if (due.length) this.explode(due);
    this.dropBlocks();
    for (const player of this.players) {
      if (player.alive && !player.respawning && player.invulnerable <= 0 && this.flames.some(flame => flame.x === player.x && flame.y === player.y)) {
        this.loseLife(player, 'explosion');
      }
    }
    for (const player of this.players) if (player.alive && player.respawning) this.respawn(player);
    if (this.tickDeaths.length) this.eliminationGroups.push([...this.tickDeaths]);
    this.actBots(dt);
    const survivors = this.players.filter(player => player.alive);
    if (survivors.length <= 1) {
      this.status = 'finished';
      this.winner = survivors.length === 1 ? survivors[0].id : null;
      this.events.push({ type: 'finished', winner: this.winner });
    }
  }

  eliminate(player, cause) {
    player.alive = false;
    player.lives = 0;
    player.respawning = false;
    this.tickDeaths.push(player.id);
    this.events.push({ type: 'eliminated', id: player.id, x: player.x, y: player.y, cause });
  }

  loseLife(player, cause) {
    player.lives--;
    this.events.push({ type: 'life-lost', id: player.id, lives: player.lives, cause });
    if (player.lives <= 0) this.eliminate(player, cause);
    else player.respawning = true;
  }

  respawn(player) {
    const candidates = [];
    for (let y = 1; y < this.arena.length - 1; y++) {
      for (let x = 1; x < this.arena[y].length - 1; x++) {
        if (this.arena[y][x] === 'floor') candidates.push({ x, y });
      }
    }
    const hazards = this.forecast();
    const freeCells = candidates.filter(({ x, y }) =>
      !this.players.some(other => other !== player && other.alive && !other.respawning && other.x === x && other.y === y)
      && !(hazards.get(`${x},${y}`) ?? []).some(window => window.end === Infinity && window.start <= 2));
    if (!freeCells.length) { this.eliminate(player, 'no-space'); return; }
    const cell = freeCells.filter(({ x, y }) => this.walkable(x, y)
      && !(hazards.get(`${x},${y}`) ?? []).some(window => window.start <= 2))
      .sort((a, b) => Math.abs(a.x - player.spawnX) + Math.abs(a.y - player.spawnY)
        - Math.abs(b.x - player.spawnX) - Math.abs(b.y - player.spawnY))[0];
    if (!cell) return; // Wait for a temporary hazard to clear before reappearing.
    player.x = player.fromX = cell.x; player.y = player.fromY = cell.y;
    player.cooldown = 0; player.invulnerable = 2; player.respawning = false;
    this.events.push({ type: 'respawned', id: player.id, x: cell.x, y: cell.y });
  }

  dropBlocks() {
    if (!this.warnedSuddenDeath && this.elapsed >= this.suddenDeathAt - 5) {
      this.warnedSuddenDeath = true;
      this.events.push({ type: 'sudden-death-warning' });
    }
    if (!this.suddenDeath && this.elapsed + 0.000001 >= this.suddenDeathAt) {
      this.suddenDeath = true;
      this.events.push({ type: 'sudden-death' });
    }
    while (this.fallIndex < this.fallingBlocks.length && this.elapsed + 0.000001 >= this.nextFallAt) {
      const { x, y } = this.fallingBlocks[this.fallIndex++];
      this.arena[y][x] = 'crushed';
      this.bombs = this.bombs.filter(bomb => bomb.x !== x || bomb.y !== y);
      this.flames = this.flames.filter(flame => flame.x !== x || flame.y !== y);
      this.items = this.items.filter(item => item.x !== x || item.y !== y);
      for (const player of this.players) {
        if (player.alive && !player.respawning && player.x === x && player.y === y) this.loseLife(player, 'crushed');
      }
      this.events.push({ type: 'block-fell', x, y });
      this.nextFallAt += 0.5;
    }
  }

  blastCells(bomb, arena = this.arena) {
    const cells = [{ x: bomb.x, y: bomb.y }];
    for (const [dx, dy] of DIRECTIONS) {
      for (let distance = 1; distance <= bomb.range; distance++) {
        const x = bomb.x + dx * distance;
        const y = bomb.y + dy * distance;
        const tile = arena[y]?.[x];
        if (!tile || tile === 'wall' || tile === 'crushed') break;
        cells.push({ x, y });
        if (tile === 'block' || this.bombs.some(other => other.x === x && other.y === y)) break;
      }
    }
    return cells;
  }

  explode(due) {
    const arenaAtDetonation = this.arena.map(row => [...row]);
    const queue = [...due];
    const detonated = new Set();
    const destroyed = new Map();
    for (let index = 0; index < queue.length; index++) {
      const bomb = queue[index];
      if (detonated.has(bomb.id)) continue;
      detonated.add(bomb.id);
      this.events.push({ type: 'explosion', x: bomb.x, y: bomb.y });
      for (const cell of this.blastCells(bomb, arenaAtDetonation)) {
        const flame = this.flames.find(other => other.x === cell.x && other.y === cell.y);
        if (flame) flame.life = FLAME_DURATION;
        else this.flames.push({ ...cell, life: FLAME_DURATION });
        this.items = this.items.filter(item => item.x !== cell.x || item.y !== cell.y);
        if (arenaAtDetonation[cell.y][cell.x] === 'block') destroyed.set(`${cell.x},${cell.y}`, cell);
        for (const other of this.bombs) {
          if (other.x === cell.x && other.y === cell.y && !detonated.has(other.id)) queue.push(other);
        }
      }
    }
    this.bombs = this.bombs.filter(bomb => !detonated.has(bomb.id));
    for (const cell of destroyed.values()) {
      this.arena[cell.y][cell.x] = 'floor';
      const drop = this.random();
      if (drop < 0.02 && this.kickItemsGenerated < this.players.length) {
        this.kickItemsGenerated++;
        this.items.push({ ...cell, type: 'kick', revealAt: this.elapsed + FLAME_DURATION });
      } else if (drop >= 0.02 && drop < 0.47) {
        const type = ['bomb', 'range', 'speed'][Math.floor(this.random() * 3)];
        this.items.push({ ...cell, type, revealAt: this.elapsed + FLAME_DURATION });
      }
    }
  }

  forecast(extraBomb) {
    const bombs = extraBomb ? [...this.bombs, extraBomb] : [...this.bombs];
    const timings = new Map(bombs.map(bomb => [bomb.id, bomb.fuse]));
    const cells = new Map(bombs.map(bomb => [bomb.id, this.blastCells(bomb)]));
    for (let pass = 0; pass < bombs.length; pass++) {
      for (const bomb of bombs) {
        for (const other of bombs) {
          if (cells.get(bomb.id).some(cell => cell.x === other.x && cell.y === other.y)) {
            timings.set(other.id, Math.min(timings.get(other.id), timings.get(bomb.id)));
          }
        }
      }
    }
    const hazards = new Map();
    const add = (x, y, start, end) => {
      const key = `${x},${y}`;
      if (!hazards.has(key)) hazards.set(key, []);
      hazards.get(key).push({ start, end });
    };
    for (const flame of this.flames) add(flame.x, flame.y, 0, flame.life);
    for (const bomb of bombs) {
      const start = timings.get(bomb.id);
      for (const cell of cells.get(bomb.id)) add(cell.x, cell.y, start, start + FLAME_DURATION);
    }
    if (this.nextFallAt - this.elapsed <= 5) {
      for (let index = this.fallIndex; index < Math.min(this.fallIndex + 8, this.fallingBlocks.length); index++) {
        const cell = this.fallingBlocks[index];
        add(cell.x, cell.y, Math.max(0, this.nextFallAt - this.elapsed + (index - this.fallIndex) * 0.5), Infinity);
      }
    }
    return hazards;
  }

  escapeRoute(player, extraBomb) {
    const hazards = this.forecast(extraBomb);
    const queue = [{ x: player.x, y: player.y, arrival: 0, path: [] }];
    const visited = new Set([`${player.x},${player.y}`]);
    for (let index = 0; index < queue.length; index++) {
      const node = queue[index];
      const windows = hazards.get(`${node.x},${node.y}`) ?? [];
      if (!windows.some(window => window.end > node.arrival)) return node.path;
      for (const direction of DIRECTIONS) {
        const [dx, dy] = direction;
        const x = node.x + dx;
        const y = node.y + dy;
        const key = `${x},${y}`;
        if (visited.has(key) || !this.walkable(x, y) || (extraBomb?.x === x && extraBomb?.y === y)) continue;
        const arrival = node.arrival + player.moveDuration;
        const threats = hazards.get(key) ?? [];
        if (threats.some(window => window.start <= 0 && window.end > 0)) continue;
        if (threats.some(window => window.start < arrival + player.moveDuration + 0.1 && window.end > arrival)) continue;
        visited.add(key);
        queue.push({ x, y, arrival, path: [...node.path, direction] });
      }
    }
    return null;
  }

  actBots(dt) {
    for (const player of this.players) {
      if (!player.bot || !player.alive || player.respawning) continue;
      player.thinkIn -= dt;
      if (player.thinkIn > 0 || player.cooldown > 0) continue;
      player.thinkIn = 0.08 + (1 - this.difficulty) * 0.3;
      const kickDirection = player.kick && DIRECTIONS.find(([dx, dy]) => {
        const bomb = this.bombs.find(candidate => candidate.x === player.x + dx && candidate.y === player.y + dy);
        return bomb && !DIRECTIONS[bomb.slideDirection] && this.canSlideBomb(bomb, dx, dy);
      });
      if (kickDirection) {
        this.move(player.id, ...kickDirection);
        continue;
      }
      const route = this.escapeRoute(player);
      if (route?.length) {
        this.move(player.id, ...route[0]);
        continue;
      }
      if (route === null) continue;
      const hypothetical = { id: -1, owner: player.id, x: player.x, y: player.y, range: player.range, fuse: 2 };
      const targetInBlast = this.blastCells(hypothetical).some(cell =>
        this.arena[cell.y][cell.x] === 'block' || this.players.some(other => other.id !== player.id && other.alive && other.x === cell.x && other.y === cell.y));
      if (targetInBlast && this.random() < 0.35 + this.difficulty * 0.4) {
        const escape = this.escapeRoute(player, hypothetical);
        if (escape?.length && this.placeBomb(player.id)) {
          this.move(player.id, ...escape[0]);
          continue;
        }
      }
      const hazards = this.forecast();
      const opponents = this.players.filter(other => other.alive && other.id !== player.id);
      const goals = [...this.items.filter(item => (item.revealAt ?? 0) <= this.elapsed && (item.type !== 'kick' || !player.kick)), ...opponents];
      const distance = (x, y) => goals.length ? Math.min(...goals.map(goal => Math.abs(goal.x - x) + Math.abs(goal.y - y))) : 0;
      const choices = DIRECTIONS.map(([dx, dy]) => ({ dx, dy, x: player.x + dx, y: player.y + dy, jitter: this.random() * (4.6 - this.difficulty * 2) }))
        .filter(choice => this.walkable(choice.x, choice.y) && !hazards.has(`${choice.x},${choice.y}`))
        .sort((a, b) => distance(a.x, a.y) + a.jitter - distance(b.x, b.y) - b.jitter);
      if (choices.length) this.move(player.id, choices[0].dx, choices[0].dy);
    }
  }

  pause() {
    if (this.status === 'running') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'running';
  }

  takeEvents() {
    return this.events.splice(0);
  }

  snapshot() {
    return {
      arena: this.arena.map(row => [...row]), players: this.players.map(player => ({ ...player })),
      bombs: this.bombs.map(bomb => ({ ...bomb })), flames: this.flames.map(flame => ({ ...flame })),
      items: this.items.map(item => ({ ...item })), remaining: this.remaining,
      elapsed: this.elapsed, status: this.status, winner: this.winner,
      eliminationGroups: this.eliminationGroups.map(group => [...group]), suddenDeath: this.suddenDeath,
      nextBlock: this.fallingBlocks[this.fallIndex] && this.nextFallAt - this.elapsed <= 5
        ? { ...this.fallingBlocks[this.fallIndex], in: Math.max(0, this.nextFallAt - this.elapsed) } : null,
    };
  }
}
