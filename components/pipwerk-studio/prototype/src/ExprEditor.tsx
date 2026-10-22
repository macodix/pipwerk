// Conditions and calculations from blocks (req-ui-015) and the formula editor for advanced users.
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TYPES, isObjectEl, methodText, tx, typeLabel } from './catalog';
import {
  ARITH_LABEL, CMP_LABEL, COMPARE_OPS, EMPTY, FUNCTIONS, bracketMatch, callAt, completionsAt, describe, highlight, memberList, methodIn, objOf, parse, prettyPrint, propList,
  refsOf, spName, typeOf,
} from './expr';
import type { Completion, Scope, VType } from './expr';
import type { Expr } from './model';
import { Btn, Icon, Select, TextInput, NumberInput, useL } from './ui';

// ---- value chooser ---------------------------------------------------------------

interface Opt {
  v: string;
  label: string;
}
interface OptGroup {
  label: string;
  items: Opt[];
}

function valueGroups(sc: Scope, L: (de: string, en: string) => string, inputs: { obj: string; prop: string; args?: number[] }[]): OptGroup[] {
  const lang = sc.lang;
  const groups: OptGroup[] = [];
  const refOpt = (obj: string, prop: string, label: string): Opt => ({ v: `ref:${obj}|${prop}`, label });
  const nameOf = (obj: string) => objOf(obj, sc);
  // methods are chosen with their arguments in the block itself
  const props = inputs.filter((i) => !methodIn(i.obj, i.prop, sc));
  if (props.length) {
    groups.push({
      label: L('Verbundene Werte', 'Connected values'),
      items: props.map((i) => {
        const o = nameOf(i.obj);
        const p = o ? propList(i.obj, sc).find((x) => x.id === i.prop) : undefined;
        return refOpt(i.obj, i.prop, `${o?.el?.name ?? '?'} › ${p ? tx(p, lang) : i.prop}`);
      }),
    });
  }
  const objects = sc.els.filter((e) => isObjectEl(e.type) && e.id !== sc.self && e.name.trim());
  const connected = new Set(props.map((i) => `${i.obj}|${i.prop}`));
  const objItems = objects.flatMap((e) => memberList(e.id, sc).filter((p) => !connected.has(`${e.id}|${p.id}`)).map((p) => (
    p.method
      ? { v: `refm:${e.id}|${p.id}`, label: `${e.name} › ${methodText(p.method, undefined, lang)} (${L('Methode', 'method')})` }
      : refOpt(e.id, p.id, `${e.name} › ${tx(p, lang)}`)
  )));
  if (objItems.length) {
    groups.push({ label: L('Indikatoren, Trends und Objekte', 'Indicators, trends and objects'), items: objItems });
  }
  const results = sc.els.filter((e) => TYPES[e.type]?.named && e.id !== sc.self && e.name.trim());
  if (results.length) {
    groups.push({
      label: L('Ergebnisse vorheriger Schritte', 'Results of previous steps'),
      items: results.map((e) => refOpt(e.id, 'ergebnis', `${e.name} › ${L('Ergebnis', 'Result')}`)),
    });
  }
  const placed = new Set(sc.els.map((e) => e.type));
  const market = ['Kerze', 'Instrument', 'Konto', 'Tick'].filter((t) => !placed.has(t));
  if (market.length) {
    groups.push({
      label: L('Objekte der Anwendung', 'Objects of the application'),
      items: market.flatMap((t) => (TYPES[t]?.props ?? []).map((p) => refOpt(t, p.id, `${typeLabel(t, lang)} › ${tx(p, lang)}`))),
    });
  }
  if (sc.orderPosition) {
    groups.push({
      label: L('Order und Position', 'Order and position'),
      items: ['Order', 'Position'].flatMap((t) => (TYPES[t]?.props ?? []).map((p) => refOpt(t, p.id, `${typeLabel(t, lang)} › ${tx(p, lang)}`))),
    });
  }
  const sItems: Opt[] = sc.params.map((p) => ({ v: `sp:${p.id}`, label: p.name }));
  for (const p of TYPES.Strategie.props.filter((x) => x.id.startsWith('wartende') || x.id.startsWith('offene'))) {
    sItems.push(refOpt('Strategie', p.id, `${typeLabel('Strategie', lang)} › ${tx(p, lang)}`));
  }
  groups.push({ label: L('Strategieparameter und Strategie', 'Strategy parameters and strategy'), items: sItems });
  if (sc.rulePars.length) {
    groups.push({ label: L('Parameter der Regel', 'Parameters of the rule'), items: sc.rulePars.map((p) => ({ v: `par:${p.id}`, label: p.name })) });
  }
  groups.push({
    label: L('Feste Werte und Rechnen', 'Fixed values and calculating'),
    items: [
      { v: 'k:num', label: L('Zahl …', 'Number …') },
      { v: 'k:str', label: L('Text oder Auswahlwert …', 'Text or choice value …') },
      { v: 'k:prev', label: L('Vorheriger Wert von …', 'Previous value of …') },
      { v: 'k:calc', label: L('Rechnung (plus, minus, mal, geteilt)', 'Calculation (plus, minus, times, divided)') },
      { v: 'k:if', label: L('Wenn … dann … sonst …', 'If … then … otherwise …') },
      { v: 'k:func', label: L('Funktion (kleinster, größter, abgerundet …)', 'Function (smallest, largest, rounded down …)') },
      { v: 'k:cond', label: L('Bedingung (wahr oder falsch) …', 'Condition (true or false) …') },
    ],
  });
  return groups;
}

