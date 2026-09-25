import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Base dos menus premium (Select, DateField): abre um painel flutuante preso ao botão,
// renderizado no <body> para não ser cortado por modais com rolagem.
export function useFloatingPanel({ minWidth = 0 } = {}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = Math.max(r.width, minWidth);
    const panelHeight = panel ? panel.offsetHeight : 320;
    const gap = 6;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < panelHeight + gap + 8 && r.top > spaceBelow;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setStyle({
      position: 'fixed',
      left,
      width,
      top: openUp ? Math.max(8, r.top - panelHeight - gap) : r.bottom + gap,
      zIndex: 10050, // acima dos modais (z-[9999])
    });
  }, [minWidth]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      place();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  return { open, setOpen, triggerRef, panelRef, style, place };
}

export function FloatingPanel({ panelRef, style, children, className = '', ...rest }) {
  return createPortal(
    <div
      ref={panelRef}
      style={style || { position: 'fixed', visibility: 'hidden' }}
      className={`premium-panel ${className}`}
      {...rest}
    >
      {children}
    </div>,
    document.body
  );
}

// Mantém do className original só o que é de layout (largura, grid, margens),
// para os campos antigos continuarem ocupando o mesmo espaço.
const LAYOUT_TOKEN = /^(?:[a-z0-9]+:)*(?:w-|min-w-|max-w-|flex-|col-span|row-span|shrink|grow|basis-|self-|justify-self|m[trblxy]?-|order-|hidden$|block$|inline-block$)/;
export function layoutClasses(className = '') {
  return String(className).split(/\s+/).filter(t => LAYOUT_TOKEN.test(t)).join(' ');
}

// Tamanho compacto quando o campo original era pequeno (barras de filtro)
export function isCompact(className = '') {
  return /(^|\s)(text-\[1[01]px\]|text-xs|py-1(\.5)?|py-0\.5)(\s|$)/.test(String(className));
}

// Recuo à esquerda quando o campo tem um ícone posicionado por cima (ex.: pl-10)
export function leadingPadding(className = '') {
  return String(className).split(/\s+/).filter(t => /^(?:[a-z]+:)?pl-/.test(t)).join(' ');
}
