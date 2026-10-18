import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  LIBRARY_DRAG_TYPE,
  serializeSource,
  type LibraryEntry,
  type LibraryGroup,
} from './libraryModel';

type ElementLibraryProps = {
  groups: readonly LibraryGroup[];
  /** The type descriptions could not be loaded. */
  loadFailed: boolean;
  /** The lists of stored templates could not be loaded. */
  storedFailed: boolean;
  /** A strategy is open, so entries can be inserted. */
  canInsert: boolean;
  onRetry: () => void;
  /** Enter on an entry: insert it in the middle of the visible drawing area, or add it to the rules. */
  onInsert: (entry: LibraryEntry) => void;
};

/**
 * The element library on the left (item 2 of the order). An entry is dragged to
 * the drawing area with the mouse; with the keyboard it is chosen and inserted
 * with the Enter key into the middle of the visible drawing area.
 */
export function ElementLibrary({ groups, loadFailed, storedFailed, canInsert, onRetry, onInsert }: ElementLibraryProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  function keyDown(event: KeyboardEvent<HTMLElement>, entry: LibraryEntry): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(entry.key);
      if (event.key === 'Enter' && canInsert && !entry.unreadable) {
        onInsert(entry);
      }
    }
  }

  return (
    <aside className="studio-library" aria-label={t('library.label')}>
      <h2>{t('library.title')}</h2>
      {loadFailed ? (
        <div role="alert" className="library-error">
          <p>{t('library.loadFailed')}</p>
          <button type="button" onClick={onRetry}>
            {t('library.retry')}
          </button>
        </div>
      ) : null}
      {groups.map((group) => (
        <section key={group.id} className="library-group" aria-labelledby={`library-group-${group.id}`}>
          <h3 id={`library-group-${group.id}`}>{t(`library.groups.${group.id}`)}</h3>
          {group.entries.length === 0 ? (
            <p className="library-empty">{group.id === 'storedTemplates' && storedFailed ? t('library.storedFailed') : t('library.empty')}</p>
          ) : (
            <ul role="listbox" aria-label={t(`library.groups.${group.id}`)}>
              {group.entries.map((entry) => (
                <li
                  key={entry.key}
                  role="option"
                  aria-selected={selected === entry.key}
                  aria-disabled={entry.unreadable || undefined}
                  tabIndex={0}
                  draggable={!entry.unreadable && canInsert}
                  className={`library-entry${selected === entry.key ? ' is-selected' : ''}${entry.unreadable ? ' is-unreadable' : ''}`}
                  title={entry.description}
                  onClick={() => {
                    setSelected(entry.key);
                  }}
                  onKeyDown={(event) => {
                    keyDown(event, entry);
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(LIBRARY_DRAG_TYPE, serializeSource(entry.source));
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <span className="library-entry-label">{entry.label}</span>
                  {entry.objectTypeName !== null ? (
                    <span className="library-entry-kind">{entry.objectTypeName}</span>
                  ) : null}
                  {entry.unreadable ? <span className="library-entry-kind">{t('library.unreadable')}</span> : null}
                  {entry.target === 'rules' ? <span className="library-entry-kind">{t('library.forRules')}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </aside>
  );
}
