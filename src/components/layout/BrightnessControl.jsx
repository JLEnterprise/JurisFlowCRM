import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Contrast as SunDim } from 'lucide-react'; // ícone diferente do sol/lua do tema

// Brilho do app (ao lado do botão de tema). Vai de -40 (mais escuro) a +20 (mais claro).
// Aplicado por uma camada transparente por cima da tela (não mexe no layout nem nos cliques).
const KEY = 'jurisflow_brilho';
const MIN = -40;
const MAX = 20;

const readSaved = () => {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(v) ? Math.min(MAX, Math.max(MIN, v)) : 0;
  } catch {
    return 0;
  }
};

export function BrightnessControl() {
  const [level, setLevel] = useState(readSaved);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, String(level)); } catch { /* sem storage */ }
  }, [level]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Camada por cima de tudo: preta para escurecer, branca suave para clarear
  const overlay = level === 0 ? null : createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: 'none',
        background: level < 0 ? `rgba(0,0,0,${(-level / 100) * 0.9})` : `rgba(255,255,255,${(level / 100) * 0.6})`,
        mixBlendMode: level < 0 ? 'normal' : 'soft-light',
      }}
    />,
    document.body
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`header-icon-btn ${level !== 0 ? '!text-gold-600 dark:!text-gold-400' : ''}`}
        aria-label="Brilho da tela"
        data-tip="Brilho"
        aria-expanded={open}
      >
        <SunDim className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="premium-panel absolute right-0 top-full z-50 mt-2 w-60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Brilho do app</span>
            <span className="font-numeric text-xs text-slate-500 dark:text-slate-400">{level > 0 ? `+${level}` : level}%</span>
          </div>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={5}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="mt-3 w-full accent-current text-gold-600 dark:text-gold-400"
            aria-label="Ajustar brilho"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>Mais escuro</span>
            <span>Mais claro</span>
          </div>
          {level !== 0 && (
            <button type="button" onClick={() => setLevel(0)} className="premium-link mt-2 -ml-2.5">Restaurar padrão</button>
          )}
        </div>
      )}
      {overlay}
    </div>
  );
}
