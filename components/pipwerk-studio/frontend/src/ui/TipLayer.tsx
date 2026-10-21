import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Tip = { text: string; x: number; y: number; below: boolean; side: 'top' | 'right' | 'left' };

/**
 * The layer for explanations: every element with `data-tip` shows its text when it is pointed at and when it has the
 * focus (specification 5.2: also with the keyboard). Entries of the element library explain themselves to the right,
 * fields of the properties view to the left.
 */
export function TipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const show = (target: Element | null): void => {
      window.clearTimeout(timer.current);
      const element = target?.closest<HTMLElement>('[data-tip]') ?? null;
      const text = element?.dataset.tip;
      if (element === null || text === undefined || text === '') {
        setTip(null);
        return;
      }
      timer.current = window.setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const below = rect.top < 90;
        const wide = window.innerWidth >= 1100;
        if (wide && element.closest('.region-library') !== null) {
          setTip({ text, x: rect.right + 10, y: rect.top + rect.height / 2, below, side: 'right' });
        } else if (wide && element.closest('.region-props') !== null) {
          setTip({ text, x: rect.left - 10, y: rect.top + rect.height / 2, below, side: 'left' });
        } else {
          setTip({
            text,
            x: Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150),
            y: below ? rect.bottom + 8 : rect.top - 8,
            below,
            side: 'top',
          });
        }
      }, 140);
    };
    const over = (event: Event): void => {
      show(event.target instanceof Element ? event.target : null);
    };
    const out = (): void => {
      window.clearTimeout(timer.current);
      setTip(null);
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusout', out);
    document.addEventListener('pointerdown', out);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusout', out);
      document.removeEventListener('pointerdown', out);
    };
  }, []);
  if (tip === null) {
    return null;
  }
  const style: CSSProperties = {
    left: tip.x,
    top: tip.y,
    transform:
      tip.side === 'right'
        ? 'translate(0, -50%)'
        : tip.side === 'left'
          ? 'translate(-100%, -50%)'
          : tip.below
            ? 'translate(-50%, 0)'
            : 'translate(-50%, -100%)',
  };
  return (
    <div className="tip" role="tooltip" style={style} data-testid="tooltip">
      {tip.text}
    </div>
  );
}
