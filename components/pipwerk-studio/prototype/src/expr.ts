// Expressions: formula text (view for advanced users) <-> expression tree <-> readable sentence.
// Names in the tree are references (ids); the text shows the current names, so renaming
// a connected object does not break any expression.
import { APP_OBJECTS, TYPES, choiceLabel, isObjectEl, memberDesc, memberLabel, membersOf, methodOf, methodText, propDef, propsOf, tx, typeLabel, typeMemberDesc } from './catalog';
import type { Member } from './catalog';
import type { El, Expr, Lang, MethodDef, SParam } from './model';

export interface Scope {
  lang: Lang;
  els: El[];
  params: SParam[];
  rulePars: { id: string; name: string }[];
  self?: string;
  /** "Order" and "Position" can be addressed (management, rules). */
  orderPosition: boolean;
}

export const EMPTY: Expr = { t: 'empty' };

// ---- names -------------------------------------------------------------------

export const normName = (s: string): string => s.trim().replace(/\s+/g, ' ').toLowerCase();

const SIMPLE = /^[\p{L}_][\p{L}\p{N}_]*$/u;
export const nm = (s: string): string => (SIMPLE.test(s) ? s : `[${s}]`);

export interface ObjRef {
  id: string;
  type: string;
  el?: El;
}

export function namedEls(sc: Scope): El[] {
  return sc.els.filter((e) => {
    const d = TYPES[e.type];
    return !!d && (isObjectEl(e.type) || d.named || !!e.own) && e.id !== sc.self && e.name.trim() !== '';
  });
}

export function findObj(name: string, sc: Scope): ObjRef | undefined {
  const n = normName(name);
  const el = namedEls(sc).find((e) => normName(e.name) === n);
  if (el) return { id: el.id, type: el.type, el };
  for (const id of APP_OBJECTS) {
    const d = TYPES[id];
    if (normName(d.de) === n || normName(d.en) === n || normName(id) === n) return { id, type: id };
  }
  return undefined;
}

export function objOf(id: string, sc: Scope): ObjRef | undefined {
  const el = sc.els.find((e) => e.id === id);
  if (el) return { id, type: el.type, el };
  if (APP_OBJECTS.includes(id)) return { id, type: id };
  return undefined;
}

export function objName(id: string, sc: Scope): string {
  const o = objOf(id, sc);
  if (!o) return '?';
  if (o.el) return o.el.name;
  return typeLabel(o.type, sc.lang);
}

export function propLabel(obj: string, prop: string, sc: Scope, args?: number[]): string {
  const o = objOf(obj, sc);
  if (!o) return prop;
  const m = methodOf(o.type, prop);
  if (m) return methodText(m, args, sc.lang);
  const p = propDef(o.type, prop, o.el);
  return p ? tx(p, sc.lang) : prop;
}

export function propList(obj: string, sc: Scope) {
  const o = objOf(obj, sc);
  if (!o) return [];
  if (o.el) return propsOf(o.el);
  return TYPES[o.type]?.props ?? [];
}

/** Properties and methods of an object. */
export function memberList(obj: string, sc: Scope): Member[] {
  const o = objOf(obj, sc);
  if (!o) return [];
  if (o.el) return membersOf(o.el);
  return membersOf({ type: o.type, own: null, name: '' });
}

export function methodIn(obj: string, prop: string, sc: Scope): MethodDef | undefined {
  const o = objOf(obj, sc);
  return o ? methodOf(o.type, prop) : undefined;
}

/** True when two references address the same property or method with the same arguments. */
export const sameMember = (a: { prop: string; args?: number[] }, b: { prop: string; args?: number[] }): boolean =>
  a.prop === b.prop && JSON.stringify(a.args ?? []) === JSON.stringify(b.args ?? []);

export { memberLabel };

export function spName(id: string, sc: Scope): string {
  return sc.params.find((p) => p.id === id)?.name ?? '?';
}

// ---- tokenizer ---------------------------------------------------------------

export interface Tok {
  k: 'num' | 'str' | 'id' | 'br' | 'op' | 'lp' | 'rp' | 'semi' | 'dot' | 'ws' | 'err';
  s: string;
  a: number;
  b: number;
}

export function tokenize(text: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const push = (k: Tok['k'], a: number, b: number) => out.push({ k, s: text.slice(a, b), a, b });
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      let j = i;
      while (j < text.length && /\s/.test(text[j])) j++;
      push('ws', i, j);
      i = j;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(text[i + 1] ?? ''))) {
      let j = i;
      while (j < text.length && /[0-9]/.test(text[j])) j++;
      if (text[j] === '.') {
        j++;
        while (j < text.length && /[0-9]/.test(text[j])) j++;
      }
      push('num', i, j);
      i = j;
    } else if (c === '"') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '"') {
          if (text[j + 1] === '"') j += 2;
          else break;
        } else j++;
      }
      if (j >= text.length) {
        push('err', i, text.length);
        i = text.length;
      } else {
        push('str', i, j + 1);
        i = j + 1;
      }
    } else if (c === '[') {
      const j = text.indexOf(']', i);
      if (j < 0) {
        push('err', i, text.length);
        i = text.length;
      } else {
        push('br', i, j + 1);
        i = j + 1;
      }
    } else if (/[\p{L}_]/u.test(c)) {
      let j = i;
      while (j < text.length && /[\p{L}\p{N}_]/u.test(text[j])) j++;
      push('id', i, j);
      i = j;
    } else if (c === '(') { push('lp', i, i + 1); i++; }
    else if (c === ')') { push('rp', i, i + 1); i++; }
    else if (c === ';') { push('semi', i, i + 1); i++; }
    else if (c === '.') { push('dot', i, i + 1); i++; }
    else if (text.startsWith('<>', i) || text.startsWith('<=', i) || text.startsWith('>=', i)) { push('op', i, i + 2); i += 2; }
    else if ('+-*/^&=<>%'.includes(c)) { push('op', i, i + 1); i++; }
    else { push('err', i, i + 1); i++; }
  }
  return out;
}

