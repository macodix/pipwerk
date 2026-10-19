// Entry of values: by data type, and the assignment of a parameter (fixed value, strategy parameter,
// value of an object, calculation, at application), always with a visible label for the kind.
import { useState } from 'react';
import { DTYPE_LABEL, TIME_UNITS, fieldTip, isObjectEl, tx } from './catalog';
import type { Field } from './catalog';
import { ExprPanel } from './ExprEditor';
import type { Scope } from './expr';
import { propList } from './expr';
import { EMPTY } from './expr';
import { isUnset } from './model';
import type { Binding, Choice, DType, SParam, SPType } from './model';
import { addParam, update, useApp } from './store';
import { Btn, Icon, Info, NumberInput, Select, TextInput, Toggle, useL } from './ui';

export function ValueByType({
  dtype, value, onChange, choices, testid, ariaLabel,
}: {
  dtype: DType | SPType;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
  choices?: Choice[];
  testid?: string;
  ariaLabel?: string;
}) {
  const L = useL();
  const lang = useApp().settings.lang;
  if (dtype === 'time_unit') {
    return (
      <Select value={String(value ?? '')} onChange={onChange} testid={testid} ariaLabel={ariaLabel ?? L('Zeiteinheit', 'Time unit')}>
        <option value="">{L('Zeiteinheit wählen …', 'Choose time unit …')}</option>
        {TIME_UNITS.map((u) => <option key={u.id} value={u.id}>{u.de}</option>)}
      </Select>
    );
  }
  if (dtype === 'choice') {
    return (
      <Select value={String(value ?? '')} onChange={onChange} testid={testid} ariaLabel={ariaLabel}>
        <option value="">{L('Wert wählen …', 'Choose value …')}</option>
        {(choices ?? []).map((c) => <option key={c.id} value={c.id}>{tx(c, lang)}</option>)}
      </Select>
    );
  }
  if (dtype === 'boolean') {
    return (
      <Select value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(v) => onChange(v === 'true')} testid={testid} ariaLabel={ariaLabel}>
        <option value="true">{L('ja', 'yes')}</option>
        <option value="false">{L('nein', 'no')}</option>
      </Select>
    );
  }
  if (dtype === 'percent') {
    const shown = typeof value === 'number' ? Math.round(value * 10000) / 100 : '';
    return <NumberInput value={shown} onChange={(v) => onChange(v === '' ? '' : v / 100)} unit="%" testid={testid} ariaLabel={ariaLabel} />;
  }
  if (dtype === 'number' || dtype === 'integer') {
    return <NumberInput value={typeof value === 'number' ? value : ''} onChange={(v) => onChange(v)} testid={testid} ariaLabel={ariaLabel} />;
  }
  if (dtype === 'date') {
    return <input className="input" type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} data-testid={testid} aria-label={ariaLabel} />;
  }
  if (dtype === 'timestamp') {
    return <input className="input" type="datetime-local" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} data-testid={testid} aria-label={ariaLabel} />;
  }
  return <TextInput value={String(value ?? '')} onChange={onChange} testid={testid} ariaLabel={ariaLabel} />;
}

export const spTypeFor = (d: DType): SPType => {
  if (d === 'time_unit') return 'time_unit';
  if (d === 'percent') return 'percent';
  if (d === 'integer') return 'integer';
  if (d === 'number') return 'number';
  if (d === 'boolean') return 'boolean';
  return 'text';
};

function compatible(p: SParam, d: DType): boolean {
  if (d === 'time_unit') return p.dtype === 'time_unit';
  if (d === 'number' || d === 'integer' || d === 'percent') return ['number', 'integer', 'percent'].includes(p.dtype);
  if (d === 'boolean') return p.dtype === 'boolean';
  return p.dtype === 'text';
}

export function defaultFixed(f: Pick<Field, 'dtype' | 'def' | 'choices'>): string | number | boolean {
  if (f.def !== undefined) return f.def;
  switch (f.dtype) {
    case 'time_unit': return 'h1';
    case 'number': case 'integer': case 'percent': return 0;
    case 'boolean': return true;
    case 'choice': return f.choices?.[0]?.id ?? '';
    default: return '';
  }
}

