import Player from './player.js';
import Phaser from 'phaser';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level extends Phaser.Scene {
    /**
     * Constructor de la escena
     */
    constructor() {
        super({ key: 'level' });
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        this.tileSize = 32;
        this.health = 5;
        this.relics = 0;
        this.invulnerableUntil = 0;
        this.attackReadyAt = 0;
        this.ended = false;
        this.createTextures();
        this.drawGround();

        this.walls = this.physics.add.staticGroup();
        this.createWalls();
        this.player = new Player(this, 112, 112);
        this.physics.add.collider(this.player, this.walls);
        this.enemies = [
            this.createEnemy(420, 176),
            this.createEnemy(688, 432),
            this.createEnemy(304, 528),
        ];
        this.physics.add.collider(this.enemies, this.walls);
        this.relicSprites = [
            this.add.image(304, 176, 'relic').setDepth(2),
            this.add.image(528, 496, 'relic').setDepth(2),
            this.add.image(784, 208, 'relic').setDepth(2),
        ];
        this.exit = this.add.image(928, 336, 'exitLocked').setDepth(2);

        this.createHud();
        this.cameras.main.setBounds(0, 0, 960, 640);
        this.physics.world.setBounds(0, 0, 960, 640);
    }

    createTextures() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xf2c96d).fillRoundedRect(8, 3, 16, 25, 6);
        graphics.fillStyle(0x314c3c).fillRect(8, 17, 16, 11);
        graphics.fillStyle(0xffe8a8).fillCircle(16, 10, 4);
        graphics.generateTexture('hero', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x714936).fillCircle(16, 17, 12);
        graphics.fillStyle(0xe8774e).fillCircle(16, 13, 9);
        graphics.fillStyle(0x301f24).fillCircle(12, 13, 2);
        graphics.fillStyle(0x301f24).fillCircle(20, 13, 2);
        graphics.generateTexture('creature', 32, 32);
        graphics.clear();

        graphics.fillStyle(0xf1d989).fillCircle(16, 16, 11);
        graphics.fillStyle(0xfff4c3).fillCircle(16, 16, 6);
        graphics.fillStyle(0xc68c49).fillCircle(16, 16, 3);
        graphics.generateTexture('relic', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x293b38).fillRect(0, 0, 32, 32);
        graphics.fillStyle(0x526b56).fillRect(2, 2, 28, 28);
        graphics.fillStyle(0x374a43).fillRect(4, 4, 24, 24);
        graphics.fillStyle(0x71805c).fillRect(4, 4, 24, 3);
        graphics.generateTexture('wall', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x2f5144).fillCircle(16, 16, 15);
        graphics.fillStyle(0x537453).fillCircle(12, 12, 9);
        graphics.fillStyle(0x78905a).fillCircle(19, 11, 5);
        graphics.generateTexture('bush', 32, 32);
        graphics.clear();

        graphics.fillStyle(0xa95743).fillCircle(16, 16, 13);
        graphics.fillStyle(0xf2d89a).fillCircle(16, 16, 7);
        graphics.generateTexture('exitLocked', 32, 32);
        graphics.clear();
        graphics.fillStyle(0x75d5ac).fillCircle(16, 16, 13);
        graphics.fillStyle(0xd4f6bd).fillCircle(16, 16, 7);
        graphics.generateTexture('exitOpen', 32, 32);
        graphics.destroy();
    }

    drawGround() {
        const ground = this.add.graphics();
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                const isPath = (x > 3 && x < 26 && y >= 9 && y <= 10)
                    || (x >= 14 && x <= 15 && y > 3 && y < 16);
                ground.fillStyle(isPath ? 0x9a8055 : ((x + y) % 2 ? 0x527d58 : 0x4b7553));
                ground.fillRect(x * 32, y * 32, 32, 32);
                if ((x * 13 + y * 7) % 11 === 0) {
                    ground.fillStyle(isPath ? 0xb49a68 : 0x66885a, 0.75);
                    ground.fillCircle(x * 32 + 8 + (x * 3) % 17, y * 32 + 9 + (y * 5) % 15, 2);
                }
            }
        }
        ground.setDepth(0);

        for (const [x, y] of [[224, 224], [256, 224], [736, 144], [768, 144], [832, 464], [864, 464], [192, 464], [224, 464]]) {
            this.add.image(x, y, 'bush').setDepth(1);
        }
    }

    createWalls() {
        const wallTiles = new Set();
        const addTile = (x, y) => wallTiles.add(`${x},${y}`);
        for (let x = 0; x < 30; x++) {
            addTile(x, 0);
            addTile(x, 19);
        }
        for (let y = 0; y < 20; y++) {
            addTile(0, y);
            if (y !== 10) addTile(29, y);
        }
        for (let y = 2; y < 8; y++) if (y !== 5) addTile(12, y);
        for (let x = 17; x < 23; x++) if (x !== 20) addTile(x, 6);
        for (let x = 4; x < 10; x++) if (x !== 7) addTile(x, 14);
        for (let y = 12; y < 18; y++) if (y !== 15) addTile(22, y);
        for (const tile of wallTiles) {
            const [x, y] = tile.split(',').map(Number);
            this.walls.create(x * 32 + 16, y * 32 + 16, 'wall').setDepth(3);
        }
    }

    createEnemy(x, y) {
        const enemy = this.physics.add.sprite(x, y, 'creature').setDepth(4);
        enemy.body.setCircle(10, 6, 6);
        enemy.speed = 58;
        enemy.nextAttackAt = 0;
        return enemy;
    }

    createHud() {
        this.add.rectangle(480, 26, 960, 52, 0x172b27, 0.92).setScrollFactor(0).setDepth(10);
        this.add.text(22, 11, 'LAS RUINAS DEL BREZAL', {
            fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f1e5bd',
            fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(11);
        this.healthLabel = this.add.text(496, 12, '', {
            fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f3ad7f',
        }).setScrollFactor(0).setDepth(11);
        this.relicLabel = this.add.text(704, 14, '', {
            fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f1d989',
        }).setScrollFactor(0).setDepth(11);
        this.updateHud();
        this.add.text(22, 606, 'WASD / FLECHAS  MOVER     ESPACIO  GOLPEAR', {
            fontFamily: 'Georgia, serif', fontSize: '13px', color: '#f1e5bd',
            backgroundColor: '#172b27cc', padding: { x: 10, y: 6 },
        }).setScrollFactor(0).setDepth(11);
        this.notice = this.add.text(480, 578, 'Reúne las 3 reliquias y alcanza el arco del este', {
            fontFamily: 'Georgia, serif', fontSize: '15px', color: '#fff1c3',
            backgroundColor: '#172b27dd', padding: { x: 12, y: 7 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
    }

    updateHud() {
        this.healthLabel.setText(`VIDA  ${'♥'.repeat(this.health)}${'♡'.repeat(5 - this.health)}`);
        this.relicLabel.setText(`RELIQUIAS  ${this.relics}/3`);
    }

    attack() {
        const now = this.time.now;
        if (now < this.attackReadyAt) return;
        this.attackReadyAt = now + 360;
        const { x, y } = this.player.facing;
        const attackX = this.player.x + x * 31;
        const attackY = this.player.y + y * 31;
        const slash = this.add.rectangle(attackX, attackY, x ? 42 : 25, y ? 42 : 25, 0xffe39a, 0.62)
            .setRotation(x && y ? Math.PI / 4 : 0).setDepth(8);
        this.tweens.add({ targets: slash, alpha: 0, scale: 0.7, duration: 130, onComplete: () => slash.destroy() });

        for (const enemy of [...this.enemies]) {
            if (!enemy.active) continue;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.hypot(dx, dy);
            const forward = dx * x + dy * y;
            if (distance < 62 && forward > 0 && Math.abs(dx * y - dy * x) < 32) {
                this.enemies = this.enemies.filter((creature) => creature !== enemy);
                enemy.destroy();
                this.tweens.add({ targets: this.player, alpha: 0.45, yoyo: true, repeat: 1, duration: 55 });
            }
        }
    }

    damagePlayer(enemy) {
        const now = this.time.now;
        if (now < this.invulnerableUntil || this.ended) return;
        this.invulnerableUntil = now + 950;
        this.health--;
        const knockback = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
        this.player.body.setVelocity(knockback.x * 210, knockback.y * 210);
        this.player.setTint(0xff8b70);
        this.time.delayedCall(180, () => this.player.clearTint());
        this.updateHud();
        if (this.health <= 0) this.finish(false);
    }

    finish(won) {
        if (this.ended) return;
        this.ended = true;
        this.physics.pause();
        const title = won ? 'EL BREZAL VUELVE A FLORECER' : 'LA SENDA SE HA OSCURECIDO';
        const subtitle = won ? 'Las reliquias han despertado el arco.' : 'Las criaturas te han vencido.';
        this.add.rectangle(480, 320, 960, 640, 0x101d1a, 0.76).setDepth(20);
        this.add.text(480, 282, title, {
            fontFamily: 'Georgia, serif', fontSize: '30px', color: '#f1d989',
            fontStyle: 'bold', align: 'center',
        }).setOrigin(0.5).setDepth(21);
        this.add.text(480, 336, `${subtitle}\nPulsa cualquier tecla para volver a intentarlo`, {
            fontFamily: 'Georgia, serif', fontSize: '17px', color: '#f1e5bd',
            align: 'center', lineSpacing: 10,
        }).setOrigin(0.5).setDepth(21);
        this.input.keyboard.once('keydown', () => this.scene.restart());
    }

    update(time, delta) {
        if (this.ended) return;
        this.player.move();
        if (Phaser.Input.Keyboard.JustDown(this.player.keys.attack)) this.attack();

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            if (distance < 220) {
                this.physics.moveToObject(enemy, this.player, enemy.speed);
            } else {
                enemy.body.setVelocity(0, 0);
            }
            if (distance < 26 && time >= enemy.nextAttackAt) {
                enemy.nextAttackAt = time + 800;
                this.damagePlayer(enemy);
            }
        }

        this.relicSprites = this.relicSprites.filter((relic) => {
            if (Phaser.Math.Distance.Between(relic.x, relic.y, this.player.x, this.player.y) > 25) return true;
            relic.destroy();
            this.relics++;
            this.updateHud();
            if (this.relics === 3) {
                this.exit.setTexture('exitOpen');
                this.notice.setText('El arco está abierto. ¡Alcanza la salida del este!');
            }
            return false;
        });

        if (this.relics === 3 && Phaser.Math.Distance.Between(this.exit.x, this.exit.y, this.player.x, this.player.y) < 28) {
            this.finish(true);
        }
    }
}