// ---- functions -----------------------------------------------------------------

export interface FnDef {
  name: string;
  args: { de: string; en: string }[];
  rest?: boolean;
  de: string;
  en: string;
}
const a = (de: string, en: string) => ({ de, en });
export const FUNCTIONS: FnDef[] = [
  { name: 'IF', args: [a('Bedingung', 'condition'), a('Wert wenn wahr', 'value if true'), a('Wert wenn falsch', 'value if false')], de: 'Wählt je nach Bedingung einen von zwei Werten.', en: 'Picks one of two values depending on the condition.' },
  { name: 'AND', args: [a('Bedingung 1', 'condition 1'), a('Bedingung 2', 'condition 2')], rest: true, de: 'Wahr, wenn alle Bedingungen wahr sind.', en: 'True if all conditions are true.' },
  { name: 'OR', args: [a('Bedingung 1', 'condition 1'), a('Bedingung 2', 'condition 2')], rest: true, de: 'Wahr, wenn mindestens eine Bedingung wahr ist.', en: 'True if at least one condition is true.' },
  { name: 'NOT', args: [a('Bedingung', 'condition')], de: 'Kehrt wahr und falsch um.', en: 'Reverses true and false.' },
  { name: 'MIN', args: [a('Wert 1', 'value 1'), a('Wert 2', 'value 2')], rest: true, de: 'Der kleinste der Werte.', en: 'The smallest of the values.' },
  { name: 'MAX', args: [a('Wert 1', 'value 1'), a('Wert 2', 'value 2')], rest: true, de: 'Der größte der Werte.', en: 'The largest of the values.' },
  { name: 'ABS', args: [a('Wert', 'value')], de: 'Der Betrag eines Werts ohne Vorzeichen.', en: 'The absolute value without sign.' },
  { name: 'FLOOR', args: [a('Wert', 'value'), a('Schrittweite', 'step')], de: 'Rundet auf ein Vielfaches der Schrittweite ab.', en: 'Rounds down to a multiple of the step.' },
  { name: 'CEILING', args: [a('Wert', 'value'), a('Schrittweite', 'step')], de: 'Rundet auf ein Vielfaches der Schrittweite auf.', en: 'Rounds up to a multiple of the step.' },
  { name: 'ISNA', args: [a('Wert', 'value')], de: 'Wahr, wenn der Wert nicht verfügbar ist.', en: 'True if the value is not available.' },
  { name: 'IFNA', args: [a('Wert', 'value'), a('Ersatz', 'replacement')], de: 'Der Wert, oder der Ersatz, wenn er nicht verfügbar ist.', en: 'The value, or the replacement if it is not available.' },
  { name: 'ISBLANK', args: [a('Wert', 'value')], de: 'Wahr, wenn der Wert leer ist.', en: 'True if the value is empty.' },
  { name: 'PREVIOUS', args: [a('Wert', 'value')], de: 'Der Wert beim vorherigen Auslöser, zum Beispiel bei der vorherigen Kerze.', en: 'The value at the previous trigger, for example at the previous candle.' },
  { name: 'TRUE', args: [], de: 'Der Wahrheitswert wahr.', en: 'The truth value true.' },
  { name: 'FALSE', args: [], de: 'Der Wahrheitswert falsch.', en: 'The truth value false.' },
];
export const fn = (name: string): FnDef | undefined => FUNCTIONS.find((f) => f.name === name.toUpperCase());

export const COMPARE_OPS = ['=', '<>', '>', '>=', '<', '<='];
export const ARITH_OPS = ['+', '-', '*', '/'];

// ---- parser --------------------------------------------------------------------

export interface ParseError {
  a: number;
  b: number;
  msg: string;
}

const PREC: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '<=': 1, '>': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };

export function parse(text: string, sc: Scope): { e: Expr; errors: ParseError[] } {
  const all = tokenize(text);
  const toks = all.filter((t) => t.k !== 'ws');
  const errors: ParseError[] = [];
  const de = sc.lang === 'de';
  let p = 0;
  const peek = () => toks[p];
  const err = (a_: number, b_: number, de_: string, en_: string) => errors.push({ a: a_, b: b_, msg: de ? de_ : en_ });

  if (toks.length === 0) return { e: EMPTY, errors: [] };
  for (const t of toks) {
    if (t.k === 'err') err(t.a, t.b, `Unzulässiges Zeichen oder nicht geschlossener Text „${t.s}“.`, `Invalid character or unclosed text "${t.s}".`);
  }
  if (errors.length) return { e: { t: 'bad', text }, errors };

  const strip = (t: Tok) => (t.k === 'br' ? t.s.slice(1, -1) : t.s);

  function primary(): Expr {
    const t = peek();
    if (!t) {
      const end = text.length;
      err(end, end, 'Der Ausdruck ist an dieser Stelle nicht zu Ende.', 'The expression is incomplete here.');
      return EMPTY;
    }
    if (t.k === 'num') { p++; return { t: 'num', v: Number(t.s) }; }
    if (t.k === 'str') { p++; return { t: 'str', v: t.s.slice(1, -1).replace(/""/g, '"') }; }
    if (t.k === 'op' && t.s === '-') {
      p++;
      return { t: 'neg', e: binary(5) };
    }
    if (t.k === 'lp') {
      p++;
      const e = expr(0);
      const c = peek();
      if (c && c.k === 'rp') p++;
      else err(t.a, t.b, 'Diese Klammer wird nicht geschlossen.', 'This parenthesis is not closed.');
      return e;
    }
    if (t.k === 'id' || t.k === 'br') {
      const nxt = toks[p + 1];
      if (t.k === 'id' && nxt && nxt.k === 'lp') return call(t);
      return name(t);
    }
    p++;
    err(t.a, t.b, `Hier wird ein Wert erwartet, nicht „${t.s}“.`, `A value is expected here, not "${t.s}".`);
    return EMPTY;
  }

  function call(t: Tok): Expr {
    const def = fn(t.s);
    p += 2;
    const args: Expr[] = [];
    if (!def) err(t.a, t.b, `Unbekannte Funktion „${t.s}“. Bekannt sind: ${FUNCTIONS.map((f) => f.name).join(', ')}.`, `Unknown function "${t.s}". Known: ${FUNCTIONS.map((f) => f.name).join(', ')}.`);
    if (peek() && peek().k === 'rp') {
      p++;
    } else {
      for (;;) {
        args.push(expr(0));
        const c = peek();
        if (c && c.k === 'semi') { p++; continue; }
        if (c && c.k === 'rp') { p++; break; }
        err(t.a, t.b, `Die Klammer von ${t.s} wird nicht geschlossen. Argumente trennen Sie mit „;“.`, `The parenthesis of ${t.s} is not closed. Separate arguments with ";".`);
        break;
      }
    }
    if (def) {
      const min = def.rest ? def.args.length : def.args.length;
      if (args.length < min || (!def.rest && args.length > def.args.length)) {
        err(t.a, t.b, `${def.name} erwartet ${def.rest ? 'mindestens ' : ''}${def.args.length} Argument(e), hier sind ${args.length} angegeben.`, `${def.name} expects ${def.rest ? 'at least ' : ''}${def.args.length} argument(s), ${args.length} given.`);
      }
    }
    const f = def?.name ?? t.s.toUpperCase();
    if (f === 'TRUE') return { t: 'bool', v: true };
    if (f === 'FALSE') return { t: 'bool', v: false };
    return { t: 'call', fn: f, args };
  }

  function name(t: Tok): Expr {
    p++;
    const nameText = strip(t);
    const dot = peek();
    if (dot && dot.k === 'dot') {
      const pt = toks[p + 1];
      if (!pt || (pt.k !== 'id' && pt.k !== 'br')) {
        err(dot.a, dot.b, 'Nach dem Punkt fehlt der Name der Eigenschaft.', 'The name of the property is missing after the dot.');
        p++;
        return EMPTY;
      }
      p += 2;
      const propText = strip(pt);
      if (['strategie', 'strategy'].includes(normName(nameText)) && !namedEls(sc).some((e) => normName(e.name) === normName(nameText))) {
        const sp = sc.params.find((x) => normName(x.name) === normName(propText));
        const own = TYPES.Strategie.props.find((x) => [x.id, x.de, x.en].some((s) => normName(s) === normName(propText)));
        if (!sp && own) return { t: 'ref', obj: 'Strategie', prop: own.id };
        if (!sp) {
          err(pt.a, pt.b, `Unbekannter Strategieparameter „${propText}“.${sc.params.length ? ` Angelegt sind: ${sc.params.map((x) => x.name).join(', ')}.` : ' Es ist noch keiner angelegt.'}`, `Unknown strategy parameter "${propText}".${sc.params.length ? ` Defined: ${sc.params.map((x) => x.name).join(', ')}.` : ' None is defined yet.'}`);
          return EMPTY;
        }
        return { t: 'sp', id: sp.id };
      }
      const o = findObj(nameText, sc);
      if (!o) {
        const names = namedEls(sc).map((e) => e.name).slice(0, 6).join(', ');
        err(t.a, t.b, `Unbekannter Name „${nameText}“.${names ? ` Bekannt sind zum Beispiel: ${names}.` : ''}`, `Unknown name "${nameText}".${names ? ` Known, for example: ${names}.` : ''}`);
        return EMPTY;
      }
      if ((o.type === 'Order' || o.type === 'Position') && !sc.orderPosition) {
        err(t.a, t.b, `„${nameText}“ gibt es nur in der Verwaltung einer Order und in Regeln, nicht im Hauptablauf.`, `"${nameText}" exists only in the management of an order and in rules, not in the main flow.`);
        return EMPTY;
      }
      const list = memberList(o.id, sc);
      const np = normName(propText);
      const prop = list.find((x) => normName(x.id) === np || normName(x.de) === np || normName(x.en) === np);
      if (!prop) {
        err(pt.a, pt.b, `„${nameText}“ hat keine Eigenschaft oder Methode „${propText}“. Möglich: ${list.map((x) => tx(x, sc.lang)).slice(0, 8).join(', ')}.`, `"${nameText}" has no property or method "${propText}". Possible: ${list.map((x) => tx(x, sc.lang)).slice(0, 8).join(', ')}.`);
        return EMPTY;
      }
      if (prop.method) {
        const m = prop.method;
        const argNames = m.args.map((q) => tx(q, sc.lang)).join('; ');
        const lp = peek();
        if (!lp || lp.k !== 'lp') {
          err(pt.a, pt.b, `„${propText}“ ist eine Methode und braucht Argumente: ${propText}(${argNames}).`, `"${propText}" is a method and needs arguments: ${propText}(${argNames}).`);
          return EMPTY;
        }
        p++;
        const args: number[] = [];
        if (peek() && peek().k === 'rp') {
          p++;
        } else {
          for (;;) {
            const at = peek();
            const a = expr(0);
            if (a.t === 'num' && Number.isInteger(a.v) && a.v >= 1) args.push(a.v);
            else if (at) err(at.a, at.b, 'Das Argument muss eine ganze Zahl ab 1 sein.', 'The argument must be a whole number from 1.');
            const c = peek();
            if (c && c.k === 'semi') { p++; continue; }
            if (c && c.k === 'rp') { p++; break; }
            err(lp.a, lp.b, `Die Klammer von ${propText} wird nicht geschlossen.`, `The parenthesis of ${propText} is not closed.`);
            break;
          }
        }
        if (args.length !== m.args.length) {
          err(pt.a, pt.b, `${propText} erwartet ${m.args.length} Argument(e): ${argNames}.`, `${propText} expects ${m.args.length} argument(s): ${argNames}.`);
        }
        return { t: 'ref', obj: o.id, prop: prop.id, args };
      }
      return { t: 'ref', obj: o.id, prop: prop.id };
    }
    const rp = sc.rulePars.find((x) => normName(x.name) === normName(nameText));
    if (rp) return { t: 'par', id: rp.id };
    err(t.a, t.b, `„${nameText}“ steht allein. Gemeint ist vielleicht „${nameText}.Eigenschaft“.`, `"${nameText}" stands alone. Perhaps "${nameText}.property" is meant.`);
    return EMPTY;
  }

  function binary(minPrec: number): Expr {
    let left = primary();
    for (;;) {
      const t = peek();
      if (!t || t.k !== 'op' || t.s === '%') break;
      const pr = PREC[t.s];
      if (pr === undefined || pr < minPrec) break;
      p++;
      const right = binary(pr + 1);
      left = { t: 'bin', op: t.s, l: left, r: right };
    }
    const t = peek();
    if (t && t.k === 'op' && t.s === '%') {
      p++;
      left = { t: 'bin', op: '/', l: left, r: { t: 'num', v: 100 } };
    }
    return left;
  }
  function expr(minPrec: number): Expr {
    return binary(minPrec || 1);
  }

  const e = expr(0);
  if (p < toks.length) {
    const t = toks[p];
    err(t.a, toks[toks.length - 1].b, `Unerwartet „${t.s}“. Vor dieser Stelle ist der Ausdruck schon vollständig.`, `Unexpected "${t.s}". The expression is already complete before this point.`);
  }
  if (errors.length) return { e: { t: 'bad', text }, errors };
  return { e: recognize(e), errors: [] };
}

