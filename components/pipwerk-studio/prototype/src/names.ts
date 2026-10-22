// The common namespace of a strategy (req-fach-055, specification 3.3): every instance, also the ones
// contained in another instance (the indicators of a trend), every rule and rule set, also the
// rules of a rule set, and every named step has one name, and the name is used once.
// This file collects the names, offers the contained ones to expressions and proposes names for the
// contained instances and rules when a template is inserted (req-ablauf-003).
import { TYPES, isObjectEl } from './catalog';
import { mapExpr, normName } from './expr';
import { emptyOwn, uid } from './model';
import type { El, Expr, OwnDef, RuleInst, Strategy } from './model';

export type NameKind = 'instance' | 'step' | 'contained' | 'rule' | 'contained-rule';

export interface NameEntry {
  id: string;
  name: string;
  kind: NameKind;
  /** The element the entry belongs to; null for the rules of the strategy. */
  owner: string | null;
  /** The instance or the rule set that contains the entry; null when it lies directly in the strategy or at an element. */
  parent: string | null;
}

type Named = Pick<Strategy, 'els' | 'rules'>;

function ruleEntries(rules: RuleInst[], owner: string | null, parent: string | null, out: NameEntry[]) {
  for (const r of rules) {
    out.push({ id: r.id, name: r.name, kind: parent ? 'contained-rule' : 'rule', owner, parent });
    ruleEntries(r.own?.rules ?? [], owner, r.id, out);
  }
}

/** All entries of the namespace of the strategy, in the order of the elements. */
export function nameEntries(s: Named): NameEntry[] {
  const out: NameEntry[] = [];
  for (const e of s.els) {
    const d = TYPES[e.type];
    if (!d) continue;
    if (isObjectEl(e.type) || d.named) out.push({ id: e.id, name: e.name, kind: isObjectEl(e.type) ? 'instance' : 'step', owner: e.id, parent: null });
    for (const inc of e.own?.includes ?? []) out.push({ id: inc.id, name: inc.name, kind: 'contained', owner: e.id, parent: e.id });
    ruleEntries(e.own?.rules ?? [], e.id, e.id, out);
    ruleEntries(e.rules, e.id, null, out);
  }
  ruleEntries(s.rules, null, null, out);
  return out;
}

/** The names that are taken, for proposing a new one. */
export const takenNames = (s: Named): string[] => nameEntries(s).map((x) => x.name);

/** Entries whose name is used by an earlier entry (the later one is reported). */
export function duplicateEntries(s: Named): { entry: NameEntry; first: NameEntry }[] {
  const seen = new Map<string, NameEntry>();
  const out: { entry: NameEntry; first: NameEntry }[] = [];
  for (const x of nameEntries(s)) {
    if (!x.name.trim()) continue;
    const k = normName(x.name);
    const first = seen.get(k);
    if (first) out.push({ entry: x, first });
    else seen.set(k, x);
  }
  return out;
}

export interface ParamClash {
  /** The rule whose parameter clashes. */
  rule: RuleInst;
  owner: string | null;
  param: string;
  /** The entry of the namespace with the same name. */
  entry: NameEntry;
}

function eachRule(rules: RuleInst[], owner: string | null, f: (r: RuleInst, owner: string | null) => void) {
  for (const r of rules) {
    f(r, owner);
    eachRule(r.own?.rules ?? [], owner, f);
  }
}

/** A parameter of a rule stands without a dot, so its name must differ from every name of the namespace. */
export function paramClashes(s: Named): ParamClash[] {
  const entries = nameEntries(s).filter((x) => x.name.trim());
  const out: ParamClash[] = [];
  const check = (r: RuleInst, owner: string | null) => {
    if (r.builtin) return;
    for (const p of r.own?.params ?? []) {
      const entry = entries.find((x) => normName(x.name) === normName(p.name) && x.id !== r.id);
      if (entry && p.name.trim()) out.push({ rule: r, owner, param: p.name, entry });
    }
  };
  for (const e of s.els) {
    eachRule(e.rules, e.id, check);
    eachRule(e.own?.rules ?? [], e.id, check);
  }
  eachRule(s.rules, null, check);
  return out;
}

