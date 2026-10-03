import BootScene from './scenes/BootScene.ts';
import WorldScene from './scenes/WorldScene.ts';
import DungeonScene from './scenes/DungeonScene.ts';
import UIScene from './scenes/UIScene.ts';
import EndScene from './scenes/EndScene.ts';
import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'juego',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  scene: [BootScene, WorldScene, DungeonScene, EndScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
