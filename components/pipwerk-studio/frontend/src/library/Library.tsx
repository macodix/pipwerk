import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LIBRARY_DRAG_TYPE } from './dragType';
import { iconOfClass } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Btn } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { filterLibrary, type LibraryEntry } from './libraryModel';

/** Switches between the library and the properties view in the side area of the middle layout (specification 5.1). */
export function PanelTabs() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const { panel } = studio.state;
  const showsLibrary = panel === 'library';
  // A short message stands in the properties view (specification 5.1): while the library hides it, its tab is marked.
  const marked = (id: 'library' | 'props'): boolean => id === 'props' && showsLibrary && studio.messageShown;
  return (
    <div className="panel-tabs" role="tablist" aria-label={t('layout.sideArea')}>
      {(['library', 'props'] as const).map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={(id === 'library') === showsLibrary}
          className={`${(id === 'library') === showsLibrary ? 'on' : ''}${marked(id) ? ' marked' : ''}`}
          data-marked={marked(id) ? 'true' : undefined}
          onClick={() => {
            studio.actions.setPanel(id);
          }}
          data-testid={`tab-${id}`}
        >
          {t(id === 'library' ? 'layout.library' : 'layout.properties')}
        </button>
      ))}
    </div>
  );
}

/**
 * The element library (specification 5.2): groups from the type descriptions with a search, an explanation for every
 * entry when it is pointed at or focused, insertion with a click behind the selected step, dragging onto the drawing
 * area. Stored templates stand in the group of their object type, marked as "own".
 */
export function Library() {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const groups = useMemo(() => filterLibrary(studio.library, query), [studio.library, query]);
  const canInsert = studio.state.document !== null;

  const insert = (entry: LibraryEntry): void => {
    // Without an open strategy the entries are not usable: the sentence in the library says so and they do nothing.
    if (!canInsert) {
      return;
    }
    if (entry.target === 'connection') {
      studio.actions.startConnection();
      return;
    }
    void studio.actions.insert(entry.key);
  };

  let body;
  if (types === null) {
    body = studio.typesFailed ? (
      <div className="pad" role="alert">
        <p className="empty-note">{t('library.loadFailed')}</p>
        <Btn small onClick={studio.actions.retryTypes}>
          {t('library.retry')}
        </Btn>
      </div>
    ) : (
      <p className="empty-note pad">{t('library.loading')}</p>
    );
  } else if (groups.length === 0) {
    body = <p className="empty-note pad">{t(query.trim() === '' ? 'library.empty' : 'library.nothingFound')}</p>;
  } else {
    body = groups.map((group) => {
      const isClosed = closed[group.id] === true && query.trim() === '';
      return (
        <section key={group.id} className="lib-group" data-testid="lib-group" data-group={group.id}>
          <button
            type="button"
            className="lib-group-head"
            aria-expanded={!isClosed}
            onClick={() => {
              setClosed({ ...closed, [group.id]: closed[group.id] !== true });
            }}
          >
            <Icon name={isClosed ? 'right' : 'down'} size={14} />
            <span>{t(`library.groups.${group.id}`, { defaultValue: group.id })}</span>
            <span className="count">{group.entries.length}</span>
          </button>
          {isClosed ? null : group.role === null ? null : (
            <p className="lib-role" data-testid="lib-group-role" data-role={group.role} data-tip={t(`library.roleTip.${group.role}`)}>
              <Icon name={group.role === 'step' ? 'right' : 'wave'} size={13} />
              {t(`library.role.${group.role}`)}
            </p>
          )}
          {isClosed ? null : (
            <ul>
              {group.entries.map((entry) => (
                <li key={entry.key}>
                  <div
                    className={`lib-item${canInsert ? '' : ' closed'}`}
                    role="button"
                    tabIndex={0}
                    draggable={canInsert && !entry.unreadable && entry.target !== 'connection'}
                    data-lib={entry.key}
                    data-testid="lib-item"
                    data-label={entry.name}
                    data-tip={entry.explanation === '' ? undefined : entry.explanation}
                    aria-disabled={entry.unreadable || !canInsert}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(LIBRARY_DRAG_TYPE, entry.key);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      insert(entry);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        insert(entry);
                      }
                    }}
                  >
                    <span className={`badge sm b-${entry.style}`}>
                      <Icon name={iconOfClass(entry.style)} size={16} />
                    </span>
                    <span className="lib-label">{entry.name}</span>
                    {entry.trigger ? (
                      <span className="tag-trigger" data-testid="lib-trigger" data-tip={t('library.triggerTip')}>
                        {t('library.trigger')}
                      </span>
                    ) : null}
                    {group.role === null && entry.role !== null ? (
                      <span className="tag-role" data-testid="lib-role" data-role={entry.role} data-tip={t(`library.roleTip.${entry.role}`)}>
                        {t(`library.role.${entry.role}`)}
                      </span>
                    ) : null}
                    {entry.own ? <span className="tag-own">{t('library.own')}</span> : null}
                    {entry.unreadable ? <span className="tag-own">{t('library.unreadable')}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    });
  }

  return (
    <aside
      className="region region-library"
      data-region="library"
      data-testid="library"
      aria-label={t('library.title')}
    >
      <PanelTabs />
      <header className="panel-head">
        <h2>{t('library.title')}</h2>
        <p className="panel-hint">{t('library.hint')}</p>
        {canInsert ? null : (
          // stays until a strategy is open; it stands here and not on the drawing area (specification 5.3, 5.5)
          <p className="lib-closed-note" role="note" data-testid="library-closed">
            {t('library.closed', { new: t('menu.new'), open: t('menu.open') })}
          </p>
        )}
        <label className="search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={t('library.search')}
            aria-label={t('library.searchLabel')}
            data-testid="library-search"
          />
        </label>
        {studio.storedFailed ? <p className="empty-note">{t('library.storedFailed')}</p> : null}
      </header>
      <div className="lib-scroll">{body}</div>
    </aside>
  );
}