// ---- recognizing the crossing pattern ---------------------------------------------

const same = (x: Expr, y: Expr) => JSON.stringify(x) === JSON.stringify(y);
const prev = (e: Expr): Expr => ({ t: 'call', fn: 'PREVIOUS', args: [e] });

/** The two comparisons that make up a crossing. */
function crossPair(x: Expr, y: Expr, dir: 'up' | 'down'): { a: Expr; b: Expr } | null {
  if (x.t !== 'bin' || y.t !== 'bin') return null;
  const op1 = dir === 'up' ? '<=' : '>=';
  const op2 = dir === 'up' ? '>' : '<';
  if (x.op !== op1 || y.op !== op2) return null;
  if (x.l.t !== 'call' || x.l.fn !== 'PREVIOUS' || x.r.t !== 'call' || x.r.fn !== 'PREVIOUS') return null;
  const pa = x.l.args[0];
  const pb = x.r.args[0];
  if (!pa || !pb) return null;
  if (!same(pa, y.l) || !same(pb, y.r)) return null;
  return { a: pa, b: pb };
}

export function crossPieces(c: Extract<Expr, { t: 'cross' }>, dir: 'up' | 'down'): [Expr, Expr] {
  return dir === 'up'
    ? [{ t: 'bin', op: '<=', l: prev(c.a), r: prev(c.b) }, { t: 'bin', op: '>', l: c.a, r: c.b }]
    : [{ t: 'bin', op: '>=', l: prev(c.a), r: prev(c.b) }, { t: 'bin', op: '<', l: c.a, r: c.b }];
}

export function recognize(e: Expr): Expr {
  switch (e.t) {
    case 'bin': return { ...e, l: recognize(e.l), r: recognize(e.r) };
    case 'neg': return { ...e, e: recognize(e.e) };
    case 'call': {
      let args = e.args.map(recognize);
      if (e.fn === 'AND') {
        const merged: Expr[] = [];
        for (let i = 0; i < args.length; i++) {
          const x = args[i];
          const y = args[i + 1];
          let done = false;
          if (y) {
            for (const dir of ['up', 'down'] as const) {
              const pr = crossPair(x, y, dir);
              if (pr) {
                merged.push({ t: 'cross', a: pr.a, b: pr.b, dir });
                i++;
                done = true;
                break;
              }
            }
          }
          if (!done) merged.push(x);
        }
        args = merged;
        if (args.length === 1 && args[0].t === 'cross') return args[0];
      }
      if (e.fn === 'OR' && args.length === 2 && args[0].t === 'cross' && args[1].t === 'cross') {
        const [c1, c2] = args;
        if (c1.dir === 'up' && c2.dir === 'down' && same(c1.a, c2.a) && same(c1.b, c2.b)) return { t: 'cross', a: c1.a, b: c1.b, dir: 'any' };
      }
      return { ...e, args };
    }
    case 'cross': return { ...e, a: recognize(e.a), b: recognize(e.b) };
    default: return e;
  }
}

// ---- printing --------------------------------------------------------------------

function fmtNum(v: number): string {
  return String(v);
}

function refText(o: string, prop: string, sc: Scope, args?: number[]): string {
  const m = methodIn(o, prop, sc);
  if (m) return `${nm(objName(o, sc))}.${nm(tx(m, sc.lang))}(${(args ?? m.defaults).join('; ')})`;
  return `${nm(objName(o, sc))}.${nm(propLabel(o, prop, sc))}`;
}

