import Phaser from 'phaser';
import type InventorySystem from '../systems/InventorySystem.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type { Facing } from '../data/types.ts';

export default class Player extends Phaser.GameObjects.Sprite {
  declare scene: WorldScene;
  declare body: Phaser.Physics.Arcade.Body;
  readonly inventory: InventorySystem;
  readonly speed = 150;
  facing: Facing = { x: 0, y: 1 };
  attacking = false;
  invulnerableUntil = 0;
  knockbackUntil = 0;
  shieldSprite: Phaser.GameObjects.Rectangle;
  keys!: Record<'up' | 'down' | 'left' | 'right' | 'attack' | 'interact', Phaser.Input.Keyboard.Key>;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: WorldScene, x: number, y: number, inventory: InventorySystem) {
    super(scene, x, y, 'hero');
    this.inventory = inventory;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
    this.body.setCollideWorldBounds(true);
    this.body.setSize(18, 20).setOffset(7, 10);
    this.attacking = false;
    this.invulnerableUntil = 0;
    this.knockbackUntil = 0;
    this.shieldSprite = scene.add.rectangle(0, 0, 10, 14, 0x4180ab).setDepth(8).setVisible(false);
    this.keys = scene.input.keyboard!.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D', attack: 'SPACE', interact: 'E',
    }) as typeof this.keys;
    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  readInput(): { dir: Phaser.Math.Vector2; attack: boolean; interact: boolean } {
    const { keys, cursors } = this;
    const { JustDown } = Phaser.Input.Keyboard;
    const dir = new Phaser.Math.Vector2(
      Number(keys.right.isDown || cursors.right.isDown) - Number(keys.left.isDown || cursors.left.isDown),
      Number(keys.down.isDown || cursors.down.isDown) - Number(keys.up.isDown || cursors.up.isDown),
    );
    return { dir, attack: JustDown(keys.attack), interact: JustDown(keys.interact) };
  }

  applyMovement(dir: Phaser.Math.Vector2, time: number): void {
    if (time < this.knockbackUntil) return;
    if (dir.lengthSq() === 0) {
      this.body.setVelocity(0, 0);
    } else {
      dir.normalize();
      const speed = this.attacking ? this.speed * 0.4 : this.speed;
      this.body.setVelocity(dir.x * speed, dir.y * speed);
      if (!this.attacking) {
        const horizontal = Math.abs(dir.x) > Math.abs(dir.y);
        this.facing = horizontal
          ? { x: Math.sign(dir.x) as -1 | 1, y: 0 }
          : { x: 0, y: Math.sign(dir.y) as -1 | 1 };
      }
      if (dir.x !== 0) this.setFlipX(dir.x < 0);
    }

    const hasShield = !this.attacking;
    this.shieldSprite.setVisible(hasShield);
    if (hasShield) {
      const shieldDist = 12;
      this.shieldSprite.setPosition(this.x + this.facing.x * shieldDist, this.y + this.facing.y * shieldDist);
    }
  }

  takeDamage(amount: number, fromX: number, fromY: number, time: number): void {
    if (time < this.invulnerableUntil || this.inventory.health <= 0) return;
    this.invulnerableUntil = time + 1000;
    this.knockbackUntil = time + 180;
    this.inventory.damage(amount);
    this.scene.soundFx.play('hurt');
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize();
    this.body.setVelocity(away.x * 260, away.y * 260);
    this.setTint(0xff8b70);
    this.scene.time.delayedCall(180, () => this.clearTint());
    this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, repeat: 3, duration: 100, onComplete: () => this.setAlpha(1) });
    if (this.inventory.health <= 0) this.scene.onPlayerDefeated();
  }
}
