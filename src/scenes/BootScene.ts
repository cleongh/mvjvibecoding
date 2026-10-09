import Phaser from 'phaser';
import { areas } from '../data/areas.ts';
import InventorySystem from '../systems/InventorySystem.ts';
import DialogueSystem from '../systems/DialogueSystem.ts';
import SoundSystem from '../systems/SoundSystem.ts';

type GraphicsDrawer = (graphics: Phaser.GameObjects.Graphics) => void;

function makeTexture(scene: Phaser.Scene, key: string, width: number, height: number, draw: GraphicsDrawer): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

function drawBoss(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(0x1e1618).fillCircle(32, 36, 28);
  g.fillStyle(color).fillCircle(32, 34, 24);
  g.fillStyle(0xf2e6c4).fillTriangle(10, 18, 18, 2, 24, 18);
  g.fillStyle(0xf2e6c4).fillTriangle(54, 18, 46, 2, 40, 18);
  g.fillStyle(0xfff1a8).fillCircle(23, 30, 5);
  g.fillStyle(0xfff1a8).fillCircle(41, 30, 5);
  g.fillStyle(0x1e1618).fillCircle(23, 30, 2);
  g.fillStyle(0x1e1618).fillCircle(41, 30, 2);
  g.fillStyle(0x1e1618).fillRect(20, 44, 24, 5);
}

function createTilesets(scene: Phaser.Scene): void {
  for (const area of Object.values(areas)) {
    const t = area.theme;
    makeTexture(scene, `tiles_${area.id}`, 160, 32, (g) => {
      g.fillStyle(t.floorA).fillRect(0, 0, 32, 32);
      g.fillStyle(t.floorB).fillRect(32, 0, 32, 32);
      g.fillStyle(t.wallLight, 0.25).fillCircle(9, 10, 2).fillCircle(50, 22, 2);
      g.fillStyle(t.wall).fillRect(64, 0, 32, 32);
      g.fillStyle(t.wallLight).fillRect(66, 2, 28, 4);
      g.fillStyle(0x000000, 0.2).fillRect(66, 20, 28, 10);
      g.fillStyle(t.water).fillRect(96, 0, 32, 32);
      g.fillStyle(0xffffff, 0.3).fillRect(102, 8, 14, 2).fillRect(108, 22, 14, 2);
      g.fillStyle(t.floorA).fillRect(128, 0, 32, 32);
      g.fillStyle(t.tree).fillCircle(144, 16, 15);
      g.fillStyle(0xffffff, 0.15).fillCircle(139, 11, 7);
    });
  }
}