function printArgs(args: Expr[], sc: Scope, prec: number): string[] {
  return args.map((x) => print(x, sc, prec));
}

export function print(e: Expr, sc: Scope, outer = 0): string {
  switch (e.t) {
    case 'empty': return '';
    case 'num': return fmtNum(e.v);
    case 'str': return `"${e.v.replace(/"/g, '""')}"`;
    case 'bool': return e.v ? 'TRUE()' : 'FALSE()';
    case 'ref': return refText(e.obj, e.prop, sc, e.args);
    case 'sp': return `${sc.lang === 'de' ? 'Strategie' : 'Strategy'}.${nm(spName(e.id, sc))}`;
    case 'par': return nm(sc.rulePars.find((x) => x.id === e.id)?.name ?? '?');
    case 'neg': return `-${print(e.e, sc, 6)}`;
    case 'bad': return e.text;
    case 'bin': {
      const pr = PREC[e.op] ?? 1;
      const s = `${print(e.l, sc, pr)} ${e.op} ${print(e.r, sc, pr + 1)}`;
      return pr < outer ? `(${s})` : s;
    }
    case 'cross': {
      if (e.dir === 'any') {
        const up = print({ ...e, dir: 'up' }, sc);
        const down = print({ ...e, dir: 'down' }, sc);
        return `OR(${up}; ${down})`;
      }
      const [x, y] = crossPieces(e, e.dir);
      return `AND(${print(x, sc)}; ${print(y, sc)})`;
    }
    case 'call': {
      const parts: string[] = [];
      if (e.fn === 'AND') {
        for (const x of e.args) {
          if (x.t === 'cross' && x.dir !== 'any') {
            const [p1, p2] = crossPieces(x, x.dir);
            parts.push(print(p1, sc), print(p2, sc));
          } else parts.push(print(x, sc));
        }
      } else parts.push(...printArgs(e.args, sc, 0));
      return `${e.fn}(${parts.join('; ')})`;
    }
  }
}

/** Multi-line form for long expressions. */
export function prettyPrint(e: Expr, sc: Scope, indent = 0): string {
  const flat = print(e, sc);
  if (flat.length <= 64) return flat;
  const pad = '  '.repeat(indent + 1);
  const close = '  '.repeat(indent);
  if (e.t === 'call' && e.args.length > 1) {
    const parts: string[] = [];
    if (e.fn === 'AND') {
      for (const x of e.args) {
        if (x.t === 'cross' && x.dir !== 'any') {
          const [p1, p2] = crossPieces(x, x.dir);
          parts.push(prettyPrint(p1, sc, indent + 1), prettyPrint(p2, sc, indent + 1));
        } else parts.push(prettyPrint(x, sc, indent + 1));
      }
    } else parts.push(...e.args.map((x) => prettyPrint(x, sc, indent + 1)));
    return `${e.fn}(\n${pad}${parts.join(`;\n${pad}`)}\n${close})`;
  }
  if (e.t === 'cross') {
    if (e.dir === 'any') {
      return `OR(\n${pad}${prettyPrint({ ...e, dir: 'up' }, sc, indent + 1)};\n${pad}${prettyPrint({ ...e, dir: 'down' }, sc, indent + 1)}\n${close})`;
    }
    const [x, y] = crossPieces(e, e.dir);
    return `AND(\n${pad}${print(x, sc)};\n${pad}${print(y, sc)}\n${close})`;
  }
  return flat;
}

// ---- reading it as a sentence ----------------------------------------------------------

const CMP_TXT: Record<string, { de: string; en: string }> = {
  '=': { de: 'ist gleich', en: 'equals' },
  '<>': { de: 'ist ungleich', en: 'does not equal' },
  '>': { de: 'ist größer als', en: 'is greater than' },
  '>=': { de: 'ist größer oder gleich', en: 'is greater than or equal to' },
  '<': { de: 'ist kleiner als', en: 'is less than' },
  '<=': { de: 'ist kleiner oder gleich', en: 'is less than or equal to' },
};
export const CMP_LABEL = CMP_TXT;
const ARITH_TXT: Record<string, { de: string; en: string }> = {
  '+': { de: 'plus', en: 'plus' },
  '-': { de: 'minus', en: 'minus' },
  '*': { de: 'mal', en: 'times' },
  '/': { de: 'geteilt durch', en: 'divided by' },
  '^': { de: 'hoch', en: 'to the power of' },
  '&': { de: 'verbunden mit', en: 'joined with' },
};
export const ARITH_LABEL = ARITH_TXT;

export interface VType {
  kind: 'number' | 'boolean' | 'text' | 'choice' | 'unknown';
  choices?: import('./model').Choice[];
}

