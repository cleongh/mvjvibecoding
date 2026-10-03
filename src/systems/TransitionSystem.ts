import Phaser from 'phaser';
import { areas } from '../data/areas.ts';
import type WorldScene from '../scenes/WorldScene.ts';
import type Player from '../entities/Player.ts';
import type { AreaId } from '../data/types.ts';

interface PortalTarget {
  area: AreaId;
  spawn?: string;
}

export default class TransitionSystem {
  readonly scene: WorldScene;
  readonly portals: { rect: Phaser.Geom.Rectangle; target: PortalTarget }[] = [];
  active = false;

  constructor(scene: WorldScene) {
    this.scene = scene;
    this.portals = [];
    this.active = false;
  }

  addPortal(x: number, y: number, width: number, height: number, target: PortalTarget): void {
    this.portals.push({ rect: new Phaser.Geom.Rectangle(x, y, width, height), target });
  }

  update(player: Player): void {
    if (this.active) return;
    const portal = this.portals.find(({ rect }) => Phaser.Geom.Rectangle.Contains(rect, player.x, player.y));
    if (portal) this.go(portal.target);
  }

  go({ area, spawn }: PortalTarget): void {
    this.active = true;
    this.scene.ended = true;
    const camera = this.scene.cameras.main;
    camera.fadeOut(250, 0, 0, 0);
    camera.once('camerafadeoutcomplete', () => {
      this.scene.scene.start(areas[area].scene, { areaId: area, spawn });
    });
  }
}
