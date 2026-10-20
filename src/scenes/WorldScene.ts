import Phaser from 'phaser';
import Player from '../entities/Player.ts';
import Enemy from '../entities/Enemy.ts';
import Boomerang from '../entities/Boomerang.ts';
import Bomb from '../entities/Bomb.ts';
import Arrow from '../entities/Arrow.ts';
import { createEnemy } from '../entities/Gohma.ts';
import NPC from '../entities/NPC.ts';
import { Chest, LockedDoor, Fountain, Pickup, RupeePickup, Shopkeeper, ArrowPickup } from '../entities/Interactables.ts';
import CombatSystem from '../systems/CombatSystem.ts';
import TransitionSystem from '../systems/TransitionSystem.ts';
import { areas, TILE, ROOM_W, ROOM_H, ROOM_DATA_W, ROOM_DATA_H, VIEW_Y, ROOM_SCALE, TILES } from '../data/areas.ts';
import { jewelIds } from '../data/items.ts';
import type InventorySystem from '../systems/InventorySystem.ts';
import type DialogueSystem from '../systems/DialogueSystem.ts';
import type SoundSystem from '../systems/SoundSystem.ts';
import type { AreaDefinition, AreaId, AreaObjectSpec, AreaRoom, EnemyId, ItemId, RewardContents } from '../data/types.ts';

const ROOM_PX_W = ROOM_W * TILE;
const ROOM_PX_H = ROOM_H * TILE;
const BLOCK_TILES = { wall: TILES.WALL, water: TILES.WATER, tree: TILES.TREE, bombWall: TILES.BOMB_WALL };

interface RoomPosition { c: number; r: number }
type InteractableObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  active: boolean;
  interactRadius: number;
  interact(player: Player): void;
};

export default class WorldScene extends Phaser.Scene {
  areaId: AreaId = 'overworld';
  spawnId = 'start';
  inventory!: InventorySystem;
  dialogue!: DialogueSystem;
  soundFx!: SoundSystem;
  area!: AreaDefinition;
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  rupeePickups: RupeePickup[] = [];
  projectiles: Phaser.Physics.Arcade.Sprite[] = [];
  interactables: InteractableObject[] = [];
  solids!: Phaser.GameObjects.Group;
  enemyGroup!: Phaser.GameObjects.Group;
  projectileGroup!: Phaser.GameObjects.Group;
  ended = false;
  changingRoom = false;
  blockedSince: number | null = null;
  transitions!: TransitionSystem;
  layer!: Phaser.Tilemaps.TilemapLayer;
  overworldMap: Phaser.Tilemaps.Tilemap | null = null;
  player!: Player;
  boomerang: Boomerang | null = null;
  bombs: Bomb[] = [];
  arrows: Arrow[] = [];
  arrowPickups: ArrowPickup[] = [];
  arrowGroup!: Phaser.GameObjects.Group;
  bowSprite!: Phaser.GameObjects.Image;
  bombWallTiles = new Set<string>();
  combat!: CombatSystem;
  room: RoomPosition = { c: 0, r: 0 };

  constructor(key = 'world') {
    super({ key });
  }

  init(data: { areaId: AreaId; spawn: string }): void {
    this.areaId = data.areaId;
    this.spawnId = data.spawn;
  }

