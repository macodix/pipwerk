// Editing the content of an own object: parameters, contained indicators, properties with
// expressions, rules and the direction of a trend. Used in the template view and in the
// properties of an instance.
import { TYPES, tx, typeLabel } from './catalog';
import { ExprPanel } from './ExprEditor';
import { EMPTY } from './expr';
import type { Scope } from './expr';
import { ValueByType } from './fields';
import { newOwnRule, newRuleFromTemplate, uniqueName } from './factory';
import { clone, uid } from './model';
import { nameContent, takenNames } from './names';
import type { DType, El, OwnDef, RuleInst, Template } from './model';
import { allTemplates, useApp } from './store';
import { Btn, Icon, Section, Select, TextInput, Toggle, useL } from './ui';

const OWN_TYPES: DType[] = ['number', 'integer', 'percent', 'boolean', 'text', 'time_unit'];

export function ownScope(own: OwnDef, lang: import('./model').Lang, rule: boolean): Scope {
  const els: El[] = own.includes.map((i) => ({
    id: i.id, type: i.tpl, name: i.name, bind: {}, rules: [], inputs: [], mgmt: null, origin: null, own: null,
  }));
  return { lang, els, params: [], rulePars: own.params.map((p) => ({ id: p.id, name: p.name })), orderPosition: rule };
}

const dtypeLabel = (L: (a: string, b: string) => string): Record<string, string> => ({
  number: L('Zahl', 'Number'), integer: L('Ganzzahl', 'Integer'), percent: L('Prozent', 'Percent'),
  boolean: L('ja/nein', 'yes/no'), text: L('Text', 'Text'), time_unit: L('Zeiteinheit', 'Time unit'),
});