function valueKey(e: Expr, sc: Scope): string {
  switch (e.t) {
    case 'ref': return `${methodIn(e.obj, e.prop, sc) ? 'refm' : 'ref'}:${e.obj}|${e.prop}`;
    case 'sp': return `sp:${e.id}`;
    case 'par': return `par:${e.id}`;
    case 'num': return 'k:num';
    case 'str': return 'k:str';
    case 'neg': return 'k:calc';
    case 'bin': return COMPARE_OPS.includes(e.op) ? 'k:cond' : 'k:calc';
    case 'cross': return 'k:cond';
    case 'bool': return 'k:cond';
    case 'call':
      if (e.fn === 'PREVIOUS') return 'k:prev';
      if (e.fn === 'IF') return 'k:if';
      if (['AND', 'OR', 'NOT', 'ISNA', 'ISBLANK'].includes(e.fn)) return 'k:cond';
      return 'k:func';
    default: return '';
  }
}

const isEmptyish = (e: Expr) => e.t === 'empty';

function fromKey(key: string, cur: Expr, sc: Scope): Expr {
  if (key.startsWith('ref:')) {
    const [obj, prop] = key.slice(4).split('|');
    return { t: 'ref', obj, prop };
  }
  if (key.startsWith('refm:')) {
    const [obj, prop] = key.slice(5).split('|');
    return { t: 'ref', obj, prop, args: [...(methodIn(obj, prop, sc)?.defaults ?? [1])] };
  }
  if (key.startsWith('sp:')) return { t: 'sp', id: key.slice(3) };
  if (key.startsWith('par:')) return { t: 'par', id: key.slice(4) };
  const keep = isEmptyish(cur) || cur.t === 'bad' ? EMPTY : cur;
  switch (key) {
    case 'k:num': return { t: 'num', v: 0 };
    case 'k:str': return { t: 'str', v: '' };
    case 'k:prev': return { t: 'call', fn: 'PREVIOUS', args: [keep] };
    case 'k:calc': return { t: 'bin', op: '+', l: keep, r: EMPTY };
    case 'k:if': return { t: 'call', fn: 'IF', args: [EMPTY, keep, EMPTY] };
    case 'k:func': return { t: 'call', fn: 'MIN', args: [keep, EMPTY] };
    case 'k:cond': return blankCompare();
    default: return EMPTY;
  }
}

const VALUE_FUNCS = ['MIN', 'MAX', 'ABS', 'FLOOR', 'CEILING', 'IFNA'];
const FN_LABEL: Record<string, { de: string; en: string }> = {
  MIN: { de: 'kleinster Wert', en: 'smallest value' },
  MAX: { de: 'größter Wert', en: 'largest value' },
  ABS: { de: 'Betrag', en: 'absolute value' },
  FLOOR: { de: 'abgerundet auf Schrittweite', en: 'rounded down to step' },
  CEILING: { de: 'aufgerundet auf Schrittweite', en: 'rounded up to step' },
  IFNA: { de: 'Wert, ersatzweise', en: 'value, otherwise' },
};

export interface EdProps {
  sc: Scope;
  inputs?: { obj: string; prop: string; args?: number[] }[];
}

