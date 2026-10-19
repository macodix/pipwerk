// Simulated consistency check: finds a few typical problems and says how to fix them.
// It runs in the browser on the model, nothing is calculated.
import { TYPES, fieldsOf, isFlowEl, isObjectEl, isTrigger, typeLabel, tx } from './catalog';
import { normName, problems, refsOf } from './expr';
import type { Scope } from './expr';
import { isUnset } from './model';
import type { El, Lang, RuleInst, Strategy, Txt } from './model';

export interface Finding {
  id: string;
  level: 'error' | 'hint';
  el: string | null;
  field: string | null;
  msg: Txt;
  fix: Txt;
  title: Txt;
}

const T = (de: string, en: string): Txt => ({ de, en });

export function scopeFor(s: Pick<Strategy, 'els' | 'params'>, lang: Lang, el?: El | null, orderPosition = false): Scope {
  return {
    lang, els: s.els, params: s.params, rulePars: [], self: el?.id, orderPosition: orderPosition || !!(el && el.mgmt !== null),
  };
}

function fieldLabel(el: El, id: string): Txt {
  const f = fieldsOf(el).find((x) => x.id === id);
  return f ? T(f.de, f.en) : T(id, id);
}

export function computeFindings(s: Strategy, lang: Lang): Finding[] {
  const out: Finding[] = [];
  const add = (f: Finding) => out.push(f);
  const incoming = new Set(s.conns.map((c) => c.to));
  const outgoing = new Set(s.conns.map((c) => c.from));
  const nm = (e: El) => `„${e.name}“`;

  for (const e of s.els) {
    const d = TYPES[e.type];
    if (!d) {
      add({
        id: `type:${e.id}`, level: 'error', el: e.id, field: null, title: T('Unbekannter Typ', 'Unknown type'),
        msg: T(`${nm(e)} hat einen Typ, den pipwerk Studio nicht kennt.`, `${nm(e)} has a type pipwerk Studio does not know.`),
        fix: T('Ersetzen Sie das Element durch ein Element aus der Elementbibliothek.', 'Replace the element with one from the element library.'),
      });
      continue;
    }
    if (isFlowEl(e.type) && !isTrigger(e.type) && !incoming.has(e.id)) {
      add({
        id: `noin:${e.id}`, level: 'error', el: e.id, field: null, title: T('Element ohne Verbindung', 'Element without connection'),
        msg: T(`${nm(e)} ist mit keinem vorherigen Schritt verbunden und wird nie erreicht.`, `${nm(e)} is not connected to a previous step and is never reached.`),
        fix: T('Ziehen Sie eine Linie vom unteren Anschluss eines vorherigen Schritts auf dieses Element. Oder wählen Sie den vorherigen Schritt und klicken Sie in der Bibliothek erneut.', 'Drag a line from the lower port of a previous step to this element. Or select the previous step and click in the library again.'),
      });
    }
    if (isTrigger(e.type) && !outgoing.has(e.id)) {
      add({
        id: `noout:${e.id}`, level: 'error', el: e.id, field: null, title: T('Auslöser ohne Verbindung', 'Trigger without connection'),
        msg: T(`Der Auslöser ${nm(e)} führt in keinen Ablauf.`, `The trigger ${nm(e)} does not lead into a flow.`),
        fix: T('Wählen Sie den Auslöser und klicken Sie in der Bibliothek den ersten Schritt, zum Beispiel „Bedingung“.', 'Select the trigger and click the first step in the library, for example "Condition".'),
      });
    }
    if ((isObjectEl(e.type) || d.named) && e.name.trim() === '') {
      add({
        id: `noname:${e.id}`, level: 'error', el: e.id, field: 'name', title: T('Name fehlt', 'Name missing'),
        msg: T('Ein Element hat keinen Namen.', 'An element has no name.'),
        fix: T('Geben Sie dem Element in der Eigenschaftenansicht einen Namen.', 'Give the element a name in the properties view.'),
      });
    }
    // parameters and order properties
    const rules = [...s.rules, ...e.rules];
    const determined = new Set(rules.filter((r) => r.determines).map((r) => r.determines as string));
    for (const f of fieldsOf(e)) {
      if (f.appliesWhen) {
        const g = e.bind[f.appliesWhen.id];
        if (!g || g.k !== 'fixed' || g.v !== f.appliesWhen.value) continue;
      }
      const b = e.bind[f.id];
      if (f.dtype === 'expression') continue;
      if (isUnset(b) && b?.k !== 'app') {
        const needed = f.required && !(f.section === 'order' && determined.has(f.id));
        if (needed && f.dtype !== 'instrument') {
          add({
            id: `req:${e.id}:${f.id}`, level: 'error', el: e.id, field: f.id, title: T('Pflichtparameter ohne Wert', 'Required parameter without value'),
            msg: T(`${nm(e)}: „${f.de}“ hat noch keinen Wert.`, `${nm(e)}: "${f.en}" has no value yet.`),
            fix: T(`Wählen Sie bei „${f.de}“ eine Belegung (zum Beispiel „Fester Wert“) und geben Sie den Wert ein.`, `Choose an assignment for "${f.en}" (for example "Fixed value") and enter the value.`),
          });
        }
      }
      if (b?.k === 'param' && !s.params.some((p) => p.id === b.id)) {
        add({
          id: `sp:${e.id}:${f.id}`, level: 'error', el: e.id, field: f.id, title: T('Strategieparameter fehlt', 'Strategy parameter missing'),
          msg: T(`${nm(e)}: Der Strategieparameter bei „${f.de}“ ist nicht mehr angelegt.`, `${nm(e)}: The strategy parameter at "${f.en}" no longer exists.`),
          fix: T('Wählen Sie einen angelegten Strategieparameter oder legen Sie einen neuen an.', 'Choose an existing strategy parameter or create a new one.'),
        });
      }
      if (b?.k === 'ref') {
        const sc = scopeFor(s, lang, e);
        const ps = problems({ t: 'ref', obj: b.obj, prop: b.prop }, sc);
        if (ps.length) {
          add({
            id: `ref:${e.id}:${f.id}`, level: 'error', el: e.id, field: f.id, title: T('Verbindung zu einem fehlenden Wert', 'Connection to a missing value'),
            msg: T(`${nm(e)}: „${f.de}“ ist mit einem Wert verbunden, den es nicht mehr gibt.`, `${nm(e)}: "${f.en}" is connected to a value that no longer exists.`),
            fix: T('Wählen Sie einen anderen Wert oder eine andere Belegung.', 'Choose another value or another assignment.'),
          });
        }
      }
    }
    // expressions of the element
    const sc = scopeFor(s, lang, e);
    for (const f of fieldsOf(e)) {
      const b = e.bind[f.id];
      if (!b || b.k !== 'expr') continue;
      checkExpr(e, f.id, fieldLabel(e, f.id), b.e, sc, f.dtype === 'expression' ? true : false, out);
    }
    if (e.own?.direction && e.type === 'Trend') {
      checkExpr(e, 'richtung', T('Richtung', 'Direction'), e.own.direction, sc, true, out);
    }
    for (const r of e.rules) checkRule(s, e, r, lang, out);
    // inputs that are not used
    for (const i of e.inputs) {
      const used = Object.values(e.bind).some((b) => b.k === 'expr' && refsOf(b.e).some((r) => r.obj === i.obj && r.prop === i.prop));
      if (!used) {
        const srcName = s.els.find((x) => x.id === i.obj)?.name ?? '?';
        add({
          id: `unused:${e.id}:${i.obj}:${i.prop}`, level: 'hint', el: e.id, field: null, title: T('Eingang nicht verwendet', 'Input not used'),
          msg: T(`${nm(e)}: Der Eingang „${srcName}“ ist verbunden, wird aber im Ausdruck nicht verwendet.`, `${nm(e)}: The input "${srcName}" is connected but not used in the expression.`),
          fix: T('Verwenden Sie den Wert in der Bedingung oder Berechnung oder entfernen Sie den Eingang.', 'Use the value in the condition or calculation or remove the input.'),
        });
      }
    }
  }

  // duplicate names
  const seen = new Map<string, El>();
  for (const e of s.els) {
    const d = TYPES[e.type];
    if (!d || !(isObjectEl(e.type) || d.named) || !e.name.trim()) continue;
    const k = normName(e.name);
    const first = seen.get(k);
    if (first) {
      add({
        id: `dup:${e.id}`, level: 'error', el: e.id, field: 'name', title: T('Name doppelt vergeben', 'Duplicate name'),
        msg: T(`Der Name ${nm(e)} wird zweimal verwendet. Ausdrücke könnten nicht unterscheiden, welches gemeint ist.`, `The name ${nm(e)} is used twice. Expressions could not tell which one is meant.`),
        fix: T('Geben Sie einem der beiden Elemente einen anderen Namen.', 'Give one of the two elements another name.'),
      });
    } else seen.set(k, e);
  }
  // strategy-level
  for (const p of s.params) {
    if (!p.atApplication && (p.value === '' || p.value === undefined)) {
      add({
        id: `spv:${p.id}`, level: 'error', el: null, field: `sp:${p.id}`, title: T('Strategieparameter ohne Wert', 'Strategy parameter without value'),
        msg: T(`Der Strategieparameter „${p.name}“ hat keinen Wert.`, `The strategy parameter "${p.name}" has no value.`),
        fix: T('Tragen Sie im Bereich „Strategieparameter“ einen Wert ein oder wählen Sie „bei der Anwendung“.', 'Enter a value in the "Strategy parameters" area or choose "at application".'),
      });
    }
  }
  for (const r of s.rules) checkRule(s, null, r, lang, out);

  // reachability of "place order"
  if (s.els.length > 0) {
    const reach = new Set<string>();
    const stack = s.els.filter((e) => isTrigger(e.type) && e.mgmt === null).map((e) => e.id);
    while (stack.length) {
      const id = stack.pop() as string;
      if (reach.has(id)) continue;
      reach.add(id);
      s.conns.filter((c) => c.from === id).forEach((c) => stack.push(c.to));
    }
    const ok = s.els.some((e) => e.type === 'flow.place_order' && e.mgmt === null && reach.has(e.id));
    if (!ok) {
      add({
        id: 'noorder', level: 'hint', el: null, field: null, title: T('Keine Order erreichbar', 'No order reachable'),
        msg: T('Von keinem Auslöser aus ist ein Schritt „Order aufgeben“ erreichbar. Die Strategie kann so keine Order stellen.', 'No "Place order" step can be reached from any trigger. The strategy cannot place an order like this.'),
        fix: T('Fügen Sie am Ende des Ablaufs „Order aufgeben“ aus der Gruppe „Bedingungen und Aktionen“ ein und verbinden Sie es mit dem vorherigen Schritt.', 'Add "Place order" from the group "Conditions and actions" at the end of the flow and connect it to the previous step.'),
      });
    }
  }
  return out;
}

