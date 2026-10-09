export const TILE = 32;
export const ROOM_W = 30;
export const ROOM_H = 18;
export const VIEW_Y = 64;
export const TILES = { FLOOR_A: 0, FLOOR_B: 1, WALL: 2, WATER: 3, TREE: 4 };

import type { AreaDefinition, AreaId, AreaObjectSpec, BlockSpec, RewardContents } from './types.ts';

const pillars = (): BlockSpec[] => [
  { t: 'wall', x: 6, y: 4, w: 2, h: 2 },
  { t: 'wall', x: 22, y: 4, w: 2, h: 2 },
  { t: 'wall', x: 6, y: 12, w: 2, h: 2 },
  { t: 'wall', x: 22, y: 12, w: 2, h: 2 },
];

const exitPortal: AreaObjectSpec = { kind: 'portal', x: 14, y: 16, to: 'overworld' };
const chest = (contents: RewardContents): AreaObjectSpec => ({ kind: 'chest', x: 26, y: 3, contents });
const key: RewardContents = { item: 'small_key' };
const potion: RewardContents = { item: 'health_potion' };
const piece: RewardContents = { heartPiece: true };

// Los huecos entre habitaciones se abren con links [c1, r1, c2, r2]: (c2, r2) está al este o al sur de (c1, r1).
// Las coordenadas de bloques y objetos son locales a la habitación, en tiles (30x18).
export const areas = {
  overworld: {
    id: 'overworld',
    scene: 'world',
    title: 'El Brezal',
    theme: { floorA: 0x4b7553, floorB: 0x527d58, wall: 0x6b6a5e, wallLight: 0x8c8b78, water: 0x3f78a8, tree: 0x2f5144 },
    cols: 3,
    rows: 2,
    defaultSpawn: 'start',
    spawns: {
      start: { c: 0, r: 0, x: 14, y: 12 },
      dungeon1: { c: 0, r: 1, x: 8, y: 10 },
      dungeon2: { c: 2, r: 0, x: 14, y: 7 },
      dungeon3: { c: 2, r: 1, x: 20, y: 10 },
    },
    links: [[0, 0, 1, 0], [1, 0, 2, 0], [0, 1, 1, 1], [1, 1, 2, 1], [0, 0, 0, 1], [1, 0, 1, 1], [2, 0, 2, 1]],
    rooms: [
      {
        c: 0, r: 0,
        blocks: [
          { t: 'tree', x: 3, y: 3, w: 4, h: 2 },
          { t: 'tree', x: 22, y: 12, w: 4, h: 2 },
          { t: 'tree', x: 3, y: 12, w: 2, h: 3 },
        ],
        enemies: [['shooter', 19, 11]],
        objects: [
          { kind: 'npc', x: 9, y: 6, texture: 'npc_sage', dialogue: 'sage_intro', repeat: 'sage_repeat' },
          { kind: 'npc', x: 17, y: 6, texture: 'sign', dialogue: 'sign_start' },
          chest(potion),
        ],
      },
      {
        c: 1, r: 0,
        blocks: [
          { t: 'water', x: 11, y: 5, w: 8, h: 3 },
          { t: 'tree', x: 3, y: 3, w: 3, h: 3 },
        ],
        enemies: [['slime', 7, 12], ['shooter', 22, 12], ['slime', 24, 4]],
        objects: [{ kind: 'pickup', x: 26, y: 14, contents: piece }],
      },
      {
        c: 2, r: 0,
        blocks: [{ t: 'wall', x: 10, y: 1, w: 10, h: 2 }],
        enemies: [['shooter', 6, 10], ['skeleton', 23, 11], ['shooter', 15, 8]],
        objects: [{ kind: 'portal', x: 14, y: 3, to: 'dungeon2' }],
      },
      {
        c: 0, r: 1,
        blocks: [{ t: 'wall', x: 4, y: 14, w: 9, h: 3 }],
        enemies: [['slime', 22, 6], ['slime', 24, 12]],
        objects: [
          { kind: 'portal', x: 8, y: 13, to: 'dungeon1' },
          { kind: 'npc', x: 11, y: 12, texture: 'sign', dialogue: 'sign_dungeon1' },
        ],
      },
      {
        c: 1, r: 1,
        blocks: [
          { t: 'tree', x: 3, y: 3, w: 3, h: 3 },
          { t: 'tree', x: 24, y: 3, w: 3, h: 3 },
          { t: 'tree', x: 3, y: 12, w: 3, h: 3 },
          { t: 'tree', x: 24, y: 12, w: 3, h: 3 },
        ],
        enemies: [],
        objects: [{ kind: 'fountain', x: 14, y: 5 }],
      },
      {
        c: 2, r: 1,
        blocks: [{ t: 'wall', x: 17, y: 14, w: 8, h: 3 }],
        enemies: [['skeleton', 6, 5], ['skeleton', 8, 13], ['skeleton', 24, 5]],
        objects: [
          { kind: 'portal', x: 20, y: 13, to: 'dungeon3' },
          chest(piece),
        ],
      },
    ],
  },

  dungeon1: {
    id: 'dungeon1',
    scene: 'dungeon',
    title: 'Cripta del Musgo',
    theme: { floorA: 0x39473e, floorB: 0x3f4f44, wall: 0x2a3a31, wallLight: 0x587363, water: 0x3f78a8, tree: 0x2f5144 },
    cols: 2,
    rows: 2,
    defaultSpawn: 'entrance',
    spawns: { entrance: { c: 0, r: 1, x: 14, y: 12 } },
    links: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 0, 1, 1]],
    boss: { c: 1, r: 0, x: 14, y: 6, type: 'boss_moss', jewel: 'jewel_moss', flag: 'dungeon1:boss' },
    rooms: [
      {
        c: 0, r: 1, blocks: pillars(),
        enemies: [['slime', 10, 7], ['slime', 19, 10]],
        objects: [{ ...exitPortal, spawn: 'dungeon1' }],
      },
      {
        c: 1, r: 1, blocks: pillars(),
        enemies: [['slime', 10, 7], ['slime', 19, 11], ['slime', 12, 13]],
        objects: [chest(key)],
      },
      {
        c: 0, r: 0, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['slime', 19, 10]],
        objects: [chest(piece)],
      },
      {
        c: 1, r: 0, blocks: pillars(),
        enemies: [],
        objects: [{ kind: 'lockedDoor', x: 14, y: 17 }],
      },
    ],
  },

  dungeon2: {
    id: 'dungeon2',
    scene: 'dungeon',
    title: 'Mina Ardiente',
    theme: { floorA: 0x4a3a35, floorB: 0x53423b, wall: 0x2f211f, wallLight: 0x8a5a45, water: 0xc8582f, tree: 0x2f5144 },
    cols: 3,
    rows: 2,
    defaultSpawn: 'entrance',
    spawns: { entrance: { c: 0, r: 1, x: 14, y: 12 } },
    links: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 2, 1], [1, 0, 1, 1], [2, 0, 2, 1]],
    boss: { c: 2, r: 0, x: 14, y: 6, type: 'boss_ember', jewel: 'jewel_ember', flag: 'dungeon2:boss' },
    rooms: [
      {
        c: 0, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['slime', 19, 10]],
        objects: [{ ...exitPortal, spawn: 'dungeon2' }],
      },
      {
        c: 1, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 11], ['slime', 12, 13]],
        objects: [],
      },
      {
        c: 2, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 10], ['skeleton', 19, 7], ['skeleton', 12, 13]],
        objects: [chest(potion)],
      },
      {
        c: 0, r: 0, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 10]],
        objects: [chest(piece)],
      },
      {
        c: 1, r: 0, blocks: pillars(),
        enemies: [['skeleton', 10, 10], ['slime', 19, 7], ['skeleton', 12, 13]],
        objects: [chest(key)],
      },
      {
        c: 2, r: 0, blocks: pillars(),
        enemies: [],
        objects: [{ kind: 'lockedDoor', x: 14, y: 17 }],
      },
    ],
  },

  dungeon3: {
    id: 'dungeon3',
    scene: 'dungeon',
    title: 'Torre de la Marea',
    theme: { floorA: 0x33495a, floorB: 0x3a5163, wall: 0x22313f, wallLight: 0x5f8aa6, water: 0x2f78b8, tree: 0x2f5144 },
    cols: 3,
    rows: 2,
    defaultSpawn: 'entrance',
    spawns: { entrance: { c: 0, r: 1, x: 14, y: 12 } },
    links: [[0, 1, 1, 1], [1, 1, 2, 1], [1, 0, 1, 1], [0, 0, 1, 0], [2, 0, 2, 1]],
    boss: { c: 2, r: 0, x: 14, y: 6, type: 'boss_tide', jewel: 'jewel_tide', flag: 'dungeon3:boss' },
    rooms: [
      {
        c: 0, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 10]],
        objects: [{ ...exitPortal, spawn: 'dungeon3' }],
      },
      {
        c: 1, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 11], ['skeleton', 12, 13]],
        objects: [],
      },
      {
        c: 2, r: 1, blocks: pillars(),
        enemies: [['skeleton', 10, 10], ['skeleton', 19, 7], ['slime', 12, 13]],
        objects: [chest(key)],
      },
      {
        c: 1, r: 0, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 10], ['skeleton', 12, 13]],
        objects: [chest(piece), { kind: 'lockedDoor', x: 14, y: 17 }],
      },
      {
        c: 0, r: 0, blocks: pillars(),
        enemies: [['skeleton', 10, 7], ['skeleton', 19, 10]],
        objects: [chest(key)],
      },
      {
        c: 2, r: 0, blocks: pillars(),
        enemies: [],
        objects: [{ kind: 'lockedDoor', x: 14, y: 17 }],
      },
    ],
  },
} satisfies Record<AreaId, AreaDefinition>;