export function ValueEditor({
  value, onChange, sc, inputs = [], hint, testid,
}: EdProps & { value: Expr; onChange: (e: Expr) => void; hint?: VType; testid?: string }) {
  const L = useL();
  const groups = useMemo(() => valueGroups(sc, L, inputs), [sc, inputs, L]);
  const key = valueKey(value, sc);
  const known = groups.some((g) => g.items.some((i) => i.v === key));
  const method = value.t === 'ref' ? methodIn(value.obj, value.prop, sc) : undefined;
  const sub = (e: Expr, fn: (x: Expr) => void, h?: VType) => (
    <ValueEditor value={e} onChange={fn} sc={sc} inputs={inputs} hint={h} />
  );
  return (
    <span className="vb" data-testid={testid}>
      <Select
        value={key}
        onChange={(k) => onChange(fromKey(k, value, sc))}
        ariaLabel={L('Wert wählen', 'Choose value')}
        className={isEmptyish(value) || value.t === 'bad' ? 'select-empty' : ''}
        testid={testid ? `${testid}-select` : 'value-select'}
      >
        {key === '' && <option value="">{L('Wert wählen …', 'Choose value …')}</option>}
        {key !== '' && !known && <option value={key}>{L('(nicht mehr vorhanden)', '(no longer available)')}</option>}
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.items.map((i) => <option key={i.v} value={i.v}>{i.label}</option>)}
          </optgroup>
        ))}
      </Select>
      {value.t === 'ref' && method && (
        <span className="vb-arg" data-testid="method-args">
          {method.args.map((a, i) => (
            <NumberInput key={a.id} value={value.args?.[i] ?? method.defaults[i] ?? 1} ariaLabel={tx(a, sc.lang)} testid={testid ? `${testid}-arg` : 'method-arg'}
              onChange={(v) => onChange({ ...value, args: method.args.map((_, j) => (j === i ? Math.max(1, Math.round(v === '' ? 1 : v)) : value.args?.[j] ?? method.defaults[j] ?? 1)) })} />
          ))}
          <span className="vb-unit">{tx(method.args[0], sc.lang)}</span>
        </span>
      )}
      {value.t === 'num' && (
        <NumberInput value={value.v} onChange={(v) => onChange({ t: 'num', v: v === '' ? 0 : v })} ariaLabel={L('Zahl', 'Number')} testid={testid ? `${testid}-num` : 'value-num'} />
      )}
      {value.t === 'str' && (hint?.kind === 'choice' && hint.choices ? (
        <Select value={value.v} onChange={(v) => onChange({ t: 'str', v })} ariaLabel={L('Auswahlwert', 'Choice value')} testid={testid ? `${testid}-choice` : 'value-choice'}>
          <option value="">{L('Wert wählen …', 'Choose value …')}</option>
          {hint.choices.map((c) => <option key={c.id} value={c.id}>{tx(c, sc.lang)}</option>)}
        </Select>
      ) : (
        <TextInput value={value.v} onChange={(v) => onChange({ t: 'str', v })} ariaLabel={L('Text', 'Text')} testid={testid ? `${testid}-text` : 'value-text'} />
      ))}
      {value.t === 'call' && value.fn === 'PREVIOUS' && (
        <span className="vb-inner">{sub(value.args[0] ?? EMPTY, (x) => onChange({ ...value, args: [x] }), hint)}</span>
      )}
      {value.t === 'bin' && !COMPARE_OPS.includes(value.op) && (
        <span className="vb-inner calc">
          {sub(value.l, (x) => onChange({ ...value, l: x }))}
          <Select value={value.op} onChange={(op) => onChange({ ...value, op })} ariaLabel={L('Rechenart', 'Operation')} testid="calc-op">
            {['+', '-', '*', '/'].map((o) => <option key={o} value={o}>{tx(ARITH_LABEL[o], sc.lang)}</option>)}
          </Select>
          {sub(value.r, (x) => onChange({ ...value, r: x }))}
        </span>
      )}
      {value.t === 'call' && value.fn === 'IF' && (
        <span className="vb-inner stack">
          <span className="vb-line"><b>{L('wenn', 'if')}</b><CondEditor value={value.args[0] ?? EMPTY} onChange={(x) => onChange({ ...value, args: [x, value.args[1] ?? EMPTY, value.args[2] ?? EMPTY] })} sc={sc} inputs={inputs} /></span>
          <span className="vb-line"><b>{L('dann', 'then')}</b>{sub(value.args[1] ?? EMPTY, (x) => onChange({ ...value, args: [value.args[0] ?? EMPTY, x, value.args[2] ?? EMPTY] }), typeOf(value.args[2] ?? EMPTY, sc))}</span>
          <span className="vb-line"><b>{L('sonst', 'otherwise')}</b>{sub(value.args[2] ?? EMPTY, (x) => onChange({ ...value, args: [value.args[0] ?? EMPTY, value.args[1] ?? EMPTY, x] }), typeOf(value.args[1] ?? EMPTY, sc))}</span>
        </span>
      )}
      {value.t === 'call' && value.fn !== 'IF' && value.fn !== 'PREVIOUS' && (
        <span className="vb-inner">
          <Select value={VALUE_FUNCS.includes(value.fn) ? value.fn : 'MIN'} onChange={(f) => onChange({ ...value, fn: f })} ariaLabel={L('Funktion', 'Function')} testid="func-select">
            {VALUE_FUNCS.map((f) => <option key={f} value={f}>{tx(FN_LABEL[f], sc.lang)}</option>)}
          </Select>
          {value.args.map((a, i) => (
            <Fragment key={i}>{sub(a, (x) => onChange({ ...value, args: value.args.map((y, j) => (j === i ? x : y)) }))}</Fragment>
          ))}
          {['MIN', 'MAX'].includes(value.fn) && (
            <Btn kind="quiet" small icon="plus" title={L('Weiteren Wert hinzufügen', 'Add another value')} onClick={() => onChange({ ...value, args: [...value.args, EMPTY] })} />
          )}
        </span>
      )}
      {value.t === 'neg' && <span className="vb-inner">−{sub(value.e, (x) => onChange({ t: 'neg', e: x }))}</span>}
      {key === 'k:cond' && (
        <span className="vb-inner stack"><CondEditor value={value} onChange={onChange} sc={sc} inputs={inputs} depth={1} /></span>
      )}
    </span>
  );
}