// ---- contained instances and rules in expressions ------------------------------------------------

const virtual = (id: string, type: string, name: string, own: OwnDef | null): El => ({
  id, type, name, bind: {}, rules: [], inputs: [], mgmt: null, origin: null, own,
});

function containedRules(rules: RuleInst[], out: El[]) {
  for (const r of rules) {
    out.push(virtual(r.id, r.kind === 'ruleset' ? 'Regelwerk' : 'Regel', r.name, emptyOwn()));
    containedRules(r.own?.rules ?? [], out);
  }
}

/**
 * Stand-ins for the instances and rules that lie inside other instances and rule sets, so that
 * expressions of the rest of the strategy can address them by name (specification 3.3). The
 * rules of a rule set count, the rule sets themselves do not appear here. The rules of an element are
 * only addressed in the rules of that element and are left out.
 */
export function containedEls(s: Named): El[] {
  const out: El[] = [];
  for (const e of s.els) {
    for (const inc of e.own?.includes ?? []) out.push(virtual(inc.id, inc.tpl, inc.name, null));
    containedRules(e.own?.rules ?? [], out);
  }
  for (const r of s.rules) containedRules(r.own?.rules ?? [], out);
  return out;
}

// ---- proposing names when a template is inserted ----------------------------------------------------

/** "<name of the new instance> <former name>", with a number appended when the proposal is taken. */
export function proposeName(parent: string, former: string, taken: string[]): string {
  const set = new Set(taken.map(normName));
  const base = `${parent} ${former}`.trim();
  if (!set.has(normName(base))) return base;
  let i = 2;
  while (set.has(normName(`${base} ${i}`))) i++;
  return `${base} ${i}`;
}

function remapRule(r: RuleInst, parent: string, taken: string[], ids: Map<string, string>) {
  const old = r.id;
  r.id = uid('r');
  ids.set(old, r.id);
  r.name = proposeName(parent, r.name, taken);
  taken.push(r.name);
  for (const c of r.own?.rules ?? []) remapRule(c, parent, taken, ids);
}

function rewrite(e: Expr, ids: Map<string, string>): Expr {
  return mapExpr(e, (x) => (x.t === 'ref' && ids.has(x.obj) ? { ...x, obj: ids.get(x.obj) as string } : undefined));
}

function rewriteRule(r: RuleInst, ids: Map<string, string>) {
  r.e = rewrite(r.e, ids);
  if (r.own) {
    r.own.props.forEach((p) => { p.e = rewrite(p.e, ids); });
    if (r.own.direction) r.own.direction = rewrite(r.own.direction, ids);
    if (r.own.total) r.own.total = rewrite(r.own.total, ids);
    r.own.rules.forEach((c) => rewriteRule(c, ids));
  }
}

/**
 * The content of a new instance gets its names: every contained instance and rule is called
 * "<name of the instance> <former name>". The contained ones get new ids, because one template can be
 * inserted several times, and the expressions of the content are rewritten to the new ids (specification 3.3).
 * `taken` holds the names of the strategy and receives the new ones.
 */
export function nameContent(own: OwnDef | null, parentName: string, taken: string[]): void {
  if (!own) return;
  const ids = new Map<string, string>();
  for (const inc of own.includes) {
    const old = inc.id;
    inc.id = uid('inc');
    ids.set(old, inc.id);
    inc.name = proposeName(parentName, inc.name, taken);
    taken.push(inc.name);
  }
  for (const r of own.rules) remapRule(r, parentName, taken, ids);
  own.props.forEach((p) => { p.e = rewrite(p.e, ids); });
  if (own.direction) own.direction = rewrite(own.direction, ids);
  if (own.total) own.total = rewrite(own.total, ids);
  own.rules.forEach((r) => rewriteRule(r, ids));
}
