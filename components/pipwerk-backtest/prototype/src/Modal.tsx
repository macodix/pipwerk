// The frame of every dialog: title, body, footer; Escape closes, the first field takes the focus.
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './ui';

export function Modal({
  title, children, footer, onClose, wide, testid, icon,
}: { title: string; children: ReactNode; footer: ReactNode; onClose: () => void; wide?: boolean; testid: string; icon?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector('input, select, textarea') as HTMLElement | null;
    (first ?? (ref.current?.querySelector('button.btn-primary') as HTMLElement | null))?.focus();
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="modal-back" data-testid="modal-back">
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} data-testid={testid}>
        <header className="modal-head">
          {icon && <Icon name={icon} size={20} />}
          <h2>{title}</h2>
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-foot">{footer}</footer>
      </div>
    </div>
  );
}