export function RulesEditor({
  rules, onChange, allowRuleset = true, title, base, onOpen,
}: { rules: RuleInst[]; onChange: (r: RuleInst[]) => void; allowRuleset?: boolean; title?: string; base?: Scope; onOpen?: (id: string) => void }) {
  const L = useL();
  const app = useApp();
  const lang = app.settings.lang;
  const tpls = allTemplates(app).filter((t) => t.kind === 'rule' || (allowRuleset && t.kind === 'ruleset'));
  const move = (i: number, d: number) => {
    const next = [...rules];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (v: string) => {
    if (!v) return;
    // in the strategy the names of the whole strategy are taken (one namespace), in a template only its own rules
    const taken = base && app.strategy ? takenNames(app.strategy) : rules.map((r) => r.name);
    if (v === '__rule') onChange([...rules, newOwnRule(uniqueName(L('Regel', 'Rule'), taken))]);
    else if (v === '__ruleset') onChange([...rules, newOwnRule(uniqueName(L('Regelwerk', 'Rule set'), taken), 'ruleset')]);
    else {
      const t = tpls.find((x) => x.id === v);
      if (t) {
        const r = newRuleFromTemplate(t, uniqueName(t.builtin ? L('Risiko', 'Risk') : t.name, taken));
        if (base && app.strategy) nameContent(r.own, r.name, [...taken, r.name]);
        onChange([...rules, r]);
      }
    }
  };
  return (
    <div className="rules-editor" data-testid="rules-editor">
      {title && <h4 className="sub-h">{title}</h4>}
      {rules.length === 0 && <p className="empty-note">{L('Noch keine Regel. Wählen Sie unten eine Regel oder ein Regelwerk.', 'No rule yet. Choose a rule or rule set below.')}</p>}
      {rules.map((r, i) => (
        <div key={r.id} className="rule-edit">
          <div className="rule-head">
            <TextInput value={r.name} onChange={(v) => onChange(rules.map((x) => (x.id === r.id ? { ...x, name: v } : x)))} ariaLabel={L('Name der Regel', 'Name of the rule')} />
            {onOpen && r.kind === 'ruleset' && <Btn kind="quiet" small icon="right" title={L('Regelwerk öffnen: die enthaltenen Regeln bearbeiten', 'Open rule set: edit the contained rules')} testid="rule-open" onClick={() => onOpen(r.id)} />}
            <Btn kind="quiet" small icon="up" title={L('Nach oben', 'Move up')} onClick={() => move(i, -1)} disabled={i === 0} />
            <Btn kind="quiet" small icon="down" title={L('Nach unten', 'Move down')} onClick={() => move(i, 1)} disabled={i === rules.length - 1} />
            <Btn kind="quiet" small icon="x" title={L('Regel entfernen', 'Remove rule')} onClick={() => onChange(rules.filter((x) => x.id !== r.id))} />
          </div>
          {r.builtin ? (
            <div className="rule-builtin">
              <p className="muted">{L('Mitgelieferte Regel „Risiko je Trade“: bestimmt das Volumen aus der Risikogrenze.', 'Delivered rule "Risk per trade": derives the volume from the risk limit.')}</p>
              <label className="kind-row">
                <span className="kind-cap">{L('Risikogrenze', 'Risk limit')}</span>
                <ValueByType dtype="percent" value={(r.params.risikogrenze as { v?: number } | undefined)?.v ?? 0.01} ariaLabel={L('Risikogrenze', 'Risk limit')} testid="risk-limit"
                  onChange={(v) => onChange(rules.map((x) => (x.id === r.id ? { ...x, params: { ...x.params, risikogrenze: { k: 'fixed', v } } } : x)))} />
              </label>
            </div>
          ) : r.kind === 'rule' ? (
            <details>
              <summary>{L('Ausdruck der Regel', 'Expression of the rule')}</summary>
              <RuleBody rule={r} lang={lang} base={base}
                onChange={(fn) => onChange(rules.map((x) => { if (x.id !== r.id) return x; const c = clone(x); fn(c); return c; }))} />
            </details>
          ) : null}
        </div>
      ))}
      <Select value="" onChange={add} ariaLabel={L('Regel hinzufügen', 'Add rule')} testid="rule-add-select">
        <option value="">{L('+ Regel oder Regelwerk hinzufügen …', '+ Add rule or rule set …')}</option>
        {tpls.map((t) => <option key={t.id} value={t.id}>{t.builtin ? (lang === 'en' ? 'Risk per trade' : 'Risiko je Trade') : t.name}{t.builtin ? '' : ` (${L('eigene', 'own')})`}</option>)}
        <option value="__rule">{L('Neue eigene Regel', 'New own rule')}</option>
        {allowRuleset && <option value="__ruleset">{L('Neues eigenes Regelwerk', 'New own rule set')}</option>}
      </Select>
    </div>
  );
}

export function OwnEditor({
  kind, own, onChange, lang,
}: { kind: 'indicator' | 'trend' | 'rule' | 'ruleset'; own: OwnDef; onChange: (o: OwnDef) => void; lang: import('./model').Lang }) {
  const L = useL();
  const app = useApp();
  const sc = ownScope(own, lang, false);
  const labels = dtypeLabel(L);
  const set = (fn: (o: OwnDef) => void) => {
    const o = clone(own);
    fn(o);
    onChange(o);
  };
  const indicatorTpls = allTemplates(app).filter((t) => t.kind === 'indicator');
  const builtinInd = ['EMA', 'ATR', 'ZigZag'];
  return (
    <div className="own-editor" data-testid="own-editor">
      <Section title={L('Eigene Parameter', 'Own parameters')} testid="own-params">
        {own.params.length === 0 && <p className="empty-note">{L('Parameter sind Einstellungen, die der Anwender der Vorlage später setzt. Noch keiner angelegt.', 'Parameters are settings the user of the template sets later. None created yet.')}</p>}
        {own.params.map((p) => (
          <div key={p.id} className="own-row">
            <TextInput value={p.name} onChange={(v) => set((o) => { o.params.find((x) => x.id === p.id)!.name = v; })} ariaLabel={L('Name des Parameters', 'Name of the parameter')} />
            <Select value={p.dtype} onChange={(v) => set((o) => { const q = o.params.find((x) => x.id === p.id)!; q.dtype = v as DType; q.def = v === 'boolean' ? true : v === 'text' || v === 'time_unit' ? '' : 0; })} ariaLabel={L('Datentyp', 'Data type')}>
              {OWN_TYPES.map((t) => <option key={t} value={t}>{labels[t]}</option>)}
            </Select>
            <ValueByType dtype={p.dtype} value={p.def} onChange={(v) => set((o) => { o.params.find((x) => x.id === p.id)!.def = v; })} ariaLabel={L('Standardwert', 'Default value')} />
            <Btn kind="quiet" small icon="x" title={L('Parameter entfernen', 'Remove parameter')} onClick={() => set((o) => { o.params = o.params.filter((x) => x.id !== p.id); })} />
          </div>
        ))}
        <Btn small icon="plus" onClick={() => set((o) => { o.params.push({ id: uid('op'), name: uniqueName(L('Parameter', 'Parameter'), o.params.map((x) => x.name)), dtype: 'number', def: 0 }); })}>
          {L('Parameter hinzufügen', 'Add parameter')}
        </Btn>
      </Section>
      {(kind === 'indicator' || kind === 'trend') && (
        <Section title={L('Enthaltene Indikatoren', 'Contained indicators')} testid="own-includes">
          {own.includes.length === 0 && <p className="empty-note">{L('Ein Indikator kann auf anderen Indikatoren aufbauen, zum Beispiel auf einem EMA. Noch keiner enthalten.', 'An indicator can build on other indicators, for example an EMA. None contained yet.')}</p>}
          {own.includes.map((i) => (
            <div key={i.id} className="own-row">
              <TextInput value={i.name} onChange={(v) => set((o) => { o.includes.find((x) => x.id === i.id)!.name = v; })} ariaLabel={L('Name', 'Name')} />
              <span className="chip">{typeLabel(i.tpl, lang)}</span>
              <Btn kind="quiet" small icon="x" title={L('Entfernen', 'Remove')} onClick={() => set((o) => { o.includes = o.includes.filter((x) => x.id !== i.id); })} />
            </div>
          ))}
          <Select value="" onChange={(v) => { if (v) set((o) => { const t = indicatorTpls.find((x) => x.id === v); const type = t ? t.type : v; o.includes.push({ id: uid('inc'), name: uniqueName(t ? t.name : typeLabel(type, lang), !app.tplView && app.strategy ? takenNames(app.strategy) : o.includes.map((x) => x.name)), tpl: type }); }); }} ariaLabel={L('Indikator hinzufügen', 'Add indicator')}>
            <option value="">{L('+ Indikator hinzufügen …', '+ Add indicator …')}</option>
            {builtinInd.map((id) => <option key={id} value={id}>{typeLabel(id, lang)}</option>)}
            {indicatorTpls.map((t) => <option key={t.id} value={t.id}>{t.name} ({L('eigene', 'own')})</option>)}
          </Select>
        </Section>
      )}
      {kind === 'trend' && (
        <Section title={L('Richtung des Trends', 'Direction of the trend')} testid="own-direction">
          <p className="muted">{L('Berechnungsverfahren „Ausdruck“: Der Ausdruck legt die Richtung fest, zum Beispiel „aufwärts“ oder „abwärts“.', 'Calculation procedure "Expression": the expression defines the direction, for example "up" or "down".')}</p>
          <ExprPanel value={own.direction ?? EMPTY} onChange={(e) => set((o) => { o.direction = e; })} sc={sc} mode="value" label={L('Richtung', 'Direction')} id="own-direction-expr" />
        </Section>
      )}
      {(kind === 'indicator' || kind === 'trend') && (
        <Section title={L('Eigene Eigenschaften', 'Own properties')} testid="own-props">
          {own.props.length === 0 && <p className="empty-note">{L('Eigenschaften sind die Werte, die der Indikator liefert. Jede wird durch einen Ausdruck bestimmt. Noch keine angelegt.', 'Properties are the values the indicator delivers. Each is determined by an expression. None created yet.')}</p>}
          {own.props.map((p) => (
            <div key={p.id} className="own-prop">
              <div className="own-row">
                <TextInput value={p.name} onChange={(v) => set((o) => { o.props.find((x) => x.id === p.id)!.name = v; })} ariaLabel={L('Name der Eigenschaft', 'Name of the property')} />
                <Select value={p.dtype} onChange={(v) => set((o) => { o.props.find((x) => x.id === p.id)!.dtype = v as DType; })} ariaLabel={L('Datentyp', 'Data type')}>
                  {['number', 'boolean', 'text'].map((t) => <option key={t} value={t}>{labels[t]}</option>)}
                </Select>
                <Btn kind="quiet" small icon="x" title={L('Eigenschaft entfernen', 'Remove property')} onClick={() => set((o) => { o.props = o.props.filter((x) => x.id !== p.id); })} />
              </div>
              <ExprPanel value={p.e} onChange={(e) => set((o) => { o.props.find((x) => x.id === p.id)!.e = e; })} sc={sc} mode={p.dtype === 'boolean' ? 'condition' : 'value'} />
            </div>
          ))}
          <Btn small icon="plus" onClick={() => set((o) => { o.props.push({ id: uid('pp'), name: uniqueName(L('Wert', 'Value'), o.props.map((x) => x.name)), dtype: 'number', e: EMPTY }); })}>
            {L('Eigenschaft hinzufügen', 'Add property')}
          </Btn>
        </Section>
      )}
      {kind === 'ruleset' && (
        <Section title={L('Regeln in fester Reihenfolge', 'Rules in a fixed order')} testid="own-rules">
          <RulesEditor rules={own.rules} onChange={(r) => set((o) => { o.rules = r; })} allowRuleset={false} />
        </Section>
      )}
    </div>
  );
}

export function RuleBody({
  rule, onChange, lang, builtin, base,
}: { rule: Pick<Template, 'e' | 'determines' | 'cmp' | 'own'>; onChange: (fn: (r: Pick<Template, 'e' | 'determines' | 'cmp' | 'own'>) => void) => void; lang: import('./model').Lang; builtin?: boolean; base?: Scope }) {
  const L = useL();
  const own = rule.own ?? { params: [], props: [], includes: [], rules: [] };
  const sc: Scope = base
    ? { ...base, rulePars: (own as OwnDef).params.map((p) => ({ id: p.id, name: p.name })), orderPosition: true }
    : ownScope(own as OwnDef, lang, true);
  const dets: [string, string][] = [
    ['', L('– nichts (die Regel prüft nur)', '– nothing (the rule only checks)')],
    ['volumen', L('Volumen', 'Volume')], ['preis', L('Preis', 'Price')], ['stop_loss', L('Stop-Loss', 'Stop loss')], ['take_profit', L('Take-Profit', 'Take profit')],
  ];
  return (
    <>
      <Section title={L('Eigene Parameter', 'Own parameters')} testid="rule-params">
        {builtin ? (
          <p className="muted">{L('Risikogrenze: höchster Verlust je Trade als Anteil des Kapitals (Standard 1 %).', 'Risk limit: maximum loss per trade as a share of the equity (default 1 %).')}</p>
        ) : (
          <OwnParamsOnly own={own as OwnDef} onChange={(o) => onChange((r) => { r.own = o; })} />
        )}
      </Section>
      {!builtin && (
        <Section title={L('Ausdruck der Regel', 'Expression of the rule')} testid="rule-expr">
          <p className="muted">{L('Der Ausdruck liefert den Wert oder das Prüfergebnis der Regel. Order und Position sind verfügbar.', 'The expression delivers the value or the check result of the rule. Order and position are available.')}</p>
          <ExprPanel value={rule.e} onChange={(e) => onChange((r) => { r.e = e; })} sc={sc} mode="condition" />
        </Section>
      )}
      <Section title={L('Wirkung auf die Order', 'Effect on the order')} testid="rule-effect">
        {builtin ? (
          <p>{L('Bestimmt das Volumen; prüft es, sobald es sich nicht mehr ändern lässt.', 'Determines the volume; checks it as soon as it can no longer change.')}</p>
        ) : (
          <>
            <label className="kind-row">
              <span className="kind-cap">{L('Bestimmt', 'Determines')}</span>
              <Select value={rule.determines ?? ''} onChange={(v) => onChange((r) => { r.determines = v || null; })} ariaLabel={L('Bestimmte Eigenschaft', 'Determined property')}>
                {dets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </label>
            <label className="kind-row">
              <span className="kind-cap">{L('Prüft', 'Checks')}</span>
              <Select value={rule.cmp} onChange={(v) => onChange((r) => { r.cmp = v as Template['cmp']; })} ariaLabel={L('Vergleich beim Prüfen', 'Comparison when checking')}>
                <option value="max">{L('Wert höchstens gleich dem Ergebnis', 'value at most equal to the result')}</option>
                <option value="min">{L('Wert mindestens gleich dem Ergebnis', 'value at least equal to the result')}</option>
                <option value="eq">{L('Wert gleich dem Ergebnis', 'value equal to the result')}</option>
              </Select>
            </label>
          </>
        )}
      </Section>
    </>
  );
}

function OwnParamsOnly({ own, onChange }: { own: OwnDef; onChange: (o: OwnDef) => void }) {
  const L = useL();
  const labels = dtypeLabel(L);
  const set = (fn: (o: OwnDef) => void) => {
    const o = clone(own);
    fn(o);
    onChange(o);
  };
  return (
    <>
      {own.params.length === 0 && <p className="empty-note">{L('Noch keiner angelegt. Parameter sind Werte wie die Risikogrenze, die bei der Verwendung der Regel gesetzt werden.', 'None created yet. Parameters are values such as the risk limit that are set when the rule is used.')}</p>}
      {own.params.map((p) => (
        <div key={p.id} className="own-row">
          <TextInput value={p.name} onChange={(v) => set((o) => { o.params.find((x) => x.id === p.id)!.name = v; })} ariaLabel={L('Name des Parameters', 'Name of the parameter')} />
          <Select value={p.dtype} onChange={(v) => set((o) => { const q = o.params.find((x) => x.id === p.id)!; q.dtype = v as DType; q.def = v === 'boolean' ? true : v === 'text' || v === 'time_unit' ? '' : 0; })} ariaLabel={L('Datentyp', 'Data type')}>
            {OWN_TYPES.map((t) => <option key={t} value={t}>{labels[t]}</option>)}
          </Select>
          <ValueByType dtype={p.dtype} value={p.def} onChange={(v) => set((o) => { o.params.find((x) => x.id === p.id)!.def = v; })} ariaLabel={L('Standardwert', 'Default value')} />
          <Btn kind="quiet" small icon="x" title={L('Parameter entfernen', 'Remove parameter')} onClick={() => set((o) => { o.params = o.params.filter((x) => x.id !== p.id); })} />
        </div>
      ))}
      <Btn small icon="plus" onClick={() => set((o) => { o.params.push({ id: uid('op'), name: uniqueName(L('Parameter', 'Parameter'), o.params.map((x) => x.name)), dtype: 'number', def: 0 }); })}>
        {L('Parameter hinzufügen', 'Add parameter')}
      </Btn>
    </>
  );
}

export { Icon, Toggle, TYPES, tx };
