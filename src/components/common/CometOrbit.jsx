import React, { useId } from 'react';

// Estrela cadente dourada que percorre o contorno de um elemento (botão de login, cartões do Dashboard).
// Muitas camadas finas e translúcidas terminam no mesmo ponto (a cabeça): se sobrepõem perto dela e
// rareiam na ponta da cauda, formando um degradê contínuo; o filtro de brilho (bloom) esconde as emendas.
const TAIL_LENGTH = 26; // % do contorno
const TAIL_LAYERS = 30;
export const COMET_LAYERS = [
  ...Array.from({ length: TAIL_LAYERS }, (_, i) => {
    const t = (i + 1) / TAIL_LAYERS;           // 0 → cabeça, 1 → fim da cauda
    const len = TAIL_LENGTH * t * t;           // camadas concentradas junto à cabeça
    const warm = Math.round(255 - 40 * t);     // branco → dourado ao longo da cauda
    return { len, width: 1.4 + 0.8 * (1 - t), color: `rgb(255 ${warm} ${Math.round(warm * 0.72)} / 0.14)` };
  }),
  { len: 0.5, width: 2.6, color: 'rgb(255 255 255 / 0.9)' },
  { len: 0.2, width: 3.4, color: '#ffffff' },
];

/**
 * Coloque dentro de um elemento com position: relative.
 * className: 'btn-comet__orbit' (sempre visível) ou 'card-orbit' (aparece no hover do pai .has-orbit).
 */
export function CometOrbit({ className = 'btn-comet__orbit' }) {
  const glowId = `comet-glow-${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <filter id={glowId} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowId})`}>
        {COMET_LAYERS.map(({ len, width, color }, i) => (
          <rect
            key={i}
            pathLength="100"
            strokeDasharray={`${len} ${100 - len}`}
            style={{ '--len': len, strokeWidth: width, stroke: color }}
          />
        ))}
      </g>
    </svg>
  );
}