  create() {
    this.inventory = this.registry.get('inventory');
    this.dialogue = this.registry.get('dialogue');
    this.soundFx = this.registry.get('soundFx');
    this.area = areas[this.areaId];
    this.inventory.setArea(this.area.title);

    this.enemies = [];
    this.pickups = [];
    this.rupeePickups = [];
    this.projectiles = [];
    this.boomerang = null;
    this.bombs = [];
    this.arrows = [];
    this.arrowPickups = [];
    this.bombWallTiles.clear();
    this.interactables = [];
    this.solids = this.add.group();
    this.enemyGroup = this.add.group();
    this.projectileGroup = this.add.group();
    this.arrowGroup = this.add.group();
    this.bowSprite = this.add.image(0, 0, 'item_bow').setDepth(8).setVisible(false);
    this.ended = false;
    this.changingRoom = false;
    this.blockedSince = null;
    this.transitions = new TransitionSystem(this);

    this.buildMap();
    this.spawnPlayer();
    this.combat = new CombatSystem(this, this.player);
    this.buildRooms();

    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemyGroup, this.layer);
    this.physics.add.collider(this.enemyGroup, this.solids);
    this.physics.add.collider(this.projectileGroup, this.layer, (proj) => { proj.destroy(); });
    this.physics.add.overlap(this.projectileGroup, this.solids, (proj) => { proj.destroy(); });
    this.physics.add.collider(this.arrowGroup, this.layer, (arrowObj) => {
      const arrow = arrowObj as Arrow;
      this.soundFx.play('arrowHit');
      this.spawnSparks(arrow.x, arrow.y, 0xd8c89c);
      arrow.destroy();
      this.arrows = this.arrows.filter((a) => a !== arrow);
    });
    this.physics.add.overlap(this.arrowGroup, this.solids, (arrowObj) => {
      const arrow = arrowObj as Arrow;
      this.soundFx.play('arrowHit');
      this.spawnSparks(arrow.x, arrow.y, 0xd8c89c);
      arrow.destroy();
      this.arrows = this.arrows.filter((a) => a !== arrow);
    });
    this.physics.add.overlap(this.arrowGroup, this.enemyGroup, (arrowObj, enemyObj) => {
      const arrow = arrowObj as Arrow;
      const enemy = enemyObj as Enemy;
      if (!arrow.active || !enemy.active || enemy.state === 'dead') return;
      this.arrows = this.arrows.filter((a) => a !== arrow);
      arrow.destroy();
      const time = this.time.now;
      if (typeof (enemy as any).takeArrowHit === 'function') {
        (enemy as any).takeArrowHit(arrow.damage, arrow.x, arrow.y, time);
      } else {
        enemy.takeHit(arrow.damage, arrow.x, arrow.y, time);
      }
    });
    this.physics.add.overlap(this.projectileGroup, this.player, (projObj, playerObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Sprite;
      const player = playerObj as Player;
      proj.destroy();

      const time = this.time.now;
      const hasShield = !player.attacking;
      if (hasShield) {
        const dx = proj.x - player.x;
        const dy = proj.y - player.y;
        const dot = dx * player.facing.x + dy * player.facing.y;
        if (dot > 0) {
          this.soundFx.play('hit');
          return;
        }
      }
      player.takeDamage(1, proj.x, proj.y, time);
    });

