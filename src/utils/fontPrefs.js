// Estilos de tipografia (Configurações → Aparência).
// Cada estilo define 4 papéis: títulos, rótulos em maiúsculas, números de destaque e textos.
// Hoje só o padrão; novos estilos entram aqui (e a fonte no <link> do index.html).

const SERIF = 'Georgia, serif';
const SANS = 'system-ui, sans-serif';

export const FONT_PAIRS = [
  {
    id: 'classica',
    name: 'Clássica',
    note: 'Cormorant Garamond + Manrope · padrão do JurisFlow',
    display: `'Cormorant Garamond', ${SERIF}`,
    label: `'Manrope', ${SANS}`,
    numeric: `'Manrope', ${SANS}`,
    body: `'Manrope', ${SANS}`,
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
