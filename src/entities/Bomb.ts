import Phaser from 'phaser';
import type WorldScene from '../scenes/WorldScene.ts';

const FUSE_MS = 1800;

export default class Bomb extends Phaser.GameObjects.Image {
  declare scene: WorldScene;

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    this.setDepth(8);
    scene.tweens.add({
      targets: this,
      alpha: 0.45,
      scale: 1.2,
      duration: 180,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
    });
    scene.time.delayedCall(FUSE_MS, () => {
      if (!this.active) return;
      this.scene.explodeBomb(this.x, this.y);
      this.destroy();
    });
  }
}