    this.setupCamera();
    this.listenToDialogueEvents();
  }

  buildMap(): void {
    if (this.areaId === 'overworld') {
      this.buildTiledOverworld();
      return;
    }

    const { cols, rows, rooms, links } = this.area;
    const width = cols * ROOM_W;
    const height = rows * ROOM_H;
    const data = Array.from({ length: height }, () => Array(width).fill(TILES.WALL));

    for (const room of rooms) {
      const ox = room.c * ROOM_W;
      const oy = room.r * ROOM_H;
      for (let y = 1; y < ROOM_H - 1; y++) {
        for (let x = 1; x < ROOM_W - 1; x++) data[oy + y][ox + x] = (x + y) % 2;
      }
      for (const block of room.blocks || []) {
        const xStart = Math.floor(block.x * ROOM_W / ROOM_DATA_W);
        const xEnd = Math.ceil((block.x + block.w) * ROOM_W / ROOM_DATA_W);
        const yStart = Math.floor(block.y * ROOM_H / ROOM_DATA_H);
        const yEnd = Math.ceil((block.y + block.h) * ROOM_H / ROOM_DATA_H);
        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            data[oy + y][ox + x] = BLOCK_TILES[block.t];
            if (block.t === 'bombWall') this.bombWallTiles.add(`${ox + x},${oy + y}`);
          }
        }
      }
    }

    for (const [c1, r1, c2, r2] of links) {
      const ox = c1 * ROOM_W;
      const oy = r1 * ROOM_H;
      const horizontal = c2 > c1;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const x = horizontal ? ox + ROOM_W - 1 + j : ox + Math.floor(ROOM_W / 2) + i;
          const y = horizontal ? oy + Math.floor(ROOM_H / 2) + i : oy + ROOM_H - 1 + j;
          data[y][x] = TILES.FLOOR_A;
        }
      }
    }

    for (const room of rooms) {
      const ox = room.c * ROOM_W;
      const oy = room.r * ROOM_H;
      for (const portal of (room.objects || []).filter((object) => object.kind === 'portal')) {
        const localX = Math.round(portal.x * ROOM_W / ROOM_DATA_W);
        const localY = Math.round(portal.y * ROOM_H / ROOM_DATA_H);
        for (let y = Math.max(1, localY - 1); y <= Math.min(ROOM_H - 2, localY + 2); y++) {
          for (let x = Math.max(1, localX); x <= Math.min(ROOM_W - 2, localX + 1); x++) {
            data[oy + y][ox + x] = TILES.FLOOR_A;
          }
        }
      }
    }

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(`tiles_${this.areaId}`, `tiles_${this.areaId}`, TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, tileset!, 0, 0, false) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setCollision([TILES.WALL, TILES.WATER, TILES.TREE, TILES.BOMB_WALL]);
    this.physics.world.setBounds(0, 0, width * TILE, height * TILE);
  }

  private buildTiledOverworld(): void {
    const map = this.make.tilemap({ key: 'overworld-map' });
    this.overworldMap = map;
    const tileset = map.addTilesetImage('overworld-tiles', 'overworld-tiles', TILE, TILE, 0, 0);
    this.layer = map.createLayer('Terrain', tileset!, 0, 0, false) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setCollision([3, 4, 5, 6]);
    this.layer.forEachTile((tile) => {
      if (tile.index === 6) this.bombWallTiles.add(`${tile.x},${tile.y}`);
    });
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  }

  toPixels(room: RoomPosition, tx: number, ty: number, size = 1): { x: number; y: number } {
    const localX = Math.round(tx * ROOM_W / ROOM_DATA_W);
    const localY = Math.round(ty * ROOM_H / ROOM_DATA_H);
    return {
      x: (room.c * ROOM_W + localX) * TILE + (size * TILE) / 2,
      y: (room.r * ROOM_H + localY) * TILE + (size * TILE) / 2,
    };
  }

  spawnPlayer(): void {
    const spawn = this.area.spawns[this.spawnId] || this.area.spawns[this.area.defaultSpawn];
    const { x, y } = this.toPixels(spawn, spawn.x, spawn.y);
    this.player = new Player(this, x, y, this.inventory);
    this.room = { c: spawn.c, r: spawn.r };
  }

  setupCamera(): void {
    const camera = this.cameras.main;
    camera.setViewport(0, VIEW_Y * ROOM_SCALE, ROOM_PX_W * ROOM_SCALE, ROOM_PX_H * ROOM_SCALE);
    camera.setZoom(ROOM_SCALE);
    camera.centerOn((this.room.c + 0.5) * ROOM_PX_W, (this.room.r + 0.5) * ROOM_PX_H);
  }

  buildRooms(): void {
    if (this.areaId === 'overworld') {
      this.buildTiledEntities();
      this.buildBoss();
      return;
    }

    for (const room of this.area.rooms) {
      const roomKey = `${room.c},${room.r}`;
      for (const [type, tx, ty] of room.enemies || []) {
        const { x, y } = this.toPixels(room, tx, ty);
        this.addEnemy(createEnemy(this, x, y, type, roomKey));
      }
      (room.objects || []).forEach((spec, index) => {
        this.buildObject(room, spec, `${this.areaId}:${roomKey}:${index}`);
      });
    }
    this.buildBoss();
  }

  private buildTiledEntities(): void {
    const objects = this.overworldMap?.getObjectLayer('Entities')?.objects || [];
    for (const object of objects) {
      const rawProperties = object.properties || [];
      const properties = Array.isArray(rawProperties)
        ? Object.fromEntries(rawProperties.map((property: { name: string; value: unknown }) => [property.name, property.value]))
        : rawProperties as Record<string, unknown>;
      const entityKind = (properties.kind as string | undefined) || object.type;
      const objectId = `overworld:tiled:${object.id}`;
      const room = {
        c: Math.floor(object.x / ROOM_PX_W),
        r: Math.floor(object.y / ROOM_PX_H),
      };

      switch (entityKind) {
        case 'enemy': {
          const enemyType = properties.enemy as EnemyId | undefined;
          if (enemyType) this.addEnemy(createEnemy(this, object.x, object.y, enemyType, `${room.c},${room.r}`));
          break;
        }
        case 'portal': {
          const target = properties.to as AreaId | undefined;
          if (!target) break;
          this.add.image(object.x + TILE, object.y + TILE / 2, 'doorway').setDepth(1);
          this.transitions.addPortal(object.x, object.y - TILE / 2, TILE * 2, TILE * 2, {
            area: target,
            spawn: properties.spawn as string | undefined,
          });
          break;
        }
        case 'chest':
        case 'pickup': {
          const contents: RewardContents | null = properties.heartPiece
            ? { heartPiece: true }
            : properties.item
              ? { item: properties.item as ItemId }
              : null;
          if (!contents) break;
          if (entityKind === 'chest') this.addInteractable(new Chest(this, objectId, object.x, object.y, contents));
          else this.addPickup(objectId, object.x, object.y, contents);
          break;
        }
        case 'lockedDoor':
          if (!this.inventory.hasFlag(objectId)) this.addInteractable(new LockedDoor(this, objectId, object.x, object.y));
          break;
        case 'fountain':
          this.addInteractable(new Fountain(this, object.x, object.y));
          break;
        case 'shop':
          this.addInteractable(new Shopkeeper(this, object.x, object.y));
          break;
        case 'npc': {
          const texture = properties.texture as string | undefined;
          const dialogue = properties.dialogue as string | undefined;
          if (texture && dialogue) {
            this.addInteractable(new NPC(this, objectId, object.x, object.y, {
              texture,
              dialogue,
              repeat: properties.repeat as string | undefined,
            }));
          }
          break;
        }
        default:
          break;
      }
    }
  }

  buildObject(room: AreaRoom, spec: AreaObjectSpec, id: string): void {
    const size = spec.kind === 'lockedDoor' || spec.kind === 'fountain' ? 2 : 1;
    const { x, y } = this.toPixels(room, spec.x, spec.y, size);

    switch (spec.kind) {
      case 'chest':
        this.addInteractable(new Chest(this, id, x, y, spec.contents));
        break;
      case 'lockedDoor':
        if (this.inventory.hasFlag(id)) break;
        this.addInteractable(new LockedDoor(this, id, x, y));
        break;
      case 'fountain':
        this.addInteractable(new Fountain(this, x, y));
        break;
      case 'shop':
        this.addInteractable(new Shopkeeper(this, x, y));
        break;
      case 'npc':
        if (spec.texture && spec.dialogue) this.addInteractable(new NPC(this, id, x, y, spec as { texture: string; dialogue: string; repeat?: string }));
        break;
      case 'pickup':
        this.addPickup(id, x, y, spec.contents);
        break;
      case 'portal': {
        if (!spec.to) break;
        const localX = Math.round(spec.x * ROOM_W / ROOM_DATA_W);
        const localY = Math.round(spec.y * ROOM_H / ROOM_DATA_H);
        const rectX = (room.c * ROOM_W + localX) * TILE;
        const rectY = (room.r * ROOM_H + localY) * TILE;
        this.add.image(rectX + TILE, rectY + TILE / 2, 'doorway').setDepth(1);
        this.transitions.addPortal(rectX, rectY - TILE / 2, TILE * 2, TILE * 2, { area: spec.to, spawn: spec.spawn });
        break;
      }
      default:
        break;
    }
  }

  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
    this.enemyGroup.add(enemy);
  }

  spawnProjectile(x: number, y: number, targetX: number, targetY: number): void {
    const angle = Math.atan2(targetY - y, targetX - x);
    const offsetDistance = 24;
    const spawnX = x + Math.cos(angle) * offsetDistance;
    const spawnY = y + Math.sin(angle) * offsetDistance;

    const proj = this.physics.add.sprite(spawnX, spawnY, 'star').setDepth(6);
    proj.body.setCircle(6, 2, 2);
    const speed = 180;
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.projectileGroup.add(proj);
    this.soundFx.play('hit');
    this.time.delayedCall(6000, () => {
      if (proj.active) proj.destroy();
    });
  }

  addInteractable(object: InteractableObject): void {
    this.interactables.push(object);
    if (object.body) this.solids.add(object);
  }

  addPickup(id: string, x: number, y: number, contents: RewardContents): void {
    if (this.inventory.hasFlag(id)) return;
    this.pickups.push(new Pickup(this, id, x, y, contents));
  }

  buildBoss(): void {
    const { boss } = this.area;
    if (!boss) return;
    if (this.inventory.hasFlag(boss.flag)) {
      this.spawnBossRewards();
      return;
    }
    const { x, y } = this.toPixels(boss, boss.x, boss.y);
    this.addEnemy(createEnemy(this, x, y, boss.type, `${boss.c},${boss.r}`));
  }

  spawnBossRewards(): void {
    const { boss } = this.area;
    const { x, y } = this.toPixels(boss, boss.x, boss.y);
    this.addPickup(`${this.areaId}:boss:jewel`, x - 28, y, { item: boss.jewel });
    this.addPickup(`${this.areaId}:boss:heart`, x + 28, y, { heartPiece: true });
  }

  onEnemyDefeated(enemy: Enemy): void {
    this.enemies = this.enemies.filter((other) => other !== enemy);
    const drop = enemy.config.rupeeDrop;
    if (drop && Math.random() < drop.chance) {
      this.rupeePickups.push(new RupeePickup(this, enemy.x, enemy.y, drop.amount));
    }
    if (this.inventory.has('bow') && Math.random() < 0.28) {
      this.arrowPickups.push(new ArrowPickup(this, enemy.x, enemy.y, 3));
    }
    if (!enemy.isBoss) return;
    this.inventory.setFlag(this.area.boss.flag);
    this.inventory.notify('¡Jefe derrotado!');
    this.spawnBossRewards();
  }

  spawnSparks(x: number, y: number, color = 0xffee88): void {
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.random() * 0.4;
      const spark = this.add.circle(x, y, 2.5, color, 0.9).setDepth(14);
      const dist = 14 + Math.random() * 10;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 180,
        onComplete: () => spark.destroy(),
      });
    }
  }

  shootBow(): void {
    if (!this.inventory.has('bow')) return;
    if (this.inventory.count('arrow') <= 0) {
      this.soundFx.play('clink');
      this.inventory.notify('¡Sin flechas!');
      return;
    }
    this.inventory.remove('arrow', 1);
    const { x, y } = this.player.facing;
    const arrow = new Arrow(this, this.player.x + x * 18, this.player.y + y * 18, this.player.facing);
    this.arrows.push(arrow);
    this.arrowGroup.add(arrow);
    this.soundFx.play('bow');

    this.bowSprite
      .setPosition(this.player.x + x * 14, this.player.y + y * 14)
      .setRotation(Math.atan2(y, x) + Math.PI / 2)
      .setVisible(true);
    this.time.delayedCall(120, () => {
      if (this.bowSprite?.active) this.bowSprite.setVisible(false);
    });
  }

  throwBoomerang(): void {
    if (!this.inventory.has('boomerang') || this.boomerang) return;
    const { x, y } = this.player.facing;
    this.boomerang = new Boomerang(
      this,
      this.player.x + x * 22,
      this.player.y + y * 22,
      this.player.facing,
    );
    this.soundFx.play('boomerang');
  }

  onBoomerangCaught(boomerang: Boomerang): void {
    if (this.boomerang !== boomerang) return;
    this.boomerang = null;
  }

  placeBomb(): void {
    if (!this.inventory.has('bomb')) return;
    this.inventory.remove('bomb');
    const x = Math.floor(this.player.x / TILE) * TILE + TILE / 2;
    const y = Math.floor(this.player.y / TILE) * TILE + TILE / 2;
    const bomb = new Bomb(this, x, y);
    this.bombs.push(bomb);
    this.soundFx.play('bomb');
  }

  explodeBomb(x: number, y: number): void {
    const radius = TILE * 2.75;
    const blast = this.add.circle(x, y, 10, 0xf08b3e, 0.76).setDepth(12);
    this.add.circle(x, y, 5, 0xffe6a1, 0.9).setDepth(13);
    this.tweens.add({
      targets: blast,
      scale: radius / 10,
      alpha: 0,
      duration: 260,
      onComplete: () => blast.destroy(),
    });
    this.soundFx.play('explosion');

    const roomKey = `${Math.floor(x / ROOM_PX_W)},${Math.floor(y / ROOM_PX_H)}`;
    const time = this.time.now;
    this.enemies.filter((enemy) => enemy.room === roomKey && enemy.state !== 'dead')
      .forEach((enemy) => {
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) enemy.takeHit(2, x, y, time);
      });
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) <= radius) {
      this.player.takeDamage(1, x + 1, y, time);
    }

    for (const tileKey of this.bombWallTiles) {
      const [tileX, tileY] = tileKey.split(',').map(Number);
      const tileCenterX = (tileX + 0.5) * TILE;
      const tileCenterY = (tileY + 0.5) * TILE;
      if (Phaser.Math.Distance.Between(x, y, tileCenterX, tileCenterY) > radius) continue;
      this.layer.putTileAt(this.areaId === 'overworld' ? 1 : TILES.FLOOR_A, tileX, tileY);
      this.bombWallTiles.delete(tileKey);
    }
    this.bombs = this.bombs.filter((bomb) => bomb.active);
  }

  onPlayerDefeated(): void {
    if (this.ended) return;
    this.ended = true;
    this.player.body.setVelocity(0, 0);
    this.inventory.notify('Has caído. Vuelves a la entrada');
    const camera = this.cameras.main;
    camera.fadeOut(700, 0, 0, 0);
    camera.once('camerafadeoutcomplete', () => {
      this.inventory.fullHeal();
      this.scene.start(this.area.scene, { areaId: this.areaId, spawn: this.area.defaultSpawn });
    });
  }

  listenToDialogueEvents(): void {
    const onEvent = (event) => this.handleDialogueEvent(event);
    this.dialogue.on('event', onEvent);
    this.events.once('shutdown', () => this.dialogue.off('event', onEvent));
  }

  handleDialogueEvent(event: string): void {
    if (event === 'sage_gift' && !this.inventory.hasFlag('sage_gift')) {
      this.inventory.setFlag('sage_gift');
      this.inventory.add('health_potion', 2);
      this.inventory.notify('Has conseguido: 2 pociones de salud');
    }
    if (event === 'deliver_jewels') this.winGame();
  }

  winGame(): void {
    this.soundFx.play('jewel');
    jewelIds.forEach((id) => this.inventory.remove(id));
    this.inventory.setFlag('game_won');
    this.ended = true;
    const camera = this.cameras.main;
    camera.fadeOut(900, 255, 255, 255);
    camera.once('camerafadeoutcomplete', () => this.scene.start('end'));
  }

  tryInteract(): void {
    const { facing } = this.player;
    const probeX = this.player.x + facing.x * 14;
    const probeY = this.player.y + facing.y * 14;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const object of this.interactables) {
      if (!object.active) continue;
      const distance = Phaser.Math.Distance.Between(probeX, probeY, object.x, object.y);
      if (distance < object.interactRadius && distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    }
    if (nearest) nearest.interact(this.player);
  }

  updateRoom(): void {
    const c = Math.floor(this.player.x / ROOM_PX_W);
    const r = Math.floor(this.player.y / ROOM_PX_H);
    if (c === this.room.c && r === this.room.r) return;
    this.room = { c, r };
    this.changingRoom = true;
    this.player.body.setVelocity(0, 0);
    this.cameras.main.pan(
      (c + 0.5) * ROOM_PX_W,
      (r + 0.5) * ROOM_PX_H,
      300,
      'Sine.easeInOut',
      false,
      () => { this.changingRoom = false; },
    );
  }

  freezeAll(): void {
    this.player.body.setVelocity(0, 0);
    this.enemies.forEach((enemy) => enemy.freeze());
  }

  resumeAfterBlock(time: number): void {
    if (this.blockedSince === null) return;
    const delta = time - this.blockedSince;
    this.blockedSince = null;
    this.enemies.forEach((enemy) => enemy.shiftTimers(delta));
    this.combat.shiftTimers(delta);
    this.player.invulnerableUntil += delta;
  }

  update(time: number): void {
    const input = this.player.readInput();
    if (this.ended) {
      this.player.body.setVelocity(0, 0);
      return;
    }
    if (this.inventory.paused || this.dialogue.active) {
      if (this.blockedSince === null) this.blockedSince = time;
      this.freezeAll();
      return;
    }
    this.resumeAfterBlock(time);

    if (this.changingRoom) {
      this.freezeAll();
      return;
    }

    // La UI puede cerrar el diálogo en este mismo frame con la misma tecla.
    const justClosedDialogue = Date.now() - this.dialogue.closedAt < 250;
    if (input.interact && !justClosedDialogue) this.tryInteract();
    if (input.attack && !justClosedDialogue) this.combat.tryAttack(time);
    if (input.boomerang && !justClosedDialogue) this.throwBoomerang();
    if (input.bomb && !justClosedDialogue) this.placeBomb();
    if (input.bow && !justClosedDialogue) this.shootBow();
    this.player.applyMovement(input.dir, time);

    const roomKey = `${this.room.c},${this.room.r}`;
    const localEnemies = this.enemies.filter((enemy) => enemy.room === roomKey);
    this.enemies.forEach((enemy) => {
      if (enemy.room !== roomKey) enemy.freeze();
    });
    this.combat.update(time, localEnemies);
    localEnemies.forEach((enemy) => enemy.updateAI(time, this.player));

    if (this.boomerang?.active) {
      this.boomerang.update(this.game.loop.delta, this.player);
      if (this.boomerang?.active) {
        this.rupeePickups = this.rupeePickups.filter((pickup) => {
          if (Phaser.Math.Distance.Between(this.boomerang!.x, this.boomerang!.y, pickup.x, pickup.y) > 20) return true;
          pickup.collect();
          return false;
        });
        this.arrowPickups = this.arrowPickups.filter((pickup) => {
          if (Phaser.Math.Distance.Between(this.boomerang!.x, this.boomerang!.y, pickup.x, pickup.y) > 20) return true;
          pickup.collect();
          return false;
        });
      }
      if (this.boomerang?.active && !this.boomerang.returning) {
        const target = localEnemies.find((enemy) => enemy.state !== 'dead'
          && Phaser.Math.Distance.Between(this.boomerang!.x, this.boomerang!.y, enemy.x, enemy.y) < enemy.config.radius + 13);
        if (target) {
          target.stun(time);
          this.boomerang.turnBack();
        }
      }
    }

    this.pickups = this.pickups.filter((pickup) => {
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) > 24) return true;
      pickup.collect();
      return false;
    });

    this.rupeePickups = this.rupeePickups.filter((pickup) => {
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) > 22) return true;
      pickup.collect();
      return false;
    });

    this.arrowPickups = this.arrowPickups.filter((pickup) => {
      if (!pickup.active) return false;
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) > 22) return true;
      pickup.collect();
      return false;
    });

    const rx = this.room.c * ROOM_PX_W;
    const ry = this.room.r * ROOM_PX_H;
    for (const arrow of this.arrows) {
      if (!arrow.active) continue;
      if (arrow.x < rx || arrow.x > rx + ROOM_PX_W || arrow.y < ry || arrow.y > ry + ROOM_PX_H) {
        arrow.destroy();
      }
    }
    this.arrows = this.arrows.filter((a) => a.active);

    this.transitions.update(this.player);
    this.updateRoom();
  }
}
