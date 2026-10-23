// Properties view: strategy, element or instance, rule, management frame.
import { useEffect, useRef, useState } from 'react';
import { DTYPE_LABEL, TYPES, choiceLabel, fieldTip, fieldsOf, isFlowEl, isObjectEl, isTrigger, memberLabel, membersOf, methodOf, methodText, supportsRefresh, tx, typeLabel } from './catalog';
import { ExprPanel } from './ExprEditor';
import { EMPTY, memberList, propList, refsOf, sameMember } from './expr';
import { collectUsage, placements } from './uses';
import type { UseRec } from './uses';
import { FieldRow, ValueByType } from './fields';
import { levelOf, scopeFor } from './findings';
import type { Finding } from './findings';
import { OwnEditor, RuleBody, RulesEditor, ownScope } from './OwnEditor';
import { defaultBinding } from './factory';
import { isUnset, uid } from './model';
import type { El, RuleInst, SParam, SPType, Use } from './model';
import {
  addEntry, addParam, allTemplates, changeUse, connectObject, getState, noteValues, paramUsers, removeUse, requestRemove, runCheck, select, setHost, setRefresh, setSection, setState, toast, update, useApp,
} from './store';
import { Btn, Icon, Info, NumberInput, Section, Select, TextInput, Toggle, fmtDate, useL } from './ui';

export const kindClass = (type: string): string => {
  const d = TYPES[type];
  if (!d) return 'unknown';
  if (d.kind === 'trigger') return 'trg';
  if (d.id === 'flow.condition') return 'cond';
  if (d.id === 'flow.calculation' || d.id === 'flow.set_parameter') return 'calc';
  if (d.id === 'flow.place_order') return 'order';
  if (d.kind === 'flow' || d.kind === 'tool') return 'act';
  if (d.kind === 'app') return 'app';
  if (d.kind === 'trend' || d.id === 'Markttechnik') return 'trend';
  return 'ind';
};

// ---- findings ---------------------------------------------------------------------------

