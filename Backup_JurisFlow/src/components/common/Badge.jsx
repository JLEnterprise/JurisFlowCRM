import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'default', className = '', size = 'sm' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50',
    gold: 'bg-gold-50 text-gold-800 dark:bg-gold-950/60 dark:text-gold-300 border border-gold-200/50 dark:border-gold-800/50',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full transition-all duration-150',
        variants[variant] || variants.default,
        sizes[size] || sizes.sm,
        className
      )}
    >
      {children}
    </span>
  );
}

export function TemperatureBadge({ temperature }) {
  if (temperature === 'hot') {
    return (
      <Badge variant="danger" size="xs">
        <span className="mr-1">🔥</span> Quente
      </Badge>
    );
  }
  if (temperature === 'warm') {
    return (
      <Badge variant="warning" size="xs">
        <span className="mr-1">🟡</span> Morno
      </Badge>
    );
  }
  return (
    <Badge variant="default" size="xs">
      <span className="mr-1">❄️</span> Frio
    </Badge>
  );
}
