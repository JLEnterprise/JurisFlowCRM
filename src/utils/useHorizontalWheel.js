import { useEffect } from 'react';

// Quadros Kanban: a roda do mouse move o quadro para os lados em qualquer ponto dele.
// Se o mouse estiver sobre uma coluna que ainda pode rolar na vertical, ela rola primeiro.
export function useHorizontalWheel(ref) {
  useEffect(() => {
    const board = ref.current;
    if (!board) return;
    const onWheel = (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // zoom ou trackpad lateral
      if (board.scrollWidth <= board.clientWidth) return;
      for (let el = e.target; el && el !== board; el = el.parentElement) {
        const canScrollY = el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(getComputedStyle(el).overflowY);
        if (!canScrollY) continue;
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
      }
      const max = board.scrollWidth - board.clientWidth;
      const next = Math.min(max, Math.max(0, board.scrollLeft + e.deltaY));
      if (next === board.scrollLeft) return; // já no começo/fim: deixa a página rolar
      e.preventDefault();
      board.scrollLeft = next;
    };
    board.addEventListener('wheel', onWheel, { passive: false });
    return () => board.removeEventListener('wheel', onWheel);
  }, [ref]);
}
