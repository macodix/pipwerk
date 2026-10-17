import { useEffect, useRef, type ReactNode } from 'react';

type ModalDialogProps = {
  /** Accessible name of the dialog: the identifier of its heading. */
  labelledBy: string;
  /** Called when the dialog closes itself (Escape). The owner then stops rendering it. */
  onClose: () => void;
  className?: string;
  role?: 'alertdialog';
  children: ReactNode;
};

// The dialogs that are open, the last one on top. Only the top one keeps the focus.
const openDialogs: HTMLDialogElement[] = [];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

/**
 * A modal dialog (`<dialog>` opened with `showModal()`): the browser locks the
 * rest of the page, Escape closes it. Mounting the component opens the dialog,
 * unmounting closes it. The focus goes to the element with `data-autofocus`, or
 * to the first control, and returns to the element that had it before. Tab
 * stays inside the dialog (same behavior as the About dialog).
 */
export function ModalDialog({ labelledBy, onClose, className, role, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closing = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return undefined;
    }
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closing.current = false;
    dialog.showModal();
    openDialogs.push(dialog);
    const target =
      dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    function keepFocus(event: KeyboardEvent): void {
      if (event.key !== 'Tab' || dialog === null || openDialogs[openDialogs.length - 1] !== dialog) {
        return;
      }
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
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
      const position = openDialogs.indexOf(dialog);
      if (position >= 0) {
        openDialogs.splice(position, 1);
      }
      closing.current = true;
      if (dialog.open) {
        dialog.close();
      }
      if (before !== null && before.isConnected) {
        before.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`modal-dialog${className === undefined ? '' : ` ${className}`}`}
      aria-labelledby={labelledBy}
      role={role}
      onClose={() => {
        if (!closing.current) {
          onCloseRef.current();
        }
      }}
    >
      {children}
    </dialog>
  );
}
