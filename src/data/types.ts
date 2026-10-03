export type ItemId =
  | 'small_key'
  | 'health_potion'
  | 'jewel_moss'
  | 'jewel_ember'
  | 'jewel_tide';

export type ItemKind = 'key' | 'consumable' | 'quest';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  type: ItemKind;
  description: string;
  heal?: number;
}

export type RewardContents = { item: ItemId } | { heartPiece: true };
export type EnemyId = 'slime' | 'skeleton' | 'boss_moss' | 'boss_ember' | 'boss_tide';
export type EnemyState = 'idle' | 'chase' | 'windup' | 'attack' | 'recovery' | 'hurt' | 'dead';

export interface EnemyDefinition {
  texture: string;
  hp: number;
  speed: number;
  damage: number;
  sight: number;
  attackRange: number;
  windup: number;
  lunge: { speed: number; duration: number };
  recovery: number;
  hitRadius: number;
  radius: number;
  boss?: boolean;
  scale?: number;
}

export type BlockKind = 'wall' | 'water' | 'tree';
export interface BlockSpec {
  t: BlockKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AreaObjectSpec {
  kind: 'portal' | 'chest' | 'lockedDoor' | 'fountain' | 'npc' | 'pickup';
  x: number;
  y: number;
  to?: AreaId;
  spawn?: string;
  contents?: RewardContents;
  texture?: string;
  dialogue?: string;
  repeat?: string;
}

export type AreaId = 'overworld' | 'dungeon1' | 'dungeon2' | 'dungeon3';
export interface AreaRoom {
  c: number;
  r: number;
  blocks?: BlockSpec[];
  enemies?: [EnemyId, number, number][];
  objects?: AreaObjectSpec[];
}

export interface AreaSpawn {
  c: number;
  r: number;
  x: number;
  y: number;
}

export interface AreaDefinition {
  id: AreaId;
  scene: 'world' | 'dungeon';
  title: string;
  theme: { floorA: number; floorB: number; wall: number; wallLight: number; water: number; tree: number };
  cols: number;
  rows: number;
  defaultSpawn: string;
  spawns: Record<string, AreaSpawn>;
  links: [number, number, number, number][];
  rooms: AreaRoom[];
  boss?: { c: number; r: number; x: number; y: number; type: EnemyId; jewel: ItemId; flag: string };
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface DialogueDefinition {
  lines: DialogueLine[];
  event?: string;
}

export interface Facing {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}