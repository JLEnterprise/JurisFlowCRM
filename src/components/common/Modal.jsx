import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

// Contador global para rastrear modais abertos e evitar remoção prematura do overflow:hidden
let openModalCount = 0;

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      openModalCount += 1;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (isOpen) {
        openModalCount = Math.max(0, openModalCount - 1);
        if (openModalCount === 0) {
          document.body.style.overflow = '';
        }
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Janela: moldura dourada fina, fio dourado no topo e título centralizado */}
      <div
        className={clsx(
          'premium-modal relative w-full overflow-hidden rounded-2xl bg-white dark:bg-[#0a1120] border border-gold-500/30 shadow-2xl transition-all duration-200 animate-fade-in my-8 max-h-[90vh] flex flex-col z-10',
          maxWidth
        )}
      >
        <div className="relative border-b border-gold-500/15 px-12 pt-5 pb-4 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/60" />
            <span className="h-1 w-1 rotate-45 bg-gold-500" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/60" />
          </div>
          <h3 className="font-display text-2xl font-semibold leading-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-600 dark:hover:text-gold-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
}

