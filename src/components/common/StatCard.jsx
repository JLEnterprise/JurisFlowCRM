import React from 'react';
import clsx from 'clsx';
import * as Icons from 'lucide-react';
import { CometOrbit } from './CometOrbit';

// Cartão de indicador: vidro escuro, ícone em dourado e estrela dourada contornando no hover.
// `color` é aceito por compatibilidade, mas o visual segue a marca (dourado) em todos.
export function StatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  iconName,
  trend,
  trendPositive = true,
  onClick,
  className = '',
}) {
  const Icon = IconComponent || (iconName && Icons[iconName]) || Icons.Activity;
  const clickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={clsx(
        'dash-panel has-orbit group transition-all duration-300 focus:outline-none',
        clickable && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      <CometOrbit className="card-orbit" />

      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/35 bg-gold-500/[0.08] text-gold-600 dark:text-gold-400 transition-colors group-hover:border-gold-500/60">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </div>
        {trend && (
          <span className={clsx('text-xs font-semibold', trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
