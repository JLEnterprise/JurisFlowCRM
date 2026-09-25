import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { DEFAULT_PAIR, FONT_PAIRS, getFontPairId, saveFontPair } from '../../utils/fontPrefs';

// Escolha do estilo de tipografia (Configurações → Aparência). Cada estilo troca títulos,
// rótulos, números e textos de uma vez; a escolha fica salva neste navegador.
export function FontStylePicker() {
  const [current, setCurrent] = useState(getFontPairId);
  const choose = (id) => { setCurrent(id); saveFontPair(id); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FONT_PAIRS.map(pair => {
          const active = current === pair.id;
          return (
            <button
              key={pair.id}
              type="button"
              onClick={() => choose(pair.id)}
              aria-pressed={active}
              className={`rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                active
                  ? 'border-gold-500/60 bg-gold-500/[0.08] ring-1 ring-inset ring-gold-500/30'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-gold-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-900 dark:text-white" style={{ fontFamily: pair.display, fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.1 }}>
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
              <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-300" style={{ fontFamily: pair.body }}>
                Reunião com cliente amanhã às 14h
              </div>
              <div className="mt-2 text-[11px] text-slate-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="font-semibold text-gold-700 dark:text-gold-300">{pair.name}</span> · {pair.note}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <span>A escolha vale para este navegador.</span>
        <button type="button" onClick={() => choose(DEFAULT_PAIR)} className="premium-link">Restaurar padrão</button>
      </div>
    </div>
  );
}
