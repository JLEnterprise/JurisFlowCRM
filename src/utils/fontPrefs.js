// Seletor de tipografia (temporário, para escolher a combinação definitiva).
// Títulos usam --font-display; textos e informações usam --font-body.

export const DISPLAY_FONTS = [
  { id: 'cormorant', name: 'Cormorant Garamond', note: 'Clássica e elegante', stack: "'Cormorant Garamond', Georgia, serif" },
  { id: 'playfair', name: 'Playfair Display', note: 'Editorial, alto contraste', stack: "'Playfair Display', Georgia, serif" },
  { id: 'fraunces', name: 'Fraunces', note: 'Serifada moderna e macia', stack: "'Fraunces', Georgia, serif" },
  { id: 'marcellus', name: 'Marcellus', note: 'Inspirada em inscrições romanas', stack: "'Marcellus', Georgia, serif" },
  { id: 'sora', name: 'Sora', note: 'Sem serifa, geométrica', stack: "'Sora', system-ui, sans-serif" },
];

export const BODY_FONTS = [
  { id: 'manrope', name: 'Manrope', note: 'Atual · limpa e técnica', stack: "'Manrope', system-ui, sans-serif" },
  { id: 'inter', name: 'Inter', note: 'Neutra, ótima leitura', stack: "'Inter', system-ui, sans-serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', note: 'Amigável e moderna', stack: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { id: 'dmsans', name: 'DM Sans', note: 'Compacta e elegante', stack: "'DM Sans', system-ui, sans-serif" },
  { id: 'figtree', name: 'Figtree', note: 'Leve e arredondada', stack: "'Figtree', system-ui, sans-serif" },
];

// Combinações prontas: um clique troca título e texto juntos
export const FONT_PAIRS = [
  { id: 'classica', name: 'Clássica', note: 'Cormorant Garamond + Manrope', display: 'cormorant', body: 'manrope' },
  { id: 'editorial', name: 'Editorial', note: 'Playfair Display + Inter', display: 'playfair', body: 'inter' },
  { id: 'contemporanea', name: 'Contemporânea', note: 'Fraunces + Figtree', display: 'fraunces', body: 'figtree' },
  { id: 'institucional', name: 'Institucional', note: 'Marcellus + DM Sans', display: 'marcellus', body: 'dmsans' },
  { id: 'tecnologica', name: 'Tecnológica', note: 'Sora + Plus Jakarta Sans', display: 'sora', body: 'jakarta' },
];

export const fontStack = (list, id) => (list.find(f => f.id === id) || list[0]).stack;

const KEY = 'jurisflow_tipografia';
export const DEFAULT_FONTS = { display: 'cormorant', body: 'manrope' };

export function getFontPrefs() {
  try {
    return { ...DEFAULT_FONTS, ...JSON.parse(window.localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_FONTS };
  }
}

export function applyFontPrefs(prefs = getFontPrefs()) {
  const display = DISPLAY_FONTS.find(f => f.id === prefs.display) || DISPLAY_FONTS[0];
  const body = BODY_FONTS.find(f => f.id === prefs.body) || BODY_FONTS[0];
  const root = document.documentElement;
  root.style.setProperty('--font-display', display.stack);
  root.style.setProperty('--font-body', body.stack);
}

export function saveFontPrefs(prefs) {
  try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* sem storage: vale só nesta sessão */ }
  applyFontPrefs(prefs);
}
