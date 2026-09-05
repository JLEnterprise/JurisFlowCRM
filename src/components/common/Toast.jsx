import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import { useCRM } from '../../context/CRMContext';

export function Toast() {
  const { toast, showToast } = useCRM();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      showToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, showToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500" />,
    danger: <AlertCircle className="h-5 w-5 text-rose-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-brand-500" />,
  };

  const bgStyles = {
    success: 'border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/95 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/30 bg-rose-50/95 dark:bg-rose-950/95 text-rose-900 dark:text-rose-100',
    danger: 'border-rose-500/30 bg-rose-50/95 dark:bg-rose-950/95 text-rose-900 dark:text-rose-100',
    warning: 'border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/95 text-amber-900 dark:text-amber-100',
    info: 'border-brand-500/30 bg-brand-50/95 dark:bg-brand-950/95 text-brand-900 dark:text-brand-100',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-auto">
      <div
        className={clsx(
          'flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-md max-w-md transition-all animate-bounce-short cursor-pointer',
          bgStyles[toast.type] || bgStyles.info
        )}
        onClick={() => showToast(null)}
      >
        <div className="flex-shrink-0">{icons[toast.type] || icons.info}</div>
        <div className="flex-1 text-sm font-medium">{toast.message}</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            showToast(null);
          }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          title="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
