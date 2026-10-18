import Phaser from 'phaser';
import { jewelIds, items, shopCatalog } from '../data/items.ts';
import type InventorySystem from '../systems/InventorySystem.ts';
import type DialogueSystem from '../systems/DialogueSystem.ts';
import type SoundSystem from '../systems/SoundSystem.ts';
import { GAME_HEIGHT, GAME_WIDTH, ROOM_SCALE, VIEW_Y } from '../data/areas.ts';

const FONT = 'MedievalSharp, Georgia, serif';
const UI_X = GAME_WIDTH / 960;
const UI_Y = GAME_HEIGHT / 640;
const uiX = (value: number) => value * UI_X;
const uiY = (value: number) => value * UI_Y;
const textStyle = (size: number, color: string) => ({ fontFamily: FONT, fontSize: `${size * UI_Y}px`, color });
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
  boomerangIcon!: Phaser.GameObjects.Image;
  bombText!: Phaser.GameObjects.Text;
  rupeeText!: Phaser.GameObjects.Text;
  keyText!: Phaser.GameObjects.Text;
  notice!: Phaser.GameObjects.Text;
  speakerText!: Phaser.GameObjects.Text;
  bodyText!: Phaser.GameObjects.Text;
  dialogueObjects!: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text>;
  listText!: Phaser.GameObjects.Text;
  detailText!: Phaser.GameObjects.Text;
  footText!: Phaser.GameObjects.Text;
  panelTitle!: Phaser.GameObjects.Text;
  panelObjects!: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text>;
  shopSelected = 0;
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
    const hudCenterY = VIEW_Y * ROOM_SCALE / 2;
    this.add.rectangle(GAME_WIDTH / 2, hudCenterY, GAME_WIDTH, VIEW_Y * ROOM_SCALE, 0x172b27);
    this.titleText = this.add.text(uiX(16), ROOM_SCALE * 6, '', textStyle(14, '#a8ba88'));
    this.heartsText = this.add.text(uiX(16), ROOM_SCALE * 24, '', textStyle(26, '#e8644f'));
    this.piecesText = this.add.text(uiX(270), ROOM_SCALE * 22, '', textStyle(17, '#f1d989'));
    this.boomerangIcon = this.add.image(uiX(370), hudCenterY, 'item_boomerang').setScale(ROOM_SCALE).setAlpha(0.2);
    this.add.text(uiX(388), ROOM_SCALE * 22, 'B', textStyle(15, '#f1e5bd'));
    this.jewelIcons = jewelIds.map((id, i) => this.add.image(uiX(430 + i * 38), hudCenterY, `item_${id}`).setScale(ROOM_SCALE));
    this.add.image(uiX(555), hudCenterY, 'item_small_key').setScale(ROOM_SCALE);
    this.keyText = this.add.text(uiX(577), ROOM_SCALE * 22, '', textStyle(17, '#f1e5bd'));
    this.add.image(uiX(650), hudCenterY, 'item_bomb').setScale(ROOM_SCALE);
    this.bombText = this.add.text(uiX(672), ROOM_SCALE * 22, '', textStyle(17, '#f1e5bd'));
    this.add.image(uiX(700), hudCenterY, 'item_rupee').setScale(ROOM_SCALE * 0.75);
    this.rupeeText = this.add.text(uiX(724), ROOM_SCALE * 22, '', textStyle(17, '#8fe0a5'));
    this.add.text(uiX(944), ROOM_SCALE * 22, 'M  Sonido   ·   I  Inventario', textStyle(14, '#a8ba88')).setOrigin(1, 0);
  }

  createNotice(): void {
    this.notice = this.add.text(GAME_WIDTH / 2, uiY(92), '', {
      ...textStyle(16, '#fff1c3'), backgroundColor: '#172b27ee', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
  }

  createDialogueBox(): void {
    this.dialogueObjects = [
      this.add.rectangle(GAME_WIDTH / 2, uiY(565), uiX(900), uiY(130), 0x172b27, 0.97).setStrokeStyle(2 * UI_Y, 0x8d8059),
      this.speakerText = this.add.text(uiX(48), uiY(512), '', textStyle(18, '#f1d989')),
      this.bodyText = this.add.text(uiX(48), uiY(544), '', { ...textStyle(18, '#f1e5bd'), wordWrap: { width: uiX(860) }, lineSpacing: 6 * UI_Y }),
      this.add.text(uiX(912), uiY(604), 'E  continuar', textStyle(13, '#a8ba88')).setOrigin(1, 0.5),
    ];
    this.dialogueObjects.forEach((object) => object.setDepth(15).setVisible(false));
  }

  createInventoryPanel(): void {
    const background = this.add.rectangle(GAME_WIDTH / 2, uiY(340), uiX(680), uiY(420), 0x172b27, 0.97).setStrokeStyle(2 * UI_Y, 0x8d8059);
    this.panelTitle = this.add.text(GAME_WIDTH / 2, uiY(150), 'INVENTARIO', { ...textStyle(24, '#f1d989'), fontStyle: 'bold' }).setOrigin(0.5);
    this.listText = this.add.text(uiX(170), uiY(190), '', { ...textStyle(20, '#f1e5bd'), lineSpacing: 10 * UI_Y });
    this.detailText = this.add.text(uiX(520), uiY(190), '', { ...textStyle(17, '#f1e5bd'), wordWrap: { width: uiX(260) }, lineSpacing: 6 * UI_Y });
    this.footText = this.add.text(GAME_WIDTH / 2, uiY(500), '', textStyle(14, '#a8ba88')).setOrigin(0.5);
    this.panelObjects = [background, this.panelTitle, this.listText, this.detailText, this.footText];
    this.panelObjects.forEach((object) => object.setDepth(20).setVisible(false));
  }

  refresh(): void {
    const { inventory } = this;
    this.titleText.setText(inventory.areaTitle.toUpperCase());
    this.heartsText.setText('♥'.repeat(inventory.health) + '♡'.repeat(inventory.maxHealth - inventory.health));
    this.piecesText.setText(`Piezas ${inventory.heartPieces % 4}/4`);
    this.keyText.setText(`x${inventory.count('small_key')}`);
    jewelIds.forEach((id, i) => this.jewelIcons[i].setAlpha(inventory.has(id) ? 1 : 0.2));
    this.boomerangIcon.setAlpha(inventory.has('boomerang') ? 1 : 0.2);
    this.bombText.setText(`x${inventory.count('bomb')}`);
    this.rupeeText.setText(`${inventory.rupees}`);
    if (inventory.shopOpen) this.panelObjects.forEach((object) => object.setVisible(true));
    if (inventory.paused) this.renderPanel();
  }

  renderPanel(): void {
    if (this.inventory.shopOpen) {
      this.shopSelected = Phaser.Math.Clamp(this.shopSelected, 0, shopCatalog.length - 1);
      this.panelTitle.setText('TIENDA DEL BREZAL');
      this.listText.setText(shopCatalog.map((offer, index) => {
        const item = items[offer.item];
        return `${index === this.shopSelected ? '▶ ' : '    '}${item.name}${offer.amount > 1 ? `  x${offer.amount}` : ''}   ${offer.price} rupias`;
      }).join('\n'));
      const offer = shopCatalog[this.shopSelected];
      this.detailText.setText(`${items[offer.item].description}\n\nTienes ${this.inventory.rupees} rupias.`);
      this.footText.setText('↑ / ↓ elegir   ·   Enter comprar   ·   I / Esc salir');
      return;
    }

    this.panelTitle.setText('INVENTARIO');
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
    this.footText.setText(`Piezas de corazón: ${this.inventory.heartPieces % 4}/4   ·   Gemas: ${jewels}/3   ·   B: bumerán   ·   X: bomba   ·   I / Esc: cerrar`);
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

    if (this.inventory.shopOpen) {
      if (pressed.close || pressed.inventory) {
        this.inventory.closeShop();
        this.panelObjects.forEach((object) => object.setVisible(false));
        this.soundFx.play('confirm');
        return;
      }
      if (pressed.up || pressed.down) {
        const direction = pressed.up ? -1 : 1;
        this.shopSelected = (this.shopSelected + shopCatalog.length + direction) % shopCatalog.length;
        this.soundFx.play('confirm');
      }
      if (pressed.confirm && this.inventory.purchaseShopItem(this.shopSelected)) this.soundFx.play('pickup');
      this.renderPanel();
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
