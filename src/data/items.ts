import type { ItemDefinition, ItemId } from './types.ts';

export const items = {
  small_key: {
    id: 'small_key',
    name: 'Llave pequeña',
    type: 'key',
    description: 'Abre una puerta cerrada con candado.',
  },
  health_potion: {
    id: 'health_potion',
    name: 'Poción de salud',
    type: 'consumable',
    heal: 2,
    description: 'Restaura 2 corazones.',
  },
  jewel_moss: {
    id: 'jewel_moss',
    name: 'Gema del Musgo',
    type: 'quest',
    description: 'Tesoro de la Cripta del Musgo. Pertenece a la fuente.',
  },
  jewel_ember: {
    id: 'jewel_ember',
    name: 'Gema del Ascua',
    type: 'quest',
    description: 'Tesoro de la Mina Ardiente. Pertenece a la fuente.',
  },
  jewel_tide: {
    id: 'jewel_tide',
    name: 'Gema de la Marea',
    type: 'quest',
    description: 'Tesoro de la Torre de la Marea. Pertenece a la fuente.',
  },
  boomerang: {
    id: 'boomerang',
    name: 'Bumerán de fresno',
    type: 'weapon',
    description: 'Lánzalo con B para aturdir a una criatura. Siempre regresa.',
  },
  bomb: {
    id: 'bomb',
    name: 'Bomba',
    type: 'weapon',
    description: 'Colócala con X. Daña a quien alcance y rompe muros agrietados.',
  },
} satisfies Record<ItemId, ItemDefinition>;

export const jewelIds: ItemId[] = ['jewel_moss', 'jewel_ember', 'jewel_tide'];

export const shopCatalog = [
  { item: 'bomb', amount: 3, price: 8 },
  { item: 'small_key', amount: 1, price: 12 },
  { item: 'health_potion', amount: 1, price: 10 },
] as const satisfies ReadonlyArray<{ item: ItemId; amount: number; price: number }>;
