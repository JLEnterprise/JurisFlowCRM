// Seletor de tipografia (temporário, para escolher a identidade definitiva).
// Cada estilo define 4 papéis: títulos, rótulos em maiúsculas, números de destaque e textos.

const SERIF = 'Georgia, serif';
const SANS = 'system-ui, sans-serif';

export const FONT_PAIRS = [
  {
    id: 'classica',
    name: 'Clássica',
    note: 'Cormorant Garamond + Manrope · a atual',
    display: `'Cormorant Garamond', ${SERIF}`,
    label: `'Manrope', ${SANS}`,
    numeric: `'Manrope', ${SANS}`,
    body: `'Manrope', ${SANS}`,
  },
  {
    id: 'imperial',
    name: 'Imperial',
    note: 'Cinzel + Cormorant + Lato · letras romanas, cara de escritório tradicional',
    display: `'Cinzel', ${SERIF}`,
    label: `'Cinzel', ${SERIF}`,
    numeric: `'Cormorant Garamond', ${SERIF}`,
    body: `'Lato', ${SANS}`,
  },
  {
    id: 'joalheria',
    name: 'Alta Joalheria',
    note: 'Bodoni Moda + Jost · alto contraste de revista de luxo',
    display: `'Bodoni Moda', ${SERIF}`,
    label: `'Jost', ${SANS}`,
    numeric: `'Bodoni Moda', ${SERIF}`,
    body: `'Jost', ${SANS}`,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    note: 'Playfair Display + Source Sans 3 · jornal financeiro',
    display: `'Playfair Display', ${SERIF}`,
    label: `'Playfair Display SC', ${SERIF}`,
    numeric: `'Playfair Display', ${SERIF}`,
    body: `'Source Sans 3', ${SANS}`,
  },
  {
    id: 'galeria',
    name: 'Galeria',
    note: 'DM Serif Display + Tenor Sans + DM Sans · sofisticada e arejada',
    display: `'DM Serif Display', ${SERIF}`,
    label: `'Tenor Sans', ${SANS}`,
    numeric: `'DM Serif Display', ${SERIF}`,
    body: `'DM Sans', ${SANS}`,
  },
  {
    id: 'artdeco',
    name: 'Art Déco',
    note: 'Josefin Sans + Nunito Sans · geométrica anos 20, moderna',
    display: `'Josefin Sans', ${SANS}`,
    label: `'Josefin Sans', ${SANS}`,
    numeric: `'Josefin Sans', ${SANS}`,
    body: `'Nunito Sans', ${SANS}`,
  },
];

const KEY = 'jurisflow_tipografia_estilo';
export const DEFAULT_PAIR = 'classica';

export function getFontPairId() {
  try {
    const id = window.localStorage.getItem(KEY);
    return FONT_PAIRS.some(p => p.id === id) ? id : DEFAULT_PAIR;
  } catch {
    return DEFAULT_PAIR;
  }
}

export function applyFontPair(id = getFontPairId()) {
  const pair = FONT_PAIRS.find(p => p.id === id) || FONT_PAIRS[0];
  const root = document.documentElement;
  root.style.setProperty('--font-display', pair.display);
  root.style.setProperty('--font-label', pair.label);
  root.style.setProperty('--font-numeric', pair.numeric);
  root.style.setProperty('--font-body', pair.body);
  root.dataset.fontPair = pair.id;
}

export function saveFontPair(id) {
  try { window.localStorage.setItem(KEY, id); } catch { /* sem storage: vale só nesta sessão */ }
  applyFontPair(id);
}

// Compatibilidade com o nome antigo usado no main.jsx
export const applyFontPrefs = () => applyFontPair();
