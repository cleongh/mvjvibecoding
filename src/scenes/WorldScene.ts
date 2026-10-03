import Phaser from 'phaser';
import Player from '../entities/Player.ts';
import Enemy from '../entities/Enemy.ts';
import NPC from '../entities/NPC.ts';
import { Chest, LockedDoor, Fountain, Pickup } from '../entities/Interactables.ts';
import CombatSystem from '../systems/CombatSystem.ts';
import TransitionSystem from '../systems/TransitionSystem.ts';
import { areas, TILE, ROOM_W, ROOM_H, VIEW_Y, TILES } from '../data/areas.ts';
import { jewelIds } from '../data/items.ts';
import type InventorySystem from '../systems/InventorySystem.ts';
import type DialogueSystem from '../systems/DialogueSystem.ts';
import type SoundSystem from '../systems/SoundSystem.ts';
import type { AreaDefinition, AreaId, AreaObjectSpec, AreaRoom, RewardContents } from '../data/types.ts';

const ROOM_PX_W = ROOM_W * TILE;
const ROOM_PX_H = ROOM_H * TILE;
const BLOCK_TILES = { wall: TILES.WALL, water: TILES.WATER, tree: TILES.TREE };

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
  interactables: InteractableObject[] = [];
  solids!: Phaser.GameObjects.Group;
  enemyGroup!: Phaser.GameObjects.Group;
  ended = false;
  changingRoom = false;
  blockedSince: number | null = null;
  transitions!: TransitionSystem;
  layer!: Phaser.Tilemaps.TilemapLayer;
  player!: Player;
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
    this.interactables = [];
    this.solids = this.add.group();
    this.enemyGroup = this.add.group();
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

    this.setupCamera();
    this.listenToDialogueEvents();
  }

  buildMap(): void {
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
        for (let y = block.y; y < block.y + block.h; y++) {
          for (let x = block.x; x < block.x + block.w; x++) data[oy + y][ox + x] = BLOCK_TILES[block.t];
        }
      }
    }

    for (const [c1, r1, c2, r2] of links) {
      const ox = c1 * ROOM_W;
      const oy = r1 * ROOM_H;
      const horizontal = c2 > c1;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const x = horizontal ? ox + ROOM_W - 1 + j : ox + 14 + i;
          const y = horizontal ? oy + 8 + i : oy + ROOM_H - 1 + j;
          data[y][x] = TILES.FLOOR_A;
        }
      }
    }

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(`tiles_${this.areaId}`, `tiles_${this.areaId}`, TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, tileset!, 0, 0, false) as Phaser.Tilemaps.TilemapLayer;
    this.layer.setCollision([TILES.WALL, TILES.WATER, TILES.TREE]);
    this.physics.world.setBounds(0, 0, width * TILE, height * TILE);
  }

  toPixels(room: RoomPosition, tx: number, ty: number, size = 1): { x: number; y: number } {
    return {
      x: (room.c * ROOM_W + tx) * TILE + (size * TILE) / 2,
      y: (room.r * ROOM_H + ty) * TILE + (size * TILE) / 2,
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
    camera.setViewport(0, VIEW_Y, ROOM_PX_W, ROOM_PX_H);
    camera.setScroll(this.room.c * ROOM_PX_W, this.room.r * ROOM_PX_H);
  }

  buildRooms(): void {
    for (const room of this.area.rooms) {
      const roomKey = `${room.c},${room.r}`;
      for (const [type, tx, ty] of room.enemies || []) {
        const { x, y } = this.toPixels(room, tx, ty);
        this.addEnemy(new Enemy(this, x, y, type, roomKey));
      }
      (room.objects || []).forEach((spec, index) => {
        this.buildObject(room, spec, `${this.areaId}:${roomKey}:${index}`);
      });
    }
    this.buildBoss();
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
      case 'npc':
        if (spec.texture && spec.dialogue) this.addInteractable(new NPC(this, id, x, y, spec as { texture: string; dialogue: string; repeat?: string }));
        break;
      case 'pickup':
        this.addPickup(id, x, y, spec.contents);
        break;
      case 'portal': {
        if (!spec.to) break;
        const rectX = (room.c * ROOM_W + spec.x) * TILE;
        const rectY = (room.r * ROOM_H + spec.y) * TILE;
        this.add.image(rectX + TILE, rectY + TILE / 2, 'doorway').setDepth(1);
        this.transitions.addPortal(rectX, rectY, TILE * 2, TILE, { area: spec.to, spawn: spec.spawn });
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
    this.addEnemy(new Enemy(this, x, y, boss.type, `${boss.c},${boss.r}`));
  }

  spawnBossRewards(): void {
    const { boss } = this.area;
    const { x, y } = this.toPixels(boss, boss.x, boss.y);
    this.addPickup(`${this.areaId}:boss:jewel`, x - 28, y, { item: boss.jewel });
    this.addPickup(`${this.areaId}:boss:heart`, x + 28, y, { heartPiece: true });
  }

  onEnemyDefeated(enemy: Enemy): void {
    this.enemies = this.enemies.filter((other) => other !== enemy);
    if (!enemy.isBoss) return;
    this.inventory.setFlag(this.area.boss.flag);
    this.inventory.notify('¡Jefe derrotado!');
    this.spawnBossRewards();
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
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: c * ROOM_PX_W,
      scrollY: r * ROOM_PX_H,
      duration: 300,
      onComplete: () => { this.changingRoom = false; },
    });
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
    this.player.applyMovement(input.dir, time);

    const roomKey = `${this.room.c},${this.room.r}`;
    const localEnemies = this.enemies.filter((enemy) => enemy.room === roomKey);
    this.enemies.forEach((enemy) => {
      if (enemy.room !== roomKey) enemy.freeze();
    });
    this.combat.update(time, localEnemies);
    localEnemies.forEach((enemy) => enemy.updateAI(time, this.player));

    this.pickups = this.pickups.filter((pickup) => {
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) > 24) return true;
      pickup.collect();
      return false;
    });

    this.transitions.update(this.player);
    this.updateRoom();
  }
}
