import React from 'react';
import * as Icons from 'lucide-react';

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Não há itens correspondentes aos filtros ou parâmetros atuais.',
  iconName = 'Inbox',
  actionLabel,
  onAction,
}) {
  const Icon = Icons[iconName] || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Icons.Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