// ---- condition ----------------------------------------------------------------------

type CondKind = 'compare' | 'cross' | 'and' | 'or' | 'not' | 'value';

function condKind(e: Expr): CondKind {
  if (e.t === 'bin' && COMPARE_OPS.includes(e.op)) return 'compare';
  if (e.t === 'cross') return 'cross';
  if (e.t === 'call' && e.fn === 'AND') return 'and';
  if (e.t === 'call' && e.fn === 'OR') return 'or';
  if (e.t === 'call' && e.fn === 'NOT') return 'not';
  if (e.t === 'empty') return 'compare';
  return 'value';
}

const blankCompare = (): Expr => ({ t: 'bin', op: '>', l: EMPTY, r: EMPTY });

function convertCond(kind: CondKind, cur: Expr): Expr {
  const have = cur.t !== 'empty' && cur.t !== 'bad';
  switch (kind) {
    case 'compare': return condKind(cur) === 'compare' && have ? cur : blankCompare();
    case 'cross': return { t: 'cross', a: EMPTY, b: EMPTY, dir: 'up' };
    case 'and': return cur.t === 'call' && cur.fn === 'OR' ? { ...cur, fn: 'AND' } : { t: 'call', fn: 'AND', args: [have ? cur : blankCompare(), blankCompare()] };
    case 'or': return cur.t === 'call' && cur.fn === 'AND' ? { ...cur, fn: 'OR' } : { t: 'call', fn: 'OR', args: [have ? cur : blankCompare(), blankCompare()] };
    case 'not': return { t: 'call', fn: 'NOT', args: [have ? cur : blankCompare()] };
    default: return EMPTY;
  }
}

