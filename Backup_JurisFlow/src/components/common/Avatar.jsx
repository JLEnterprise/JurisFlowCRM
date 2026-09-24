import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Sparkles } from 'lucide-react';

// Cores de gradientes executivos para iniciais
const GRADIENTS = [
  'from-brand-600 to-blue-700',
  'from-gold-600 to-amber-700',
  'from-emerald-600 to-teal-700',
  'from-indigo-600 to-purple-700',
  'from-rose-600 to-pink-700',
  'from-cyan-600 to-blue-800',
];

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'JF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientByName(name) {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function Avatar({
  src,
  name,
  role,
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className = '',
  status, // 'online' | 'busy' | 'away' | 'offline'
  showBorder = false,
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
  };

  const statusSize = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-white dark:ring-navy-950',
    busy: 'bg-rose-500 ring-white dark:ring-navy-950',
    away: 'bg-amber-500 ring-white dark:ring-navy-950',
    offline: 'bg-slate-400 ring-white dark:ring-navy-950',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const gradient = getGradientByName(name || 'Advogado');
  const initials = getInitials(name);

  const shouldShowImage = Boolean(src && !hasError && src.trim() !== '');

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center select-none ${currentSize} ${className}`}>
      {shouldShowImage ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoaded(true)}
          className={`h-full w-full rounded-full object-cover shadow-xs transition-opacity duration-200 ${
            showBorder ? 'ring-2 ring-white/80 dark:ring-navy-800' : ''
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div
          className={`h-full w-full rounded-full bg-gradient-to-tr ${gradient} text-white font-bold flex items-center justify-center shadow-xs ${
            showBorder ? 'ring-2 ring-white/80 dark:ring-navy-800' : ''
          }`}
        >
          {initials}
        </div>
      )}

      {/* Indicador de status opcional */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ${
            statusSize[size] || 'h-2.5 w-2.5'
          } ${statusColors[status] || statusColors.online}`}
        />
      )}
    </div>
  );
}
