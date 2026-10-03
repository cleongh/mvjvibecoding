import Phaser from 'phaser';
import { jewelIds } from '../data/items.ts';
import type InventorySystem from '../systems/InventorySystem.ts';
import type DialogueSystem from '../systems/DialogueSystem.ts';
import type SoundSystem from '../systems/SoundSystem.ts';

const FONT = 'Georgia, serif';
const textStyle = (size: number, color: string) => ({ fontFamily: FONT, fontSize: `${size}px`, color });
const LINE_DEBOUNCE_MS = 150;

export default class UIScene extends Phaser.Scene {
  inventory!: InventorySystem;
  dialogue!: DialogueSystem;
  soundFx!: SoundSystem;
  selected = 0;
  lineShownAt = 0;
  titleText!: Phaser.GameObjects.Text;
  heartsText!: Phaser.GameObjects.Text;
  piecesText!: Phaser.GameObjects.Text;
  jewelIcons!: Phaser.GameObjects.Image[];
  keyText!: Phaser.GameObjects.Text;
  notice!: Phaser.GameObjects.Text;
  speakerText!: Phaser.GameObjects.Text;
  bodyText!: Phaser.GameObjects.Text;
  dialogueObjects!: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text>;
  listText!: Phaser.GameObjects.Text;
  detailText!: Phaser.GameObjects.Text;
  footText!: Phaser.GameObjects.Text;
  panelObjects!: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text>;
  keys!: Record<'inventory' | 'close' | 'up' | 'down' | 'confirm' | 'interact' | 'attack' | 'mute', Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: 'ui' });
  }

  create() {
    this.inventory = this.registry.get('inventory');
    this.dialogue = this.registry.get('dialogue');
    this.soundFx = this.registry.get('soundFx');

    this.createHud();
    this.createNotice();
    this.createDialogueBox();
    this.createInventoryPanel();
    this.keys = this.input.keyboard!.addKeys({
      inventory: 'I', close: 'ESC', up: 'UP', down: 'DOWN', confirm: 'ENTER', interact: 'E', attack: 'SPACE',
      mute: 'M',
    }) as typeof this.keys;

    this.inventory.on('changed', this.refresh, this);
    this.inventory.on('notify', this.showNotice, this);
    this.dialogue.on('line', this.showLine, this);
    this.dialogue.on('end', this.hideDialogue, this);
    this.events.once('shutdown', () => {
      this.inventory.off('changed', this.refresh, this);
      this.inventory.off('notify', this.showNotice, this);
      this.dialogue.off('line', this.showLine, this);
      this.dialogue.off('end', this.hideDialogue, this);
    });
    this.refresh();
  }

  createHud(): void {
    this.add.rectangle(480, 32, 960, 64, 0x172b27);
    this.titleText = this.add.text(16, 6, '', textStyle(14, '#a8ba88'));
    this.heartsText = this.add.text(16, 24, '', textStyle(26, '#e8644f'));
    this.piecesText = this.add.text(300, 22, '', textStyle(17, '#f1d989'));
    this.jewelIcons = jewelIds.map((id, i) => this.add.image(560 + i * 44, 32, `item_${id}`));
    this.add.image(720, 32, 'item_small_key');
    this.keyText = this.add.text(742, 22, '', textStyle(17, '#f1e5bd'));
    this.add.text(944, 22, 'M  Sonido   ·   I  Inventario', textStyle(14, '#a8ba88')).setOrigin(1, 0);
  }

  createNotice(): void {
    this.notice = this.add.text(480, 92, '', {
      ...textStyle(16, '#fff1c3'), backgroundColor: '#172b27ee', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
  }

  createDialogueBox(): void {
    this.dialogueObjects = [
      this.add.rectangle(480, 565, 900, 130, 0x172b27, 0.97).setStrokeStyle(2, 0x8d8059),
      this.speakerText = this.add.text(48, 512, '', textStyle(18, '#f1d989')),
      this.bodyText = this.add.text(48, 544, '', { ...textStyle(18, '#f1e5bd'), wordWrap: { width: 860 }, lineSpacing: 6 }),
      this.add.text(912, 604, 'E  continuar', textStyle(13, '#a8ba88')).setOrigin(1, 0.5),
    ];
    this.dialogueObjects.forEach((object) => object.setDepth(15).setVisible(false));
  }

  createInventoryPanel(): void {
    const background = this.add.rectangle(480, 340, 680, 420, 0x172b27, 0.97).setStrokeStyle(2, 0x8d8059);
    const title = this.add.text(480, 150, 'INVENTARIO', { ...textStyle(24, '#f1d989'), fontStyle: 'bold' }).setOrigin(0.5);
    this.listText = this.add.text(170, 190, '', { ...textStyle(20, '#f1e5bd'), lineSpacing: 10 });
    this.detailText = this.add.text(520, 190, '', { ...textStyle(17, '#f1e5bd'), wordWrap: { width: 260 }, lineSpacing: 6 });
    this.footText = this.add.text(480, 500, '', textStyle(14, '#a8ba88')).setOrigin(0.5);
    this.panelObjects = [background, title, this.listText, this.detailText, this.footText];
    this.panelObjects.forEach((object) => object.setDepth(20).setVisible(false));
  }

  refresh(): void {
    const { inventory } = this;
    this.titleText.setText(inventory.areaTitle.toUpperCase());
    this.heartsText.setText('♥'.repeat(inventory.health) + '♡'.repeat(inventory.maxHealth - inventory.health));
    this.piecesText.setText(`Piezas ${inventory.heartPieces % 4}/4`);
    this.keyText.setText(`x${inventory.count('small_key')}`);
    jewelIds.forEach((id, i) => this.jewelIcons[i].setAlpha(inventory.has(id) ? 1 : 0.2));
    if (inventory.paused) this.renderPanel();
  }

  renderPanel(): void {
    const list = this.inventory.list();
    this.selected = Phaser.Math.Clamp(this.selected, 0, Math.max(0, list.length - 1));
    this.listText.setText(list.length
      ? list.map(({ item, count }, i) => `${i === this.selected ? '▶ ' : '    '}${item.name}${count > 1 ? `  x${count}` : ''}`).join('\n')
      : 'No llevas nada todavía');
    const entry = list[this.selected];
    this.detailText.setText(entry
      ? `${entry.item.name}\n\n${entry.item.description}${entry.item.type === 'consumable' ? '\n\nEnter: usar' : ''}`
      : '');
    const jewels = jewelIds.filter((id) => this.inventory.has(id)).length;
    this.footText.setText(`Piezas de corazón: ${this.inventory.heartPieces % 4}/4   ·   Gemas: ${jewels}/3   ·   I / Esc: cerrar`);
  }

  setPanelOpen(open: boolean): void {
    this.inventory.paused = open;
    this.panelObjects.forEach((object) => object.setVisible(open));
    this.soundFx.play('confirm');
    if (open) this.renderPanel();
  }

  showNotice(text: string): void {
    this.tweens.killTweensOf(this.notice);
    this.notice.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.notice, alpha: 0, delay: 2200, duration: 500 });
  }

  showLine({ speaker, text }: { speaker: string; text: string }): void {
    this.soundFx.play('confirm');
    this.lineShownAt = this.time.now;
    this.speakerText.setText(speaker);
    this.bodyText.setText(text);
    this.dialogueObjects.forEach((object) => object.setVisible(true));
  }

  hideDialogue(): void {
    this.dialogueObjects.forEach((object) => object.setVisible(false));
  }

  update(time: number): void {
    // Se leen todas las teclas cada frame para no acumular pulsaciones pendientes.
    const pressed: Record<keyof UIScene['keys'], boolean> = {} as Record<keyof UIScene['keys'], boolean>;
    for (const [name, key] of Object.entries(this.keys)) pressed[name] = Phaser.Input.Keyboard.JustDown(key);

    if (this.dialogue.active) {
      const advance = pressed.interact || pressed.confirm || pressed.attack;
      if (advance && this.time.now - this.lineShownAt > LINE_DEBOUNCE_MS) {
        this.soundFx.play('confirm');
        this.dialogue.advance();
      }
      return;
    }

    if (pressed.mute) {
      const muted = this.soundFx.toggle();
      this.showNotice(muted ? 'Sonido desactivado' : 'Sonido activado');
      return;
    }
    if (pressed.inventory || (this.inventory.paused && pressed.close)) {
      this.setPanelOpen(!this.inventory.paused);
      return;
    }
    if (!this.inventory.paused) return;

    const count = this.inventory.list().length;
    if (pressed.up && count) {
      this.selected = (this.selected + count - 1) % count;
      this.soundFx.play('confirm');
    }
    if (pressed.down && count) {
      this.selected = (this.selected + 1) % count;
      this.soundFx.play('confirm');
    }
    if (pressed.confirm) {
      const entry = this.inventory.list()[this.selected];
      if (entry && this.inventory.use(entry.item.id)) this.soundFx.play('heart');
    }
    this.renderPanel();
  }
}