function checkExpr(e: El, field: string, label: Txt, x: import('./model').Expr, sc: Scope, requireValue: boolean, out: Finding[]) {
  const nm = `„${e.name}“`;
  if (x.t === 'empty') {
    if (requireValue) {
      out.push({
        id: `empty:${e.id}:${field}`, level: 'error', el: e.id, field, title: T('Pflichtparameter ohne Wert', 'Required parameter without value'),
        msg: T(`${nm}: „${label.de}“ ist noch leer.`, `${nm}: "${label.en}" is still empty.`),
        fix: T('Stellen Sie die Bedingung oder Berechnung aus Bausteinen zusammen: Wählen Sie links einen Wert, den Vergleich und rechts den Vergleichswert.', 'Put the condition or calculation together from blocks: choose a value on the left, the comparison and the value on the right.'),
      });
    }
    return;
  }
  const ps = problems(x, sc);
  if (ps.length) {
    const emptyBlock = ps[0].de.includes('noch leer');
    out.push({
      id: `expr:${e.id}:${field}`, level: 'error', el: e.id, field, title: T('Fehlerhafter Ausdruck', 'Faulty expression'),
      msg: T(`${nm}: ${ps[0].de}`, `${nm}: ${ps[0].en}`),
      fix: emptyBlock
        ? T('Ein Baustein ist leer, zum Beispiel weil ein Objekt oder Strategieparameter entfernt wurde. Wählen Sie dort in den Bausteinen „Wert wählen …“ einen anderen Wert.', 'A block is empty, for example because an object or strategy parameter was removed. Choose another value at "Choose value …" in the blocks.')
        : T('Öffnen Sie die Ansicht „Ausdruck für Fortgeschrittene“: Die Fehlerstelle ist rot unterstrichen, beim Zeigen erscheint die Erklärung. Oder wählen Sie die Bausteine neu.', 'Open the view "Expression for advanced users": the faulty place is underlined in red, hover for the explanation. Or choose the blocks again.'),
    });
  }
}

