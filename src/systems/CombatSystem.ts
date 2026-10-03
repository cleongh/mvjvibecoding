import Phaser from 'phaser';
import type Player from '../entities/Player.ts';
import type Enemy from '../entities/Enemy.ts';
import type WorldScene from '../scenes/WorldScene.ts';

const SWORD = { damage: 1, startup: 70, active: 130, recovery: 160, reach: 30, hitSize: 44 };

export default class CombatSystem {
  readonly scene: WorldScene;
  readonly player: Player;
  phase: 'startup' | 'active' | 'recovery' | null = null;
  phaseUntil = 0;
  hitEnemies = new Set<Enemy>();
  sword: Phaser.GameObjects.Image;

  constructor(scene: WorldScene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.phase = null;
    this.phaseUntil = 0;
    this.hitEnemies = new Set();
    this.sword = scene.add.image(0, 0, 'sword').setDepth(7).setVisible(false);
  }

  tryAttack(time: number): void {
    if (this.phase) return;
    this.phase = 'startup';
    this.phaseUntil = time + SWORD.startup;
    this.player.attacking = true;
    this.hitEnemies.clear();
    this.scene.soundFx.play('sword');
  }

  update(time: number, enemies: Enemy[]): void {
    if (!this.phase) return;
    if (time >= this.phaseUntil) this.nextPhase(time);
    if (!this.phase) return;

    const { x, y } = this.player.facing;
    this.sword
      .setVisible(this.phase !== 'recovery')
      .setAlpha(this.phase === 'active' ? 1 : 0.45)
      .setPosition(this.player.x + x * SWORD.reach, this.player.y + y * SWORD.reach)
      .setRotation(Math.atan2(x, -y));

    if (this.phase === 'active') this.applyHits(time, enemies);
  }

  nextPhase(time: number): void {
    if (this.phase === 'startup') {
      this.phase = 'active';
      this.phaseUntil = time + SWORD.active;
    } else if (this.phase === 'active') {
      this.phase = 'recovery';
      this.phaseUntil = time + SWORD.recovery;
    } else {
      this.phase = null;
      this.player.attacking = false;
      this.sword.setVisible(false);
    }
  }

  applyHits(time: number, enemies: Enemy[]): void {
    const { x, y } = this.player.facing;
    const half = SWORD.hitSize / 2;
    const hitbox = new Phaser.Geom.Rectangle(
      this.player.x + x * SWORD.reach - half,
      this.player.y + y * SWORD.reach - half,
      SWORD.hitSize,
      SWORD.hitSize,
    );
    for (const enemy of enemies) {
      if (!enemy.active || enemy.state === 'dead' || this.hitEnemies.has(enemy)) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, enemy.getBounds())) continue;
      this.hitEnemies.add(enemy);
      enemy.takeHit(SWORD.damage, this.player.x, this.player.y, time);
    }
  }

  shiftTimers(delta: number): void {
    this.phaseUntil += delta;
  }
}