export function CondEditor({
  value, onChange, sc, inputs = [], depth = 0,
}: EdProps & { value: Expr; onChange: (e: Expr) => void; depth?: number }) {
  const L = useL();
  // "Value is true" starts empty; it stays chosen until a value is picked
  const [forced, setForced] = useState<CondKind | null>(null);
  const kind: CondKind = value.t === 'empty' && forced ? forced : condKind(value);
  const v: Expr = value.t === 'empty' && kind === 'compare' ? blankCompare() : value;
  const kinds: [CondKind, string][] = [
    ['compare', L('Vergleich', 'Comparison')],
    ['cross', L('Kreuzung', 'Crossing')],
    ['and', L('Alle gelten (und)', 'All apply (and)')],
    ['or', L('Eine gilt (oder)', 'One applies (or)')],
    ['not', L('Nicht', 'Not')],
    ['value', L('Wert ist wahr', 'Value is true')],
  ];
  return (
    <div className={`cb cb-${kind}${depth > 0 ? ' cb-nested' : ''}`} data-testid="cond-block">
      <div className="cb-kind">
        <Select value={kind} onChange={(k) => { const next = convertCond(k as CondKind, value); setForced(next.t === 'empty' ? (k as CondKind) : null); onChange(next); }} ariaLabel={L('Art der Bedingung', 'Kind of condition')} testid="cond-kind">
          {kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </div>
      {kind === 'compare' && v.t === 'bin' && (
        <div className="cb-row">
          <ValueEditor value={v.l} onChange={(l) => onChange({ ...v, l })} sc={sc} inputs={inputs} hint={typeOf(v.r, sc)} testid="cmp-left" />
          <Select value={v.op} onChange={(op) => onChange({ ...v, op })} ariaLabel={L('Vergleich', 'Comparison')} testid="cmp-op">
            {COMPARE_OPS.map((o) => <option key={o} value={o}>{tx(CMP_LABEL[o], sc.lang)}</option>)}
          </Select>
          <ValueEditor value={v.r} onChange={(r) => onChange({ ...v, r })} sc={sc} inputs={inputs} hint={typeOf(v.l, sc)} testid="cmp-right" />
        </div>
      )}
      {kind === 'cross' && v.t === 'cross' && (
        <div className="cb-row">
          <ValueEditor value={v.a} onChange={(a) => onChange({ ...v, a })} sc={sc} inputs={inputs} testid="cross-a" />
          <span className="cb-word">{L('kreuzt', 'crosses')}</span>
          <ValueEditor value={v.b} onChange={(b) => onChange({ ...v, b })} sc={sc} inputs={inputs} testid="cross-b" />
          <Select value={v.dir} onChange={(dir) => onChange({ ...v, dir: dir as 'up' | 'down' | 'any' })} ariaLabel={L('Richtung des Kreuzens', 'Direction of crossing')} testid="cross-dir">
            <option value="up">{L('nach oben', 'upwards')}</option>
            <option value="down">{L('nach unten', 'downwards')}</option>
            <option value="any">{L('in beide Richtungen', 'in either direction')}</option>
          </Select>
        </div>
      )}
      {(kind === 'and' || kind === 'or') && v.t === 'call' && (
        <div className="cb-list">
          {v.args.map((a, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="cb-join">{kind === 'and' ? L('und', 'and') : L('oder', 'or')}</div>}
              <div className="cb-item">
                <CondEditor value={a} onChange={(x) => onChange({ ...v, args: v.args.map((y, j) => (j === i ? x : y)) })} sc={sc} inputs={inputs} depth={depth + 1} />
                {v.args.length > 2 && (
                  <Btn kind="quiet" small icon="x" title={L('Bedingung entfernen', 'Remove condition')} onClick={() => onChange({ ...v, args: v.args.filter((_, j) => j !== i) })} />
                )}
              </div>
            </Fragment>
          ))}
          <Btn kind="quiet" small icon="plus" testid="cond-add" onClick={() => onChange({ ...v, args: [...v.args, blankCompare()] })}>
            {L('Bedingung hinzufügen', 'Add condition')}
          </Btn>
        </div>
      )}
      {kind === 'not' && v.t === 'call' && (
        <div className="cb-list">
          <CondEditor value={v.args[0] ?? EMPTY} onChange={(x) => onChange({ ...v, args: [x] })} sc={sc} inputs={inputs} depth={depth + 1} />
        </div>
      )}
      {kind === 'value' && (
        <div className="cb-row">
          <ValueEditor value={v} onChange={onChange} sc={sc} inputs={inputs} testid="cond-value" />
          <span className="cb-word">{L('ist wahr', 'is true')}</span>
        </div>
      )}
    </div>
  );
}

// ---- panel with both views ------------------------------------------------------------------

