import Phaser from 'phaser';
import type Player from './Player.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type { Facing } from '../data/types.ts';

const SPEED = 360;
const MAX_DISTANCE = 240;
const CATCH_DISTANCE = 24;

export default class Boomerang extends Phaser.GameObjects.Image {
  declare scene: WorldScene;
  readonly direction: Facing;
  returning = false;
  travelled = 0;

  constructor(scene: WorldScene, x: number, y: number, direction: Facing) {
    super(scene, x, y, 'boomerang');
    scene.add.existing(this);
    this.setDepth(7);
    this.direction = { ...direction };
  }

  turnBack(): void {
    this.returning = true;
  }

  update(delta: number, player: Player): void {
    const step = SPEED * delta / 1000;
    this.setRotation(this.rotation + delta * 0.025);

    if (!this.returning) {
      this.x += this.direction.x * step;
      this.y += this.direction.y * step;
      this.travelled += step;
      const tile = this.scene.layer.getTileAtWorldXY(this.x, this.y);
      if (this.travelled >= MAX_DISTANCE || tile?.collides) this.turnBack();
      return;
    }

    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    if (toPlayer.length() <= CATCH_DISTANCE) {
      this.scene.onBoomerangCaught(this);
      this.destroy();
      return;
    }
    toPlayer.normalize().scale(step * 1.25);
    this.x += toPlayer.x;
    this.y += toPlayer.y;
  }
}
