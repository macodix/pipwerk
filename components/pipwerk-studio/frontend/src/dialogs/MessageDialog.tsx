import { useId, type ReactNode } from 'react';

import { ModalDialog } from './ModalDialog';

export type DialogAction = {
  label: string;
  onClick: () => void;
  /** The button the focus starts on. */
  primary?: boolean;
};

type MessageDialogProps = {
  title: string;
  children?: ReactNode;
  actions: readonly DialogAction[];
  /** Escape: the dialog was cancelled. */
  onCancel: () => void;
  /** `alertdialog` for a message that reports an error. */
  role?: 'alertdialog';
};

/** A question or a message with buttons: the confirmations of the application (items 8 and 9 of the order). */
export function MessageDialog({ title, children, actions, onCancel, role }: MessageDialogProps) {
  const titleId = useId();
  return (
    <ModalDialog labelledBy={titleId} onClose={onCancel} className="message-dialog" role={role}>
      <h2 id={titleId}>{title}</h2>
      {children}
      <div className="dialog-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            data-autofocus={action.primary === true ? '' : undefined}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </ModalDialog>
  );
}
