import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DEFAULT_LOGO_BASE64 } from '../../data/defaultLogo';

export function BrandLogo({
  className = "h-10 w-10",
  iconSize = "h-5 w-5",
  showText = false,
  textClassName = "",
  customSrc = null,
  forceEmblem = false
}) {
  const { officeSettings } = useCRM();
  const [imageFailed, setImageFailed] = useState(false);

  // Logo ativa: se o officeSettings.logoUrl for valido, usa ele, senao usa o DEFAULT_LOGO_BASE64 embutido
  const getActiveLogoSrc = () => {
    if (customSrc && typeof customSrc === 'string' && customSrc.trim() !== '') {
      return customSrc;
    }
    if (officeSettings?.logoUrl && typeof officeSettings.logoUrl === 'string' && officeSettings.logoUrl.trim() !== '') {
      return officeSettings.logoUrl;
    }
    return DEFAULT_LOGO_BASE64;
  };

  const activeLogo = getActiveLogoSrc();

  // Redefinir status de falha quando a logo mudar
  useEffect(() => {
    setImageFailed(false);
  }, [activeLogo, forceEmblem]);

  const hasValidLogo = !forceEmblem && !imageFailed && Boolean(activeLogo && String(activeLogo).trim() !== '');

  return (
    <div className="flex items-center gap-3 overflow-hidden select-none">
      {/* Box do Icone / Logotipo */}
      <div className={`relative flex ${className} shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-xs bg-slate-900 border border-slate-800`}>
        {hasValidLogo ? (
          <img
            src={activeLogo}
            alt="JurisFlow Logotipo"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-0.5"
            loading="eager"
          />
        ) : (
          /* Emblema Dourado Executivo de Fallback */
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-brand-800 via-brand-600 to-gold-500 text-white shadow-md shadow-brand-500/20">
            <Scale className={`${iconSize} text-white drop-shadow`} />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white dark:ring-[#0b0f17]" />
          </div>
        )}
      </div>

      {/* Nome da Marca: JurisFlow em evidencia */}
      {showText && (
        <div className={`truncate ${textClassName}`}>
          <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
            <span>JurisFlow</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gradient-to-r from-gold-500/20 to-gold-400/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 rounded-md">
              CRM
            </span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold truncate max-w-[160px]">
            {officeSettings?.tradeName || officeSettings?.officeName || 'Advocacia Estratégica'}
          </div>
        </div>
      )}
    </div>
  );
}
