import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Layers } from 'lucide-react';
import { useCRM, ALL_OFFICES } from '../../context/CRMContext';

// Seletor de escritório no topo (só aparece para o dono quando há filiais).
// Trocar aqui troca o sistema inteiro; "Todos os escritórios" mostra tudo junto.
export function OfficeSwitcher({ className = '' }) {
  const { accessibleOffices = [], currentEscritorioId, ownEscritorioId, isConsolidated, switchEscritorio } = useCRM();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (accessibleOffices.length <= 1) return null;

  const current = accessibleOffices.find(o => o.id === currentEscritorioId);
  const label = isConsolidated ? 'Todos os escritórios' : (current?.nome || 'Escritório');
  const ordered = [...accessibleOffices].sort((a, b) =>
    (a.id === ownEscritorioId ? -1 : b.id === ownEscritorioId ? 1 : String(a.nome).localeCompare(String(b.nome))));

  const pick = (id) => { setOpen(false); switchEscritorio(id); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex max-w-[15rem] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          isConsolidated
            ? 'border-gold-500/50 bg-gold-500/10 text-gold-800 dark:text-gold-200'
            : 'border-slate-200 text-slate-700 hover:border-gold-500/40 dark:border-white/[0.08] dark:text-slate-200'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Escolher escritório"
      >
        {isConsolidated ? <Layers className="h-3.5 w-3.5 shrink-0" /> : <Building2 className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" />}
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </button>

      {open && (
        <div role="listbox" className="premium-panel absolute right-0 top-full z-50 mt-2 w-64">
          <div className="premium-panel__group">Escritório</div>
          {ordered.map(o => {
            const active = !isConsolidated && o.id === currentEscritorioId;
            return (
              <button key={o.id} type="button" role="option" aria-selected={active} onClick={() => pick(o.id)}
                className={`premium-option ${active ? 'is-selected' : ''}`}>
                <span className="min-w-0">
                  <span className="block truncate">{o.nome}</span>
                  <span className="block text-[10px] text-slate-400">
                    {o.id === ownEscritorioId ? 'Matriz' : 'Filial'}{o.cidade ? ` · ${o.cidade}${o.estado ? `/${o.estado}` : ''}` : ''}
                  </span>
                </span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" />}
              </button>
            );
          })}
          <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />
          <button type="button" role="option" aria-selected={isConsolidated} onClick={() => pick(ALL_OFFICES)}
            className={`premium-option ${isConsolidated ? 'is-selected' : ''}`}>
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
              <span>
                <span className="block">Todos os escritórios</span>
                <span className="block text-[10px] text-slate-400">Visão consolidada do dono</span>
              </span>
            </span>
            {isConsolidated && <Check className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
