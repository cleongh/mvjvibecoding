import Phaser from 'phaser';
import Enemy from './Enemy.ts';
import { ArrowPickup } from './Interactables.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type Player from './Player.ts';
import type { EnemyId } from '../data/types.ts';

export class GohmaLarva extends Enemy {
  constructor(scene: WorldScene, x: number, y: number, room: string) {
    super(scene, x, y, 'gohma_larva', room);
    this.setDepth(5);
  }

  override die(): void {
    if (this.scene.inventory.has('bow')) {
      const dropAmount = this.scene.inventory.count('arrow') <= 3 ? 4 : 2;
      this.scene.arrowPickups.push(new ArrowPickup(this.scene, this.x, this.y, dropAmount));
    }
    super.die();
  }
}

export default class Gohma extends Enemy {
  eyeOpen = false;
  attackCount = 0;
  chaseTimer = 0;

  constructor(scene: WorldScene, x: number, y: number, room: string) {
    super(scene, x, y, 'boss_gohma', room);
    this.eyeOpen = false;
    this.attackCount = 0;
    this.chaseTimer = 0;
  }

  override updateAI(time: number, player: Player): void {
    if (this.state === 'dead') return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const { config } = this;

    switch (this.state) {
      case 'idle':
        this.eyeOpen = false;
        this.setTexture('boss_gohma');
        if (distance < config.sight) {
          this.chaseTimer = time;
          this.changeState('chase', time);
        }
        break;

      case 'chase': {
        this.eyeOpen = false;
        this.setTexture('boss_gohma');

        // Movimiento arácnido hacia el jugador con balanceo lateral
        const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
        const lateral = new Phaser.Math.Vector2(-toPlayer.y, toPlayer.x).scale(Math.sin(time / 140) * 0.6);
        const crawlDir = toPlayer.add(lateral).normalize();
        this.body.setVelocity(crawlDir.x * config.speed, crawlDir.y * config.speed);

        // Cada 2.4 - 3.2 segundos o si está cerca, abre el ojo para preparar un ataque
        const chaseDuration = time - this.chaseTimer;
        if (distance < config.attackRange || chaseDuration > 2800) {
          this.freeze();
          this.eyeOpen = true;
          this.setTexture('boss_gohma_open');
          this.direction.set(player.x - this.x, player.y - this.y).normalize();
          this.changeState('windup', time, config.windup);
          this.scene.soundFx.play('enemyAttack');
        }
        break;
      }

      case 'windup':
        // El ojo gigante está abierto y expuesto. Parpadeo y pulso amenazante.
        this.eyeOpen = true;
        this.setTexture('boss_gohma_open');
        this.setScale(1 + 0.1 * Math.sin(time / 45));

        if (time >= this.stateUntil) {
          this.setScale(1);
          this.hitLanded = false;
          this.performAttack(player);
          this.changeState('attack', time, 500);
        }
        break;

      case 'attack':
        if (time >= this.stateUntil) {
          this.freeze();
          this.eyeOpen = false;
          this.setTexture('boss_gohma');
          this.changeState('recovery', time, config.recovery);
        }
        break;

      case 'recovery':
      case 'hurt':
        this.eyeOpen = false;
        this.setTexture('boss_gohma');
        if (time >= this.stateUntil) {
          this.clearTint();
          this.chaseTimer = time;
          this.changeState('chase', time);
        }
        break;

      case 'stunned':
        this.freeze();
        this.eyeOpen = true;
        this.setTexture('boss_gohma_stunned');
        this.setScale(1 + 0.04 * Math.sin(time / 30));
        if (time >= this.stateUntil) {
          this.setScale(1);
          this.clearTint();
          this.eyeOpen = false;
          this.setTexture('boss_gohma');
          this.changeState('recovery', time, 800);
        }
        break;

      default:
        break;
    }
  }

  private performAttack(player: Player): void {
    this.attackCount++;
    if (this.attackCount % 2 === 1) {
      // Disparo de proyectil hacia el jugador
      this.scene.spawnProjectile(this.x, this.y, player.x, player.y);
      this.scene.time.delayedCall(160, () => {
        if (this.active && this.state !== 'dead') {
          this.scene.spawnProjectile(this.x, this.y, player.x, player.y);
        }
      });
    } else {
      // Puesta de larva de Gohma
      this.spawnLarva();
    }
  }

