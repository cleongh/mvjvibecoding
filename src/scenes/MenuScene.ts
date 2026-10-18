import Phaser from 'phaser';
import logoUrl from '../../assets/logo-brezal.svg?url&no-inline';
import { GAME_HEIGHT, GAME_WIDTH } from '../data/areas.ts';
import type SoundSystem from '../systems/SoundSystem.ts';

export default class MenuScene extends Phaser.Scene {
  private started = false;
  private soundFx!: SoundSystem;

  constructor() {
    super({ key: 'menu' });
  }

  preload(): void {
    this.load.svg('title-logo', logoUrl, { width: 900, height: 400 });
  }

  create(): void {
    this.started = false;
    this.soundFx = this.registry.get('soundFx');
    this.drawBackdrop();

    this.add.image(GAME_WIDTH / 2, 365, 'title-logo').setDisplaySize(840, 374);
    this.add.text(GAME_WIDTH / 2, 620, 'La fuente antigua vuelve a llamar', {
      fontFamily: 'MedievalSharp, Georgia, serif', fontSize: '25px', color: '#C4D0AE',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0.9);

    const buttonY = 760;
    const button = this.add.rectangle(GAME_WIDTH / 2, buttonY, 330, 82, 0x28483a)
      .setStrokeStyle(3, 0xf1d989)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(GAME_WIDTH / 2, buttonY, 'JUGAR', {
      fontFamily: 'MedievalSharp, Georgia, serif', fontSize: '34px', color: '#F4E9C8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => {
      button.setFillStyle(0x3f6b4b);
      label.setColor('#FFF2BF');
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x28483a);
      label.setColor('#F4E9C8');
    });
    button.on('pointerdown', () => this.startGame());

    this.add.text(GAME_WIDTH / 2, 846, 'ENTER  ·  ESPACIO', {
      fontFamily: 'MedievalSharp, Georgia, serif', fontSize: '17px', color: '#A8BA88',
    }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());

    this.tweens.add({
      targets: [button, label], alpha: 0.78, duration: 1100, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x142923, 0x142923, 0x31493b, 0x31493b, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.fillStyle(0xd9d7ac, 0.86).fillCircle(1160, 170, 48);
    graphics.fillStyle(0xfff0c2, 0.16).fillCircle(1160, 170, 76);

    graphics.fillStyle(0x253f36, 0.9);
    graphics.fillTriangle(0, 530, 245, 260, 520, 530);
    graphics.fillTriangle(300, 530, 650, 200, 980, 530);
    graphics.fillTriangle(820, 530, 1130, 300, 1472, 530);
    graphics.fillStyle(0x405a47, 0.8);
    graphics.fillTriangle(0, 610, 350, 370, 680, 610);
    graphics.fillTriangle(650, 610, 1000, 340, 1330, 610);

    graphics.fillStyle(0x172c25, 0.98);
    for (let x = -30; x < GAME_WIDTH + 100; x += 82) {
      const height = 125 + ((x * 17) % 75 + 75) % 75;
      graphics.fillRect(x + 28, 720 - height, 25, height + 150);
      graphics.fillTriangle(x - 12, 720 - height, x + 40, 620 - height, x + 94, 720 - height);
      graphics.fillTriangle(x - 5, 680 - height, x + 40, 585 - height, x + 86, 680 - height);
    }
    graphics.fillStyle(0xb5c782, 0.7);
    for (let i = 0; i < 24; i++) {
      const x = 80 + ((i * 173) % (GAME_WIDTH - 160));
      const y = 150 + ((i * 97) % 390);
      graphics.fillCircle(x, y, i % 4 === 0 ? 3 : 2);
    }
    graphics.fillStyle(0x101f1b, 0.84).fillRect(0, 870, GAME_WIDTH, 154);
    graphics.lineStyle(2, 0xc3a968, 0.65).beginPath()
      .moveTo(250, 897).lineTo(GAME_WIDTH - 250, 897).strokePath();
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.soundFx.play('confirm');
    this.cameras.main.fadeOut(350, 10, 24, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('ui');
      this.scene.start('world', { areaId: 'overworld', spawn: 'start' });
    });
  }
}