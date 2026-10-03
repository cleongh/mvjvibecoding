import Phaser from 'phaser';
import { items } from '../data/items.ts';
import type { ItemDefinition, ItemId } from '../data/types.ts';

const HEARTS_PER_CONTAINER_PIECES = 4;

export default class InventorySystem extends Phaser.Events.EventEmitter {
  maxHealth = 3;
  health = 3;
  heartPieces = 0;
  items: Partial<Record<ItemId, number>> = {};
  flags = new Set<string>();
  paused = false;
  areaTitle = '';

  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.maxHealth = 3;
    this.health = 3;
    this.heartPieces = 0;
    this.items = {};
    this.flags = new Set();
    this.paused = false;
    this.areaTitle = '';
    this.emit('changed');
  }

  setArea(title: string): void {
    this.areaTitle = title;
    this.emit('changed');
  }

  notify(text: string): void {
    this.emit('notify', text);
  }

  setFlag(flag: string): void {
    this.flags.add(flag);
  }

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  add(id: ItemId, amount = 1): void {
    this.items[id] = (this.items[id] || 0) + amount;
    this.emit('changed');
  }

  count(id: ItemId): number {
    return this.items[id] || 0;
  }

  has(id: ItemId): boolean {
    return this.count(id) > 0;
  }

  remove(id: ItemId, amount = 1): void {
    this.items[id] = Math.max(0, this.count(id) - amount);
    this.emit('changed');
  }

  list(): { item: ItemDefinition; count: number }[] {
    return Object.entries(this.items)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({ item: items[id], count }));
  }

  use(id: ItemId): boolean {
    const item = items[id];
    if (!item || item.type !== 'consumable' || !this.has(id)) return false;
    if (this.health >= this.maxHealth) {
      this.notify('Ya tienes la vida completa');
      return false;
    }
    this.remove(id);
    this.heal(item.heal);
    return true;
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.emit('changed');
  }

  fullHeal() {
    this.health = this.maxHealth;
    this.emit('changed');
  }

  damage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.emit('changed');
  }

  addHeartPiece(): void {
    this.heartPieces++;
    if (this.heartPieces % HEARTS_PER_CONTAINER_PIECES === 0) {
      this.maxHealth++;
      this.health = this.maxHealth;
      this.notify('¡Corazón completo! Vida restaurada');
    } else {
      this.notify(`Pieza de corazón (${this.heartPieces % HEARTS_PER_CONTAINER_PIECES}/${HEARTS_PER_CONTAINER_PIECES})`);
    }
    this.emit('changed');
  }
}