const KIND_LABEL = (L: (a: string, b: string) => string, f: Pick<Field, 'dtype'>): Record<string, string> => ({
  unset: L('nicht belegt', 'not assigned'),
  fixed: L('Fester Wert', 'Fixed value'),
  param: L('Strategieparameter', 'Strategy parameter'),
  ref: L('Wert eines Objekts', 'Value of an object'),
  expr: L('Berechnung aus Bausteinen', 'Calculation from blocks'),
  app: f.dtype === 'instrument' ? L('Instrument der Anwendung', 'Instrument of the application') : L('Bei der Anwendung übergeben', 'Passed at application'),
});

export function NewParamInline({ dtype, onCreated }: { dtype: DType; onCreated: (id: string) => void }) {
  const L = useL();
  const [name, setName] = useState('');
  return (
    <div className="inline-new" data-testid="new-param-inline">
      <TextInput value={name} onChange={setName} placeholder={L('Name des neuen Strategieparameters', 'Name of the new strategy parameter')} ariaLabel={L('Name des neuen Strategieparameters', 'Name of the new strategy parameter')} testid="new-param-name" />
      <Btn small kind="primary" icon="plus" testid="new-param-create" disabled={!name.trim()} onClick={() => { const id = addParam(name.trim(), spTypeFor(dtype)); setName(''); onCreated(id); }}>
        {L('Anlegen', 'Create')}
      </Btn>
    </div>
  );
}