function checkRule(s: Strategy, owner: El | null, r: RuleInst, lang: Lang, out: Finding[]) {
  if (r.builtin) return;
  const sc = { ...scopeFor(s, lang, owner, true), rulePars: (r.own?.params ?? []).map((p) => ({ id: p.id, name: p.name })) };
  if (r.kind === 'rule') {
    if (r.e.t === 'empty') {
      out.push({
        id: `rule:${r.id}`, level: 'error', el: owner?.id ?? null, field: `rule:${r.id}`, title: T('Regel ohne Ausdruck', 'Rule without expression'),
        msg: T(`Die Regel „${r.name}“ hat noch keinen Ausdruck.`, `The rule "${r.name}" has no expression yet.`),
        fix: T('Öffnen Sie die Regel und stellen Sie ihren Ausdruck aus Bausteinen zusammen.', 'Open the rule and put its expression together from blocks.'),
      });
    } else {
      const ps = problems(r.e, sc);
      if (ps.length) {
        out.push({
          id: `rule:${r.id}`, level: 'error', el: owner?.id ?? null, field: `rule:${r.id}`, title: T('Fehlerhafter Ausdruck', 'Faulty expression'),
          msg: T(`Regel „${r.name}“: ${ps[0].de}`, `Rule "${r.name}": ${ps[0].en}`),
          fix: T('Öffnen Sie die Regel und beheben Sie den Ausdruck.', 'Open the rule and fix the expression.'),
        });
      }
    }
  }
}

export function levelOf(fs: Finding[], elId: string): 'error' | 'hint' | null {
  const own = fs.filter((f) => f.el === elId);
  if (own.some((f) => f.level === 'error')) return 'error';
  if (own.length) return 'hint';
  return null;
}

export { tx, typeLabel };
