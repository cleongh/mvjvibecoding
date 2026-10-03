import Phaser from 'phaser';
import type WorldScene from '../scenes/WorldScene.ts';

export default class NPC extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  readonly id: string;
  readonly dialogueId: string;
  readonly repeatId?: string;
  readonly interactRadius = 48;

  constructor(scene: WorldScene, id: string, x: number, y: number, { texture, dialogue, repeat }: { texture: string; dialogue: string; repeat?: string }) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(3);
    this.id = id;
    this.dialogueId = dialogue;
    this.repeatId = repeat;
  }

  interact(): void {
    const { inventory, dialogue } = this.scene;
    const metFlag = `${this.id}:met`;
    if (this.repeatId && inventory.hasFlag(metFlag)) {
      dialogue.start(this.repeatId);
      return;
    }
    inventory.setFlag(metFlag);
    dialogue.start(this.dialogueId);
  }
}
