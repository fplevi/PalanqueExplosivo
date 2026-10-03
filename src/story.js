import { CHARACTERS } from './characters.js';

export const BOSSES = ['lula', 'flavio'];
export const STORY_SAVE_KEY = 'bomber-politicos.story.v1';

export function storyCharacters() {
  return CHARACTERS.filter(character => !BOSSES.includes(character.id));
}

function qualifiers(groups, slots) {
  const qualified = [];
  for (const group of groups) {
    const available = slots - qualified.length;
    if (group.length > available) return { qualified, tied: group, slots: available };
    qualified.push(...group);
    if (qualified.length === slots) return { qualified, tied: [], slots: 0 };
  }
  throw new Error('Resultado incompleto da partida.');
}

function rankedCharacters(view) {
  const character = id => view.players.find(player => player.id === id).character;
  const survivors = view.players.filter(player => player.alive).map(player => player.character);
  return [...(survivors.length ? [survivors] : []), ...view.eliminationGroups.slice().reverse().map(group => group.map(character))];
}

export class Story {
  constructor(character, random = Math.random) {
    if (!storyCharacters().some(candidate => candidate.id === character)) throw new Error('Personagem indisponível no Modo história.');
    this.character = character;
    this.order = storyCharacters().map(candidate => candidate.id).filter(id => id !== character);
    for (let index = this.order.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [this.order[index], this.order[other]] = [this.order[other], this.order[index]];
    }
    this.stage = 0;
    this.finalists = [];
    this.spectating = false;
    this.tie = null;
    this.completed = false;
  }

  get preliminaryStages() { return Math.ceil(this.order.length / 3); }
  get semifinal() { return this.stage === this.preliminaryStages; }
  get final() { return this.stage === this.preliminaryStages + 1; }
  get totalStages() { return this.preliminaryStages + 2; }
  get title() {
    const name = this.semifinal ? 'Primeiro turno' : this.final ? 'Segundo turno' : 'Disputa eleitoral';
    return `Fase ${this.stage + 1}/${this.totalStages} · ${this.tie ? 'Desempate' : name}`;
  }

  participants() {
    const characters = this.tie?.tied ?? (this.semifinal ? [this.character, ...BOSSES] : this.final ? this.finalists
      : [this.character, ...this.order.slice(this.stage * 3, this.stage * 3 + 3)]);
    const corners = [[1, 1], [13, 11], [13, 1], [1, 11]];
    return characters.map((character, index) => ({
      id: character === this.character ? 'human' : character,
      character, x: corners[index][0], y: corners[index][1],
      bot: this.spectating || character !== this.character,
      lives: this.tie ? 1 : this.final || (!this.spectating && character === this.character) ? 3 : 1,
    }));
  }

  restart() { this.tie = null; this.spectating = false; this.completed = false; }

  // A single, untied third place is a failure before the two bots finish.
  eliminatedFirst(view) {
    return this.semifinal && (!this.tie || this.tie.slots === 2) && view.eliminationGroups[0]?.length === 1
      && view.eliminationGroups[0][0] === 'human';
  }

  failedDuringMatch(view) {
    if (this.spectating || view.status === 'finished') return false;
    const human = view.players.find(player => player.id === 'human');
    if (!human || human.alive) return false;
    return !this.semifinal || this.eliminatedFirst(view);
  }

  resolve(view) {
    const slots = this.tie?.slots ?? (this.semifinal ? 2 : 1);
    const previous = this.tie?.qualified ?? [];
    const result = qualifiers(rankedCharacters(view), slots);
    if (result.tied.length) {
      this.tie = { ...result, qualified: [...previous, ...result.qualified] };
      return { kind: 'tie' };
    }
    const qualified = [...previous, ...result.qualified];
    if (!this.spectating && !qualified.includes(this.character)) return { kind: 'defeat' };
    this.tie = null;
    if (this.final) {
      this.completed = true;
      return { kind: 'complete', winner: qualified[0] };
    }
    if (this.semifinal) this.finalists = qualified;
    this.stage++;
    return { kind: 'advance' };
  }

  serialize() {
    return JSON.stringify({ version: 2, character: this.character, order: this.order, stage: this.stage,
      finalists: this.finalists, spectating: this.final && this.spectating, completed: this.completed });
  }

  static restore(value) {
    try {
      const data = JSON.parse(value);
      if (![1, 2].includes(data?.version) || !Number.isInteger(data.stage) || data.stage < 0) return null;
      const story = new Story(data.character, () => 0);
      // Keep existing campaigns: each three old duels now form one preliminary phase.
      const stage = data.version === 1 ? data.stage < story.order.length ? Math.floor(data.stage / 3)
        : story.preliminaryStages + data.stage - story.order.length : data.stage;
      if (!Array.isArray(data.order) || data.order.length !== story.order.length
        || new Set(data.order).size !== data.order.length || data.order.some(id => !story.order.includes(id))
        || stage >= story.totalStages
        || typeof data.spectating !== 'boolean' || typeof data.completed !== 'boolean'
        || !Array.isArray(data.finalists)) return null;
      if (stage === story.totalStages - 1 && (data.finalists.length !== 2
        || new Set(data.finalists).size !== 2 || data.finalists.some(id => ![data.character, ...BOSSES].includes(id))
        || (!data.spectating && !data.finalists.includes(data.character))
        || (data.spectating && data.finalists.includes(data.character)))) return null;
      Object.assign(story, { order: data.order, stage, finalists: data.finalists,
        spectating: stage === story.totalStages - 1 && data.spectating, completed: data.completed });
      return story.completed ? null : story;
    } catch { return null; }
  }
}
