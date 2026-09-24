import React from 'react';
import clsx from 'clsx';
import * as Icons from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  iconName,
  trend,
  trendPositive = true,
  color = 'brand',
  onClick,
  className = '',
}) {
  const Icon = IconComponent || (iconName && Icons[iconName]) || Icons.Activity;

  const colorStyles = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 shadow-glow-brand/30',
    gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/20 shadow-glow-gold/30',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-glow-emerald/30',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-brand-500/5 btn-tactile group',
        onClick && 'cursor-pointer hover:border-gold-500/50 dark:hover:border-gold-500/40',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110', colorStyles[color] || colorStyles.brand)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          {value}
        </div>
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center text-xs font-bold',
              trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
