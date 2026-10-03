import type { DialogueDefinition } from './types.ts';

export const dialogues = {
  sage_intro: {
    event: 'sage_gift',
    lines: [
      { speaker: 'Sabia Ilda', text: 'El Brezal se marchita. La fuente mágica del centro del valle se ha quedado sin fuerza.' },
      { speaker: 'Sabia Ilda', text: 'Tres criaturas guardan tres gemas en las ruinas de los alrededores: el Musgo, el Ascua y la Marea.' },
      { speaker: 'Sabia Ilda', text: 'Llévalas a la fuente y el valle florecerá de nuevo. Toma estas pociones, las necesitarás.' },
      { speaker: 'Sabia Ilda', text: 'Pulsa I para abrir el inventario y usarlas.' },
    ],
  },
  sage_repeat: {
    lines: [
      { speaker: 'Sabia Ilda', text: 'Cada ruina esconde una llave, un jefe y una gema. Las piezas de corazón te harán más fuerte: reúne cuatro para ganar un corazón entero.' },
    ],
  },
  sign_start: {
    lines: [
      { speaker: 'Cartel', text: 'Al este: Paso de la Montaña. Al sur: Cripta del Musgo. La fuente mágica está en el centro del valle.' },
    ],
  },
  sign_dungeon1: {
    lines: [
      { speaker: 'Cartel', text: 'Cripta del Musgo. Un buen lugar para empezar. Busca la llave.' },
    ],
  },
  fountain_missing: {
    lines: [
      { speaker: 'Fuente mágica', text: 'El agua apenas murmura. Necesita las tres gemas: Musgo, Ascua y Marea.' },
    ],
  },
  fountain_complete: {
    event: 'deliver_jewels',
    lines: [
      { speaker: 'Fuente mágica', text: 'Las tres gemas brillan sobre el agua...' },
      { speaker: 'Fuente mágica', text: 'El Brezal vuelve a florecer. Gracias, valiente.' },
    ],
  },
} satisfies Record<string, DialogueDefinition>;