export function typeOf(e: Expr, sc: Scope): VType {
  switch (e.t) {
    case 'num': return { kind: 'number' };
    case 'str': return { kind: 'text' };
    case 'bool': return { kind: 'boolean' };
    case 'ref': {
      const o = objOf(e.obj, sc);
      if (o && methodOf(o.type, e.prop)) return { kind: 'number' };
      const p = o ? propDef(o.type, e.prop, o.el) : undefined;
      if (!p) return { kind: 'unknown' };
      if (p.dtype === 'choice') return { kind: 'choice', choices: p.choices };
      if (p.dtype === 'boolean') return { kind: 'boolean' };
      if (p.dtype === 'text') return { kind: 'text' };
      return { kind: 'number' };
    }
    case 'sp': {
      const s = sc.params.find((x) => x.id === e.id);
      if (!s) return { kind: 'unknown' };
      if (s.dtype === 'boolean') return { kind: 'boolean' };
      if (s.dtype === 'text' || s.dtype === 'time_unit') return { kind: 'text' };
      return { kind: 'number' };
    }
    case 'bin':
      if (CMP_TXT[e.op]) return { kind: 'boolean' };
      if (e.op === '&') return { kind: 'text' };
      return { kind: 'number' };
    case 'neg': return { kind: 'number' };
    case 'cross': return { kind: 'boolean' };
    case 'call':
      if (['AND', 'OR', 'NOT', 'ISNA', 'ISBLANK'].includes(e.fn)) return { kind: 'boolean' };
      if (e.fn === 'IF') return typeOf(e.args[1] ?? EMPTY, sc);
      if (['MIN', 'MAX', 'ABS', 'FLOOR', 'CEILING', 'PREVIOUS', 'IFNA'].includes(e.fn)) return e.args[0] ? typeOf(e.args[0], sc) : { kind: 'unknown' };
      return { kind: 'unknown' };
    default: return { kind: 'unknown' };
  }
}

function numText(v: number, lang: Lang): string {
  const s = String(v);
  return lang === 'de' ? s.replace('.', ',') : s;
}

export function describe(e: Expr, sc: Scope, ctx?: VType): string {
  const de = sc.lang === 'de';
  const d = (x: Expr, c?: VType) => describe(x, sc, c);
  const wrapLogic = (x: Expr, parent: string) => {
    const s = d(x);
    if (x.t === 'call' && (x.fn === 'AND' || x.fn === 'OR') && x.fn !== parent && x.args.length > 1) return `(${s})`;
    if (x.t === 'cross' && false) return s;
    return s;
  };
  switch (e.t) {
    case 'empty': return de ? '…' : '…';
    case 'bad': return de ? 'Ausdruck fehlerhaft' : 'Expression has errors';
    case 'num': return numText(e.v, sc.lang);
    case 'str': {
      if (ctx?.kind === 'choice') return `„${choiceLabel(ctx.choices, e.v, sc.lang)}“`;
      return `„${e.v}“`;
    }
    case 'bool': return e.v ? (de ? 'wahr' : 'true') : (de ? 'falsch' : 'false');
    case 'ref': {
      const pl = propLabel(e.obj, e.prop, sc, e.args);
      const on = objName(e.obj, sc);
      // the main value of an object or the result of a step is called by its name
      if (e.prop === 'wert' || e.prop === 'ergebnis') return on;
      return de ? `${pl} von ${on}` : `${pl} of ${on}`;
    }
    case 'sp': return de ? `Strategieparameter ${spName(e.id, sc)}` : `strategy parameter ${spName(e.id, sc)}`;
    case 'par': return sc.rulePars.find((x) => x.id === e.id)?.name ?? '?';
    case 'neg': return `−${d(e.e)}`;
    case 'cross': {
      const dir = e.dir === 'up' ? (de ? 'nach oben' : 'upwards') : e.dir === 'down' ? (de ? 'nach unten' : 'downwards') : de ? 'in beide Richtungen' : 'in either direction';
      return de ? `${d(e.a)} kreuzt ${d(e.b)} ${dir}` : `${d(e.a)} crosses ${d(e.b)} ${dir}`;
    }
    case 'bin': {
      if (CMP_TXT[e.op]) {
        const lt = typeOf(e.l, sc);
        const rt = typeOf(e.r, sc);
        return `${d(e.l, rt)} ${tx(CMP_TXT[e.op], sc.lang)} ${d(e.r, lt)}`;
      }
      const s = `${d(e.l)} ${tx(ARITH_TXT[e.op] ?? { de: e.op, en: e.op }, sc.lang)} ${d(e.r)}`;
      return s;
    }
    case 'call': {
      const args = e.args;
      switch (e.fn) {
        case 'AND': return args.map((x) => wrapLogic(x, 'AND')).join(de ? ' und ' : ' and ');
        case 'OR': return args.map((x) => wrapLogic(x, 'OR')).join(de ? ' oder ' : ' or ');
        case 'NOT': return de ? `nicht (${d(args[0] ?? EMPTY)})` : `not (${d(args[0] ?? EMPTY)})`;
        case 'IF': return de ? `wenn ${d(args[0] ?? EMPTY)}, dann ${d(args[1] ?? EMPTY)}, sonst ${d(args[2] ?? EMPTY)}` : `if ${d(args[0] ?? EMPTY)}, then ${d(args[1] ?? EMPTY)}, otherwise ${d(args[2] ?? EMPTY)}`;
        case 'PREVIOUS': return de ? `vorheriger Wert von ${d(args[0] ?? EMPTY)}` : `previous value of ${d(args[0] ?? EMPTY)}`;
        case 'MIN': return de ? `der kleinste Wert aus ${args.map((x) => d(x)).join(' und ')}` : `the smallest of ${args.map((x) => d(x)).join(' and ')}`;
        case 'MAX': return de ? `der größte Wert aus ${args.map((x) => d(x)).join(' und ')}` : `the largest of ${args.map((x) => d(x)).join(' and ')}`;
        case 'ABS': return de ? `Betrag von ${d(args[0] ?? EMPTY)}` : `absolute value of ${d(args[0] ?? EMPTY)}`;
        case 'FLOOR': return de ? `${d(args[0] ?? EMPTY)} abgerundet auf ${d(args[1] ?? EMPTY)}` : `${d(args[0] ?? EMPTY)} rounded down to ${d(args[1] ?? EMPTY)}`;
        case 'CEILING': return de ? `${d(args[0] ?? EMPTY)} aufgerundet auf ${d(args[1] ?? EMPTY)}` : `${d(args[0] ?? EMPTY)} rounded up to ${d(args[1] ?? EMPTY)}`;
        case 'ISNA': return de ? `${d(args[0] ?? EMPTY)} ist nicht verfügbar` : `${d(args[0] ?? EMPTY)} is not available`;
        case 'IFNA': return de ? `${d(args[0] ?? EMPTY)}, ersatzweise ${d(args[1] ?? EMPTY)}` : `${d(args[0] ?? EMPTY)}, otherwise ${d(args[1] ?? EMPTY)}`;
        case 'ISBLANK': return de ? `${d(args[0] ?? EMPTY)} ist leer` : `${d(args[0] ?? EMPTY)} is empty`;
        default: return `${e.fn}(${args.map((x) => d(x)).join('; ')})`;
      }
    }
  }
}

