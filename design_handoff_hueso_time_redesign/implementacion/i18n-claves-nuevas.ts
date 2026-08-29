// Añadir a i18n/locales.ts — solo las claves nuevas del rediseño.
// Las de `tabs` reemplazan el bloque existente (se le agrega `generate`);
// el bloque `generate` se mergea con el que ya existe (noMatchTitle, bpmAny, etc.).

export const esNuevas = {
  tabs: {
    generate: 'Generar',
    setlists: 'Setlists',
    repertoire: 'Repertorio',
    settings: 'Ajustes',
  },
  generate: {
    title: 'Armá el show',
    subtitle: '{{songs}} canciones · {{artists}} artistas',
    cta: 'Generar',
    tapToRoll: 'Toca para armar el show',
    shape: '{{count}} sets × {{min}} min',
    shapeLabel: 'Formato',
    pool: 'Pool',
    pool_all: 'Todo el repertorio',
    pool_favorites: 'Solo favoritas',
    pool_ready: 'Listas para tocar',
    energy: 'Energía',
    energy_rising: 'Ascendente',
    energy_party: 'Fiesta',
    energy_calm: 'Tranqui',
    energy_varied: 'Variada',
    recent: 'Últimos tiros',
    recentMeta: '{{sets}} sets · {{songs}} canciones',
    recentEmpty: 'Todavía no armaste ningún show.',
  },
};

export const enNuevas = {
  tabs: {
    generate: 'Generate',
    setlists: 'Setlists',
    repertoire: 'Repertoire',
    settings: 'Settings',
  },
  generate: {
    title: 'Build the show',
    subtitle: '{{songs}} songs · {{artists}} artists',
    cta: 'Generate',
    tapToRoll: 'Tap to build the show',
    shape: '{{count}} sets × {{min}} min',
    shapeLabel: 'Shape',
    pool: 'Pool',
    pool_all: 'Whole repertoire',
    pool_favorites: 'Favorites only',
    pool_ready: 'Ready to play',
    energy: 'Energy',
    energy_rising: 'Rising',
    energy_party: 'Party',
    energy_calm: 'Easy',
    energy_varied: 'Varied',
    recent: 'Recent rolls',
    recentMeta: '{{sets}} sets · {{songs}} songs',
    recentEmpty: 'No shows built yet.',
  },
};