  private spawnLarva(): void {
    const offsetX = (Math.random() - 0.5) * 36;
    const offsetY = 16 + Math.random() * 16;
    const larva = new GohmaLarva(this.scene, this.x + offsetX, this.y + offsetY, this.room);
    this.scene.addEnemy(larva);
    this.scene.spawnSparks(this.x + offsetX, this.y + offsetY, 0x5a9e6b);
    this.scene.soundFx.play('enemyAttack');
  }

  takeArrowHit(amount: number, arrowX: number, arrowY: number, time: number): void {
    if (this.state === 'dead') return;

    if (this.state === 'stunned') {
      // Flechazo mientras está aturdido: daño adicional directo
      this.hp -= amount;
      this.scene.soundFx.play('hit');
      this.scene.spawnSparks(this.x, this.y, 0xff4433);
      this.setTint(0xff5555);
      this.scene.time.delayedCall(120, () => {
        if (this.active && this.state === 'stunned') this.setTint(0x8bd8d0);
      });
      if (this.hp <= 0) this.die();
      return;
    }

    if (this.eyeOpen && this.state === 'windup') {
      // ¡IMPACTO CRÍTICO DIRECTO EN EL OJO ABIERTO!
      this.hp -= amount;
      this.scene.soundFx.play('gohmaScreech');
      this.scene.cameras.main.shake(180, 0.008);
      this.scene.spawnSparks(this.x, this.y, 0xff2222);

      if (this.hp <= 0) {
        this.die();
        return;
      }

      // Gohma cae aturdido durante 4.5 segundos exponiendo su ojo a ataques
      this.stun(time, 4500);
      return;
    }

    // El caparazón blindado desvía la flecha (ojo cerrado)
    this.scene.soundFx.play('clink');
    this.scene.spawnSparks(arrowX, arrowY, 0xffee88);
  }

  override takeHit(amount: number, fromX: number, fromY: number, time: number): void {
    if (this.state === 'dead') return;

    if (this.state === 'stunned') {
      // Atacable con espada durante el aturdimiento
      this.scene.soundFx.play('hit');
      this.hp -= amount;
      this.scene.spawnSparks(this.x, this.y, 0xff4433);
      this.setTint(0xff5555);
      this.scene.time.delayedCall(120, () => {
        if (this.active && this.state === 'stunned') this.setTint(0x8bd8d0);
      });
      if (this.hp <= 0) this.die();
      return;
    }

    if (this.eyeOpen && this.state === 'windup') {
      // Si el jugador se arriesga a golpear el ojo cuerpo a cuerpo
      this.hp -= amount;
      this.scene.soundFx.play('gohmaScreech');
      this.scene.spawnSparks(this.x, this.y, 0xff2222);
      if (this.hp <= 0) {
        this.die();
        return;
      }
      this.stun(time, 3500);
      return;
    }

    // El caparazón metálico repele el golpe de espada
    this.scene.soundFx.play('clink');
    this.scene.spawnSparks(this.x, this.y, 0xffee88);
  }

  override stun(time: number, duration = 4500): void {
    if (this.state === 'dead') return;
    this.freeze();
    this.eyeOpen = true;
    this.setTexture('boss_gohma_stunned');
    this.setTint(0x8bd8d0);
    this.changeState('stunned', time, duration);
  }

  override die(): void {
    this.scene.soundFx.play('explosion');
    this.scene.cameras.main.shake(300, 0.012);
    this.scene.spawnSparks(this.x, this.y, 0xffaa33);
    super.die();
  }
}

export function createEnemy(scene: WorldScene, x: number, y: number, type: EnemyId, room: string): Enemy {
  if (type === 'boss_gohma') {
    return new Gohma(scene, x, y, room);
  }
  if (type === 'gohma_larva') {
    return new GohmaLarva(scene, x, y, room);
  }
  return new Enemy(scene, x, y, type, room);
}