// ---- references -----------------------------------------------------------------------

export function walk(e: Expr, f: (x: Expr) => void): void {
  f(e);
  switch (e.t) {
    case 'bin': walk(e.l, f); walk(e.r, f); break;
    case 'neg': walk(e.e, f); break;
    case 'call': e.args.forEach((x) => walk(x, f)); break;
    case 'cross': walk(e.a, f); walk(e.b, f); break;
    default: break;
  }
}

export function refsOf(e: Expr): { obj: string; prop: string; args?: number[] }[] {
  const out: { obj: string; prop: string; args?: number[] }[] = [];
  walk(e, (x) => {
    if (x.t === 'ref' && !out.some((r) => r.obj === x.obj && sameMember(r, x))) out.push(x.args ? { obj: x.obj, prop: x.prop, args: x.args } : { obj: x.obj, prop: x.prop });
  });
  return out;
}

export function spRefsOf(e: Expr): string[] {
  const out: string[] = [];
  walk(e, (x) => {
    if (x.t === 'sp' && !out.includes(x.id)) out.push(x.id);
  });
  return out;
}

export function mapExpr(e: Expr, f: (x: Expr) => Expr | undefined): Expr {
  const r = f(e);
  if (r) return r;
  switch (e.t) {
    case 'bin': return { ...e, l: mapExpr(e.l, f), r: mapExpr(e.r, f) };
    case 'neg': return { ...e, e: mapExpr(e.e, f) };
    case 'call': return { ...e, args: e.args.map((x) => mapExpr(x, f)) };
    case 'cross': return { ...e, a: mapExpr(e.a, f), b: mapExpr(e.b, f) };
    default: return e;
  }
}

/** Problems of an expression for the simulated consistency check. */
export function problems(e: Expr, sc: Scope): { de: string; en: string }[] {
  const out: { de: string; en: string }[] = [];
  if (e.t === 'bad') {
    const r = parse(e.text, sc);
    const first = r.errors[0];
    out.push({
      de: `Der Ausdruck ist fehlerhaft: ${first ? first.msg : ''}`,
      en: `The expression has an error: ${first ? first.msg : ''}`,
    });
    return out;
  }
  if (e.t === 'empty') {
    out.push({ de: 'Es ist noch nichts eingegeben.', en: 'Nothing has been entered yet.' });
    return out;
  }
  let hasEmpty = false;
  walk(e, (x) => {
    if (x.t === 'empty') hasEmpty = true;
    if (x.t === 'ref') {
      const o = objOf(x.obj, sc);
      if (!o) out.push({ de: 'Der Ausdruck verwendet ein Objekt, das es nicht mehr gibt.', en: 'The expression uses an object that no longer exists.' });
      else if (!memberList(x.obj, sc).some((p) => p.id === x.prop)) out.push({ de: `„${objName(x.obj, sc)}“ hat die Eigenschaft oder Methode nicht mehr, die der Ausdruck verwendet.`, en: `"${objName(x.obj, sc)}" no longer has the property or method the expression uses.` });
    }
    if (x.t === 'sp' && !sc.params.some((p) => p.id === x.id)) out.push({ de: 'Der Ausdruck verwendet einen Strategieparameter, den es nicht mehr gibt.', en: 'The expression uses a strategy parameter that no longer exists.' });
  });
  if (hasEmpty) out.push({ de: 'Ein Baustein des Ausdrucks ist noch leer.', en: 'A block of the expression is still empty.' });
  return out;
}

// ---- formula editor support ------------------------------------------------------------

export interface HlSpan {
  a: number;
  b: number;
  cls: string;
}

export function highlight(text: string, sc: Scope): HlSpan[] {
  const all = tokenize(text);
  const spans: HlSpan[] = [];
  const sig = all.filter((t) => t.k !== 'ws');
  sig.forEach((t, idx) => {
    const next = sig[idx + 1];
    const before = sig[idx - 1];
    let cls = '';
    if (t.k === 'num') cls = 'tk-num';
    else if (t.k === 'str') cls = 'tk-str';
    else if (t.k === 'op') cls = 'tk-op';
    else if (t.k === 'id' && next && next.k === 'lp') cls = fn(t.s) ? 'tk-fn' : 'tk-badfn';
    else if (t.k === 'id' || t.k === 'br') {
      const after = before && before.k === 'dot';
      cls = after ? 'tk-prop' : 'tk-name';
    } else if (t.k === 'err') cls = 'tk-err';
    if (cls) spans.push({ a: t.a, b: t.b, cls });
  });
  return spans;
}

export function bracketMatch(text: string, caret: number): [number, number] | null {
  const idxs: number[] = [];
  const pairs = new Map<number, number>();
  for (const t of tokenize(text)) {
    if (t.k === 'lp') idxs.push(t.a);
    else if (t.k === 'rp') {
      const o = idxs.pop();
      if (o !== undefined) { pairs.set(o, t.a); pairs.set(t.a, o); }
    }
  }
  for (const pos of [caret - 1, caret]) {
    if (pos >= 0 && pairs.has(pos)) return [pos, pairs.get(pos) as number];
  }
  return null;
}