export function FindingsBox({ items, compact }: { items: Finding[]; compact?: boolean }) {
  const L = useL();
  const lang = useApp().settings.lang;
  if (items.length === 0) return null;
  return (
    <div className={`findings${compact ? ' compact' : ''}`} data-testid="findings-box">
      {items.map((f) => (
        <div key={f.id} className={`finding ${f.level}`} data-testid="finding">
          <Icon name={f.level === 'error' ? 'warn' : 'info'} size={18} />
          <div className="finding-body">
            <strong>{tx(f.title, lang)}</strong>
            <p>{tx(f.msg, lang)}</p>
            <p className="fix"><b>{L('So beheben Sie es: ', 'How to fix it: ')}</b>{tx(f.fix, lang)}</p>
            <Btn small kind="ghost" icon="right" testid="finding-goto" onClick={() => gotoFinding(f)}>{L('Zur Stelle', 'Go to it')}</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

export function gotoFinding(f: Finding) {
  if (f.el) {
    const rule = f.field?.startsWith('rule:') ? f.field.slice(5) : null;
    if (rule) setState({ sel: { k: 'rule', owner: getState().strategy?.els.some((e) => e.id === f.el) ? f.el : null, id: rule }, panel: 'props', focusField: f.field });
    else setState({ sel: { k: 'el', id: f.el }, panel: 'props', focusField: f.field, lastAdded: f.el });
  } else {
    setState({ sel: { k: 'strategy' }, panel: 'props', focusField: f.field });
  }
}

/** After a click on a finding the field is scrolled into view and highlighted. */
export function useFocusField(root: React.RefObject<HTMLElement | null>) {
  const focus = useApp().focusField;
  useEffect(() => {
    if (!focus || !root.current) return;
    const target = root.current.querySelector(`[data-field="${CSS.escape(focus)}"]`) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.classList.add('flash');
      const inp = target.querySelector('select, input, textarea, button') as HTMLElement | null;
      inp?.focus({ preventScroll: true });
      window.setTimeout(() => target.classList.remove('flash'), 1800);
    }
    setState({ focusField: null });
  }, [focus, root]);
}

// ---- strategy parameters ---------------------------------------------------------------------

const SP_TYPES: [SPType, string, string][] = [
  ['number', 'Zahl', 'Number'], ['integer', 'Ganzzahl', 'Integer'], ['percent', 'Prozent', 'Percent'],
  ['boolean', 'Wahrheitswert', 'Yes/no'], ['text', 'Text', 'Text'], ['time_unit', 'Zeiteinheit', 'Time unit'],
];

export function ParamEditor({ p }: { p: SParam }) {
  const L = useL();
  const lang = useApp().settings.lang;
  const set = (fn: (x: SParam) => void) => update((s) => { const q = s.params.find((x) => x.id === p.id); if (q) fn(q); });
  const users = paramUsers(p.id);
  return (
    <div className="param-edit" data-testid="param-edit" data-field={`sp:${p.id}`}>
      <div className="param-line">
        <TextInput value={p.name} onChange={(v) => set((q) => { q.name = v; })} ariaLabel={L('Name des Strategieparameters', 'Name of the strategy parameter')} testid="param-name" />
        <Btn kind="quiet" small icon="trash" title={L('Strategieparameter löschen', 'Delete strategy parameter')} testid="param-delete" onClick={() => setState({ dialog: { k: 'removeParam', id: p.id } })} />
      </div>
      <div className="param-line">
        <Select value={p.dtype} onChange={(v) => set((q) => { q.dtype = v as SPType; q.value = v === 'time_unit' ? 'h1' : v === 'boolean' ? false : v === 'text' ? '' : 0; })} ariaLabel={L('Datentyp', 'Data type')} testid="param-type">
          {SP_TYPES.map(([id, de, en]) => <option key={id} value={id}>{lang === 'en' ? en : de}</option>)}
        </Select>
        {!p.atApplication && <ValueByType dtype={p.dtype} value={p.value} onChange={(v) => set((q) => { q.value = v; })} ariaLabel={L('Wert', 'Value')} testid="param-value" />}
        {p.atApplication && <span className="muted">{L('wird bei der Anwendung übergeben', 'passed at application')}</span>}
      </div>
      <div className="param-line sub">
        <Toggle checked={p.atApplication} onChange={(v) => set((q) => { q.atApplication = v; })} label={L('Wert erst bei der Anwendung übergeben', 'Pass the value only at application')} />
        <span className="muted">{users.length ? L(`verwendet in ${users.length} Element(en)`, `used in ${users.length} element(s)`) : L('noch nirgends verwendet', 'not used anywhere yet')}</span>
      </div>
    </div>
  );
}

export function ParamTable() {
  const L = useL();
  const s = useApp().strategy;
  if (!s) return null;
  return (
    <div data-testid="param-table">
      {s.params.length === 0 && (
        <p className="empty-note" data-testid="params-empty">
          {L('Strategieparameter sind Werte, die Sie an einer Stelle festlegen und überall in der Strategie verwenden, zum Beispiel die Zeiteinheit. Legen Sie den ersten mit „Strategieparameter anlegen“ an.', 'Strategy parameters are values you set in one place and use everywhere in the strategy, for example the time unit. Create the first one with "Create strategy parameter".')}
        </p>
      )}
      {s.params.map((p) => <ParamEditor key={p.id} p={p} />)}
      <Btn icon="plus" testid="param-add" onClick={() => addParam(L('Neuer Strategieparameter', 'New strategy parameter'), 'number')}>
        {L('Strategieparameter anlegen', 'Create strategy parameter')}
      </Btn>
    </div>
  );
}

// ---- strategy ---------------------------------------------------------------------------------

export function StrategyProps({ findings }: { findings: Finding[] }) {
  const L = useL();
  const app = useApp();
  const s = app.strategy;
  const root = useRef<HTMLDivElement>(null);
  useFocusField(root);
  if (!s) return null;
  const general = findings.filter((f) => f.el === null);
  const sc = scopeFor(s, app.settings.lang, null, true);
  return (
    <div className="props" ref={root} data-testid="props-strategy">
      {s.els.length === 0 && !app.wizard && (
        <div className="empty-card flat hint-empty" data-testid="empty-hint">
          <Icon name="wand" size={26} />
          <h2>{L('Die Strategie ist leer', 'The strategy is empty')}</h2>
          <p>{L('Nächster Schritt: Beginnen Sie mit einem Auslöser. Er legt fest, wann die Strategie rechnet. Klicken Sie in der Elementbibliothek in der Gruppe „Ablaufsteuerung“ auf „Kerzenschluss“ – oder starten Sie den Assistenten.', 'Next step: start with a trigger. It defines when the strategy calculates. In the element library, group "Flow control", click "Candle close" – or start the assistant.')}</p>
          <div className="btn-row">
            <Btn kind="primary" icon="wand" testid="empty-wizard" onClick={() => setState({ wizard: { step: 1 }, wzShown: true, panel: 'props' })}>{L('Assistent starten', 'Start assistant')}</Btn>
            <Btn icon="list" className="show-lib" testid="empty-library" onClick={() => setState({ panel: 'library' })}>{L('Elementbibliothek zeigen', 'Show element library')}</Btn>
            <Btn icon="clock" testid="empty-trigger" onClick={() => addEntry({ k: 'type', id: 'trigger.candle_close' })}>{L('Kerzenschluss einfügen', 'Insert candle close')}</Btn>
          </div>
        </div>
      )}
      <header className="props-head">
        <div className="badge b-strategy"><Icon name="chart" size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{L('Strategie', 'Strategy')}</span>
          <TextInput value={s.name} onChange={(v) => update((x) => { x.name = v; })} ariaLabel={L('Name der Strategie', 'Name of the strategy')} testid="strategy-name" className="title-input" />
        </div>
      </header>
      <Section title={L('Beschreibung', 'Description')}>
        <textarea className="input area" rows={3} value={s.description} onChange={(e) => update((x) => { x.description = e.target.value; })} aria-label={L('Beschreibung', 'Description')} data-testid="strategy-description" placeholder={L('Worum geht es in dieser Strategie?', 'What is this strategy about?')} />
      </Section>
      <Section title={L('Strategieparameter', 'Strategy parameters')} testid="sec-params">
        <ParamTable />
      </Section>
      <Section title={L('Regeln und Regelwerke der Strategie', 'Rules and rule sets of the strategy')} testid="sec-rules">
        <p className="muted">{L('Diese Regeln gelten für jede Order der Strategie, zum Beispiel „Risiko je Trade“.', 'These rules apply to every order of the strategy, for example "Risk per trade".')}</p>
        <RulesEditor rules={s.rules} onChange={(r) => update((x) => { x.rules = r; })} base={sc} onOpen={(id) => select({ k: 'rule', owner: null, id })} />
      </Section>
      <Section title={L('Befunde der Prüfung', 'Check results')} testid="sec-findings" aside={<Btn small kind="ghost" icon="check" onClick={runCheck} testid="props-check">{L('Prüfen', 'Check')}</Btn>}>
        {!app.checked && <p className="empty-note">{L('Noch nicht geprüft. „Prüfen“ sucht Probleme wie fehlende Verbindungen oder leere Pflichtangaben.', 'Not checked yet. "Check" looks for problems such as missing connections or empty required entries.')}</p>}
        {app.checked && findings.length === 0 && <p className="ok-note" data-testid="no-findings"><Icon name="check" size={16} />{L('Keine Befunde. Die Strategie ist in sich stimmig.', 'No findings. The strategy is consistent.')}</p>}
        {app.checked && findings.length > 0 && (
          <p className="muted">{general.length === findings.length
            ? L('Diese Befunde gehören zu keinem einzelnen Element.', 'These findings belong to no single element.')
            : L('Rot und orange markierte Elemente auf der Fläche haben einen Befund. „Zur Stelle“ führt dorthin.', 'Elements marked red or orange on the canvas have a finding. "Go to it" leads there.')}</p>
        )}
        {app.checked && findings.length > 0 && <FindingsBox items={[...general, ...findings.filter((f) => f.el !== null)]} />}
      </Section>
      <p className="meta">{L('Zuletzt gespeichert: ', 'Last saved: ')}{fmtDate(s.savedAt, app.settings.lang)}</p>
    </div>
  );
}

// ---- management frame -----------------------------------------------------------------------

export function FrameProps({ orderId }: { orderId: string }) {
  const L = useL();
  const s = useApp().strategy;
  const order = s?.els.find((e) => e.id === orderId);
  if (!s || !order) return null;
  const count = s.els.filter((e) => e.mgmt === orderId).length;
  return (
    <div className="props" data-testid="props-frame">
      <header className="props-head">
        <div className="badge b-order"><Icon name="layers" size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{L('Verwaltung', 'Management')}</span>
          <h2>{L(`der Order „${order.name}“`, `of the order "${order.name}"`)}</h2>
        </div>
      </header>
      <p>{L('Die Verwaltung läuft für jede gestellte Order einzeln: zuerst für die wartende Order, nach der Ausführung für die Position. Hier ändern oder löschen Sie die Order, ziehen den Stop-Loss nach oder schließen die Position.', 'The management runs for each placed order individually: first for the waiting order, after execution for the position. Here you modify or delete the order, trail the stop loss or close the position.')}</p>
      <p className="hint-box"><Icon name="info" size={16} /><span>{count === 0 ? L('Der Rahmen ist noch leer. Fügen Sie aus der Elementbibliothek zuerst einen Auslöser ein, zum Beispiel „Kerzenschluss“ oder „Tick“. Weitere Schritte hängen sich daran.', 'The frame is still empty. First add a trigger from the element library, for example "Candle close" or "Tick". Further steps attach to it.') : L('Was Sie jetzt aus der Elementbibliothek einfügen, kommt in diesen Rahmen.', 'Whatever you insert from the element library now goes into this frame.')}</span></p>
    </div>
  );
}

// ---- element ---------------------------------------------------------------------------------

export function ElementProps({ el, findings }: { el: El; findings: Finding[] }) {
  const L = useL();
  const app = useApp();
  const lang = app.settings.lang;
  const s = app.strategy;
  const root = useRef<HTMLDivElement>(null);
  useFocusField(root);
  if (!s) return null;
  const d = TYPES[el.type];
  const sc = scopeFor(s, lang, el);
  const mine = findings.filter((f) => f.el === el.id);
  const flow = isFlowEl(el.type);
  const obj = isObjectEl(el.type);
  const fields = fieldsOf(el);
  const determining = [...s.rules, ...el.rules].filter((r) => r.determines);
  const lvl = (id: string) => (mine.some((f) => f.field === id && f.level === 'error') ? 'error' : mine.some((f) => f.field === id) ? 'hint' : null);

  const setEl = (fn: (e: El) => void) => update((st) => { const x = st.els.find((q) => q.id === el.id); if (x) fn(x); });
  /** A new order type brings its own properties: they start with their default values. */
  const setField = (fid: string, b: import('./model').Binding) =>
    setEl((x) => {
      x.bind[fid] = b;
      if (x.type === 'flow.place_order' && fid === 'ordertyp') {
        for (const f of fieldsOf(x)) if (x.bind[f.id] === undefined) x.bind[f.id] = defaultBinding(f);
      }
    });
  const addInputs = (e: import('./model').Expr) => noteValues(el.id, e);

  if (!d) {
    return (
      <div className="props" data-testid="props-unknown">
        <header className="props-head"><div className="badge b-unknown"><Icon name="warn" size={20} /></div><div className="props-title"><span className="props-kind">{el.type}</span><h2>{el.name}</h2></div></header>
        <FindingsBox items={mine} />
      </div>
    );
  }
  const typeTip = fieldTip(`type:${el.type}`, lang, 'f');
  void typeTip;
  const origin = el.origin;
  const originText = obj && origin
    ? origin.tplId
      ? L(`${el.name}, aus Vorlage ${origin.tplName ?? ''}, Objekttyp ${typeLabel(origin.type, lang)}`, `${el.name}, from template ${origin.tplName ?? ''}, object type ${typeLabel(origin.type, lang)}`)
      : L(`${el.name}, aus Objekttyp ${typeLabel(origin.type, lang)}`, `${el.name}, from object type ${typeLabel(origin.type, lang)}`)
    : '';
  const paramFields = fields.filter((f) => f.section === 'param' && f.dtype !== 'expression');
  const exprFields = fields.filter((f) => f.dtype === 'expression');
  const orderFields = fields.filter((f) => f.section === 'order');
  const shown = (f: (typeof fields)[number]) => {
    if (!f.appliesWhen) return true;
    const g = el.bind[f.appliesWhen.id];
    return g?.k === 'fixed' && g.v === f.appliesWhen.value;
  };
  const sectionOf = s.sections.find((x) => x.els.includes(el.id));
  const props = membersOf(el);
  const allUses = collectUsage(s);
  const places = placements(s, allUses);
  const place = places.get(el.id);
  const usage = new Map<string, string[]>();
  for (const u of allUses.filter((x) => x.src === el.id)) {
    const n = s.els.find((x) => x.id === u.dst)?.name ?? '?';
    if (!usage.has(u.prop)) usage.set(u.prop, []);
    if (!usage.get(u.prop)?.includes(n)) usage.get(u.prop)?.push(n);
  }
  const myUses = allUses.filter((u) => u.dst === el.id);
  const objectsForInputs = s.els.filter((e) => isObjectEl(e.type) && e.id !== el.id);
  const hostCandidates = s.els.filter((e) => e.id !== el.id && (isFlowEl(e.type) || isObjectEl(e.type)));

  return (
    <div className="props" ref={root} data-testid="props-element" data-kind={el.type}>
      <header className="props-head">
        <div className={`badge b-${kindClass(el.type)}`}><Icon name={d.icon} size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{typeLabel(el.type, lang)}</span>
          <TextInput value={el.name} onChange={(v) => setEl((x) => { x.name = v; })} ariaLabel={L('Name', 'Name')} testid="element-name" className="title-input" />
        </div>
      </header>
      {originText && <p className="origin" data-testid="element-origin"><Icon name="tag" size={14} />{originText}</p>}
      <p className="type-tip">{fieldTip(`type:${el.type}`, lang, 'f') ?? ''}</p>
      {mine.length > 0 && <FindingsBox items={mine} />}

      {exprFields.map((f) => (
        <Section key={f.id} title={tx(f, lang)} testid={`sec-${f.id}`}>
          <FieldRow f={f} b={el.bind[f.id]} sc={sc} inputs={el.inputs} level={lvl(f.id)} id={`field-${el.id}-${f.id}`} mode={el.type === 'flow.condition' ? 'condition' : 'value'} onChange={(b) => setField(f.id, b)} onBlocksChange={addInputs} />
        </Section>
      ))}

      {el.type === 'flow.set_parameter' && (
        <Section title={L('Strategieparameter', 'Strategy parameter')}>
          <div className="field" data-field="strategieparameter">
            <div className="field-label" data-tip={fieldTip('strategieparameter', lang)}><span>{L('Strategieparameter', 'Strategy parameter')}</span><span className="req">*</span><Info tip={fieldTip('strategieparameter', lang)} /></div>
            <FieldRow f={{ ...fields.find((q) => q.id === 'strategieparameter')!, dtype: 'text', bindings: ['param'] }} b={el.bind.strategieparameter?.k === 'param' ? el.bind.strategieparameter : { k: 'param', id: '' }} sc={sc} onChange={(b) => setEl((x) => { x.bind.strategieparameter = b; })} />
          </div>
        </Section>
      )}

      {paramFields.length > 0 && el.type !== 'flow.set_parameter' && (
        <Section title={d.kind === 'flow' || d.kind === 'trigger' ? L('Einstellungen', 'Settings') : L('Einstellungen des Objekts', 'Settings of the object')} testid="sec-settings">
          {paramFields.filter(shown).map((f) => (
            <FieldRow key={f.id} f={f} b={el.bind[f.id]} sc={sc} inputs={el.inputs} level={lvl(f.id)} id={`field-${el.id}-${f.id}`} onChange={(b) => setField(f.id, b)} onBlocksChange={addInputs} />
          ))}
        </Section>
      )}

      {orderFields.length > 0 && (
        <Section title={L('Eigenschaften der Order', 'Properties of the order')} testid="sec-order">
          <p className="muted">{L('Diese Werte bekommt die Order. Fehlt eine Pflichtangabe wie das Volumen, muss eine Regel sie bestimmen.', 'The order gets these values. If a required entry such as the volume is missing, a rule has to determine it.')}</p>
          {orderFields.filter(shown).map((f) => {
            const det = determining.find((r) => r.determines === f.id);
            return (
              <FieldRow key={f.id} f={f} b={el.bind[f.id]} sc={sc} inputs={el.inputs} level={lvl(f.id)} id={`field-${el.id}-${f.id}`}
                note={det ? L(`Wird von der Regel „${det.name}“ bestimmt.`, `Determined by the rule "${det.name}".`) : undefined}
                onChange={(b) => setField(f.id, b)} onBlocksChange={addInputs} />
            );
          })}
        </Section>
      )}

      {(el.type === 'Indikator' || el.type === 'Trend') && el.own && (
        <OwnEditor kind={el.type === 'Trend' ? 'trend' : 'indicator'} own={el.own} lang={lang} onChange={(o) => setEl((x) => { x.own = o; })} />
      )}

      {(obj || d.named) && props.length > 0 && (
        <Section title={L('Liefert', 'Delivers')} testid="sec-delivers" aside={<span className="muted">{L('Jeder Wert und jede Methode ist ein Ausgang für eine Linie', 'Each value and each method is an output for a line')}</span>}>
          <ul className="prop-list">
            {props.map((p) => {
              const tip = fieldTip(p.id, lang, 'p');
              const used = usage.get(p.id);
              return (
                <li key={p.id} className="prop-row" data-tip={tip} data-testid="prop-row" data-method={p.method ? '1' : '0'}>
                  <span className="prop-name">{p.method ? methodText(p.method, undefined, lang) : tx(p, lang)}</span>
                  {p.method
                    ? <span className="dtype-chip method-chip">{L('Methode', 'Method')} · {p.method.args.map((a) => tx(a, lang)).join('; ')}</span>
                    : <span className="dtype-chip">{tx(DTYPE_LABEL[p.dtype], lang)}</span>}
                  {p.choices && <span className="prop-values">{p.choices.map((c) => tx(c, lang)).join(' · ')}</span>}
                  {used && <span className="prop-used"><Icon name="link" size={12} />{used.join(', ')}</span>}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {obj && el.type !== 'Strategie' && (
        <Section title={L('Erste Verwendung', 'First use')} testid="sec-first-use" aside={<Info tip={fieldTip('erste_verwendung', lang, 'f')} />}>
          <div className="field" data-field="host">
            {place ? (
              <p className="first-use" data-testid="first-use-text">
                <Icon name="link" size={14} />
                {L('Liegt bei ', 'Lies at ')}<b>{s.els.find((x) => x.id === place.host)?.name}</b>
                {place.depth > 1 ? L(' (über ein anderes Objekt)', ' (via another object)') : ''}
              </p>
            ) : (
              <p className="hint" data-testid="first-use-none">
                <Icon name="warn" size={15} />
                <span>{L('Noch mit keinem Element verbunden. Wählen Sie unten das Element, das diese Instanz zuerst verwendet, oder ziehen Sie ihre Karte auf der Fläche darauf.', 'Not connected to an element yet. Choose below the element that uses this instance first, or drag its card onto it on the canvas.')}</span>
              </p>
            )}
            <Select value={place?.host ?? ''} onChange={(v) => setHost(el.id, v || null)} ariaLabel={L('Element der ersten Verwendung', 'Element of the first use')} testid="host-select">
              <option value="">{L('– mit Element verbinden … –', '– connect to element … –')}</option>
              {hostCandidates.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </div>
          {allUses.filter((u) => u.src === el.id && u.dst !== place?.host).length > 0 && (
            <div className="further" data-testid="further-uses">
              <h4 className="sub-h">{L('Weitere Verwendungen', 'Further uses')}</h4>
              <ul className="prop-list">
                {[...new Set(allUses.filter((u) => u.src === el.id && u.dst !== place?.host).map((u) => u.dst))].map((dst) => (
                  <li key={dst} className="prop-row" data-testid="further-use">
                    <button type="button" className="link-btn" onClick={() => select({ k: 'el', id: dst })}>{s.els.find((x) => x.id === dst)?.name}</button>
                    <span className="prop-values">{allUses.filter((u) => u.src === el.id && u.dst === dst).map((u) => memberLabel(el, u.prop, u.args, lang) + (u.refresh ? ' ↻' : '')).join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {(flow || obj) && (
        <Section title={L('Verwendete Werte', 'Values used')} testid="sec-inputs" aside={<Info tip={L('Werte von Objekten, die dieses Element verwendet. Bei jeder Verwendung wählen Sie die Eigenschaft oder Methode und, wo das Objekt es vorsieht, ob es seine Werte vorher neu ermittelt (Aktualisieren). Die Werte stehen in der Bedingung oder Berechnung zur Auswahl.', 'Values of objects that this element uses. At each use you choose the property or method and, where the object provides it, whether it determines its values anew first (Update). The values are available in the condition or calculation.')} />}>
          {myUses.length === 0 && <p className="empty-note">{L('Noch kein Wert verwendet. Wählen Sie unten einen Wert, ziehen Sie auf der Fläche eine Linie von der Eigenschaft eines Objekts hierher oder wählen Sie den Wert in der Bedingung oder Berechnung.', 'No value used yet. Choose a value below, drag a line from the property of an object to here on the canvas or choose the value in the condition or calculation.')}</p>}
          {myUses.map((u) => <UseRow key={`${u.dst}|${u.key}`} el={el} u={u} first={places.get(u.src)?.host === el.id} />)}
          <Select value="" onChange={(v) => {
            if (!v) return;
            const [o, p] = v.split('|');
            const oe = s.els.find((x) => x.id === o);
            const m = oe ? methodOf(oe.type, p) : undefined;
            connectObject(o, el.id, { obj: o, prop: p, ...(m ? { args: [...m.defaults] } : {}) });
          }} ariaLabel={L('Wert verbinden', 'Connect value')} testid="input-add">
            <option value="">{L('+ Wert verbinden …', '+ Connect value …')}</option>
            {objectsForInputs.map((o) => (
              <optgroup key={o.id} label={o.name}>
                {memberList(o.id, sc).map((p) => <option key={p.id} value={`${o.id}|${p.id}`}>{o.name} › {p.method ? `${methodText(p.method, undefined, lang)} (${L('Methode', 'method')})` : tx(p, lang)}</option>)}
              </optgroup>
            ))}
          </Select>
        </Section>
      )}

      {d.rulesAllowed && (
        <Section title={L('Regeln und Regelwerke dieses Elements', 'Rules and rule sets of this element')} testid="sec-element-rules">
          <p className="muted">{L('Diese Regeln gelten zusätzlich zu den Regeln der Strategie nur für dieses Element.', 'These rules apply in addition to the rules of the strategy, for this element only.')}</p>
          <RulesEditor rules={el.rules} onChange={(r) => setEl((x) => { x.rules = r; })} base={sc} onOpen={(id) => select({ k: 'rule', owner: el.id, id })} />
        </Section>
      )}

      {flow && (
        <Section title={L('Abschnitt', 'Section')} testid="sec-section" aside={<Info tip={L('Abschnitte fassen zusammengehörige Schritte zusammen. Sie lassen sich auf der Fläche einklappen.', 'Sections group steps that belong together. They can be collapsed on the canvas.')} />}>
          <SectionPicker el={el} current={sectionOf?.id ?? ''} />
        </Section>
      )}

      <footer className="props-foot">
        {obj && el.type !== 'Strategie' && (
          <Btn icon="copy" kind="ghost" testid="save-as-template" onClick={() => setState({ dialog: { k: 'saveTemplate', elId: el.id } })}>
            {L('Als Vorlage speichern', 'Save as template')}
          </Btn>
        )}
        <Btn icon="trash" kind="quiet" testid="remove-element" onClick={() => requestRemove(el.id)}>
          {L('Entfernen', 'Remove')}
        </Btn>
      </footer>
    </div>
  );
}

/** One use of an object by this element: property or method, its arguments, the switch "Update". */
function UseRow({ el, u, first }: { el: El; u: UseRec; first: boolean }) {
  const L = useL();
  const app = useApp();
  const lang = app.settings.lang;
  const s = app.strategy;
  const src = s?.els.find((x) => x.id === u.src);
  if (!s || !src) return null;
  const members = membersOf(src);
  const method = members.find((m) => m.id === u.prop)?.method;
  const from: Use = { obj: u.src, prop: u.prop, args: u.args };
  const toMember = (prop: string) => {
    const m = methodOf(src.type, prop);
    changeUse(el.id, from, { obj: u.src, prop, ...(m ? { args: [...m.defaults] } : {}) });
  };
  const removable = el.inputs.some((i) => i.obj === u.src && sameMember(i, u));
  return (
    <div className="use-row" data-testid="use-row" data-field={`use:${u.key}`} data-use-src={src.name}>
      <div className="use-head">
        <Icon name="link" size={13} />
        <b>{src.name}</b>
        {first && <span className="chip first-chip" data-testid="use-first" data-tip={fieldTip('erste_verwendung', lang, 'f')}>{L('erste Verwendung', 'first use')}</span>}
        {removable && (
          <button type="button" className="use-remove" aria-label={L('Verbindung entfernen', 'Remove connection')} data-testid="use-remove" onClick={() => removeUse(el.id, from)}><Icon name="x" size={13} /></button>
        )}
      </div>
      <div className="use-body">
        <Select value={u.prop} onChange={toMember} ariaLabel={L('Eigenschaft oder Methode', 'Property or method')} testid="use-member">
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.method ? `${methodText(m.method, undefined, lang)} (${L('Methode', 'method')})` : tx(m, lang)}</option>
          ))}
        </Select>
        {method && method.args.map((a, i) => (
          <NumberInput key={a.id} value={u.args?.[i] ?? method.defaults[i] ?? 1} ariaLabel={tx(a, lang)} testid="use-arg"
            onChange={(v) => changeUse(el.id, from, { obj: u.src, prop: u.prop, args: method.args.map((_, j) => (j === i ? Math.max(1, Math.round(v === '' ? 1 : v)) : u.args?.[j] ?? method.defaults[j] ?? 1)) })} />
        ))}
        {method && <span className="muted">{tx(method.args[0], lang)}</span>}
        {supportsRefresh(src) && (
          <span className="use-refresh" data-tip={fieldTip('aktualisieren', lang, 'f')}>
            <Toggle checked={u.refresh} onChange={(v) => setRefresh(el.id, u.key, v)} label={L('Aktualisieren', 'Update')} testid="use-refresh" />
          </span>
        )}
      </div>
    </div>
  );
}

function SectionPicker({ el, current }: { el: El; current: string }) {
  const L = useL();
  const s = useApp().strategy;
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  if (!s) return null;
  const options = s.sections.filter((x) => x.flow === (el.mgmt ?? null));
  return (
    <div>
      <Select value={current} onChange={(v) => { if (v === '__new') setAdding(true); else setSection(el.id, v); }} testid="section-select" ariaLabel={L('Abschnitt', 'Section')}>
        <option value="">{L('– keinem Abschnitt zugeordnet –', '– not in a section –')}</option>
        {options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        <option value="__new">{L('+ Neuen Abschnitt bilden …', '+ Create new section …')}</option>
      </Select>
      {adding && (
        <div className="inline-new">
          <TextInput value={name} onChange={setName} placeholder={L('Name des Abschnitts, zum Beispiel „Einstieg“', 'Name of the section, for example "Entry"')} ariaLabel={L('Name des Abschnitts', 'Name of the section')} testid="section-name" autoFocus />
          <Btn small kind="primary" testid="section-create" disabled={!name.trim()} onClick={() => { setSection(el.id, 'new', name.trim()); setAdding(false); setName(''); }}>{L('Bilden', 'Create')}</Btn>
        </div>
      )}
      {current && (
        <p className="muted">{L('Auf der Fläche klappt der Abschnitt mit dem Knopf an seinem Titel ein und aus.', 'On the canvas the section collapses and expands with the button at its title.')}</p>
      )}
    </div>
  );
}

// ---- rule ---------------------------------------------------------------------------------------

export function RuleProps({ owner, id }: { owner: string | null; id: string }) {
  const L = useL();
  const app = useApp();
  const s = app.strategy;
  if (!s) return null;
  const el = owner ? s.els.find((e) => e.id === owner) : null;
  const list = el ? el.rules : s.rules;
  const r = list.find((x) => x.id === id);
  if (!r) return null;
  const setRule = (fn: (x: RuleInst) => void) => update((st) => {
    const l = owner ? st.els.find((e) => e.id === owner)?.rules : st.rules;
    const q = l?.find((x) => x.id === id);
    if (q) fn(q);
  });
  const sc = { ...scopeFor(s, app.settings.lang, el ?? null, true), rulePars: (r.own?.params ?? []).map((p) => ({ id: p.id, name: p.name })) };
  return (
    <div className="props" data-testid="props-rule">
      <header className="props-head">
        <div className="badge b-rule"><Icon name={r.kind === 'ruleset' ? 'layers' : 'shield'} size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{r.kind === 'ruleset' ? L('Regelwerk', 'Rule set') : L('Regel', 'Rule')}</span>
          <TextInput value={r.name} onChange={(v) => setRule((x) => { x.name = v; })} ariaLabel={L('Name', 'Name')} className="title-input" />
        </div>
      </header>
      <p className="origin"><Icon name="tag" size={14} />{r.origin.tplId ? L(`aus Vorlage ${r.origin.tplName}, Objekttyp ${typeLabel(r.origin.type, app.settings.lang)}`, `from template ${r.origin.tplName}, object type ${typeLabel(r.origin.type, app.settings.lang)}`) : L(`eigene Regel, Objekttyp ${typeLabel(r.origin.type, app.settings.lang)}`, `own rule, object type ${typeLabel(r.origin.type, app.settings.lang)}`)}</p>
      <p>{el ? L(`Gilt nur für das Element „${el.name}“.`, `Applies only to the element "${el.name}".`) : L('Gilt für jede Order der Strategie.', 'Applies to every order of the strategy.')}</p>
      {r.builtin ? (
        <Section title={L('Risikogrenze', 'Risk limit')}>
          <p className="muted">{L('Höchster Verlust vom Preis bis zum Stop-Loss als Anteil des Kapitals. Das Volumen wird daraus bestimmt und auf den Volumenschritt abgerundet.', 'Maximum loss from the price to the stop loss as a share of the equity. The volume is derived from it and rounded down to the volume step.')}</p>
          <ValueByType dtype="percent" value={(r.params.risikogrenze as { v?: number } | undefined)?.v ?? 0.01} onChange={(v) => setRule((x) => { x.params.risikogrenze = { k: 'fixed', v }; })} ariaLabel={L('Risikogrenze', 'Risk limit')} testid="risk-limit" />
        </Section>
      ) : r.kind === 'rule' ? (
        <RuleBody rule={r} lang={app.settings.lang} base={sc} onChange={(fn) => setRule((x) => fn(x as never))} />
      ) : (
        <Section title={L('Regeln in fester Reihenfolge', 'Rules in a fixed order')}>
          <RulesEditor rules={r.own?.rules ?? []} onChange={(rs) => setRule((x) => { if (x.own) x.own.rules = rs; })} allowRuleset={false} base={sc} />
        </Section>
      )}
      <footer className="props-foot">
        <Btn icon="left" kind="ghost" onClick={() => select(el ? { k: 'el', id: el.id } : { k: 'strategy' })}>{L('Zurück', 'Back')}</Btn>
        <Btn icon="trash" kind="quiet" onClick={() => { update((st) => { if (owner) { const e = st.els.find((q) => q.id === owner); if (e) e.rules = e.rules.filter((q) => q.id !== id); } else st.rules = st.rules.filter((q) => q.id !== id); }); select(el ? { k: 'el', id: el.id } : { k: 'strategy' }); }}>{L('Regel entfernen', 'Remove rule')}</Btn>
      </footer>
    </div>
  );
}

export { addParam, allTemplates, isUnset, isTrigger, toast, choiceLabel, uid, ownScope, EMPTY };
