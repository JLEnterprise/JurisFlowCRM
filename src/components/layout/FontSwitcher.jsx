import React, { useEffect, useRef, useState } from 'react';
import { Check, Type } from 'lucide-react';
import { BODY_FONTS, DEFAULT_FONTS, DISPLAY_FONTS, FONT_PAIRS, fontStack, getFontPrefs, saveFontPrefs } from '../../utils/fontPrefs';

// Botão temporário do topo para testar combinações de fonte: cada opção troca título + texto juntos.
export function FontSwitcher() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(getFontPrefs);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (pair) => {
    const next = { display: pair.display, body: pair.body };
    setPrefs(next);
    saveFontPrefs(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="header-icon-btn border border-slate-200 dark:border-white/[0.07]"
        aria-label="Tipografia"
        data-tip="Tipografia"
        aria-expanded={open}
      >
        <Type className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="premium-panel absolute right-0 top-[calc(100%+8px)] z-50 w-80 max-h-[75vh] overflow-y-auto">
          <div className="px-3 pt-2 pb-1.5 flex items-baseline justify-between">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Combinações</span>
            <span className="text-[10px] text-slate-400">título + texto</span>
          </div>
          {FONT_PAIRS.map(pair => {
            const active = prefs.display === pair.display && prefs.body === pair.body;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => choose(pair)}
                aria-pressed={active}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active ? 'bg-gold-500/10 ring-1 ring-inset ring-gold-500/35' : 'hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-slate-900 dark:text-white" style={{ fontFamily: fontStack(DISPLAY_FONTS, pair.display), fontSize: '1.15rem', fontWeight: 600 }}>
                    Funil Comercial
                  </span>
                  <span className="block truncate text-slate-600 dark:text-slate-300" style={{ fontFamily: fontStack(BODY_FONTS, pair.body), fontSize: '0.8rem' }}>
                    R$ 125.912,00 · prazo em 24/09
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">
                    <span className="font-semibold text-gold-700 dark:text-gold-300">{pair.name}</span> · {pair.note}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />}
              </button>
            );
          })}
          <div className="mt-1.5 border-t border-slate-100 dark:border-white/[0.06] px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Vale só neste navegador</span>
            <button type="button" onClick={() => { setPrefs(DEFAULT_FONTS); saveFontPrefs(DEFAULT_FONTS); }} className="premium-link">
              Restaurar padrão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
