import Phaser from 'phaser';
import type WorldScene from '../scenes/WorldScene.ts';
import type { Facing } from '../data/types.ts';

const SPEED = 420;

export default class Arrow extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  declare body: Phaser.Physics.Arcade.Body;
  readonly direction: Facing;
  readonly damage = 2;

  constructor(scene: WorldScene, x: number, y: number, direction: Facing) {
    super(scene, x, y, 'arrow');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
    this.direction = { ...direction };

    const angle = Math.atan2(direction.y, direction.x);
    this.setRotation(angle);

    this.body.setVelocity(direction.x * SPEED, direction.y * SPEED);
    this.body.setSize(12, 12);

    scene.time.delayedCall(1200, () => {
      if (this.active) this.destroy();
    });
  }
}
