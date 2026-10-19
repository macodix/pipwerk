// Element library in the language of a trader: groups, short explanations on hover, own templates marked.
import { useState } from 'react';
import { GROUPS, TIPS, TYPE_LIST, tx } from './catalog';
import { templateDescription, templateName } from './factory';
import type { GroupId, Template } from './model';
import { addEntry, allTemplates, openTemplate, setState, templateLibraryGroup, useApp } from './store';
import type { LibEntry } from './store';
import { LIB_LABEL } from './catalog';
import { Btn, Icon, useL } from './ui';
import { kindClass } from './Properties';

interface Item {
  key: string;
  entry: LibEntry;
  label: string;
  tip: string;
  icon: string;
  cls: string;
  tag?: string;
  tpl?: Template;
  /** Opens the read-only view of a delivered type. */
  openId?: string;
}

export function Library() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const tpls = allTemplates(app);

  const groups = GROUPS.map((g) => {
    const items: Item[] = [];
    const ownItems: Item[] = [];
    const tplItem = (t: Template): Item => {
      const own = !t.builtin;
      return {
        key: t.id, entry: { k: 'tpl', id: t.id }, label: templateName(t, lang),
        tip: own ? `${tx(TIPS['tpl:own'], lang)} ${templateDescription(t, lang)}` : tx(TIPS['tpl:risiko'], lang),
        icon: t.kind === 'ruleset' ? 'layers' : t.kind === 'rule' ? 'shield' : t.kind === 'trend' ? 'trend' : 'wave', cls: t.kind === 'rule' || t.kind === 'ruleset' ? 'rule' : 'ind',
        tag: own ? L('eigene', 'own') : undefined, tpl: t,
      };
    };
    // delivered templates first, then the types, own templates last (marked as "own")
    for (const t of tpls) if (templateLibraryGroup(t) === g.id && t.builtin) items.push(tplItem(t));
    for (const d of TYPE_LIST) {
      if (d.group !== g.id) continue;
      if (d.kind === 'app' && !d.placeable) continue;
      const label = d.own && LIB_LABEL[d.id] ? tx(LIB_LABEL[d.id], lang) : tx(d, lang);
      items.push({
        key: d.id, entry: { k: 'type', id: d.id }, label, tip: tx(TIPS[`type:${d.id}`] ?? { de: '', en: '' }, lang), icon: d.icon, cls: kindClass(d.id),
        openId: (d.kind === 'indicator' || d.kind === 'trend') && !d.own ? `type:${d.id}` : undefined,
      });
    }
    for (const t of tpls) if (templateLibraryGroup(t) === g.id && !t.builtin) ownItems.push(tplItem(t));
    items.push(...ownItems);
    const q = query.trim().toLowerCase();
    return { ...g, items: q ? items.filter((i) => i.label.toLowerCase().includes(q) || i.tip.toLowerCase().includes(q)) : items };
  });

  return (
    <aside className="region region-library" data-region="library" data-testid="library" aria-label={L('Elementbibliothek', 'Element library')}>
      <PanelTabs />
      <header className="panel-head">
        <h2>{L('Elementbibliothek', 'Element library')}</h2>
        <p className="panel-hint">{L('Klicken fügt ein Element hinter dem gewählten Schritt ein. Sie können es auch auf die Fläche ziehen.', 'A click inserts an element after the selected step. You can also drag it onto the canvas.')}</p>
        <label className="search">
          <Icon name="search" size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L('Suchen …', 'Search …')} aria-label={L('Elementbibliothek durchsuchen', 'Search element library')} data-testid="library-search" />
        </label>
      </header>
      <div className="lib-scroll">
        {groups.map((g) => {
          if (g.items.length === 0) return null;
          const isClosed = closed[g.id] && !query;
          return (
            <section key={g.id} className="lib-group" data-testid="lib-group" data-group={g.id}>
              <button type="button" className="lib-group-head" aria-expanded={!isClosed} onClick={() => setClosed({ ...closed, [g.id]: !closed[g.id] })}>
                <Icon name={isClosed ? 'right' : 'down'} size={14} />
                <span>{tx(g, lang)}</span>
                <span className="count">{g.items.length}</span>
              </button>
              {!isClosed && (
                <ul>
                  {g.items.map((it) => (
                    <li key={it.key}>
                      <div
                        className="lib-item"
                        role="button"
                        tabIndex={0}
                        draggable
                        data-lib={it.key}
                        data-testid="lib-item"
                        data-label={it.label}
                        data-tip={it.tip}
                        onDragStart={(e) => { e.dataTransfer.setData('application/x-pipwerk', JSON.stringify(it.entry)); e.dataTransfer.effectAllowed = 'copy'; }}
                        onClick={() => addEntry(it.entry)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addEntry(it.entry); } }}
                      >
                        <span className={`badge sm b-${it.cls}`}><Icon name={it.icon} size={16} /></span>
                        <span className="lib-label">{it.label}</span>
                        {it.tag && <span className="tag-own">{it.tag}</span>}
                        {(it.tpl || it.openId) && (
                          <button type="button" className="lib-open" data-nodrag aria-label={L(`Vorlage „${it.label}“ öffnen`, `Open template "${it.label}"`)} data-tip={it.openId ? L('Beschreibung ansehen (mitgeliefert, nicht änderbar)', 'View description (delivered, cannot be changed)') : L('Vorlage öffnen', 'Open template')} data-testid="lib-open-template"
                            onClick={(e) => { e.stopPropagation(); openTemplate((it.openId ?? it.tpl?.id) as string); }}>
                            <Icon name="file" size={15} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {groups.every((g) => g.items.length === 0) && <p className="empty-note pad">{L('Nichts gefunden. Versuchen Sie einen anderen Suchbegriff.', 'Nothing found. Try another search term.')}</p>}
      </div>
      <footer className="panel-foot">
        <Btn icon="plus" kind="ghost" testid="new-object" onClick={() => setState({ dialog: { k: 'newObject' } })}>{L('Neues Objekt …', 'New object …')}</Btn>
      </footer>
    </aside>
  );
}

export function PanelTabs() {
  const app = useApp();
  const L = useL();
  const tabs: [string, string][] = [['library', L('Bibliothek', 'Library')], ['props', L('Eigenschaften', 'Properties')]];
  return (
    <div className="panel-tabs" role="tablist" data-nodrag>
      {tabs.map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={(id === 'library') === (app.panel === 'library')} className={(id === 'library') === (app.panel === 'library') ? 'on' : ''} onClick={() => setState({ panel: id as 'library' | 'props' })} data-testid={`tab-${id}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export const GROUP_IDS: GroupId[] = GROUPS.map((g) => g.id);