export function ExprPanel({
  value, onChange, sc, inputs = [], mode, onBlocksChange, label, id,
}: EdProps & {
  value: Expr;
  onChange: (e: Expr) => void;
  mode: 'condition' | 'value';
  onBlocksChange?: (e: Expr) => void;
  label?: string;
  id?: string;
}) {
  const L = useL();
  const [view, setView] = useState<'blocks' | 'formula'>('blocks');
  const sentence = value.t === 'empty' ? '' : value.t === 'bad' ? '' : describe(value, sc);
  const change = (e: Expr) => {
    onChange(e);
    onBlocksChange?.(e);
  };
  return (
    <div className="ep" data-testid="expr-panel" id={id}>
      <div className="ep-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'blocks'} className={view === 'blocks' ? 'on' : ''} onClick={() => setView('blocks')} data-testid="view-blocks">
          {L('Bausteine', 'Blocks')}
        </button>
        <button type="button" role="tab" aria-selected={view === 'formula'} className={view === 'formula' ? 'on' : ''} onClick={() => setView('formula')} data-testid="view-formula">
          {L('Ausdruck für Fortgeschrittene', 'Expression for advanced users')}
        </button>
      </div>
      {label && <div className="ep-label">{label}</div>}
      <div className={`ep-sentence${sentence ? '' : ' empty'}`} data-testid="expr-sentence">
        <Icon name="book" size={15} />
        <span>{sentence || (value.t === 'bad'
          ? L('Der Ausdruck hat noch Fehler und lässt sich noch nicht als Satz lesen.', 'The expression still has errors and cannot be read as a sentence yet.')
          : L('Noch nichts zusammengestellt. Wählen Sie unten die Bausteine.', 'Nothing put together yet. Choose the blocks below.'))}</span>
      </div>
      {view === 'blocks' ? (
        value.t === 'bad' ? (
          <div className="ep-bad" data-testid="expr-bad">
            <Icon name="warn" size={16} />
            <div>
              <p>{L('Dieser Ausdruck ist fehlerhaft und lässt sich nicht aus Bausteinen anzeigen.', 'This expression has errors and cannot be shown as blocks.')}</p>
              <Btn small onClick={() => setView('formula')}>{L('Zur Ansicht für Fortgeschrittene', 'To the advanced view')}</Btn>
              <Btn small kind="ghost" onClick={() => change(EMPTY)}>{L('Neu zusammenstellen', 'Start over')}</Btn>
            </div>
          </div>
        ) : mode === 'condition' ? (
          <CondEditor value={value} onChange={change} sc={sc} inputs={inputs} />
        ) : (
          <ValueEditor value={value} onChange={change} sc={sc} inputs={inputs} testid="calc-root" />
        )
      ) : (
        <FormulaEditor value={value} onChange={onChange} sc={sc} />
      )}
    </div>
  );
}

// ---- formula editor ---------------------------------------------------------------------------

