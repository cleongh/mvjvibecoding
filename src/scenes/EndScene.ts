import Phaser from 'phaser';

export default class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'end' });
  }

  create() {
    const style = { fontFamily: 'Georgia, serif', align: 'center' };
    this.cameras.main.setBackgroundColor(0x172b27);
    this.cameras.main.fadeIn(800, 255, 255, 255);
    this.add.text(480, 270, 'EL BREZAL VUELVE A FLORECER', { ...style, fontSize: '36px', color: '#f1d989', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(480, 340, 'Las tres gemas han despertado la fuente mágica.\nPulsa cualquier tecla para jugar de nuevo', {
      ...style, fontSize: '18px', color: '#f1e5bd', lineSpacing: 10,
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
