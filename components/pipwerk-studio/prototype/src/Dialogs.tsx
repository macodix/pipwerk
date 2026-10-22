// Dialogs: open, settings, about, questions before closing and deleting.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import licenseText from '../../../../LICENSE?raw';
import { typeLabel } from './catalog';
import type { Lang } from './model';
import {
  DEFAULT_DIR, deleteStrategyConfirmed, deleteTemplateConfirmed, getState, newObject, openStrategy, removeEl, removeInfo, removeParamConfirmed, saveAsTemplate,
  saveStrategy, saveTemplate, setLang, setObjectDir, setState, templateUsages, useApp, paramUsers, toast,
} from './store';
import { Btn, Icon, TextInput, fmtDate, useL } from './ui';

function Modal({
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

const close = () => setState({ dialog: null });

export function Dialogs() {
  const app = useApp();
  const d = app.dialog;
  if (!d) return null;
  switch (d.k) {
    case 'open': return <OpenDialog />;
    case 'settings': return <SettingsDialog />;
    case 'about': return <AboutDialog />;
    case 'dirty': return <DirtyDialog what={d.what} then={d.then} />;
    case 'deleteStrategy': return <DeleteStrategyDialog />;
    case 'deleteTemplate': return <DeleteTemplateDialog id={d.id} />;
    case 'saveTemplate': return <SaveTemplateDialog elId={d.elId} />;
    case 'newObject': return <NewObjectDialog />;
    case 'moveFiles': return <MoveFilesDialog dir={d.dir} />;
    case 'removeEl': return <RemoveElDialog id={d.id} />;
    case 'removeParam': return <RemoveParamDialog id={d.id} />;
  }
}

function OpenDialog() {
  const app = useApp();
  const L = useL();
  const [q, setQ] = useState('');
  const lang = app.settings.lang;
  const badge = (sample?: string) => (sample === 'auftraggeber' ? L('Ihre Strategie', 'Your strategy') : sample === 'str01' ? L('Testfall str-01', 'Test case str-01') : sample === 'str03' ? L('Testfall str-03', 'Test case str-03') : '');
  const list = app.saved.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title={L('Strategie öffnen', 'Open strategy')} icon="folder" onClose={close} wide testid="dialog-open"
      footer={<Btn onClick={close} testid="dialog-cancel">{L('Abbrechen', 'Cancel')}</Btn>}>
      <input className="input" placeholder={L('Suchen …', 'Search …')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={L('Strategien durchsuchen', 'Search strategies')} data-testid="open-search" />
      {list.length === 0 && <p className="empty-note">{L('Keine Strategie gefunden. Schließen Sie das Fenster und wählen Sie „Neue Strategie“.', 'No strategy found. Close this window and choose "New strategy".')}</p>}
      <ul className="open-list" data-testid="open-list">
        {list.map((s) => (
          <li key={s.id}>
            <button type="button" className="open-row" onClick={() => openStrategy(s.id)} data-testid="open-row" data-name={s.name} data-sample={s.sample ?? ''}>
              <span className="open-main">
                <strong>{s.name}</strong>
                {badge(s.sample) && <span className="tag-own">{badge(s.sample)}</span>}
                <span className="open-desc">{s.description || L('Ohne Beschreibung', 'No description')}</span>
              </span>
              <span className="open-date">{L('Zuletzt geändert', 'Last changed')}<br />{fmtDate(s.savedAt, lang)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function SettingsDialog() {
  const app = useApp();
  const L = useL();
  const [dir, setDir] = useState(app.settings.objectDir);
  const [lang, setLangState] = useState<Lang>(app.settings.lang);
  const apply = () => {
    if (lang !== app.settings.lang) setLang(lang);
    if (dir.trim() && dir !== app.settings.objectDir) setState({ dialog: { k: 'moveFiles', dir: dir.trim() } });
    else close();
  };
  return (
    <Modal title={L('Einstellungen', 'Settings')} icon="gear" onClose={close} testid="dialog-settings"
      footer={<><Btn onClick={close} testid="settings-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="primary" onClick={apply} testid="settings-apply">{L('Übernehmen', 'Apply')}</Btn></>}>
      <div className="field">
        <div className="field-label" data-tip={L('Sprache der Oberfläche. Eigene Namen und Beschreibungen werden nicht übersetzt.', 'Language of the interface. Your own names and descriptions are not translated.')}>{L('Sprache', 'Language')}</div>
        <div className="seg big" role="radiogroup" aria-label={L('Sprache', 'Language')}>
          {(['de', 'en'] as const).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLangState(l)} data-testid={`lang-${l}`}>
              {l === 'de' ? 'Deutsch' : 'English'}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <div className="field-label" data-tip={L('Das Verzeichnis, in dem Strategien und Vorlagen als Dateien liegen. Im Prototyp nur simuliert.', 'The directory in which strategies and templates are stored as files. Only simulated in the prototype.')}>{L('Objektverzeichnis', 'Object directory')}</div>
        <TextInput value={dir} onChange={setDir} ariaLabel={L('Objektverzeichnis', 'Object directory')} testid="settings-dir" />
        <p className="muted">{L('Ein absoluter Pfad. Standard: ', 'An absolute path. Default: ')}<code>{DEFAULT_DIR}</code>. {L('Bei einer Änderung fragt Studio, ob die vorhandenen Dateien verschoben werden.', 'When you change it, Studio asks whether the existing files are moved.')}</p>
      </div>
    </Modal>
  );
}

function MoveFilesDialog({ dir }: { dir: string }) {
  const L = useL();
  return (
    <Modal title={L('Dateien verschieben?', 'Move files?')} icon="folder" onClose={close} testid="dialog-move"
      footer={<>
        <Btn onClick={() => setState({ dialog: { k: 'settings' } })} testid="move-cancel">{L('Abbrechen', 'Cancel')}</Btn>
        <Btn onClick={() => { setObjectDir(dir); toast('Das neue Verzeichnis gilt. Die Dateien bleiben im alten Verzeichnis.', 'The new directory applies. The files stay in the old directory.'); }} testid="move-no">{L('Nein', 'No')}</Btn>
        <Btn kind="primary" onClick={() => { setObjectDir(dir); toast('Die Dateien wurden in das neue Verzeichnis verschoben.', 'The files were moved to the new directory.'); }} testid="move-yes">{L('Ja, verschieben', 'Yes, move')}</Btn>
      </>}>
      <p>{L('Sollen die vorhandenen Dateien in das neue Verzeichnis verschoben werden?', 'Should the existing files be moved to the new directory?')}</p>
      <p className="muted">{L('Bei „Ja“ verschiebt Studio sie. Bei „Nein“ bleibt das alte Verzeichnis unverändert, und Studio zeigt ab jetzt den Inhalt des neuen.', 'With "Yes" Studio moves them. With "No" the old directory stays unchanged and Studio shows the content of the new one from now on.')}</p>
      <p><code>{dir}</code></p>
    </Modal>
  );
}

function AboutDialog() {
  const L = useL();
  return (
    <Modal title={L('Über pipwerk Studio', 'About pipwerk Studio')} icon="info" onClose={close} wide testid="dialog-about"
      footer={<Btn kind="primary" onClick={close} testid="about-close">{L('Schließen', 'Close')}</Btn>}>
      <h3>pipwerk Studio</h3>
      <dl className="about-list">
        <dt>{L('Stand', 'Version')}</dt>
        <dd>{L('Prototyp der Oberfläche, Stand 2026-10-19. Commit: unbekannt.', 'Prototype of the interface, version 2026-10-19. Commit: unknown.')}</dd>
        <dt>{L('Lizenz', 'Licence')}</dt>
        <dd>GNU General Public License, Version 3 (GPL-3.0)</dd>
        <dt>{L('Adresse', 'Address')}</dt>
        <dd><a href="https://github.com/macodix/pipwerk" target="_blank" rel="noreferrer noopener">https://github.com/macodix/pipwerk</a></dd>
      </dl>
      <pre className="license" tabIndex={0} aria-label={L('Lizenztext', 'Licence text')} data-testid="license-text">{licenseText}</pre>
    </Modal>
  );
}

function DirtyDialog({ what, then }: { what: 'strategy' | 'template'; then: () => void }) {
  const L = useL();
  const name = what === 'strategy' ? getState().strategy?.name : getState().tplView?.tpl.name;
  return (
    <Modal title={L('Ungespeicherte Änderungen', 'Unsaved changes')} icon="warn" onClose={close} testid="dialog-dirty"
      footer={<>
        <Btn onClick={close} testid="dirty-cancel">{L('Abbrechen', 'Cancel')}</Btn>
        <Btn kind="danger" onClick={() => { setState({ dialog: null, dirty: what === 'strategy' ? false : getState().dirty, tplView: what === 'template' && getState().tplView ? { ...(getState().tplView as NonNullable<ReturnType<typeof getState>['tplView']>), dirty: false } : getState().tplView }); then(); }} testid="dirty-discard">{L('Verwerfen', 'Discard')}</Btn>
        <Btn kind="primary" onClick={() => { if (what === 'strategy') saveStrategy(); else saveTemplate(); setState({ dialog: null }); then(); }} testid="dirty-save">{L('Speichern', 'Save')}</Btn>
      </>}>
      <p>{L(`„${name ?? ''}“ hat ungespeicherte Änderungen. Was soll geschehen?`, `"${name ?? ''}" has unsaved changes. What should happen?`)}</p>
    </Modal>
  );
}

function DeleteStrategyDialog() {
  const L = useL();
  const s = useApp().strategy;
  return (
    <Modal title={L('Strategie löschen?', 'Delete strategy?')} icon="trash" onClose={close} testid="dialog-delete-strategy"
      footer={<><Btn onClick={close} testid="delete-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" onClick={deleteStrategyConfirmed} testid="delete-confirm">{L('Endgültig löschen', 'Delete for good')}</Btn></>}>
      <p>{L(`Die Strategie „${s?.name ?? ''}“ wird gelöscht. Das lässt sich nicht rückgängig machen.`, `The strategy "${s?.name ?? ''}" will be deleted. This cannot be undone.`)}</p>
    </Modal>
  );
}

function DeleteTemplateDialog({ id }: { id: string }) {
  const L = useL();
  const app = useApp();
  const t = app.templates.find((x) => x.id === id);
  const u = templateUsages(id);
  const none = u.strategies.length === 0 && u.templates.length === 0;
  return (
    <Modal title={L('Vorlage löschen?', 'Delete template?')} icon="trash" onClose={close} testid="dialog-delete-template"
      footer={<><Btn onClick={close} testid="delete-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" onClick={() => deleteTemplateConfirmed(id)} testid="delete-confirm">{L('Vorlage löschen', 'Delete template')}</Btn></>}>
      <p>{L(`Die Vorlage „${t?.name ?? ''}“ wird gelöscht.`, `The template "${t?.name ?? ''}" will be deleted.`)}</p>
      {none ? (
        <p className="ok-note" data-testid="usages-none"><Icon name="check" size={16} />{L('Keine Strategie und keine Vorlage enthält Instanzen aus dieser Vorlage.', 'No strategy and no template contains instances from this template.')}</p>
      ) : (
        <div data-testid="usages">
          <p>{L('Diese Strategien und Vorlagen enthalten Instanzen aus der Vorlage. Sie bleiben unverändert, weil sie die Werte der Vorlage übernommen haben:', 'These strategies and templates contain instances from the template. They stay unchanged because they took over the values of the template:')}</p>
          <ul className="usage-list">
            {u.strategies.map((n) => <li key={`s${n}`}><Icon name="chart" size={14} />{n}<span className="chip">{L('Strategie', 'Strategy')}</span></li>)}
            {u.templates.map((n) => <li key={`t${n}`}><Icon name="file" size={14} />{n}<span className="chip">{L('Vorlage', 'Template')}</span></li>)}
          </ul>
        </div>
      )}
    </Modal>
  );
}

function SaveTemplateDialog({ elId }: { elId: string }) {
  const L = useL();
  const el = getState().strategy?.els.find((e) => e.id === elId);
  const [name, setName] = useState(el?.name ?? '');
  return (
    <Modal title={L('Als Vorlage speichern', 'Save as template')} icon="copy" onClose={close} testid="dialog-save-template"
      footer={<><Btn onClick={close} testid="save-template-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="primary" disabled={!name.trim()} onClick={() => saveAsTemplate(elId, name.trim())} testid="save-template-ok">{L('Speichern', 'Save')}</Btn></>}>
      <p>{L('Die Einstellungen dieses Objekts werden zur Vorlage. Sie steht danach in der Elementbibliothek, gekennzeichnet als „eigene“, und lässt sich in anderen Strategien einfügen.', 'The settings of this object become a template. Afterwards it is in the element library, marked as "own", and can be inserted in other strategies.')}</p>
      <label className="field"><span className="field-label">{L('Name der Vorlage', 'Name of the template')}</span>
        <TextInput value={name} onChange={setName} ariaLabel={L('Name der Vorlage', 'Name of the template')} testid="save-template-name" /></label>
    </Modal>
  );
}

function NewObjectDialog() {
  const L = useL();
  const opts: { k: 'indicator' | 'trend' | 'rule' | 'ruleset'; icon: string; de: string; en: string; dd: string; ed: string }[] = [
    { k: 'indicator', icon: 'wave', de: 'Indikator', en: 'Indicator', dd: 'Ein Wert, den Sie aus anderen Indikatoren und Regeln zusammenstellen.', ed: 'A value you put together from other indicators and rules.' },
    { k: 'trend', icon: 'trend', de: 'Trend', en: 'Trend', dd: 'Eine Richtung, die ein Ausdruck bestimmt, zum Beispiel aufwärts oder abwärts.', ed: 'A direction determined by an expression, for example up or down.' },
    { k: 'rule', icon: 'shield', de: 'Regel', en: 'Rule', dd: 'Bestimmt einen Wert der Order oder prüft die Order.', ed: 'Determines a value of the order or checks the order.' },
    { k: 'ruleset', icon: 'layers', de: 'Regelwerk', en: 'Rule set', dd: 'Mehrere Regeln in fester Reihenfolge.', ed: 'Several rules in a fixed order.' },
  ];
  return (
    <Modal title={L('Neues Objekt', 'New object')} icon="plus" onClose={close} testid="dialog-new-object"
      footer={<Btn onClick={close} testid="new-object-cancel">{L('Abbrechen', 'Cancel')}</Btn>}>
      <p>{L('Was möchten Sie anlegen? Es entsteht als Vorlage und steht danach in der Elementbibliothek.', 'What do you want to create? It becomes a template and is afterwards in the element library.')}</p>
      <div className="choice-cards">
        {opts.map((o) => (
          <button key={o.k} type="button" onClick={() => newObject(o.k)} data-testid={`new-${o.k}`}>
            <Icon name={o.icon} size={22} /><b>{L(o.de, o.en)}</b><span>{L(o.dd, o.ed)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function RemoveElDialog({ id }: { id: string }) {
  const L = useL();
  const lang = useApp().settings.lang;
  const info = removeInfo(id);
  if (!info) return null;
  return (
    <Modal title={L('Element entfernen?', 'Remove element?')} icon="trash" onClose={close} testid="dialog-remove-element"
      footer={<><Btn onClick={close} testid="remove-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" onClick={() => removeEl(id)} testid="remove-confirm">{L('Trotzdem entfernen', 'Remove anyway')}</Btn></>}>
      <p>{L(`„${info.el.name}“ (${typeLabel(info.el.type, lang)}) wird entfernt.`, `"${info.el.name}" (${typeLabel(info.el.type, lang)}) will be removed.`)}</p>
      {info.users.length > 0 && (
        <>
          <p>{L('Diese Elemente verwenden seine Werte. An der Stelle bleibt ein leerer Baustein, und die Prüfung meldet ihn:', 'These elements use its values. An empty block remains in their place and the check reports it:')}</p>
          <ul className="usage-list">{info.users.map((u) => <li key={u.id}><Icon name="link" size={14} />{u.name}</li>)}</ul>
        </>
      )}
      {info.hosted.length > 0 && (
        <>
          <p>{L('Diese Instanzen liegen bei dem Element. Danach sind sie mit keinem Element verbunden, und die Prüfung meldet das:', 'These instances lie at the element. Afterwards they are not connected to any element, and the check reports it:')}</p>
          <ul className="usage-list" data-testid="hosted-list">{info.hosted.map((u) => <li key={u.id}><Icon name="wave" size={14} />{u.name}</li>)}</ul>
        </>
      )}
      {info.managed.length > 0 && (
        <>
          <p>{L('Mit der Order wird ihre Verwaltung entfernt:', 'The management of the order is removed with it:')}</p>
          <ul className="usage-list">{info.managed.map((u) => <li key={u.id}><Icon name="layers" size={14} />{u.name}</li>)}</ul>
        </>
      )}
    </Modal>
  );
}

function RemoveParamDialog({ id }: { id: string }) {
  const L = useL();
  const app = useApp();
  const p = app.strategy?.params.find((x) => x.id === id);
  const users = paramUsers(id);
  if (!p) return null;
  return (
    <Modal title={L('Strategieparameter löschen?', 'Delete strategy parameter?')} icon="trash" onClose={close} testid="dialog-remove-param"
      footer={<><Btn onClick={close} testid="remove-param-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" onClick={() => removeParamConfirmed(id)} testid="remove-param-confirm">{L('Löschen', 'Delete')}</Btn></>}>
      <p>{L(`Der Strategieparameter „${p.name}“ wird gelöscht.`, `The strategy parameter "${p.name}" will be deleted.`)}</p>
      {users.length > 0 ? (
        <>
          <p>{L('Er wird in diesen Elementen verwendet. Dort ist die Belegung danach leer, und die Prüfung meldet sie:', 'It is used in these elements. Their assignment is empty afterwards and the check reports it:')}</p>
          <ul className="usage-list">{users.map((n) => <li key={n}><Icon name="link" size={14} />{n}</li>)}</ul>
        </>
      ) : (
        <p className="muted">{L('Er wird nirgends verwendet.', 'It is not used anywhere.')}</p>
      )}
    </Modal>
  );
}
