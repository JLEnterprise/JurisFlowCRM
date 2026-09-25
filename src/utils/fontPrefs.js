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
    id: 'tribunal',
    name: 'Tribunal',
    note: 'Cinzel + Crimson Pro · tudo serifado, cara de petição e de escritório tradicional',
    display: `'Cinzel', ${SERIF}`,
    label: `'Cinzel', ${SERIF}`,
    numeric: `'Cinzel', ${SERIF}`,
    body: `'Crimson Pro', ${SERIF}`,
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    note: 'Libre Baskerville + Lora · livro jurídico, leitura clássica e calorosa',
    display: `'Libre Baskerville', ${SERIF}`,
    label: `'Libre Baskerville', ${SERIF}`,
    numeric: `'Libre Baskerville', ${SERIF}`,
    body: `'Lora', ${SERIF}`,
  },
  {
    id: 'couture',
    name: 'Couture',
    note: 'Italiana + Raleway · finíssima e alongada, cara de maison de luxo',
    display: `'Italiana', ${SERIF}`,
    label: `'Raleway', ${SANS}`,
    numeric: `'Italiana', ${SERIF}`,
    body: `'Raleway', ${SANS}`,
  },
  {
    id: 'vanguarda',
    name: 'Vanguarda',
    note: 'Syne + Space Grotesk · ousada e contemporânea, fintech de alto padrão',
    display: `'Syne', ${SANS}`,
    label: `'Space Grotesk', ${SANS}`,
    numeric: `'Syne', ${SANS}`,
    body: `'Space Grotesk', ${SANS}`,
  },
  {
    id: 'suico',
    name: 'Suíço',
    note: 'Unbounded + Outfit · largas e geométricas, minimalismo de estúdio',
    display: `'Unbounded', ${SANS}`,
    label: `'Unbounded', ${SANS}`,
    numeric: `'Unbounded', ${SANS}`,
    body: `'Outfit', ${SANS}`,
  },
  {
    id: 'engenharia',
    name: 'Engenharia',
    note: 'IBM Plex Serif + Plex Sans + Plex Mono · técnica e precisa, números de terminal',
    display: `'IBM Plex Serif', ${SERIF}`,
    label: `'IBM Plex Mono', monospace`,
    numeric: `'IBM Plex Mono', monospace`,
    body: `'IBM Plex Sans', ${SANS}`,
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
