// =============================================================
//  CONTENIDO DE LAS DIAPOSITIVAS
//  Editá libremente títulos, viñetas y tips. El orden de este
//  array es el orden del recorrido (las posiciones de cámara
//  están en main.js -> VIEWS, una por cada "id").
// =============================================================

export const META = {
  brand: 'CASINO · Recorrido',
  // textos de la fachada (podés poner el nombre real del casino)
  facadeTop: 'CASINOS MAC GROUP',
  facadeMain: 'CASINO',
};

export const SLIDES = [
  {
    id: 'portada',
    type: 'cover',
    kicker: 'Presentación',
    title: 'Un paseo por el casino',
    subtitle: 'Presioná → o la flecha roja para entrar',
  },
  {
    id: 'ruleta',
    kicker: 'PARADA 01',
    title: 'Ruleta electrónica',
    accent: '#e8342f',
    side: 'right',
    bullets: [
      'Punto de partida del recorrido.',
      'Desde la ruleta se ve el Pozo MEGA.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en la ruleta para girarla.',
  },
  {
    id: 'pozo',
    kicker: 'PARADA 02',
    title: 'Tragamonedas del Pozo MEGA',
    accent: '#7b3fc4',
    side: 'left',
    bullets: [
      'Máquinas conectadas a un pozo acumulado.',
      'El cartel muestra el pozo en vivo.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en una tragamonedas para tirar.',
  },
  {
    id: 'expendedora',
    kicker: 'PARADA 03',
    title: 'Máquina expendedora',
    accent: '#18a7b5',
    side: 'right',
    bullets: [
      'Ubicada al lado de la escalera mecánica.',
      'Bebidas y snacks para los jugadores.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en la máquina para comprar algo.',
  },
  {
    id: 'moza',
    kicker: 'PARADA 04',
    title: 'Servicio en sala',
    accent: '#ff8a1f',
    side: 'right',
    bullets: [
      'El personal recorre la sala con café.',
      'Uniforme: traje negro.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en la moza.',
  },
  {
    id: 'cajero',
    kicker: 'PARADA 05',
    title: 'Cajero automático',
    accent: '#3fae49',
    side: 'left',
    bullets: [
      'Máquina para cobrar los tickets.',
      'Junto al ascensor, al fondo de la sala.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en el cajero para cobrar.',
  },
  {
    id: 'camaras',
    kicker: 'PARADA 06',
    title: 'Cámaras de seguridad',
    accent: '#2a2f45',
    side: 'left',
    bullets: [
      'Hay cámaras en todo el casino.',
      'Tres vigilan el cajero desde arriba.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: fijate cómo las cámaras te siguen.',
  },
];
