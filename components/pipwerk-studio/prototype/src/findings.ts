// Simulated consistency check: finds a few typical problems and says how to fix them.
// It runs in the browser on the model, nothing is calculated.
import { TYPES, fieldsOf, isFlowEl, isObjectEl, isTrigger, typeLabel, tx } from './catalog';
import { normName, problems, refsOf, sameMember } from './expr';
import type { Scope } from './expr';
import { containedEls, duplicateEntries, nameEntries, paramClashes } from './names';
import type { NameEntry } from './names';
import { collectUsage, flowElementOf, onEveryPath, placements } from './uses';
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

/** The names an expression of the strategy can address: the elements and, in the common namespace, the contained instances and rules. */
export function scopeFor(s: Pick<Strategy, 'els' | 'params'> & Partial<Pick<Strategy, 'rules'>>, lang: Lang, el?: El | null, orderPosition = false): Scope {
  return {
    lang, els: [...s.els, ...containedEls({ els: s.els, rules: s.rules ?? [] })], params: s.params, rulePars: [], self: el?.id,
    orderPosition: orderPosition || !!(el && el.mgmt !== null),
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
      const used = i.auto || Object.values(e.bind).some((b) => b.k === 'expr' && refsOf(b.e).some((r) => r.obj === i.obj && sameMember(r, i)));
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
  // one namespace: instances, contained instances, rules and rule sets, named steps (req-fach-055)
  const byIdAll = new Map(s.els.map((x) => [x.id, x]));
  const allEntries = nameEntries(s);
  const whereText = (x: NameEntry): Txt => {
    const parent = x.parent ? (byIdAll.get(x.parent)?.name ?? allEntries.find((y) => y.id === x.parent)?.name) : null;
    const owner = x.owner ? byIdAll.get(x.owner)?.name : null;
    if (x.kind === 'contained' || x.kind === 'contained-rule') return T(` (enthalten in „${parent ?? '?'}“)`, ` (contained in "${parent ?? '?'}")`);
    if (x.kind === 'rule') return owner ? T(` (Regel des Elements „${owner}“)`, ` (rule of the element "${owner}")`) : T(' (Regel der Strategie)', ' (rule of the strategy)');
    return T('', '');
  };
  for (const { entry, first } of duplicateEntries(s)) {
    const q = `„${entry.name}“`;
    const w = whereText(entry);
    const w1 = whereText(first);
    const rule = entry.kind === 'rule' || entry.kind === 'contained-rule';
    add({
      id: `dup:${entry.id}`, level: 'error', el: entry.owner, field: rule ? `rule:${entry.id}` : entry.kind === 'contained' ? 'own-includes' : 'name', title: T('Name doppelt vergeben', 'Duplicate name'),
      msg: T(
        `Der Name ${q}${w.de} wird in der Strategie mehr als einmal verwendet${w1.de ? `, auch${w1.de}` : ''}. Alle Instanzen, enthaltenen Instanzen, Regeln, Regelwerke und benannten Schritte teilen einen Namensraum, Ausdrücke könnten nicht unterscheiden, welches gemeint ist.`,
        `The name "${entry.name}"${w.en} is used more than once in the strategy${w1.en ? `, also${w1.en}` : ''}. All instances, contained instances, rules, rule sets and named steps share one namespace, expressions could not tell which one is meant.`,
      ),
      fix: T('Geben Sie einem der beiden in der Eigenschaftenansicht einen anderen Namen. Dasselbe Objekt mit anderen Parametern oder zu einem anderen Zeitpunkt ist eine eigene Instanz mit eigenem Namen, zum Beispiel „EMA20 Start“.', 'Give one of the two another name in the properties view. The same object with other parameters or at another time is an instance of its own with its own name, for example "EMA20 Start".'),
    });
  }
  for (const c of paramClashes(s)) {
    add({
      id: `duppar:${c.rule.id}:${c.param}`, level: 'error', el: c.owner, field: `rule:${c.rule.id}`, title: T('Name doppelt vergeben', 'Duplicate name'),
      msg: T(
        `Der Parameter „${c.param}“ der Regel „${c.rule.name}“ heißt wie „${c.entry.name}“ in der Strategie. Ein Parameter steht in Ausdrücken ohne Punkt, der Name wäre nicht eindeutig.`,
        `The parameter "${c.param}" of the rule "${c.rule.name}" has the same name as "${c.entry.name}" in the strategy. A parameter stands in expressions without a dot, so the name would be ambiguous.`,
      ),
      fix: T('Nennen Sie den Parameter oder die Instanz um. Öffnen Sie dazu die Regel beziehungsweise das Element in der Eigenschaftenansicht.', 'Rename the parameter or the instance. Open the rule or the element in the properties view for this.'),
    });
  }
  // instances: first use (req-fach-055)
  const usage = collectUsage(s);
  const places = placements(s, usage);
  const byId = new Map(s.els.map((x) => [x.id, x]));
  for (const e of s.els) {
    if (!isObjectEl(e.type) || places.has(e.id)) continue;
    add({
      id: `nohost:${e.id}`, level: 'error', el: e.id, field: 'host', title: T('Instanz ohne Verbindung zum Element ihrer ersten Verwendung', 'Instance without connection to the element of its first use'),
      msg: T(`${nm(e)} ist mit keinem Element verbunden. Ohne dieses Element steht nicht fest, wann ihre Werte ermittelt werden.`, `${nm(e)} is not connected to an element. Without it, it is not defined when its values are determined.`),
      fix: T('Ziehen Sie die Karte auf das Element, das sie zuerst verwendet. Oder wählen Sie in ihren Eigenschaften unter „Erste Verwendung“ das Element.', 'Drag the card onto the element that uses it first. Or choose the element in its properties under "First use".'),
    });
  }
  const reported = new Set<string>();
  for (const u of usage) {
    const pl = places.get(u.src);
    if (!pl || u.dst === pl.host || reported.has(`${u.src}>${u.dst}`)) continue;
    const hostFlow = flowElementOf(pl.host, places, byId);
    const userFlow = flowElementOf(u.dst, places, byId);
    if (!hostFlow || !userFlow || onEveryPath(s, hostFlow, userFlow)) continue;
    reported.add(`${u.src}>${u.dst}`);
    const obj = byId.get(u.src) as El;
    const user = byId.get(u.dst) as El;
    const host = byId.get(pl.host) as El;
    add({
      id: `path:${u.src}:${u.dst}`, level: 'error', el: u.dst, field: null, title: T('Verwendung auf einem Weg ohne die Stelle der ersten Verwendung', 'Use on a path that does not pass the place of the first use'),
      msg: T(`${nm(user)} verwendet ${nm(obj)}, aber nicht jeder Weg dorthin führt über ${nm(host)}, wo ${nm(obj)} zuerst verwendet wird. Dort würden ihre Werte nie ermittelt.`, `${nm(user)} uses ${nm(obj)}, but not every path leads there through ${nm(host)}, where ${nm(obj)} is used first. Its values would never be determined there.`),
      fix: T('Verbinden Sie die Instanz mit dem Element, das auf jedem Weg liegt. Oder legen Sie für diesen Zweig eine eigene Instanz an, zum Beispiel „EMA20 Start“ und „EMA20“.', 'Connect the instance to the element that lies on every path. Or create an instance of its own for this branch, for example "EMA20 Start" and "EMA20".'),
    });
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
        fix: T('Fügen Sie am Ende des Ablaufs „Order aufgeben“ aus der Gruppe „Aktionen“ ein und verbinden Sie es mit dem vorherigen Schritt.', 'Add "Place order" from the group "Actions" at the end of the flow and connect it to the previous step.'),
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
