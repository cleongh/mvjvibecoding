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
} satisfies Record<ItemId, ItemDefinition>;

export const jewelIds: ItemId[] = ['jewel_moss', 'jewel_ember', 'jewel_tide'];
