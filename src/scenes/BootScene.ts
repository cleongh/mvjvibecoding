import Phaser from 'phaser';
import heroSpriteUrl from '../../assets/sprites/hero.svg?url&no-inline';
import overworldMapUrl from '../../assets/maps/overworld.tmj?url&no-inline';
import overworldTilesUrl from '../../assets/maps/overworld-tiles.svg?url&no-inline';
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
  g.fillStyle(0x111a16, 0.7).fillEllipse(32, 58, 54, 12);
  g.fillStyle(0x1e1618).fillCircle(32, 36, 29);
  g.fillStyle(color).fillCircle(32, 34, 24);
  g.fillStyle(0xffffff, 0.17).fillEllipse(24, 20, 18, 9);
  g.fillStyle(0xf2e6c4).fillTriangle(8, 19, 17, 1, 25, 20);
  g.fillStyle(0xf2e6c4).fillTriangle(56, 19, 47, 1, 39, 20);
  g.fillStyle(0x9b493b).fillTriangle(10, 17, 17, 4, 20, 18);
  g.fillStyle(0x9b493b).fillTriangle(54, 17, 47, 4, 44, 18);
  g.fillStyle(0x1e1618).fillEllipse(32, 42, 33, 17);
  g.fillStyle(0xfff1a8).fillCircle(22, 30, 6).fillCircle(42, 30, 6);
  g.fillStyle(0x1e1618).fillCircle(22, 30, 3).fillCircle(42, 30, 3);
  g.fillStyle(0xffffff, 0.75).fillCircle(20, 28, 1).fillCircle(40, 28, 1);
  g.fillStyle(0xffd96e).fillTriangle(32, 33, 27, 43, 37, 43);
  g.fillStyle(0x1e1618).fillRect(20, 46, 24, 5);
  g.fillStyle(0xe8e0c8).fillRect(25, 46, 3, 4).fillRect(31, 46, 3, 4).fillRect(37, 46, 3, 4);
  g.fillStyle(0xf1d989).fillCircle(32, 19, 3);
}

function createTilesets(scene: Phaser.Scene): void {
  for (const area of Object.values(areas)) {
    const t = area.theme;
    makeTexture(scene, `tiles_${area.id}`, 192, 32, (g) => {
      g.fillStyle(t.floorA).fillRect(0, 0, 32, 32);
      g.fillStyle(t.floorB).fillRect(32, 0, 32, 32);
      g.fillStyle(t.wallLight, 0.25).fillCircle(9, 10, 2).fillCircle(50, 22, 2);
      g.fillStyle(t.wall).fillRect(64, 0, 32, 32);
      g.fillStyle(t.wallLight).fillRect(66, 2, 28, 4);
      g.fillStyle(0x000000, 0.2).fillRect(66, 20, 28, 10);
      g.fillStyle(t.water).fillRect(96, 0, 32, 32);
      g.fillStyle(0xffffff, 0.3).fillRect(102, 8, 14, 2).fillRect(108, 22, 14, 2);
      g.fillStyle(t.floorA).fillRect(128, 0, 32, 32);
      g.fillStyle(0x17251e).fillCircle(144, 19, 15);
      g.fillStyle(t.tree).fillCircle(144, 15, 14);
      g.fillStyle(t.tree).fillCircle(137, 18, 8).fillCircle(151, 18, 8).fillCircle(144, 9, 8);
      g.fillStyle(t.wallLight, 0.62).fillCircle(139, 10, 4).fillCircle(149, 14, 3);
      g.fillStyle(0x182d23, 0.7).fillCircle(139, 21, 3).fillCircle(150, 22, 3);
      g.fillStyle(0xd9b85f, 0.7).fillCircle(144, 16, 1);
      g.fillStyle(t.wall).fillRect(160, 0, 32, 32);
      g.fillStyle(t.wallLight).fillRect(162, 2, 28, 4).fillRect(162, 27, 28, 3);
      g.fillStyle(0x211a18).fillRect(165, 8, 22, 17);
      g.fillStyle(t.wallLight).fillRect(166, 9, 20, 14);
      g.lineStyle(2, 0x392c28).beginPath().moveTo(174, 9).lineTo(170, 14).lineTo(175, 17).lineTo(169, 23).strokePath();
      g.lineStyle(1, 0x8f4934).beginPath().moveTo(180, 11).lineTo(177, 15).lineTo(181, 18).strokePath();
      g.fillStyle(0x3a2924).fillCircle(169, 11, 1).fillCircle(184, 22, 1);
    });
  }
}

