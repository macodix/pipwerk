// Data model of the prototype. Nothing here is calculated: the model only holds
// what the user designs. Internal ids are never shown; the user sees one name.

export type Lang = 'de' | 'en';
export type Txt = { de: string; en: string };

export type DType =
  | 'number'
  | 'integer'
  | 'percent'
  | 'boolean'
  | 'text'
  | 'choice'
  | 'time_unit'
  | 'timestamp'
  | 'date'
  | 'expression'
  | 'instrument'
  | 'object';

export interface Choice {
  id: string;
  de: string;
  en: string;
}

export type BindingKind = 'fixed' | 'param' | 'ref' | 'expr' | 'app';

export interface ParamDef {
  id: string;
  de: string;
  en: string;
  dtype: DType;
  required?: boolean;
  def?: string | number | boolean;
  choices?: Choice[];
  bindings: BindingKind[];
  appliesWhen?: { id: string; value: string };
}

export interface PropDef {
  id: string;
  de: string;
  en: string;
  dtype: DType;
  choices?: Choice[];
  /** The user sets this value (order properties, own properties, direction of a trend). */
  userSet?: boolean;
  must?: boolean;
  appliesWhen?: { id: string; value: string };
}

export interface OutDef {
  id: string;
  de: string;
  en: string;
  management?: boolean;
}

export type TypeKind =
  | 'trigger'
  | 'flow'
  | 'indicator'
  | 'trend'
  | 'app'
  | 'rule'
  | 'ruleset';

export type GroupId = 'when' | 'actions' | 'market' | 'indicators' | 'trends' | 'rules';

export interface TypeDef {
  id: string;
  kind: TypeKind;
  group: GroupId;
  icon: string;
  de: string;
  en: string;
  params: ParamDef[];
  props: PropDef[];
  outputs: OutDef[];
  /** Condition and calculation: carry a name under which expressions address the result. */
  named?: boolean;
  rulesAllowed?: boolean;
  /** Offered in the library as own object (the user defines parameters and properties). */
  own?: boolean;
  /** Objects of the application that are only addressed by expressions, not placed. */
  placeable?: boolean;
}

// ---- expressions -----------------------------------------------------------

export type Expr =
  | { t: 'empty' }
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; obj: string; prop: string }
  | { t: 'sp'; id: string }
  | { t: 'par'; id: string }
  | { t: 'bin'; op: string; l: Expr; r: Expr }
  | { t: 'neg'; e: Expr }
  | { t: 'call'; fn: string; args: Expr[] }
  | { t: 'cross'; a: Expr; b: Expr; dir: 'up' | 'down' | 'any' }
  | { t: 'bad'; text: string };

// ---- bindings --------------------------------------------------------------

export type Binding =
  | { k: 'unset' }
  | { k: 'fixed'; v: string | number | boolean }
  | { k: 'param'; id: string }
  | { k: 'ref'; obj: string; prop: string }
  | { k: 'expr'; e: Expr }
  | { k: 'app' };

export interface OwnProp {
  id: string;
  name: string;
  dtype: DType;
  e: Expr;
}
export interface OwnParam {
  id: string;
  name: string;
  dtype: DType;
  def: string | number | boolean;
}
export interface OwnDef {
  params: OwnParam[];
  props: OwnProp[];
  /** Template ids of contained indicators (name derived). */
  includes: { id: string; name: string; tpl: string }[];
  rules: RuleInst[];
  /** Trend: calculation procedure; only "expression" is delivered. */
  method?: string;
  direction?: Expr;
  /** Rule set: expression for the total result. */
  total?: Expr;
}

export interface Origin {
  tplId: string | null;
  tplName: string | null;
  type: string;
}

export type Comparison = 'max' | 'min' | 'eq';

export interface RuleInst {
  id: string;
  name: string;
  /** rule or rule set */
  kind: 'rule' | 'ruleset';
  origin: Origin;
  params: Record<string, Binding>;
  own: OwnDef | null;
  e: Expr;
  determines: string | null;
  cmp: Comparison;
  builtin?: string;
}

export interface El {
  id: string;
  type: string;
  name: string;
  bind: Record<string, Binding>;
  rules: RuleInst[];
  /** Explicit data inputs: values of objects that are wired to this element. */
  inputs: { obj: string; prop: string }[];
  /** Id of the "place order" element whose management this element belongs to. */
  mgmt: string | null;
  origin: Origin | null;
  own: OwnDef | null;
  /** Manual shift against the automatic position. */
  dx?: number;
  dy?: number;
  /** Object card: all properties shown. */
  open?: boolean;
  description?: string;
}

export interface Conn {
  from: string;
  out: string;
  to: string;
}

export interface Section {
  id: string;
  name: string;
  /** null: main flow, otherwise id of the "place order" element. */
  flow: string | null;
  collapsed: boolean;
  els: string[];
}

export type SPType = 'number' | 'integer' | 'percent' | 'boolean' | 'text' | 'time_unit' | 'instrument';

export interface SParam {
  id: string;
  name: string;
  dtype: SPType;
  value: string | number | boolean;
  atApplication: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  params: SParam[];
  rules: RuleInst[];
  els: El[];
  conns: Conn[];
  sections: Section[];
  /** Management frames that were collapsed. */
  collapsedMgmt: string[];
  savedAt: string | null;
  sample?: string;
}

export interface Template {
  id: string;
  kind: 'indicator' | 'trend' | 'rule' | 'ruleset';
  /** type id used for instances: EMA, ATR, ZigZag, Markttechnik, Indikator, Trend, Regel, Regelwerk */
  type: string;
  name: string;
  description: string;
  builtin?: boolean;
  defaults: Record<string, Binding>;
  own: OwnDef | null;
  e: Expr;
  determines: string | null;
  cmp: Comparison;
  savedAt: string | null;
}

export interface Settings {
  lang: Lang;
  objectDir: string;
}

// ---- helpers ---------------------------------------------------------------

let counter = 0;
export function uid(prefix = 'x'): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function clone<T>(v: T): T {
  return structuredClone(v);
}

export function emptyOwn(): OwnDef {
  return { params: [], props: [], includes: [], rules: [], method: 'expression', direction: { t: 'empty' } };
}

export function isUnset(b: Binding | undefined): boolean {
  if (!b) return true;
  if (b.k === 'unset') return true;
  if (b.k === 'fixed' && (b.v === '' || b.v === undefined)) return true;
  if (b.k === 'expr' && (b.e.t === 'empty' || b.e.t === 'bad')) return true;
  return false;
}
