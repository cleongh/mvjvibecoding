import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../data/areas.ts';

export default class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'end' });
  }

  create() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const style = { fontFamily: 'MedievalSharp, Georgia, serif', align: 'center' };
    this.cameras.main.setBackgroundColor(0x172b27);
    this.cameras.main.fadeIn(800, 255, 255, 255);
    this.add.text(centerX, centerY - 50, 'EL BREZAL VUELVE A FLORECER', { ...style, fontSize: '58px', color: '#f1d989', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(centerX, centerY + 55, 'Las tres gemas han despertado la fuente mágica.\nPulsa cualquier tecla para jugar de nuevo', {
      ...style, fontSize: '29px', color: '#f1e5bd', lineSpacing: 16,
    }).setOrigin(0.5);

    this.scene.stop('ui');
    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown', () => {
        this.registry.get('inventory').reset();
        this.scene.launch('ui');
        this.scene.start('world', { areaId: 'overworld', spawn: 'start' });
      });
    });
  }
}
