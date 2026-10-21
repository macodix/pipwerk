// Short readable texts for elements on the canvas.
import { ORDER_TYPES, TYPES, choiceLabel, fieldsOf, tx } from './catalog';
import { describe, objOf, propLabel } from './expr';
import type { Scope } from './expr';
import type { Binding, El, Lang, Strategy } from './model';
import type { Field } from './catalog';

export function bindingText(b: Binding | undefined, f: Pick<Field, 'dtype' | 'choices'>, s: Pick<Strategy, 'params'>, sc: Scope): string {
  const lang = sc.lang;
  if (!b || b.k === 'unset') return '–';
  switch (b.k) {
    case 'fixed': {
      if (f.dtype === 'choice') return choiceLabel(f.choices, String(b.v), lang);
      if (f.dtype === 'time_unit') return String(b.v).toUpperCase();
      if (f.dtype === 'percent' && typeof b.v === 'number') return `${Math.round(b.v * 10000) / 100} %`;
      return String(b.v);
    }
    case 'param': {
      const p = s.params.find((x) => x.id === b.id);
      if (!p) return '?';
      const v = p.atApplication ? (lang === 'en' ? 'at application' : 'bei Anwendung') : p.dtype === 'time_unit' ? String(p.value).toUpperCase() : String(p.value);
      return `${p.name} (${v})`;
    }
    case 'ref': {
      const o = objOf(b.obj, sc);
      return o ? `${o.el?.name ?? ''} › ${propLabel(b.obj, b.prop, sc)}` : '?';
    }
    case 'expr': return describe(b.e, sc);
    case 'app': return lang === 'en' ? 'at application' : 'bei Anwendung';
  }
}

export function summaryOf(el: El, s: Strategy, sc: Scope): string {
  const lang: Lang = sc.lang;
  const de = lang === 'de';
  const fields = fieldsOf(el);
  const fld = (id: string) => fields.find((f) => f.id === id);
  const txt = (id: string) => {
    const f = fld(id);
    return f ? bindingText(el.bind[id], f, s, sc) : '–';
  };
  switch (el.type) {
    case 'trigger.candle_close': return `${de ? 'Bei jedem Kerzenschluss' : 'At every candle close'}, ${de ? 'Zeiteinheit' : 'time unit'} ${txt('zeiteinheit')}`;
    case 'trigger.tick': return de ? 'Bei jedem neuen Kurs' : 'At every new quote';
    case 'trigger.manual': return de ? 'Einmal, von Hand ausgelöst' : 'Once, triggered by hand';
    case 'flow.condition':
    case 'flow.calculation': {
      const b = el.bind.ausdruck;
      if (!b || b.k !== 'expr' || b.e.t === 'empty') return de ? 'Noch leer – wählen Sie die Bausteine.' : 'Still empty – choose the blocks.';
      return describe(b.e, sc);
    }
    case 'flow.place_order': {
      const ot = el.bind.ordertyp;
      const label = ot && ot.k === 'fixed' ? tx(ORDER_TYPES.find((o) => o.id === ot.v) ?? { de: String(ot.v), en: String(ot.v) }, lang) : '?';
      const dirText = txt('richtung');
      return `${label}${dirText !== '–' ? `, ${de ? 'Richtung' : 'direction'}: ${dirText}` : ''}`;
    }
    case 'flow.delete_order': return de ? 'Löscht die wartende Order' : 'Deletes the pending order';
    case 'flow.close_position': {
      const v = txt('volumen');
      return v === '–' ? (de ? 'Schließt die Position ganz' : 'Closes the position completely') : `${de ? 'Schließt Volumen' : 'Closes volume'} ${v}`;
    }
    case 'flow.modify_order':
    case 'flow.modify_position': {
      const parts = fields.filter((f) => el.bind[f.id] && el.bind[f.id].k !== 'unset').map((f) => `${tx(f, lang)} ← ${txt(f.id)}`);
      return parts.length ? parts.join('; ') : de ? 'Noch nichts zu ändern festgelegt' : 'Nothing to change defined yet';
    }
    default: return TYPES[el.type] ? tx(TYPES[el.type], lang) : el.type;
  }
}

export function cardSubtitle(el: El, s: Strategy, sc: Scope): string {
  const fields = fieldsOf(el).filter((f) => ['zeiteinheit', 'periode', 'depth'].includes(f.id) || f.id.startsWith('own:'));
  const parts: string[] = [];
  for (const f of fields.slice(0, 3)) {
    const b = el.bind[f.id];
    if (!b || b.k === 'unset') continue;
    let v: string;
    if (b.k === 'param') {
      const p = s.params.find((x) => x.id === b.id);
      v = p ? (p.atApplication ? '…' : p.dtype === 'time_unit' ? String(p.value).toUpperCase() : String(p.value)) : '?';
    } else v = bindingText(b, f, s, sc);
    parts.push(f.id === 'zeiteinheit' ? v : `${tx(f, sc.lang)} ${v}`);
  }
  return parts.join(' · ');
}
