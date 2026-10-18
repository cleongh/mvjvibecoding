import BootScene from './scenes/BootScene.ts';
import WorldScene from './scenes/WorldScene.ts';
import DungeonScene from './scenes/DungeonScene.ts';
import UIScene from './scenes/UIScene.ts';
import EndScene from './scenes/EndScene.ts';
import MenuScene from './scenes/MenuScene.ts';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './data/areas.ts';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'juego',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  scene: [BootScene, MenuScene, WorldScene, DungeonScene, EndScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
