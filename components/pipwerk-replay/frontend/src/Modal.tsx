import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import { Icon } from './ui';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer: ReactNode;
  testid: string;
  wide?: boolean;
  /** The element that gets the focus when the dialog opens; the first button of the footer if absent. */
  initialFocus?: 'first-field' | 'footer';
};

/**
 * A modal dialog on the element `<dialog>`: the rest of the page is locked, Escape closes it.
 * Without its own code the focus leaves the dialog or lands on the dialog element itself
 * (measured in Chromium, Firefox and WebKit for the About dialog of pipwerk Studio). While
 * the dialog is open it therefore keeps the focus itself: Tab from the last and Shift+Tab
 * from the first element continue at the other end.
 */
export function Modal({ open, onClose, title, icon, children, footer, testid, wide, initialFocus }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      // The dialog is not displayed before `showModal()`, so the focus is set here.
      const target =
        initialFocus === 'first-field'
          ? dialog.querySelector<HTMLElement>('input, select, textarea')
          : dialog.querySelector<HTMLElement>('.modal-foot button');
      (target ?? dialog.querySelector<HTMLElement>('button'))?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function keepFocus(event: KeyboardEvent): void {
      const dialog = dialogRef.current;
      if (event.key !== 'Tab' || dialog === null || !dialog.open) {
        return;
      }
      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      const active = document.activeElement;
      const inside = active instanceof Node && active !== dialog && dialog.contains(active);
      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keepFocus);
    return () => {
      document.removeEventListener('keydown', keepFocus);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal${wide === true ? ' wide' : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      data-testid={testid}
    >
      <header className="modal-head">
        {icon !== undefined && <Icon name={icon} size={20} />}
        <h2 id={titleId}>{title}</h2>
      </header>
      <div className="modal-body">{children}</div>
      <footer className="modal-foot">{footer}</footer>
    </dialog>
  );
}
