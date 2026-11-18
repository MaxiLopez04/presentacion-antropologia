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
    kicker: 'Antropología Económica · 2026',
    title: 'Casino MAC Group',
    subtitle: 'Consumo, reciprocidad y uso del tiempo entre apostadores y personal · Presioná → para entrar',
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
      'Calle Gral. Alvear, en el centro de San Salvador de Jujuy.',
      'La recepcionista guía con calidez a quien entra por primera vez y le explica los montos mínimos.',
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
      'Nuestro punto fijo de observación los viernes 06/11 (18–20 h) y 13/11 (20–21:30 h).',
      'En dos de las observaciones que realizamos, otros jugadores nos pedían el lugar.',
      'Como situación fuera de lo común, nos encontramos con un hombre que perdió todo en una jugada, golpeó la pantalla y se fue a otro sector.',
    ],
    tip: '',
  },
  {
    id: 'mapa',
    panel: false, // sin cartel: la diapositiva es el plano en sí
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
      'Las máquinas centrales del Pozo MEGA y las de alrededor estaban siempre ocupadas.',
      'La mayoría apuesta entre $1.000 y $20.000 (alrededor de $10.000 en promedio). Algunos adultos mayores llegan a $90.000–$100.000.',
      'Gestos que vimos: varios adultos mayores frotan o «rascan» el vidrio, y algunos golpean los botones. Nada de eso cambia el resultado.',
      'En la primera observación vimos a una persona con movilidad reducida que se quedó jugando durante toda la jornada.',
    ],
    tip: '',
  },
  {
    id: 'expendedora',
    kicker: 'PARADA 05',
    title: 'Máquina expendedora',
    accent: '#18a7b5',
    side: 'right',
    bullets: [
      'Al lado de la escalera mecánica hay una expendedora de bebidas y snacks.',
      'El bar del fondo casi no tiene gente.',
      'Los jugadores comen y toman sin levantarse de la máquina.',
      'La comida va hasta el asiento para que nadie deje de jugar.',
    ],
    tip: '',
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
      'El café no tiene costo, pero se suele dejar propina.',
      'También llevan sándwiches y bebidas sin cargo hasta el asiento.',
    ],
    tip: '',
  },
  {
    id: 'tecnico',
    kicker: 'PARADA 07',
    title: 'Mantenimiento',
    accent: '#2f6a3a',
    side: 'left',
    bullets: [
      'Los técnicos usan mameluco verde oscuro. Abren y arreglan las máquinas que fallan.',
      'En una de las observaciones se nos trabó una máquina: el técnico lo solucionó y la encargada nos deseó suerte.',
      'La encargada nos contó que el casino se llena a la mañana y a la noche.',
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
      'No es un cajero de banco: es una terminal del propio casino para cobrar los tickets.',
      'Paga de a $1.000 y el resto ($1–$999) lo devuelve en ticket, así la plata se queda adentro.',
      'Acepta tarjetas de membresía. Aun así, muchos traen efectivo en riñonera.',
    ],
    tip: '',
  },
  {
    id: 'camaras',
    kicker: 'PARADA 09',
    title: 'Cámaras de seguridad',
    accent: '#2a2f45',
    side: 'left',
    bullets: [
      'Hay cámaras en todo el casino y el personal recorre la sala vigilando.',
      'No hay ventanas, luz natural ni relojes a la vista: siempre parece de noche.',
      'Una señora nos preguntó la hora: la gente pierde la noción del tiempo.',
    ],
    tip: '',
  },
  {
    // Últimas paradas: la cámara vuelve a la ruleta y hace zoom al cuaderno de
    // un joven sentado mirando hacia el Pozo MEGA. Lo que escribas acá
    // aparece en las hojas, con letra manuscrita. Cada parada de tipo
    // 'notebook' es una doble página: al pasar de una a otra el joven da vuelta la hoja.
    //  - Cada página tiene un título y una lista de renglones.
    //  - Un renglón que empieza con '- ' se dibuja como viñeta.
    //  - Un renglón vacío ('') deja un espacio.
    //  - Los renglones largos se cortan solos; si no entra todo, la letra se
    //    achica (en todas las dobles páginas por igual). Entran 16 renglones.
    id: 'cuaderno',
    type: 'notebook',
    kicker: 'PARADA 10',
    title: 'Mis teorías',
    notebook: {
      left: {
        title: 'Observación → Teoría',
        lines: [
          '1. Comida y café sin cargo en el asiento, trato amable, sin relojes ni ventanas, cajero que devuelve el cambio en tickets → Polanyi: la economía está incrustada en relaciones sociales.',
          '',
          '2. Adultos mayores que apuestan entre $40.000 y $100.000 → Robbins: conducta irracional. Herskovits: es racional dentro de su matriz cultural.',
        ],
      },
      right: {
        title: 'Preguntas',
        lines: [
          '1a. ¿Cómo recrea el casino hospitalidad y un tiempo propio para que el dinero siga circulando?',
          '',
          '1b. ¿La falta de relojes y la atención en el asiento hacen que una transacción desigual se viva como un espacio de pertenencia y cuidado?',
          '',
          '2a. ¿Cómo permite la matriz cultural de Herskovits entender como racional apostar la jubilación o los ahorros?',
          '',
          '2b. ¿Qué necesidades no monetarias buscan los adultos mayores: compañía, un lugar fresco y seguro, el buen trato?',
        ],
      },
    },
  },
  {
    id: 'cuaderno2',
    type: 'notebook',
    kicker: 'PARADA 11',
    title: 'Mis teorías (2)',
    notebook: {
      left: {
        title: 'Observación → Teoría',
        lines: [
          '3. Rascar el vidrio y golpear los botones, aunque no cambian el resultado → Mauss: la ofrenda a los dioses, «dar una cosa pequeña por una grande».',
          '',
          '4. Comida, bebida y trato amable sin cargo → Mauss: el don y las tres obligaciones (dar, recibir y devolver).',
        ],
      },
      right: {
        title: 'Preguntas',
        lines: [
          '3. ¿Los gestos son rituales en los que el dinero es una ofrenda a «la suerte», o cálculo racional aunque el gesto no cambie nada?',
          '',
          '4. ¿Los obsequios y el trato funcionan como un don que obliga a «devolver» quedándose a jugar?',
        ],
      },
    },
  },
];
