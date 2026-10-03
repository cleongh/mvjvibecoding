import Phaser from 'phaser';
import { enemies } from '../data/enemies.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type { EnemyDefinition, EnemyId, EnemyState } from '../data/types.ts';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare scene: WorldScene;
  declare body: Phaser.Physics.Arcade.Body;
  readonly config: EnemyDefinition;
  readonly room: string;
  readonly isBoss: boolean;
  hp: number;
  state: EnemyState = 'idle';
  stateUntil = 0;
  direction = new Phaser.Math.Vector2(0, 1);
  hitLanded = false;

  constructor(scene: WorldScene, x: number, y: number, type: EnemyId, room: string) {
    const config = enemies[type];
    super(scene, x, y, config.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.config = config;
    this.room = room;
    this.hp = config.hp;
    this.isBoss = Boolean(config.boss);
    this.state = 'idle';
    this.stateUntil = 0;
    this.direction = new Phaser.Math.Vector2(0, 1);
    this.hitLanded = false;
    this.setDepth(5);
    const offset = this.width / 2 - config.radius;
    this.body.setCircle(config.radius, offset, offset);
  }

  changeState(state: EnemyState, time: number, duration = 0): void {
    this.state = state;
    this.stateUntil = time + duration;
  }

  freeze(): void {
    this.body.setVelocity(0, 0);
  }

  shiftTimers(delta: number): void {
    this.stateUntil += delta;
  }

  updateAI(time: number, player: import('./Player.ts').default): void {
    if (this.state === 'dead') return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const { config } = this;

    switch (this.state) {
      case 'idle':
        if (distance < config.sight) this.changeState('chase', time);
        break;
      case 'chase':
        if (distance < config.attackRange) {
          this.freeze();
          this.direction.set(player.x - this.x, player.y - this.y).normalize();
          this.changeState('windup', time, config.windup);
          this.setTint(0xffd36b);
        } else if (distance > config.sight * 1.6) {
          this.freeze();
          this.changeState('idle', time);
        } else {
          this.scene.physics.moveToObject(this, player, config.speed);
        }
        break;
      case 'windup':
        this.setScale(1 + 0.12 * Math.sin(time / 35));
        if (time >= this.stateUntil) {
          this.setScale(1);
          this.clearTint();
          this.hitLanded = false;
          this.body.setVelocity(this.direction.x * config.lunge.speed, this.direction.y * config.lunge.speed);
          this.changeState('attack', time, config.lunge.duration);
        }
        break;
      case 'attack':
        if (!this.hitLanded && distance < config.hitRadius) {
          this.hitLanded = true;
          player.takeDamage(config.damage, this.x, this.y, time);
        }
        if (time >= this.stateUntil) {
          this.freeze();
          this.changeState('recovery', time, config.recovery);
        }
        break;
      case 'recovery':
      case 'hurt':
        if (time >= this.stateUntil) {
          this.clearTint();
          this.changeState('chase', time);
        }
        break;
      default:
        break;
    }
  }

  takeHit(amount: number, fromX: number, fromY: number, time: number): void {
    if (this.state === 'dead') return;
    this.scene.soundFx.play('hit');
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return;
    }
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize();
    this.setScale(1);
    this.setTint(0xff6666);
    this.body.setVelocity(away.x * 220, away.y * 220);
    this.changeState('hurt', time, 220);
  }

  die(): void {
    this.state = 'dead';
    this.body.enable = false;
    this.clearTint();
    this.scene.onEnemyDefeated(this);
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 1.4, duration: 220, onComplete: () => this.destroy(),
    });
  }
}
