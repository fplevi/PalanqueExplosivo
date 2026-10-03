export const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const ARENA_WIDTH = 15;
export const ARENA_HEIGHT = 13;

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
  constructor({ arena = makeArena(), players, random = Math.random, duration = 150, items = [] } = {}) {
    this.arena = arena.map(row => [...row]);
    this.random = random;
    this.players = (players ?? [
      { id: 'human', x: 1, y: 1 }, { id: 'bot1', x: 13, y: 11, bot: true },
      { id: 'bot2', x: 13, y: 1, bot: true }, { id: 'bot3', x: 1, y: 11, bot: true },
    ]).map(player => ({
      alive: true, capacity: 1, range: 2, speed: 1, cooldown: 0, facing: 2,
      fromX: player.x, fromY: player.y, moveDuration: 0.18, thinkIn: 0, ...player,
    }));
    this.bombs = [];
    this.flames = [];
    this.items = items.map(item => ({ ...item }));
    this.events = [];
    this.remaining = duration;
    this.elapsed = 0;
    this.status = 'running';
    this.winner = null;
    this.nextBomb = 0;
  }

  walkable(x, y) {
    return this.arena[y]?.[x] === 'floor' && !this.bombs.some(bomb => bomb.x === x && bomb.y === y);
  }

  move(id, dx, dy) {
    const player = this.players.find(candidate => candidate.id === id);
    if (this.status !== 'running' || !player?.alive || Math.abs(dx) + Math.abs(dy) !== 1) return false;
    player.facing = DIRECTIONS.findIndex(([x, y]) => x === dx && y === dy);
    if (player.cooldown > 0 || !this.walkable(player.x + dx, player.y + dy)) return false;
    player.fromX = player.x;
    player.fromY = player.y;
    player.x += dx;
    player.y += dy;
    player.moveDuration = Math.max(0.1, 0.18 - (player.speed - 1) * 0.018);
    player.cooldown = player.moveDuration;
    const itemIndex = this.items.findIndex(item => item.x === player.x && item.y === player.y && (item.revealAt ?? 0) <= this.elapsed);
    if (itemIndex >= 0) {
      const [item] = this.items.splice(itemIndex, 1);
      const stat = { bomb: 'capacity', range: 'range', speed: 'speed' }[item.type];
      if (stat) player[stat] = Math.min(player[stat] + 1, { capacity: 5, range: 6, speed: 5 }[stat]);
      this.events.push({ type: 'pickup', id, item: item.type, x: player.x, y: player.y });
    }
    return true;
  }

  placeBomb(id) {
    const player = this.players.find(candidate => candidate.id === id);
    if (this.status !== 'running' || !player?.alive) return false;
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
    for (const player of this.players) player.cooldown = Math.max(0, player.cooldown - dt);
    for (const flame of this.flames) flame.life -= dt;
    this.flames = this.flames.filter(flame => flame.life > 0);
    for (const bomb of this.bombs) bomb.fuse -= dt;
    const due = this.bombs.filter(bomb => bomb.fuse <= 0.000001);
    if (due.length) this.explode(due);
    for (const player of this.players) {
      if (player.alive && this.flames.some(flame => flame.x === player.x && flame.y === player.y)) {
        player.alive = false;
        this.events.push({ type: 'eliminated', id: player.id, x: player.x, y: player.y });
      }
    }
    this.actBots(dt);
    const survivors = this.players.filter(player => player.alive);
    if (survivors.length <= 1 || this.remaining <= 0) {
      this.status = 'finished';
      this.winner = survivors.length === 1 ? survivors[0].id : null;
      this.events.push({ type: 'finished', winner: this.winner });
    }
  }

  blastCells(bomb, arena = this.arena) {
    const cells = [{ x: bomb.x, y: bomb.y }];
    for (const [dx, dy] of DIRECTIONS) {
      for (let distance = 1; distance <= bomb.range; distance++) {
        const x = bomb.x + dx * distance;
        const y = bomb.y + dy * distance;
        const tile = arena[y]?.[x];
        if (!tile || tile === 'wall') break;
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
        if (flame) flame.life = 0.55;
        else this.flames.push({ ...cell, life: 0.55 });
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
      if (this.random() < 0.45) {
        const type = ['bomb', 'range', 'speed'][Math.floor(this.random() * 3)];
        this.items.push({ ...cell, type, revealAt: this.elapsed + 0.55 });
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
      for (const cell of cells.get(bomb.id)) add(cell.x, cell.y, start, start + 0.55);
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
      if (!player.bot || !player.alive) continue;
      player.thinkIn -= dt;
      if (player.thinkIn > 0 || player.cooldown > 0) continue;
      player.thinkIn = 0.08;
      const route = this.escapeRoute(player);
      if (route?.length) {
        this.move(player.id, ...route[0]);
        continue;
      }
      if (route === null) continue;
      const hypothetical = { id: -1, owner: player.id, x: player.x, y: player.y, range: player.range, fuse: 2 };
      const targetInBlast = this.blastCells(hypothetical).some(cell =>
        this.arena[cell.y][cell.x] === 'block' || this.players.some(other => other.id !== player.id && other.alive && other.x === cell.x && other.y === cell.y));
      if (targetInBlast && this.random() < 0.75) {
        const escape = this.escapeRoute(player, hypothetical);
        if (escape?.length && this.placeBomb(player.id)) {
          this.move(player.id, ...escape[0]);
          continue;
        }
      }
      const hazards = this.forecast();
      const opponents = this.players.filter(other => other.alive && other.id !== player.id);
      const goals = [...this.items.filter(item => (item.revealAt ?? 0) <= this.elapsed), ...opponents];
      const distance = (x, y) => goals.length ? Math.min(...goals.map(goal => Math.abs(goal.x - x) + Math.abs(goal.y - y))) : 0;
      const choices = DIRECTIONS.map(([dx, dy]) => ({ dx, dy, x: player.x + dx, y: player.y + dy, jitter: this.random() * 2.6 }))
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
    };
  }
}
