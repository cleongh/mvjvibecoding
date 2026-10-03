import Phaser from 'phaser';
import { items, jewelIds } from '../data/items.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type { RewardContents } from '../data/types.ts';

function grantReward(inventory: WorldScene['inventory'], contents: RewardContents): void {
  if ('heartPiece' in contents) {
    inventory.addHeartPiece();
    return;
  }
  inventory.add(contents.item);
  inventory.notify(`Has conseguido: ${items[contents.item].name}`);
}

function addStaticBody(scene: WorldScene, sprite: Phaser.GameObjects.Sprite): void {
  scene.add.existing(sprite);
  scene.physics.add.existing(sprite, true);
  sprite.setDepth(3);
}

export class Chest extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  readonly id: string;
  readonly contents: RewardContents;
  readonly interactRadius = 48;
  opened: boolean;

  constructor(scene: WorldScene, id: string, x: number, y: number, contents: RewardContents) {
    super(scene, x, y, 'chest_closed');
    addStaticBody(scene, this);
    this.id = id;
    this.contents = contents;
    this.opened = scene.inventory.hasFlag(id);
    if (this.opened) this.setTexture('chest_open');
  }

  interact(): void {
    if (this.opened) return;
    this.opened = true;
    this.setTexture('chest_open');
    this.scene.inventory.setFlag(this.id);
    this.scene.soundFx.play('chest');
    grantReward(this.scene.inventory, this.contents);
  }
}

export class LockedDoor extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  readonly id: string;
  readonly interactRadius = 70;

  constructor(scene: WorldScene, id: string, x: number, y: number) {
    super(scene, x, y, 'door');
    addStaticBody(scene, this);
    this.id = id;
  }

  interact(): void {
    const { inventory } = this.scene;
    if (!inventory.has('small_key')) {
      inventory.notify('La puerta está cerrada. Necesitas una llave pequeña');
      return;
    }
    inventory.remove('small_key');
    inventory.setFlag(this.id);
    this.scene.soundFx.play('unlock');
    inventory.notify('Puerta abierta');
    this.destroy();
  }
}

export class Fountain extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  readonly interactRadius = 76;

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'fountain');
    addStaticBody(scene, this);
  }

  interact(): void {
    const { inventory, dialogue } = this.scene;
    const complete = jewelIds.every((id) => inventory.has(id));
    dialogue.start(complete ? 'fountain_complete' : 'fountain_missing');
  }
}

export class Pickup extends Phaser.GameObjects.Image {
  declare scene: WorldScene;
  readonly id: string;
  readonly contents: RewardContents;

  constructor(scene: WorldScene, id: string, x: number, y: number, contents: RewardContents) {
    super(scene, x, y, 'heartPiece' in contents ? 'heart_piece' : `item_${contents.item}`);
    scene.add.existing(this);
    this.setDepth(4);
    this.id = id;
    this.contents = contents;
  }

  collect(): void {
    this.scene.inventory.setFlag(this.id);
    this.scene.soundFx.play('heartPiece' in this.contents ? 'heart' : 'pickup');
    grantReward(this.scene.inventory, this.contents);
    this.destroy();
  }
}