function createSprites(scene: Phaser.Scene): void {
  makeTexture(scene, 'sword', 32, 32, (g) => {
    g.fillStyle(0xd8e1d7).fillTriangle(16, 1, 10, 19, 22, 19);
    g.fillStyle(0x8b9b92).fillRect(14, 15, 4, 9);
    g.fillStyle(0xd9b85f).fillRect(7, 21, 18, 3);
    g.fillStyle(0x65452f).fillRect(14, 24, 4, 6);
    g.fillStyle(0xd9b85f).fillCircle(16, 30, 2);
  });
  makeTexture(scene, 'slime', 32, 32, (g) => {
    g.fillStyle(0x14231b, 0.55).fillEllipse(16, 27, 28, 7);
    g.fillStyle(0x245438).fillEllipse(16, 21, 29, 19);
    g.fillStyle(0x4c9d5d).fillEllipse(16, 18, 25, 17);
    g.fillStyle(0x7bce75).fillEllipse(13, 14, 14, 8);
    g.fillStyle(0xb4e48b).fillCircle(10, 12, 2);
    g.fillStyle(0x183323).fillCircle(11, 18, 2).fillCircle(21, 18, 2);
    g.fillStyle(0xffffff).fillCircle(11, 17, 1).fillCircle(21, 17, 1);
    g.lineStyle(1, 0x245438).beginPath().arc(16, 21, 4, 0.2, Math.PI - 0.2).strokePath();
  });
  makeTexture(scene, 'skeleton', 32, 32, (g) => {
    g.fillStyle(0x111a16, 0.6).fillEllipse(16, 28, 25, 6);
    g.fillStyle(0x756c5a).fillRect(13, 16, 6, 13);
    g.fillStyle(0xc6baa0).fillRect(10, 19, 12, 3).fillRect(12, 24, 8, 3);
    g.fillStyle(0xeee6d2).fillCircle(16, 10, 9);
    g.fillStyle(0xd0c6af).fillRect(9, 9, 14, 6);
    g.fillStyle(0xeee6d2).fillRect(10, 12, 12, 7);
    g.fillStyle(0x211e1b).fillTriangle(9, 8, 15, 9, 11, 13).fillTriangle(23, 8, 17, 9, 21, 13);
    g.fillStyle(0xf1d989).fillCircle(12, 10, 1).fillCircle(20, 10, 1);
    g.fillStyle(0x493f34).fillTriangle(16, 11, 13, 16, 19, 16);
    g.fillStyle(0x554b3e).fillRect(12, 16, 2, 3).fillRect(15, 16, 2, 3).fillRect(18, 16, 2, 3);
    g.fillStyle(0xf4eddb).fillRect(6, 20, 5, 3).fillRect(21, 20, 5, 3);
    g.fillStyle(0xa34c38).fillRect(14, 21, 4, 2);
  });
  makeTexture(scene, 'boss_moss', 64, 64, (g) => drawBoss(g, 0x4f8f4f));
  makeTexture(scene, 'boss_ember', 64, 64, (g) => drawBoss(g, 0xd0562f));
  makeTexture(scene, 'boss_tide', 64, 64, (g) => drawBoss(g, 0x3f78c8));
  makeTexture(scene, 'chest_closed', 32, 32, (g) => {
    g.fillStyle(0x1d1713).fillEllipse(16, 27, 28, 7);
    g.fillStyle(0x4b2d20).fillRect(2, 10, 28, 18);
    g.fillStyle(0x9b6237).fillRect(4, 9, 24, 16);
    g.fillStyle(0xb77b43).fillRect(5, 11, 22, 5);
    g.fillStyle(0x754528).fillRect(5, 18, 22, 6);
    g.fillStyle(0x57321f).fillRect(7, 19, 18, 2).fillRect(7, 22, 18, 2);
    g.fillStyle(0xd8ad60).fillRect(3, 8, 26, 3).fillRect(3, 24, 26, 3);
    g.fillStyle(0xe8c778).fillRect(4, 8, 24, 1).fillRect(4, 25, 24, 1);
    g.fillStyle(0xd9b85f).fillRect(14, 11, 4, 12);
    g.fillStyle(0xf1d989).fillRect(13, 14, 6, 5);
    g.fillStyle(0x65452f).fillRect(15, 15, 2, 2);
    g.fillStyle(0xf1d989).fillCircle(4, 12, 1).fillCircle(28, 12, 1).fillCircle(4, 23, 1).fillCircle(28, 23, 1);
  });
  makeTexture(scene, 'chest_open', 32, 32, (g) => {
    g.fillStyle(0x1d1713).fillEllipse(16, 27, 28, 7);
    g.fillStyle(0x4b2d20).fillRect(2, 16, 28, 12);
    g.fillStyle(0x9b6237).fillRect(4, 16, 24, 9);
    g.fillStyle(0x754528).fillRect(6, 19, 20, 4);
    g.fillStyle(0x2a1a12).fillRect(6, 17, 20, 4);
    g.fillStyle(0xf1d989).fillTriangle(13, 19, 19, 19, 16, 14);
    g.fillStyle(0x4b2d20).fillRect(2, 6, 28, 9);
    g.fillStyle(0xb77b43).fillRect(4, 4, 24, 8);
    g.fillStyle(0x9b6237).fillRect(5, 6, 22, 5);
    g.fillStyle(0xd8ad60).fillRect(3, 12, 26, 3).fillRect(3, 6, 3, 8).fillRect(26, 6, 3, 8);
    g.fillStyle(0xf1d989).fillRect(13, 7, 6, 3);
    g.fillStyle(0x65452f).fillRect(15, 7, 2, 2);
    g.fillStyle(0xf1d989).fillCircle(4, 21, 1).fillCircle(28, 21, 1);
  });
  makeTexture(scene, 'door', 64, 64, (g) => {
    g.fillStyle(0x241b18).fillRect(2, 1, 60, 63);
    g.fillStyle(0x8b795c).fillRect(6, 5, 52, 59);
    g.fillStyle(0x50392c).fillRect(10, 10, 44, 54);
    g.fillStyle(0x714c34).fillRect(13, 13, 18, 47).fillRect(33, 13, 18, 47);
    g.fillStyle(0x986947).fillRect(15, 15, 14, 42).fillRect(35, 15, 14, 42);
    g.fillStyle(0x3b2a21).fillRect(31, 13, 2, 49);
    g.fillStyle(0xc69c54).fillRect(8, 11, 4, 43).fillRect(52, 11, 4, 43);
    g.fillStyle(0xe0b84e).fillCircle(32, 34, 8);
    g.fillStyle(0xffe391).fillCircle(30, 32, 3);
    g.fillStyle(0x3a2c28).fillRect(30, 34, 4, 15);
    g.fillStyle(0x261b17).fillTriangle(4, 12, 32, 0, 60, 12);
    g.fillStyle(0x937b5a).fillTriangle(9, 10, 32, 2, 55, 10);
    g.fillStyle(0xe6cc88).fillCircle(8, 8, 2).fillCircle(56, 8, 2);
  });
  makeTexture(scene, 'fountain', 64, 64, (g) => {
    g.fillStyle(0x17251e, 0.55).fillEllipse(32, 58, 58, 11);
    g.fillStyle(0x655f50).fillEllipse(32, 36, 61, 46);
    g.fillStyle(0xb1a782).fillEllipse(32, 33, 55, 40);
    g.fillStyle(0x77735f).fillEllipse(32, 34, 44, 31);
    g.fillStyle(0x3f78a8).fillEllipse(32, 29, 39, 28);
    g.fillStyle(0x8fc4e8).fillEllipse(32, 26, 28, 18);
    g.fillStyle(0x344d50).fillRect(27, 24, 10, 18);
    g.fillStyle(0x8fc4e8).fillEllipse(32, 23, 24, 13);
    g.fillStyle(0xffffff, 0.7).fillCircle(32, 20, 5).fillEllipse(32, 15, 7, 12);
    g.fillStyle(0xf1d989).fillCircle(9, 34, 2).fillCircle(55, 34, 2).fillCircle(32, 48, 2);
  });
  makeTexture(scene, 'doorway', 64, 32, (g) => {
    g.fillStyle(0x15110f).fillRect(0, 0, 64, 32);
    g.fillStyle(0x3a3128).fillRect(0, 0, 64, 4).fillRect(0, 0, 4, 32).fillRect(60, 0, 4, 32);
  });
  makeTexture(scene, 'sign', 32, 32, (g) => {
    g.fillStyle(0x1d1713, 0.45).fillEllipse(16, 30, 20, 4);
    g.fillStyle(0x543922).fillRect(14, 15, 5, 16);
    g.fillStyle(0x78502e).fillRect(15, 16, 2, 13);
    g.fillStyle(0x4a2e1e).fillTriangle(3, 4, 29, 4, 26, 20).fillTriangle(3, 4, 26, 20, 6, 20);
    g.fillStyle(0xb07a45).fillTriangle(5, 5, 27, 5, 24, 18).fillTriangle(5, 5, 24, 18, 7, 18);
    g.fillStyle(0xd0a160).fillRect(7, 7, 16, 2).fillRect(6, 17, 18, 1);
    g.fillStyle(0x694326).fillRect(8, 10, 12, 2).fillRect(8, 14, 9, 2);
    g.fillStyle(0xecd18d).fillTriangle(23, 8, 20, 13, 25, 13).fillRect(22, 12, 2, 3);
    g.fillStyle(0x3d2a1a).fillRect(4, 9, 2, 5);
  });
  makeTexture(scene, 'npc_sage', 32, 32, (g) => {
    g.fillStyle(0x1d3028).fillEllipse(16, 24, 25, 15);
    g.fillStyle(0x365b69).fillTriangle(5, 19, 27, 19, 16, 31);
    g.fillStyle(0x49798a).fillRect(7, 17, 18, 9);
    g.fillStyle(0xc9b978).fillRect(9, 24, 14, 2);
    g.fillStyle(0xf1d989).fillCircle(16, 20, 2);
    g.fillStyle(0xeee2c8).fillEllipse(16, 11, 18, 17);
    g.fillStyle(0xd0d7d0).fillCircle(8, 12, 4).fillCircle(24, 12, 4);
    g.fillStyle(0xf0d2a6).fillEllipse(16, 12, 12, 13);
    g.fillStyle(0x8b9a9a).fillRect(11, 12, 10, 3);
    g.fillStyle(0xf4eee0).fillRect(11, 13, 10, 3);
    g.fillStyle(0x332b2a).fillRect(12, 11, 2, 2).fillRect(18, 11, 2, 2);
    g.fillStyle(0xb78570).fillRect(15, 14, 2, 2);
    g.fillStyle(0x668a92).fillTriangle(7, 7, 25, 7, 16, 1);
    g.fillStyle(0xd5c694).fillRect(14, 4, 4, 3);
    g.fillStyle(0xf1d989).fillCircle(16, 20, 1);
  });
  makeTexture(scene, 'shield', 20, 24, (g) => {
    g.fillStyle(0x1d3028).fillTriangle(1, 2, 19, 2, 16, 17).fillTriangle(1, 2, 16, 17, 10, 23).fillTriangle(1, 2, 10, 23, 4, 17);
    g.fillStyle(0x718a91).fillTriangle(2, 3, 18, 3, 15, 16).fillTriangle(2, 3, 15, 16, 10, 21).fillTriangle(2, 3, 10, 21, 5, 16);
    g.fillStyle(0xc9d8d2).fillTriangle(4, 5, 10, 5, 9, 16).fillTriangle(4, 5, 9, 16, 6, 15);
    g.fillStyle(0x425e67).fillTriangle(11, 5, 16, 5, 14, 15).fillTriangle(11, 5, 14, 15, 10, 19);
    g.fillStyle(0xd9b85f).fillTriangle(9, 5, 11, 5, 12, 16).fillTriangle(9, 5, 12, 16, 10, 20);
    g.fillStyle(0xf1d989).fillCircle(10, 9, 2);
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
  makeTexture(scene, 'item_rupee', 32, 32, (g) => {
    g.fillStyle(0x277c4d).fillTriangle(11, 2, 22, 2, 28, 16).fillTriangle(28, 16, 20, 30, 9, 30).fillTriangle(9, 30, 4, 16, 11, 2);
    g.fillStyle(0x56c878).fillTriangle(12, 4, 19, 4, 24, 16).fillTriangle(24, 16, 18, 27, 11, 27).fillTriangle(11, 27, 7, 16, 12, 4);
    g.fillStyle(0xb0f0a9).fillTriangle(12, 5, 16, 5, 11, 15).fillTriangle(11, 15, 9, 11, 12, 5);
    g.fillStyle(0x2e8d55).fillRect(9, 14, 15, 2);
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
  makeTexture(scene, 'boomerang', 32, 32, (g) => {
    g.lineStyle(6, 0xd9b85f).beginPath().arc(16, 16, 11, -2.35, 2.35, false).strokePath();
    g.fillStyle(0xf3e2ad).fillTriangle(5, 7, 12, 5, 8, 12);
    g.fillStyle(0xf3e2ad).fillTriangle(5, 25, 12, 27, 8, 20);
  });
  makeTexture(scene, 'item_boomerang', 32, 32, (g) => {
    g.lineStyle(5, 0xd9b85f).beginPath().arc(16, 16, 10, -2.35, 2.35, false).strokePath();
    g.fillStyle(0xf3e2ad).fillTriangle(5, 7, 12, 5, 8, 12);
    g.fillStyle(0xf3e2ad).fillTriangle(5, 25, 12, 27, 8, 20);
  });
  makeTexture(scene, 'bomb', 32, 32, (g) => {
    g.fillStyle(0x111a16, 0.6).fillEllipse(16, 28, 25, 6);
    g.fillStyle(0x342a25).fillCircle(16, 19, 11);
    g.fillStyle(0x59463a).fillCircle(16, 18, 9);
    g.fillStyle(0x88715b).fillEllipse(13, 14, 8, 5);
    g.fillStyle(0x1d1713).fillRect(13, 6, 6, 5);
    g.fillStyle(0xc7a75d).fillRect(12, 8, 8, 3);
    g.lineStyle(2, 0xf0c765).beginPath().moveTo(16, 7).lineTo(19, 4).lineTo(22, 5).strokePath();
    g.fillStyle(0xffe78c).fillCircle(23, 4, 2);
    g.fillStyle(0xf09b4b).fillTriangle(22, 2, 25, 4, 22, 6);
  });
  makeTexture(scene, 'item_bomb', 32, 32, (g) => {
    g.fillStyle(0x342a25).fillCircle(16, 18, 11);
    g.fillStyle(0x59463a).fillCircle(16, 17, 9);
    g.fillStyle(0x88715b).fillEllipse(13, 13, 8, 5);
    g.fillStyle(0x1d1713).fillRect(13, 5, 6, 5);
    g.fillStyle(0xc7a75d).fillRect(12, 7, 8, 3);
    g.lineStyle(2, 0xf0c765).beginPath().moveTo(16, 6).lineTo(19, 3).lineTo(22, 4).strokePath();
    g.fillStyle(0xffe78c).fillCircle(23, 3, 2);
  });
  makeTexture(scene, 'npc_shopkeeper', 32, 32, (g) => {
    g.fillStyle(0x30251f).fillEllipse(16, 28, 23, 6);
    g.fillStyle(0x3f6d54).fillRect(7, 13, 18, 14);
    g.fillStyle(0x638f65).fillRect(9, 14, 14, 10);
    g.fillStyle(0xe8bd8b).fillEllipse(16, 12, 14, 14);
    g.fillStyle(0x563c2d).fillRect(9, 8, 14, 3).fillRect(11, 5, 10, 4);
    g.fillStyle(0x78533a).fillTriangle(7, 10, 25, 10, 16, 2);
    g.fillStyle(0x20201b).fillRect(12, 12, 2, 2).fillRect(18, 12, 2, 2);
    g.fillStyle(0xe4bf5c).fillRect(14, 18, 4, 2).fillCircle(16, 21, 2);
    g.fillStyle(0x8f513f).fillRect(7, 18, 4, 6).fillRect(21, 18, 4, 6);
  });
  makeTexture(scene, 'star', 16, 16, (g) => {
    g.fillStyle(0xf2e6c4).fillCircle(8, 8, 6);
    g.fillStyle(0xe89b3f).fillCircle(8, 8, 3);
  });
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload(): void {
    this.load.svg('hero', heroSpriteUrl, { width: 32, height: 32 });
    this.load.image('overworld-tiles', overworldTilesUrl);
    this.load.tilemapTiledJSON('overworld-map', overworldMapUrl);
  }

  create() {
    createTilesets(this);
    createSprites(this);
    this.registry.set('inventory', new InventorySystem());
    this.registry.set('dialogue', new DialogueSystem());
    this.registry.set('soundFx', new SoundSystem());
    this.scene.start('menu');
  }
}
