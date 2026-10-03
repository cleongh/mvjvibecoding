import Phaser from 'phaser';
import { dialogues } from '../data/dialogue.ts';
import type { DialogueDefinition, DialogueLine } from '../data/types.ts';

export default class DialogueSystem extends Phaser.Events.EventEmitter {
  current: DialogueDefinition | null = null;
  index = 0;
  closedAt = 0;

  constructor() {
    super();
    this.current = null;
    this.index = 0;
    this.closedAt = 0;
  }

  get active() {
    return this.current !== null;
  }

  start(id: string): void {
    if (this.active || !dialogues[id]) return;
    this.current = dialogues[id];
    this.index = 0;
    this.emit('line', this.current.lines[0]);
  }

  advance(): void {
    if (!this.active) return;
    this.index++;
    if (this.index < this.current.lines.length) {
      this.emit('line', this.current.lines[this.index]);
      return;
    }
    const { event } = this.current;
    this.current = null;
    this.closedAt = Date.now();
    this.emit('end');
    if (event) this.emit('event', event);
  }
}
