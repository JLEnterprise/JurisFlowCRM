import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { FloatingPanel, useFloatingPanel, layoutClasses, isCompact, leadingPadding } from './floatingPanel';

// Transforma <option>/<optgroup> (inclusive dentro de fragmentos e .map) em uma lista plana.
function parseOptions(children, out = [], group = null) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      parseOptions(child.props.children, out, group);
    } else if (child.type === 'optgroup') {
      out.push({ kind: 'group', label: child.props.label });
      parseOptions(child.props.children, out, child.props.label);
    } else if (child.type === 'option') {
      const label = React.Children.toArray(child.props.children).join('');
      const value = child.props.value !== undefined ? String(child.props.value) : label;
      out.push({ kind: 'option', value, label, disabled: !!child.props.disabled, group });
    }
  });
  return out;
}

/**
 * Menu de seleção premium do JurisFlow. Substitui o <select> nativo mantendo a mesma API:
 * <Select value={x} onChange={(e) => setX(e.target.value)}><option value="a">A</option></Select>
 */
export function Select({
  value,
  onChange,
  children,
  name,
  id,
  required,
  disabled,
  placeholder = 'Selecione...',
  className = '',
  searchable,
  'aria-label': ariaLabel,
  title,
}) {
  const items = useMemo(() => parseOptions(children), [children]);
  const options = items.filter(i => i.kind === 'option');
  const current = value === undefined || value === null ? '' : String(value);
  const selected = options.find(o => o.value === current);
  const compact = isCompact(className);
  const showSearch = searchable ?? options.length > 10;

  const { open, setOpen, triggerRef, panelRef, style, place } = useFloatingPanel({ minWidth: 200 });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const matches = items.filter(i => i.kind === 'option' && i.label.toLowerCase().includes(q));
    return matches;
  }, [items, query]);
  const visibleOptions = visible.filter(i => i.kind === 'option' && !i.disabled);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = options.filter(o => !o.disabled).findIndex(o => o.value === current);
    setActive(idx);
    requestAnimationFrame(() => {
      place();
      if (showSearch) searchRef.current?.focus();
      listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (open) place(); }, [visible.length, open, place]);

  const choose = (opt) => {
    if (!opt || opt.disabled) return;
    setOpen(false);
    triggerRef.current?.focus();
    if (opt.value !== current) {
      onChange?.({ target: { value: opt.value, name, id }, currentTarget: { value: opt.value, name, id } });
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(visibleOptions.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(visibleOptions[active]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const label = selected ? selected.label : placeholder;
  // Cinza só para "Selecione..." — opções como "Todos os Status" são escolhas válidas
  const isPlaceholder = !selected || (selected.value === '' && /^(selecion|escolh|--)/i.test(selected.label.trim()));
  let optionIndex = -1;

  return (
    <div className={`relative ${layoutClasses(className) || 'inline-block min-w-[10rem]'}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={title}
        className={`premium-field ${compact ? 'premium-field--sm' : ''} ${open ? 'is-open' : ''} ${leadingPadding(className)}`}
      >
        <span className={`truncate ${isPlaceholder ? 'text-slate-400 dark:text-slate-500' : ''}`}>{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-gold-500' : ''}`} />
      </button>

      {/* Mantém a validação nativa de campo obrigatório nos formulários */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          name={name}
          value={current}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      )}

      {open && (
        <FloatingPanel panelRef={panelRef} style={style} role="listbox" onKeyDown={onKeyDown}>
          {showSearch && (
            <div className="relative mb-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Buscar..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] py-2 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-gold-500/60 focus:outline-none"
              />
            </div>
          )}
          <div ref={listRef} className="max-h-72 overflow-y-auto pr-0.5">
            {visible.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-400">Nenhuma opção encontrada</div>
            )}
            {visible.map((item, i) => {
              if (item.kind === 'group') {
                return (
                  <div key={`g-${i}`} className="premium-panel__group">{item.label}</div>
                );
              }
              const isSelected = item.value === current;
              const idx = item.disabled ? -1 : ++optionIndex;
              return (
                <button
                  key={`${item.value}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  data-index={idx}
                  disabled={item.disabled}
                  onMouseEnter={() => idx >= 0 && setActive(idx)}
                  onClick={() => choose(item)}
                  className={`premium-option ${isSelected ? 'is-selected' : ''} ${idx === active ? 'is-active' : ''}`}
                >
                  <span className="truncate">{item.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" />}
                </button>
              );
            })}
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}