export function ParamPicker({
  dtype, value, onChange, params,
}: { dtype: DType; value: string; onChange: (id: string) => void; params: SParam[] }) {
  const L = useL();
  const [adding, setAdding] = useState(false);
  const list = params.filter((p) => compatible(p, dtype));
  const none = list.length === 0;
  return (
    <div className="parampick" data-testid="param-picker">
      {none ? (
        <p className="hint" data-testid="param-hint">
          <Icon name="info" size={15} />
          <span>
            {params.length === 0
              ? L('Es ist noch kein Strategieparameter angelegt. Legen Sie hier den ersten an.', 'No strategy parameter has been created yet. Create the first one here.')
              : L('Kein angelegter Strategieparameter passt zu diesem Feld. Legen Sie einen passenden an.', 'No existing strategy parameter fits this field. Create a fitting one.')}
          </span>
        </p>
      ) : (
        <Select value={value} onChange={(v) => { if (v === '__new') setAdding(true); else onChange(v); }} testid="param-select" ariaLabel={L('Strategieparameter wählen', 'Choose strategy parameter')}>
          <option value="">{L('Strategieparameter wählen …', 'Choose strategy parameter …')}</option>
          {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="__new">{L('+ Neuen Strategieparameter anlegen …', '+ Create new strategy parameter …')}</option>
        </Select>
      )}
      {(none || adding) && <NewParamInline dtype={dtype} onCreated={(id) => { setAdding(false); onChange(id); }} />}
    </div>
  );
}

export function RefPicker({
  value, onChange, sc,
}: { value: { obj: string; prop: string }; onChange: (v: { obj: string; prop: string }) => void; sc: Scope }) {
  const L = useL();
  const objs = sc.els.filter((e) => isObjectEl(e.type) && e.id !== sc.self);
  if (objs.length === 0) {
    return (
      <p className="hint" data-testid="ref-hint">
        <Icon name="info" size={15} />
        <span>{L('Auf der Zeichenfläche liegt noch kein Objekt. Fügen Sie aus der Elementbibliothek einen Indikator oder ein anderes Objekt ein.', 'There is no object on the canvas yet. Add an indicator or another object from the element library.')}</span>
      </p>
    );
  }
  const props = value.obj ? propList(value.obj, sc) : [];
  return (
    <div className="refpick">
      <Select value={value.obj} onChange={(obj) => onChange({ obj, prop: '' })} testid="ref-object" ariaLabel={L('Objekt wählen', 'Choose object')}>
        <option value="">{L('Objekt wählen …', 'Choose object …')}</option>
        {objs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </Select>
      <Select value={value.prop} onChange={(prop) => onChange({ ...value, prop })} testid="ref-prop" ariaLabel={L('Eigenschaft wählen', 'Choose property')} disabled={!value.obj}>
        <option value="">{L('Eigenschaft wählen …', 'Choose property …')}</option>
        {props.map((p) => <option key={p.id} value={p.id}>{tx(p, sc.lang)}</option>)}
      </Select>
    </div>
  );
}

export function FieldRow({
  f, b, onChange, sc, inputs, note, id, level, onBlocksChange, mode, unsetNote,
}: {
  mode?: 'condition' | 'value';
  unsetNote?: string;
  f: Field;
  b: Binding | undefined;
  onChange: (b: Binding) => void;
  sc: Scope;
  inputs?: { obj: string; prop: string }[];
  note?: string;
  id?: string;
  level?: 'error' | 'hint' | null;
  onBlocksChange?: (e: import('./model').Expr) => void;
}) {
  const L = useL();
  const lang = sc.lang;
  const labels = KIND_LABEL(L, f);
  const cur: Binding = b ?? { k: 'unset' };
  const options = Array.from(new Set<string>(['unset', ...f.bindings, cur.k]));
  const tip = fieldTip(f.id, lang, 'f') ?? fieldTip(f.id, lang, 'p');
  const exprOnly = f.bindings.length === 1 && f.bindings[0] === 'expr';
  const setKind = (k: string) => {
    switch (k) {
      case 'unset': onChange({ k: 'unset' }); break;
      case 'fixed': onChange({ k: 'fixed', v: defaultFixed(f) }); break;
      case 'param': onChange({ k: 'param', id: '' }); break;
      case 'ref': onChange({ k: 'ref', obj: '', prop: '' }); break;
      case 'expr': onChange({ k: 'expr', e: EMPTY }); break;
      case 'app': onChange({ k: 'app' }); break;
      default: break;
    }
  };
  return (
    <div className={`field${level === 'error' ? ' has-error' : level === 'hint' ? ' has-hint' : ''}`} id={id} data-testid={`field-${f.id}`} data-field={f.id}>
      <div className="field-label" data-tip={tip}>
        <span>{tx(f, lang)}</span>
        {f.required && <span className="req" aria-label={L('Pflicht', 'required')}>*</span>}
        <Info tip={tip} />
        {f.dtype !== 'expression' && f.dtype !== 'instrument' && <span className="dtype-chip">{tx(DTYPE_LABEL[f.dtype], lang)}</span>}
      </div>
      {note && <div className="field-note"><Icon name="shield" size={14} /><span>{note}</span></div>}
      {!exprOnly && (
        <label className="kind-row">
          <span className="kind-cap">{L('Belegung', 'Assignment')}</span>
          <Select value={cur.k} onChange={setKind} testid={`kind-${f.id}`} ariaLabel={`${tx(f, lang)}: ${L('Belegung', 'Assignment')}`}>
            {options.map((k) => <option key={k} value={k}>{labels[k]}</option>)}
          </Select>
        </label>
      )}
      <div className="field-value">
        {cur.k === 'fixed' && (
          <ValueByType dtype={f.dtype} value={cur.v} choices={f.choices} onChange={(v) => onChange({ k: 'fixed', v })} testid={`value-${f.id}`} ariaLabel={tx(f, lang)} />
        )}
        {cur.k === 'param' && (
          <ParamPicker dtype={f.dtype} value={cur.id} params={sc.params} onChange={(pid) => onChange({ k: 'param', id: pid })} />
        )}
        {cur.k === 'ref' && <RefPicker value={cur} onChange={(r) => onChange({ k: 'ref', ...r })} sc={sc} />}
        {cur.k === 'expr' && (
          <ExprPanel
            value={cur.e}
            onChange={(e) => onChange({ k: 'expr', e })}
            sc={sc}
            inputs={inputs}
            mode={mode ?? (f.dtype === 'boolean' ? 'condition' : 'value')}
            onBlocksChange={onBlocksChange}
          />
        )}
        {cur.k === 'app' && f.dtype === 'instrument' && (
          <p className="fixed-note">{L('Das Instrument, auf dem die Strategie angewendet wird.', 'The instrument the strategy is applied to.')}</p>
        )}
        {cur.k === 'app' && f.dtype !== 'instrument' && (
          <p className="fixed-note">{L('Der Wert wird erst übergeben, wenn die Strategie angewendet wird.', 'The value is only passed when the strategy is applied.')}</p>
        )}
        {cur.k === 'unset' && <p className="fixed-note muted">{unsetNote ?? (f.required ? L('Pflichtangabe: Wählen Sie eine Belegung.', 'Required: choose an assignment.') : L('Optional. Ohne Wert bleibt die Angabe leer beziehungsweise unverändert.', 'Optional. Without a value the entry stays empty or unchanged.'))}</p>}
      </div>
    </div>
  );
}

export { Toggle, isUnset, update };
