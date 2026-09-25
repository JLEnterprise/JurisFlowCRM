import React, { useEffect, useRef, useState } from 'react';
import { Check, Type } from 'lucide-react';
import { DEFAULT_PAIR, FONT_PAIRS, getFontPairId, saveFontPair } from '../../utils/fontPrefs';

// Botão temporário do topo: cada estilo troca títulos, rótulos, números e textos de uma vez.
export function FontSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getFontPairId);
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

  const choose = (id) => {
    setCurrent(id);
    saveFontPair(id);
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
        <div className="premium-panel absolute right-0 top-[calc(100%+8px)] z-50 w-[22rem] max-h-[78vh] overflow-y-auto">
          <div className="px-3 pt-2 pb-2 flex items-baseline justify-between">
            <span className="text-[0.6rem] font-semibold tracking-[0.22em] text-slate-400" style={{ fontFamily: 'Manrope, sans-serif' }}>ESTILOS</span>
            <span className="text-[10px] text-slate-400">títulos · rótulos · números · textos</span>
          </div>

          <div className="space-y-1.5">
            {FONT_PAIRS.map(pair => {
              const active = current === pair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => choose(pair.id)}
                  aria-pressed={active}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? 'border-gold-500/50 bg-gold-500/[0.08]'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-900 dark:text-white" style={{ fontFamily: pair.display, fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.1 }}>
                      Funil Comercial
                    </span>
                    {active && <Check className="mt-1 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />}
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-[10px] tracking-[0.18em] text-slate-500 dark:text-slate-400" style={{ fontFamily: pair.label, textTransform: 'uppercase' }}>
                      Pipeline potencial
                    </span>
                    <span className="text-slate-900 dark:text-white" style={{ fontFamily: pair.numeric, fontSize: '1.2rem', fontWeight: 600, fontVariantNumeric: 'lining-nums' }}>
                      R$ 125.912,00
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300" style={{ fontFamily: pair.body }}>
                    Reunião com cliente amanhã às 14h
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    <span className="font-semibold text-gold-700 dark:text-gold-300">{pair.name}</span> · {pair.note}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 dark:border-white/[0.06] px-3 pt-2 pb-1 flex items-center justify-between" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <span className="text-[10px] text-slate-400">Vale só neste navegador</span>
            <button type="button" onClick={() => choose(DEFAULT_PAIR)} className="premium-link">Restaurar padrão</button>
          </div>
        </div>
      )}
    </div>
  );
}
