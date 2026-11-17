// =============================================================
//  LAYOUT DEL CASINO — coordenadas en píxeles del croquis
//  (imagen de 1180 x 594). util.js las convierte a metros:
//  20 px = 1 m, origen en el centro de la sala.
//  yaw: 0 = la pantalla mira al sur (abajo en el croquis),
//       180 = mira al norte, 90 = mira al este.
// =============================================================

export const BUILDING = { x1: 45, y1: 120, x2: 1145, y2: 528 };

// Hall de entrada ampliado hacia la calle (fuera del croquis original):
// va desde la nueva pared de entrada (x1) hasta la pared vieja del
// edificio (BUILDING.x1), entre y1 e y2. La fachada se corre con él.
export const HALL = { x1: -55, y1: 210, y2: 440 };

// [x, y, yaw, skin]
export const SLOTS = [
  // fila superior izquierda
  [188, 145, 0, 0], [226, 145, 0, 1], [266, 145, 0, 2], [307, 145, 0, 3],
  // fila superior derecha
  [735, 145, 0, 4], [768, 145, 0, 0], [801, 145, 0, 1], [835, 145, 0, 2],
  [868, 145, 0, 3], [901, 145, 0, 4], [935, 145, 0, 0], [968, 145, 0, 1],
  [1001, 145, 0, 2], [1035, 145, 0, 3], [1068, 145, 0, 4],
  // fila inferior izquierda (contra la pared sur, mirando a la sala)
  [163, 492, 180, 2], [204, 492, 180, 3], [246, 492, 180, 4], [288, 492, 180, 0], [330, 492, 180, 1],
  // fila junto a la escalera
  [575, 425, 180, 3], [608, 425, 180, 4], [641, 425, 180, 0], [674, 425, 180, 1],
  // fila diagonal
  [712, 437, 148, 2], [740, 455, 148, 3], [770, 474, 148, 4], [800, 492, 148, 0],
  // grupo derecho (zona de caja)
  [1030, 257, 90, 1], [995, 302, 90, 2], [1068, 302, 90, 3], [1030, 346, 90, 4],
  // banco junto a la expendedora (antes mesa de juego): dos filas espalda con espalda
  [327, 311, 180, 0], [357, 311, 180, 1], [388, 311, 180, 2], [418, 311, 180, 3],
  [327, 333, 0, 4], [357, 333, 0, 0], [388, 333, 0, 1], [418, 333, 0, 2],
  // ex barra: 4 mirando hacia la sala (este) y 4 detrás mirando a la entrada (oeste)
  [250, 295, 90, 3], [250, 325, 90, 4], [250, 355, 90, 0], [250, 385, 90, 1],
  [228, 295, 270, 2], [228, 325, 270, 3], [228, 355, 270, 4], [228, 385, 270, 0],
  // contra la pared de debajo de la escalera mecánica, mirando hacia la ruleta
  [710, 176, 90, 1], [710, 202, 90, 2],
  // fila contra la pared de debajo de la escalera mecánica (donde estaba el cartel del Pozo)
  [467, 223, 0, 0], [495, 223, 0, 1], [523, 223, 0, 2], [551, 223, 0, 3], [579, 223, 0, 4],
  [607, 223, 0, 0], [635, 223, 0, 1], [663, 223, 0, 2], [691, 223, 0, 3],
];

// Banco del Pozo MEGA: dos filas espalda con espalda
export const MEGA_SLOTS = [
  [492, 307, 180], [530, 307, 180], [567, 307, 180], [606, 307, 180],
  [492, 329, 0], [530, 329, 0], [567, 329, 0], [606, 329, 0],
];

export const ROULETTE = { x: 850, y: 307 };

// Marcas de las diapositivas (las X rojas del croquis)
export const MARKERS = [
  { slide: 1, x: -5, y: 262 },
  { slide: 2, x: 942, y: 285 },
  { slide: 3, x: 953, y: 505 },
  { slide: 4, x: 622, y: 272 },
  { slide: 5, x: 343, y: 238 },
  { slide: 6, x: 450, y: 405 },
  { slide: 7, x: 690, y: 398 },
  { slide: 8, x: 838, y: 462 },
  { slide: 9, x: 905, y: 512 },
];

// Recorrido de la moza (flecha roja punteada)
export const WORKER_PATH = [
  [130, 454], [165, 448], [200, 442], [255, 440], [300, 416], [370, 410], [440, 410], [505, 412],
];

// Cámaras de seguridad en el techo (domos) [x, y]
export const DOME_CAMS = [
  [160, 300], [300, 250], [300, 425], [470, 410], [540, 215], [690, 300], [700, 440],
  [880, 250], [960, 420], [1080, 300], [1000, 180], [760, 180], [200, 180], [600, 355],
];
// Las tres cámaras de pared sobre el cajero (diapositiva 6) [x en px]
export const ATM_CAMS = [850, 882, 914];

// Elementos para dibujar el minimapa [x1, y1, x2, y2]
export const MAP_RECTS = {
  guard: [52, 127, 142, 209],
  staff: [52, 437, 122, 520],
  escalatorTop: [357, 128, 702, 170],
  escalatorBottom: [357, 175, 702, 217],
  vending: [368, 220, 385, 245],
  stairs: [388, 450, 692, 520],
  atm: [858, 477, 906, 520],
  elevator: [1047, 448, 1135, 520],
  caja: [1088, 128, 1145, 157],
};
