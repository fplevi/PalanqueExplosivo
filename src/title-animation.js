import { CHARACTERS } from './characters.js';

const FINALISTS = ['lula', 'flavio'];
const others = CHARACTERS.filter(character => !FINALISTS.includes(character.id));
const lineup = [...others.slice(0, 5), ...FINALISTS.map(id => CHARACTERS.find(character => character.id === id)), ...others.slice(5)];
const positions = characters => new Map(characters.map((character, index) => [character.id, 320 + (index - (characters.length - 1) / 2) * 42]));

export class TitleAnimation {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.characters = [...lineup];
    this.previousPositions = positions(this.characters);
    this.layoutStarted = -1;
    this.holder = this.pick(others).id;
    this.phase = 'holding';
    this.phaseStarted = 0;
    this.nextEvent = 0.7;
    this.fuseEnds = 3.5 + this.random() * 1.5;
    this.recipient = null;
  }

  pick(characters) {
    return characters[Math.floor(this.random() * characters.length)];
  }

  update(dt) {
    const end = this.time + Math.max(0, dt);
    while (this.nextEvent <= end) {
      this.time = this.nextEvent;
      if (this.phase === 'exploding') {
        this.previousPositions = new Map(this.snapshot().characters.map(character => [character.id, character.x]));
        this.characters = this.characters.filter(character => character.id !== this.holder);
        this.layoutStarted = this.time;
        this.holder = this.pick(this.characters).id;
        this.fuseEnds = this.characters.length === 2 ? Infinity : this.time + 3.5 + this.random() * 1.5;
        this.hold();
      } else if (this.phase === 'passing') {
        this.holder = this.recipient;
        this.recipient = null;
        if (this.canExplode()) this.explode();
        else this.hold();
      } else if (this.canExplode()) {
        this.explode();
      } else {
        let recipients = this.characters.filter(character => character.id !== this.holder);
        // If a finalist has the bomb at the deadline, hand it to an eliminable character.
        if (this.time >= this.fuseEnds) recipients = recipients.filter(character => !FINALISTS.includes(character.id));
        this.recipient = this.pick(recipients).id;
        this.phase = 'passing';
        this.phaseStarted = this.time;
        this.nextEvent = this.time + 0.55;
      }
    }
    this.time = end;
  }

  canExplode() {
    return this.time >= this.fuseEnds && !FINALISTS.includes(this.holder);
  }

  hold() {
    this.phase = 'holding';
    this.phaseStarted = this.time;
    this.nextEvent = this.time + 0.35 + this.random() * 0.35;
    if (!FINALISTS.includes(this.holder)) this.nextEvent = Math.min(this.nextEvent, this.fuseEnds);
  }

  explode() {
    this.phase = 'exploding';
    this.phaseStarted = this.time;
    this.nextEvent = this.time + 0.6;
  }

  snapshot() {
    const targetPositions = positions(this.characters);
    const layoutProgress = Math.min(1, Math.max(0, (this.time - this.layoutStarted) / 0.65));
    const progress = Math.min(1, (this.time - this.phaseStarted) / (this.nextEvent - this.phaseStarted));
    return {
      time: this.time, phase: this.phase, progress, holder: this.holder, recipient: this.recipient,
      characters: this.characters.map(character => ({
        ...character,
        x: this.previousPositions.get(character.id) * (1 - layoutProgress) + targetPositions.get(character.id) * layoutProgress,
      })),
    };
  }
}
