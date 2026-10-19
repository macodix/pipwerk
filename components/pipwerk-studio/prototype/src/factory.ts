// Creating elements, instances, rules and templates with their default values.
import { TYPES, fieldsOf, isFlowEl, isObjectEl, typeLabel, LIB_LABEL, tx } from './catalog';
import { EMPTY } from './expr';
import { emptyOwn, uid } from './model';
import type { Binding, El, Lang, Origin, RuleInst, Strategy, Template } from './model';

export const BUILTIN_RISK_ID = 'tpl-risiko';

export function defaultBinding(f: ReturnType<typeof fieldsOf>[number]): Binding {
  if (f.dtype === 'instrument') return { k: 'app' };
  if (f.dtype === 'expression') return { k: 'expr', e: EMPTY };
  if (f.def !== undefined) return { k: 'fixed', v: f.def };
  return { k: 'unset' };
}

export function uniqueName(base: string, taken: string[]): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const set = new Set(taken.map(norm));
  if (!set.has(norm(base))) return base;
  let i = 2;
  while (set.has(norm(`${base} ${i}`))) i++;
  return `${base} ${i}`;
}

export function builtinTemplates(): Template[] {
  return [
    {
      id: BUILTIN_RISK_ID, kind: 'rule', type: 'Regel', name: 'Risiko je Trade',
      description: 'Der Verlust vom Preis bis zum Stop-Loss darf höchstens die Risikogrenze des Kapitals betragen. Das Volumen wird daraus bestimmt und auf den Volumenschritt abgerundet.',
      builtin: true, defaults: { risikogrenze: { k: 'fixed', v: 0.01 } },
      own: { ...emptyOwn(), params: [{ id: 'risikogrenze', name: 'Risikogrenze', dtype: 'percent', def: 0.01 }] },
      e: EMPTY, determines: 'volumen', cmp: 'max', savedAt: null,
    },
  ];
}

export function templateName(t: Template, lang: Lang): string {
  if (t.builtin && t.id === BUILTIN_RISK_ID) return lang === 'en' ? 'Risk per trade' : 'Risiko je Trade';
  return t.name;
}
export function templateDescription(t: Template, lang: Lang): string {
  if (t.builtin && t.id === BUILTIN_RISK_ID) {
    return lang === 'en'
      ? 'The loss from the price to the stop loss may be at most the risk limit of the equity. The volume is derived from it and rounded down to the volume step.'
      : t.description;
  }
  return t.description;
}

export function defaultName(type: string, lang: Lang, taken: string[]): string {
  const d = TYPES[type];
  const base = d?.own && LIB_LABEL[type] ? typeLabel(type, lang) : d ? typeLabel(type, lang) : type;
  return uniqueName(base, taken);
}

export function newEl(type: string, name: string, over: Partial<El> = {}): El {
  const el: El = {
    id: uid('e'), type, name, bind: {}, rules: [], inputs: [], mgmt: null, origin: null, own: null, ...over,
  };
  const d = TYPES[type];
  if (d?.own) el.own = el.own ?? emptyOwn();
  for (const f of fieldsOf(el)) {
    if (el.bind[f.id] === undefined) el.bind[f.id] = defaultBinding(f);
  }
  if (isObjectEl(type) && !el.origin) el.origin = { tplId: null, tplName: null, type };
  return el;
}

export function newRuleFromTemplate(t: Template, name: string): RuleInst {
  return {
    id: uid('r'), name, kind: t.kind === 'ruleset' ? 'ruleset' : 'rule',
    origin: { tplId: t.id, tplName: t.name, type: t.type },
    params: JSON.parse(JSON.stringify(t.defaults)) as Record<string, Binding>,
    own: t.own ? (JSON.parse(JSON.stringify(t.own)) as typeof t.own) : null,
    e: t.e, determines: t.determines, cmp: t.cmp, builtin: t.builtin ? t.id : undefined,
  };
}

export function newOwnRule(name: string, kind: 'rule' | 'ruleset' = 'rule'): RuleInst {
  const origin: Origin = { tplId: null, tplName: null, type: kind === 'rule' ? 'Regel' : 'Regelwerk' };
  return { id: uid('r'), name, kind, origin, params: {}, own: emptyOwn(), e: EMPTY, determines: null, cmp: 'max' };
}

export function newStrategy(name: string): Strategy {
  return {
    id: uid('s'), name, description: '', params: [], rules: [], els: [], conns: [], sections: [], collapsedMgmt: [], savedAt: null,
  };
}

export function instanceFromTemplate(t: Template, name: string): El {
  const el = newEl(t.type, name, {
    origin: { tplId: t.id, tplName: t.name, type: t.type },
    own: t.own ? (JSON.parse(JSON.stringify(t.own)) as typeof t.own) : null,
  });
  for (const [k, b] of Object.entries(t.defaults)) el.bind[k] = JSON.parse(JSON.stringify(b)) as Binding;
  return el;
}

export function libraryLabel(type: string, lang: Lang): string {
  const l = LIB_LABEL[type];
  return l ? tx(l, lang) : typeLabel(type, lang);
}

export { isFlowEl };
