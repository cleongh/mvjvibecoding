import Phaser from 'phaser';

/**
    }
 * Clase que representa el jugador del juego. El jugador se mueve por el mundo usando los cursores.
 * También almacena la puntuación o número de estrellas que ha recogido hasta el momento.
 */
export default class Player extends Phaser.GameObjects.Sprite {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'hero');

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.setCollideWorldBounds();
        this.body.setSize(18, 20).setOffset(7, 10);
        this.body.setAllowGravity(false);
        this.speed = 150;
        this.facing = { x: 0, y: 1 };
        this.keys = this.scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D', attack: 'SPACE',
        });
        this.cursors = this.scene.input.keyboard.createCursorKeys();
    }

    move() {
        const left = this.keys.left.isDown || this.cursors.left.isDown;
        const right = this.keys.right.isDown || this.cursors.right.isDown;
        const up = this.keys.up.isDown || this.cursors.up.isDown;
        const down = this.keys.down.isDown || this.cursors.down.isDown;
        const direction = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));

        if (direction.lengthSq() > 0) {
            direction.normalize();
            this.body.setVelocity(direction.x * this.speed, direction.y * this.speed);
            this.facing = { x: Math.abs(direction.x) > Math.abs(direction.y) ? Math.sign(direction.x) : 0,
                y: Math.abs(direction.y) >= Math.abs(direction.x) ? Math.sign(direction.y) : 0 };
            if (direction.x !== 0) this.setFlipX(direction.x < 0);
        } else {
            this.body.setVelocity(0, 0);
        }
        this.setDepth(this.y + 10);
    }
}

