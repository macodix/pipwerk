// Own view of a template (indicator, trend, rule, rule set) with Save, Check, Close, Delete.
// The open strategy stays open behind it.
import { DTYPE_LABEL, TYPES, fieldTip, fieldsOf, propsOf, tx, typeLabel } from './catalog';
import { problems } from './expr';
import type { Scope } from './expr';
import { FieldRow } from './fields';
import { FindingsBox } from './Properties';
import { OwnEditor, RuleBody, ownScope } from './OwnEditor';
import type { Finding } from './findings';
import { templateDescription, templateName } from './factory';
import type { OwnDef, Template } from './model';
import { closeTemplate, saveTemplate, setState, updateTemplate, useApp } from './store';
import { Btn, Icon, Section, TextInput, useL } from './ui';

const T = (de: string, en: string) => ({ de, en });

export function checkTemplate(t: Template, lang: import('./model').Lang): Finding[] {
  const out: Finding[] = [];
  const own: OwnDef = t.own ?? { params: [], props: [], includes: [], rules: [] };
  const sc = ownScope(own, lang, t.kind === 'rule');
  const add = (id: string, level: 'error' | 'hint', title: ReturnType<typeof T>, msg: ReturnType<typeof T>, fix: ReturnType<typeof T>, field: string | null = null) =>
    out.push({ id, level, el: null, field, title, msg, fix });
  if (!t.name.trim()) {
    add('name', 'error', T('Name fehlt', 'Name missing'), T('Die Vorlage hat keinen Namen.', 'The template has no name.'), T('Geben Sie der Vorlage oben einen Namen.', 'Give the template a name at the top.'));
  }
  const chk = (e: import('./model').Expr, scope: Scope, label: string, id: string) => {
    if (e.t === 'empty') {
      add(id, 'error', T('Pflichtparameter ohne Wert', 'Required parameter without value'), T(`„${label}“ ist noch leer.`, `"${label}" is still empty.`), T('Stellen Sie den Ausdruck aus Bausteinen zusammen.', 'Put the expression together from blocks.'));
      return;
    }
    const ps = problems(e, scope);
    if (ps.length) add(id, 'error', T('Fehlerhafter Ausdruck', 'Faulty expression'), T(`„${label}“: ${ps[0].de}`, `"${label}": ${ps[0].en}`), T('Öffnen Sie „Ausdruck für Fortgeschrittene“: Die Fehlerstelle ist rot unterstrichen.', 'Open "Expression for advanced users": the faulty place is underlined in red.'));
  };
  if (t.kind === 'rule' && !t.builtin) chk(t.e, ownScope(own, lang, true), t.name || 'Regel', 'rule');
  if (t.kind === 'trend') chk(own.direction ?? { t: 'empty' }, sc, lang === 'en' ? 'Direction' : 'Richtung', 'direction');
  if (t.kind === 'indicator' && t.type === 'Indikator') {
    if (own.props.length === 0) add('noprops', 'hint', T('Keine Eigenschaft', 'No property'), T('Der Indikator liefert noch keinen Wert.', 'The indicator does not deliver a value yet.'), T('Legen Sie unter „Eigene Eigenschaften“ einen Wert an.', 'Create a value under "Own properties".'));
    own.props.forEach((p) => chk(p.e, sc, p.name, `prop:${p.id}`));
  }
  if (t.kind === 'trend') own.props.forEach((p) => chk(p.e, sc, p.name, `prop:${p.id}`));
  if (t.kind === 'ruleset' && own.rules.length === 0) {
    add('norules', 'hint', T('Keine Regel', 'No rule'), T('Das Regelwerk enthält noch keine Regel.', 'The rule set contains no rule yet.'), T('Fügen Sie unten eine Regel hinzu.', 'Add a rule below.'));
  }
  return out;
}

