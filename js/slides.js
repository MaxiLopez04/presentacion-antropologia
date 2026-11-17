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
    id: 'hall',
    kicker: 'PARADA 01',
    title: 'Hall de entrada',
    accent: '#2c4fb5',
    side: 'right',
    bullets: [
      'A la izquierda, la recepcionista.',
      'Hay que dejar la mochila y mostrar el DNI.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: '',
  },
  {
    id: 'ruleta',
    kicker: 'PARADA 02',
    title: 'Ruleta electrónica',
    accent: '#e8342f',
    side: 'right',
    bullets: [
      'Desde acá se ve toda la sala.',
      'Desde la ruleta se ve el Pozo MEGA.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: 'Tip: hacé click en la ruleta para girarla.',
  },
  {
    id: 'mapa',
    kicker: 'PARADA 03',
    title: 'Mapa de seguridad',
    accent: '#e8342f',
    side: 'left',
    bullets: [
      'Plano de la sala junto al cajero.',
      'Marca salidas, matafuegos y cámaras.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: '',
  },
  {
    id: 'pozo',
    kicker: 'PARADA 04',
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
    kicker: 'PARADA 05',
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
    kicker: 'PARADA 06',
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
    id: 'tecnico',
    kicker: 'PARADA 07',
    title: 'Mantenimiento',
    accent: '#2f6a3a',
    side: 'left',
    bullets: [
      'Una tragamonedas fuera de servicio.',
      'El técnico la está reparando.',
      'Texto de ejemplo: reemplazalo en js/slides.js.',
    ],
    tip: '',
  },
  {
    id: 'cajero',
    kicker: 'PARADA 08',
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
    kicker: 'PARADA 09',
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