export interface Completion {
  label: string;
  insert: string;
  detail: string;
  tip?: string;
}

export function completionsAt(text: string, caret: number, sc: Scope): { from: number; items: Completion[] } | null {
  const before = text.slice(0, caret);
  const de = sc.lang === 'de';
  const dotM = /(\[[^\]]+\]|[\p{L}_][\p{L}\p{N}_]*)\.([\p{L}\p{N}_]*)$/u.exec(before);
  if (dotM) {
    const nameText = dotM[1].startsWith('[') ? dotM[1].slice(1, -1) : dotM[1];
    const prefix = dotM[2].toLowerCase();
    const from = caret - dotM[2].length;
    if (['strategie', 'strategy'].includes(normName(nameText)) && !namedEls(sc).some((e) => normName(e.name) === normName(nameText))) {
      const items: Completion[] = sc.params
        .filter((p) => normName(p.name).startsWith(prefix))
        .map((p) => ({ label: p.name, insert: nm(p.name), detail: de ? 'Strategieparameter' : 'strategy parameter' }));
      for (const p of TYPES.Strategie.props) {
        if (normName(tx(p, sc.lang)).startsWith(prefix)) items.push({ label: tx(p, sc.lang), insert: nm(tx(p, sc.lang)), detail: dtypeShort(p.dtype, sc.lang), tip: typeMemberDesc('Strategie', p.id, sc.lang) });
      }
      return { from, items };
    }
    const o = findObj(nameText, sc);
    if (!o) return null;
    const items = memberList(o.id, sc)
      .filter((p) => normName(tx(p, sc.lang)).startsWith(prefix) || normName(p.id).startsWith(prefix))
      .map((p) => p.method
        ? {
          label: methodText(p.method, undefined, sc.lang),
          insert: `${nm(tx(p, sc.lang))}(${p.method.defaults.join('; ')})`,
          detail: `${de ? 'Methode' : 'method'}: ${p.method.args.map((q) => tx(q, sc.lang)).join('; ')}`,
          tip: o.el ? memberDesc(o.el, p.id, sc.lang) : typeMemberDesc(o.type, p.id, sc.lang),
        }
        : {
          label: tx(p, sc.lang),
          insert: nm(tx(p, sc.lang)),
          detail: dtypeShort(p.dtype, sc.lang),
          tip: o.el ? memberDesc(o.el, p.id, sc.lang) : typeMemberDesc(o.type, p.id, sc.lang),
        });
    return { from, items };
  }
  const wordM = /([\p{L}_][\p{L}\p{N}_]*)$/u.exec(before);
  if (wordM && wordM[1].length >= 1) {
    const prefix = wordM[1].toLowerCase();
    const from = caret - wordM[1].length;
    const items: Completion[] = [];
    for (const e of namedEls(sc)) {
      if (normName(e.name).startsWith(prefix)) items.push({ label: e.name, insert: nm(e.name), detail: typeLabel(e.type, sc.lang) });
    }
    for (const id of APP_OBJECTS) {
      if ((id === 'Order' || id === 'Position') && !sc.orderPosition) continue;
      const lab = typeLabel(id, sc.lang);
      if (normName(lab).startsWith(prefix)) items.push({ label: lab, insert: nm(lab), detail: de ? 'Objekt der Anwendung' : 'object of the application' });
    }
    const sl = de ? 'Strategie' : 'Strategy';
    if (normName(sl).startsWith(prefix)) items.push({ label: sl, insert: sl, detail: de ? 'Strategieparameter' : 'strategy parameters' });
    for (const f of FUNCTIONS) {
      if (f.name.toLowerCase().startsWith(prefix)) items.push({ label: f.name, insert: f.name, detail: 'ƒ', tip: tx(f, sc.lang) });
    }
    if (items.length === 0) return null;
    return { from, items: items.slice(0, 12) };
  }
  return null;
}

function dtypeShort(d: string, lang: Lang): string {
  const m: Record<string, [string, string]> = {
    number: ['Zahl', 'number'], integer: ['Ganzzahl', 'integer'], percent: ['Prozent', 'percent'], boolean: ['ja/nein', 'yes/no'],
    text: ['Text', 'text'], choice: ['Auswahl', 'choice'], time_unit: ['Zeiteinheit', 'time unit'], timestamp: ['Zeitpunkt', 'time'],
    date: ['Datum', 'date'], object: ['Objekt', 'object'],
  };
  const v = m[d] ?? [d, d];
  return lang === 'de' ? v[0] : v[1];
}

/** The function call the caret is in, with the index of the argument. */
export function callAt(text: string, caret: number): { fn: FnDef; arg: number } | null {
  const toks = tokenize(text.slice(0, caret)).filter((t) => t.k !== 'ws');
  const stack: { name: string | null; arg: number }[] = [];
  toks.forEach((t, i) => {
    if (t.k === 'lp') {
      const prev_ = toks[i - 1];
      stack.push({ name: prev_ && prev_.k === 'id' ? prev_.s : null, arg: 0 });
    } else if (t.k === 'rp') stack.pop();
    else if (t.k === 'semi' && stack.length) stack[stack.length - 1].arg++;
  });
  for (let i = stack.length - 1; i >= 0; i--) {
    const f = stack[i].name ? fn(stack[i].name as string) : undefined;
    if (f) return { fn: f, arg: stack[i].arg };
  }
  return null;
}

/** Errors of the text with their positions (for underlining). */
export function errorsOf(text: string, sc: Scope): ParseError[] {
  return parse(text, sc).errors;
}
