import { useTranslation } from 'react-i18next';

type MenuBarProps = {
  /** A strategy is open. */
  hasStrategy: boolean;
  /** The type descriptions are loaded, so a strategy can be created or opened. */
  ready: boolean;
  /** A request is running. */
  busy: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onCheck: () => void;
  onClose: () => void;
  onDelete: () => void;
  onSettings: () => void;
};

/** The menu in the header (item 1 of the order). */
export function MenuBar(props: MenuBarProps) {
  const { t } = useTranslation();
  const needsStrategy = !props.hasStrategy || props.busy;
  const items: { key: string; onClick: () => void; disabled: boolean }[] = [
    { key: 'new', onClick: props.onNew, disabled: !props.ready || props.busy },
    { key: 'open', onClick: props.onOpen, disabled: !props.ready || props.busy },
    { key: 'save', onClick: props.onSave, disabled: needsStrategy },
    { key: 'check', onClick: props.onCheck, disabled: needsStrategy },
    { key: 'close', onClick: props.onClose, disabled: needsStrategy },
    { key: 'delete', onClick: props.onDelete, disabled: needsStrategy },
    { key: 'settings', onClick: props.onSettings, disabled: false },
  ];
  return (
    <nav className="studio-menu" aria-label={t('menu.label')}>
      {items.map((item) => (
        <button key={item.key} type="button" disabled={item.disabled} onClick={item.onClick}>
          {t(`menu.${item.key}`)}
        </button>
      ))}
    </nav>
  );
}