function createSprites(scene: Phaser.Scene): void {
  makeTexture(scene, 'hero', 32, 32, (g) => {
    g.fillStyle(0xf2c96d).fillRoundedRect(8, 3, 16, 25, 6);
    g.fillStyle(0x314c3c).fillRect(8, 17, 16, 11);
    g.fillStyle(0xffe8a8).fillCircle(16, 10, 4);
  });
  makeTexture(scene, 'sword', 32, 32, (g) => {
    g.fillStyle(0xd8e1d7).fillTriangle(16, 1, 10, 19, 22, 19);
    g.fillStyle(0x8b9b92).fillRect(14, 15, 4, 9);
    g.fillStyle(0xd9b85f).fillRect(7, 21, 18, 3);
    g.fillStyle(0x65452f).fillRect(14, 24, 4, 6);
    g.fillStyle(0xd9b85f).fillCircle(16, 30, 2);
  });
  makeTexture(scene, 'slime', 32, 32, (g) => {
    g.fillStyle(0x3d7a4c).fillEllipse(16, 21, 28, 20);
    g.fillStyle(0x6fbf73).fillEllipse(16, 18, 24, 16);
    g.fillStyle(0x1e1618).fillCircle(11, 17, 2).fillCircle(21, 17, 2);
  });
  makeTexture(scene, 'skeleton', 32, 32, (g) => {
    g.fillStyle(0xe8e0c8).fillCircle(16, 10, 8);
    g.fillStyle(0xe8e0c8).fillRect(12, 18, 8, 10);
    g.fillStyle(0xc8bfa4).fillRect(8, 20, 16, 3);
    g.fillStyle(0x1e1618).fillCircle(13, 10, 2).fillCircle(19, 10, 2);
  });
  makeTexture(scene, 'boss_moss', 64, 64, (g) => drawBoss(g, 0x4f8f4f));
  makeTexture(scene, 'boss_ember', 64, 64, (g) => drawBoss(g, 0xd0562f));
  makeTexture(scene, 'boss_tide', 64, 64, (g) => drawBoss(g, 0x3f78c8));
  makeTexture(scene, 'chest_closed', 32, 32, (g) => {
    g.fillStyle(0x6b4429).fillRect(3, 8, 26, 20);
    g.fillStyle(0x8a5a35).fillRect(3, 8, 26, 8);
    g.fillStyle(0xe0b84e).fillRect(14, 12, 4, 8);
  });
  makeTexture(scene, 'chest_open', 32, 32, (g) => {
    g.fillStyle(0x6b4429).fillRect(3, 14, 26, 14);
    g.fillStyle(0x8a5a35).fillRect(3, 4, 26, 6);
    g.fillStyle(0x2a1a12).fillRect(5, 14, 22, 4);
  });
  makeTexture(scene, 'door', 64, 64, (g) => {
    g.fillStyle(0x3a2c28).fillRect(0, 0, 64, 64);
    g.fillStyle(0x6b5a4a).fillRect(4, 4, 56, 56);
    g.fillStyle(0xe0b84e).fillCircle(32, 30, 8);
    g.fillStyle(0x3a2c28).fillRect(30, 30, 4, 12);
  });
  makeTexture(scene, 'fountain', 64, 64, (g) => {
    g.fillStyle(0x7d7a6a).fillCircle(32, 32, 30);
    g.fillStyle(0x3f78a8).fillCircle(32, 32, 24);
    g.fillStyle(0x8fc4e8).fillCircle(32, 32, 14);
    g.fillStyle(0xffffff, 0.6).fillCircle(32, 32, 5);
  });
  makeTexture(scene, 'doorway', 64, 32, (g) => {
    g.fillStyle(0x15110f).fillRect(0, 0, 64, 32);
    g.fillStyle(0x3a3128).fillRect(0, 0, 64, 4).fillRect(0, 0, 4, 32).fillRect(60, 0, 4, 32);
  });
  makeTexture(scene, 'sign', 32, 32, (g) => {
    g.fillStyle(0x6b4429).fillRect(14, 14, 4, 16);
    g.fillStyle(0x9a6f42).fillRect(4, 4, 24, 14);
    g.fillStyle(0x3d2a1a).fillRect(8, 8, 16, 2).fillRect(8, 12, 12, 2);
  });
  makeTexture(scene, 'npc_sage', 32, 32, (g) => {
    g.fillStyle(0x7a4f9a).fillRoundedRect(7, 6, 18, 24, 6);
    g.fillStyle(0xf0d2a6).fillCircle(16, 12, 5);
    g.fillStyle(0xeeeeee).fillRect(11, 14, 10, 6);
  });
  makeTexture(scene, 'heart_piece', 32, 32, (g) => {
    g.fillStyle(0xe8644f).fillCircle(11, 13, 7).fillCircle(21, 13, 7).fillTriangle(4, 16, 28, 16, 16, 29);
    g.fillStyle(0xffffff, 0.5).fillCircle(9, 11, 2);
    g.lineStyle(2, 0xf1d989).strokeCircle(16, 16, 15);
  });
  makeTexture(scene, 'item_small_key', 32, 32, (g) => {
    g.fillStyle(0xe0b84e).fillCircle(16, 9, 6).fillRect(14, 12, 4, 16).fillRect(18, 22, 5, 3).fillRect(18, 26, 4, 3);
    g.fillStyle(0x15110f).fillCircle(16, 9, 2);
  });
  makeTexture(scene, 'item_health_potion', 32, 32, (g) => {
    g.fillStyle(0xddd6c0).fillRect(13, 3, 6, 7);
    g.fillStyle(0xe8644f).fillCircle(16, 20, 10);
    g.fillStyle(0xffffff, 0.5).fillCircle(12, 17, 3);
  });
  const jewels = { item_jewel_moss: 0x5fcf7a, item_jewel_ember: 0xe8643a, item_jewel_tide: 0x5aa8f0 };
  for (const [key, color] of Object.entries(jewels)) {
    makeTexture(scene, key, 32, 32, (g) => {
      g.fillStyle(color).fillTriangle(16, 2, 4, 14, 28, 14).fillTriangle(4, 14, 28, 14, 16, 30);
      g.fillStyle(0xffffff, 0.45).fillTriangle(16, 2, 10, 14, 16, 14);
    });
  }
  makeTexture(scene, 'star', 16, 16, (g) => {
    g.fillStyle(0xf2e6c4).fillCircle(8, 8, 6);
    g.fillStyle(0xe89b3f).fillCircle(8, 8, 3);
  });
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  create() {
    createTilesets(this);
    createSprites(this);
    this.registry.set('inventory', new InventorySystem());
    this.registry.set('dialogue', new DialogueSystem());
    this.registry.set('soundFx', new SoundSystem());
    this.scene.launch('ui');
    this.scene.start('world', { areaId: 'overworld', spawn: 'start' });
  }
}