export function FormulaEditor({ value, onChange, sc }: { value: Expr; onChange: (e: Expr) => void; sc: Scope }) {
  const L = useL();
  const ta = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(() => (value.t === 'bad' ? value.text : prettyPrint(value, sc)));
  const [caret, setCaret] = useState(0);
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(true);
  const emitted = useRef<string>(JSON.stringify(value));

  // sync when the other view changed the expression
  useEffect(() => {
    const j = JSON.stringify(value);
    if (j !== emitted.current) {
      emitted.current = j;
      setText(value.t === 'bad' ? value.text : prettyPrint(value, sc));
    }
  }, [value, sc]);
  // names may change with the language
  useEffect(() => {
    if (value.t !== 'bad') setText(prettyPrint(value, sc));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc.lang]);

  const parsed = useMemo(() => parse(text, sc), [text, sc]);
  const spans = useMemo(() => highlight(text, sc), [text, sc]);
  const br = useMemo(() => bracketMatch(text, caret), [text, caret]);
  const comp = useMemo(() => (open ? completionsAt(text, caret, sc) : null), [text, caret, sc, open]);
  const call = useMemo(() => callAt(text, caret), [text, caret]);

  useLayoutEffect(() => {
    const el = ta.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [text]);

  const emit = (t: string) => {
    setText(t);
    const r = parse(t, sc);
    const next: Expr = r.errors.length ? { t: 'bad', text: t } : r.e;
    emitted.current = JSON.stringify(next);
    onChange(next);
  };

  const insert = (c: Completion) => {
    if (!comp) return;
    const el = ta.current;
    const to = el ? el.selectionStart : caret;
    const t = text.slice(0, comp.from) + c.insert + text.slice(to);
    emit(t);
    const pos = comp.from + c.insert.length;
    window.setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
      setCaret(pos);
    }, 0);
  };

  // overlay pieces
  const pieces: { a: number; b: number; cls: string; msg?: string }[] = [];
  const marks: { a: number; b: number; cls: string; msg?: string }[] = [
    ...spans.map((s) => ({ ...s })),
    ...parsed.errors.map((e) => ({ a: e.a, b: Math.max(e.b, e.a + 1), cls: 'tk-error', msg: e.msg })),
  ];
  if (br) br.forEach((p) => marks.push({ a: p, b: p + 1, cls: 'tk-bracket' }));
  const cuts = new Set<number>([0, text.length]);
  marks.forEach((m) => { cuts.add(m.a); cuts.add(Math.min(m.b, text.length)); });
  const sorted = [...cuts].sort((x, y) => x - y);
  for (let i = 0; i + 1 < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const cls = marks.filter((m) => m.a <= a && m.b >= b).map((m) => m.cls).join(' ');
    const msg = marks.find((m) => m.msg && m.a <= a && m.b >= b)?.msg;
    pieces.push({ a, b, cls, msg });
  }
  const trailingError = parsed.errors.find((e) => e.a >= text.length);

  return (
    <div className="fe" data-testid="formula-editor">
      <div className="fe-wrap">
        <textarea
          ref={ta}
          className="fe-ta"
          value={text}
          spellCheck={false}
          rows={2}
          aria-label={L('Ausdruck', 'Expression')}
          data-testid="formula-input"
          onChange={(e) => { emit(e.target.value); setCaret(e.target.selectionStart); setSel(0); setOpen(true); }}
          onKeyUp={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart)}
          onClick={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart)}
          onKeyDown={(e) => {
            if (comp && comp.items.length && open) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((sel + 1) % comp.items.length); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((sel + comp.items.length - 1) % comp.items.length); }
              else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insert(comp.items[Math.min(sel, comp.items.length - 1)]); }
              else if (e.key === 'Escape') { setOpen(false); }
            }
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onFocus={() => setOpen(true)}
        />
        <div className="fe-hl" aria-hidden="true">
          {pieces.map((p, i) => (
            <span key={i} className={p.cls || undefined} data-tip={p.msg} onMouseDown={() => { ta.current?.focus(); ta.current?.setSelectionRange(p.a, p.a); }}>
              {text.slice(p.a, p.b)}
            </span>
          ))}
          {trailingError && <span className="tk-error tk-end" data-tip={trailingError.msg}>{' '}</span>}
          {text.endsWith('\n') && <span>{'​'}</span>}
        </div>
      </div>
      {comp && comp.items.length > 0 && open && (
        <ul className="fe-pop" role="listbox" data-testid="formula-suggestions">
          {comp.items.map((c, i) => (
            <li key={c.label + i} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); insert(c); }} onMouseEnter={() => setSel(i)}>
              <span className="fe-pop-label">{c.label}</span>
              <span className="fe-pop-detail">{c.detail}</span>
              {c.tip && <span className="fe-pop-tip">{c.tip}</span>}
            </li>
          ))}
        </ul>
      )}
      {call && (
        <div className="fe-hint" data-testid="formula-hint">
          <code>
            {call.fn.name}(
            {call.fn.args.map((a, i) => (
              <Fragment key={i}>
                {i > 0 && '; '}
                <b className={i === Math.min(call.arg, call.fn.args.length - 1) ? 'cur' : ''}>{tx(a, sc.lang)}</b>
              </Fragment>
            ))}
            {call.fn.rest ? '; …' : ''})
          </code>
          <span>{tx(call.fn, sc.lang)}</span>
        </div>
      )}
      {parsed.errors.length > 0 ? (
        <div className="fe-error" data-testid="formula-error">
          <Icon name="warn" size={15} />
          <span>{parsed.errors[0].msg}</span>
        </div>
      ) : (
        <div className="fe-ok">
          <Icon name="check" size={15} />
          <span>{text.trim() ? L('Der Ausdruck ist in Ordnung.', 'The expression is fine.') : L('Noch nichts eingegeben. Beispiel: ', 'Nothing entered yet. Example: ')}{!text.trim() && <code>EMA20.Wert &gt; EMA50.Wert</code>}</span>
        </div>
      )}
      <details className="fe-funcs">
        <summary>{L('Funktionen', 'Functions')}</summary>
        <ul>
          {FUNCTIONS.map((f) => (
            <li key={f.name}><code>{f.name}</code> {tx(f, sc.lang)}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function usedObjects(e: Expr): string[] {
  return refsOf(e).map((r) => r.obj);
}
export { spName };