export function TemplateView() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const v = app.tplView;
  if (!v) return null;
  const t = v.tpl;
  const ro = !!t.builtin;
  const isType = t.id.startsWith('type:');
  const findings = v.checked ? checkTemplate(t, lang) : [];
  const kindLabel = { indicator: L('Indikator', 'Indicator'), trend: L('Trend', 'Trend'), rule: L('Regel', 'Rule'), ruleset: L('Regelwerk', 'Rule set') }[t.kind];
  const own: OwnDef = t.own ?? { params: [], props: [], includes: [], rules: [] };
  const baseType = TYPES[t.type];
  const set = (fn: (x: Template) => void) => updateTemplate(fn);
  const sc: Scope = { lang, els: [], params: [], rulePars: [], orderPosition: false };

  return (
    <div className="props template-view" data-testid="template-view">
      <header className="props-head">
        <div className="badge b-rule"><Icon name={t.kind === 'ruleset' ? 'layers' : t.kind === 'rule' ? 'shield' : t.kind === 'trend' ? 'trend' : 'wave'} size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{L('Vorlage', 'Template')} · {kindLabel}{ro && <span className="lock-tag"><Icon name="lock" size={12} />{L('mitgeliefert', 'delivered')}</span>}</span>
          <TextInput value={ro ? (isType ? typeLabel(t.type, lang) : templateName(t, lang)) : t.name} onChange={(x) => set((q) => { q.name = x; })} ariaLabel={L('Name der Vorlage', 'Name of the template')} testid="template-name" className="title-input" />
        </div>
      </header>
      {ro && (
        <p className="hint-box" data-testid="template-readonly">
          <Icon name="lock" size={16} />
          <span>{L('Mitgelieferte Vorlagen sind in jeder Installation gleich und lassen sich nicht ändern oder löschen. Eine Abwandlung legen Sie als neue Vorlage an („Neues Objekt …“).', 'Delivered templates are the same in every installation and cannot be changed or deleted. Create a variation as a new template ("New object …").')}</span>
        </p>
      )}
      <div className="tpl-actions" role="toolbar" aria-label={L('Vorlage', 'Template')}>
        <Btn kind="primary" icon="save" testid="template-save" disabled={ro} onClick={saveTemplate}>{L('Speichern', 'Save')}</Btn>
        <Btn icon="check" testid="template-check" onClick={() => setState({ tplView: { ...v, checked: true } })}>{L('Prüfen', 'Check')}</Btn>
        <Btn icon="x" testid="template-close" onClick={closeTemplate}>{L('Schließen', 'Close')}</Btn>
        <Btn icon="trash" kind="danger" testid="template-delete" disabled={ro || v.isNew} tip={ro ? L('Mitgelieferte Vorlagen lassen sich nicht löschen', 'Delivered templates cannot be deleted') : undefined} onClick={() => setState({ dialog: { k: 'deleteTemplate', id: t.id } })}>{L('Löschen', 'Delete')}</Btn>
      </div>
      {v.dirty && !ro && <p className="muted" data-testid="template-dirty">{L('Ungespeicherte Änderungen', 'Unsaved changes')}</p>}
      {v.checked && findings.length === 0 && <p className="ok-note"><Icon name="check" size={16} />{L('Keine Befunde. Die Vorlage ist stimmig.', 'No findings. The template is consistent.')}</p>}
      {findings.length > 0 && <FindingsBox items={findings} />}
      <fieldset className="plain" disabled={ro}>
        <Section title={L('Beschreibung', 'Description')}>
          <textarea className="input area" rows={3} value={ro ? (isType ? fieldTip(`type:${t.type}`, lang, 'f') ?? '' : templateDescription(t, lang)) : t.description} onChange={(e) => set((q) => { q.description = e.target.value; })} aria-label={L('Beschreibung', 'Description')} data-testid="template-description" placeholder={L('Wofür ist diese Vorlage gut?', 'What is this template good for?')} />
        </Section>
        {t.kind === 'indicator' && t.type === 'Indikator' && <OwnEditor kind="indicator" own={own} lang={lang} onChange={(o) => set((q) => { q.own = o; })} />}
        {t.kind === 'trend' && <OwnEditor kind="trend" own={own} lang={lang} onChange={(o) => set((q) => { q.own = o; })} />}
        {t.kind === 'ruleset' && <OwnEditor kind="ruleset" own={own} lang={lang} onChange={(o) => set((q) => { q.own = o; })} />}
        {t.kind === 'rule' && <RuleBody rule={t} lang={lang} builtin={ro} onChange={(fn) => set((q) => fn(q as never))} />}
        {t.kind === 'indicator' && t.type !== 'Indikator' && baseType && (
          <Section title={L('Standardwerte der Einstellungen', 'Default values of the settings')} testid="tpl-defaults">
            <p className="muted">{L(`Objekttyp ${typeLabel(t.type, lang)}. Instanzen aus dieser Vorlage übernehmen diese Werte; sie lassen sich in der Strategie ändern.`, `Object type ${typeLabel(t.type, lang)}. Instances from this template take these values; they can be changed in the strategy.`)}</p>
            {fieldsOf({ type: t.type, bind: t.defaults, own: null }).filter((f) => f.dtype !== 'instrument').map((f) => (
              <FieldRow key={f.id} f={{ ...f, bindings: ['fixed'], required: false }} b={t.defaults[f.id]} sc={sc} onChange={(b) => set((q) => { q.defaults[f.id] = b; })}
                unsetNote={L('Kein Standardwert: Wer die Vorlage verwendet, belegt diese Angabe.', 'No default value: whoever uses the template assigns this entry.')} />
            ))}
          </Section>
        )}
        {isType && baseType && propsOf({ type: t.type, own: null, name: t.name }).length > 0 && (
          <Section title={L('Liefert', 'Delivers')} testid="tpl-delivers">
            <ul className="prop-list">
              {propsOf({ type: t.type, own: null, name: t.name }).map((p) => (
                <li key={p.id} className="prop-row" data-tip={fieldTip(p.id, lang, 'p')}>
                  <span className="prop-name">{tx(p, lang)}</span>
                  <span className="dtype-chip">{tx(DTYPE_LABEL[p.dtype], lang)}</span>
                  {p.choices && <span className="prop-values">{p.choices.map((c) => tx(c, lang)).join(' · ')}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </fieldset>
    </div>
  );
}
