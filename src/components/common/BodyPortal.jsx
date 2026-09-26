import { createPortal } from 'react-dom';

// Renderiza o conteúdo direto no <body>: janelas "fixed" (modais, camadas) nunca ficam
// presas dentro da tela, atrás do topo ou cortadas pela rolagem.
export function BodyPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}
