// The assistant for a new strategy: trigger, indicators, condition, order. Can be left at any time.
import { useState } from 'react';
import { ORDER_TYPES, TYPES, isObjectEl, tx, typeLabel } from './catalog';
import { propList } from './expr';
import type { Scope } from './expr';
import { newEl, newRuleFromTemplate, uniqueName, builtinTemplates, BUILTIN_RISK_ID } from './factory';
import type { Expr, El } from './model';
import { addParam, getState, removeEl, runCheck, setState, toast, update, useApp } from './store';
import { scopeFor } from './findings';
import { Btn, Icon, Select, TextInput, NumberInput, useL } from './ui';
import { ValueByType } from './fields';

const STEPS = 5;

export function Wizard() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const s = app.strategy;
  const wz = app.wizard;
  const [trig, setTrig] = useState<'trigger.candle_close' | 'trigger.tick'>('trigger.candle_close');
  const [unit, setUnit] = useState('h1');
  const [asParam, setAsParam] = useState(true);
  const [cmp, setCmp] = useState<'cross' | 'gt' | 'lt'>('cross');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [orderType, setOrderType] = useState('MarketOrder');
  const [dirVal, setDirVal] = useState('buy');
  const [risk, setRisk] = useState(true);
  if (!s || !wz) return null;
  const step = wz.step;
  const goto = (n: number) => setState({ wizard: { ...(getState().wizard as NonNullable<typeof wz>), step: n } });
  const patch = (p: Partial<NonNullable<typeof wz>>) => setState({ wizard: { ...(getState().wizard as NonNullable<typeof wz>), ...p } });
  const leave = () => setState({ wizard: null });
  const sc: Scope = scopeFor(s, lang);
  const unitParamId = () => s.params.find((p) => p.dtype === 'time_unit')?.id;

  const stepTitles = [
    L('Name', 'Name'), L('Auslöser', 'Trigger'), L('Indikatoren', 'Indicators'), L('Bedingung', 'Condition'), L('Order', 'Order'),
  ];

  const applyTrigger = () => {
    if (wz.trigger && getState().strategy?.els.some((e) => e.id === wz.trigger)) removeEl(wz.trigger);
    let pid: string | undefined;
    if (trig === 'trigger.candle_close' && asParam) {
      pid = unitParamId();
      if (pid) update((st) => { const p = st.params.find((x) => x.id === pid); if (p) p.value = unit; });
      else {
        pid = addParam(L('Zeiteinheit', 'Time unit'), 'time_unit');
        update((st) => { const p = st.params.find((x) => x.id === pid); if (p) p.value = unit; });
      }
    }
    let id = '';
    update((st) => {
      const el = newEl(trig, trig === 'trigger.tick' ? 'Tick' : L('Kerzenschluss', 'Candle close'));
      if (trig === 'trigger.candle_close') el.bind.zeiteinheit = pid ? { k: 'param', id: pid } : { k: 'fixed', v: unit };
      st.els.push(el);
      id = el.id;
    });
    patch({ trigger: id });
    setState({ sel: { k: 'el', id }, lastAdded: id });
  };

  const addIndicator = (type: string) => {
    let id = '';
    update((st) => {
      const base = type === 'EMA' ? 'EMA' : typeLabel(type, lang);
      const name = uniqueName(type === 'EMA' ? `EMA ${st.els.filter((e) => e.type === 'EMA').length === 0 ? 20 : 50}` : base, st.els.map((e) => e.name));
      const el = newEl(type, name);
      const pid = st.params.find((p) => p.dtype === 'time_unit')?.id;
      el.bind.zeiteinheit = pid ? { k: 'param', id: pid } : { k: 'fixed', v: unit };
      if (type === 'EMA') el.bind.periode = { k: 'fixed', v: st.els.filter((e) => e.type === 'EMA').length === 0 ? 20 : 50 };
      if (type === 'ATR') el.bind.periode = { k: 'fixed', v: 14 };
      st.els.push(el);
      id = el.id;
    });
    patch({ inds: [...(getState().wizard?.inds ?? []), id] });
    setState({ lastAdded: id });
  };

  const objects = s.els.filter((e) => isObjectEl(e.type));
  const optionList = objects.flatMap((o) => propList(o.id, sc).filter((p) => p.dtype === 'number').map((p) => ({ v: `${o.id}|${p.id}`, label: `${o.name} › ${tx(p, lang)}` })));

  const applyCondition = () => {
    if (wz.cond && getState().strategy?.els.some((e) => e.id === wz.cond)) removeEl(wz.cond);
    if (!a || !b) return;
    const [ao, ap] = a.split('|');
    const [bo, bp] = b.split('|');
    const ea: Expr = { t: 'ref', obj: ao, prop: ap };
    const eb: Expr = { t: 'ref', obj: bo, prop: bp };
    const expr: Expr = cmp === 'cross' ? { t: 'cross', a: ea, b: eb, dir: 'any' } : { t: 'bin', op: cmp === 'gt' ? '>' : '<', l: ea, r: eb };
    let id = '';
    update((st) => {
      const nameBase = cmp === 'cross' ? L('Kreuzen', 'Crossing') : L('Vergleich', 'Comparison');
      const el = newEl('flow.condition', uniqueName(nameBase, st.els.map((e) => e.name)));
      el.bind.ausdruck = { k: 'expr', e: expr };
      el.inputs = [{ obj: ao, prop: ap }, { obj: bo, prop: bp }].filter((x, i, arr) => arr.findIndex((y) => y.obj === x.obj && y.prop === x.prop) === i);
      st.els.push(el);
      id = el.id;
      // the condition is the first use of both indicators: they lie at it
      for (const oid of [ao, bo]) {
        const o = st.els.find((e) => e.id === oid);
        if (o && !o.host) o.host = el.id;
      }
      const t = wz.trigger ? st.els.find((e) => e.id === wz.trigger) : undefined;
      if (t) st.conns.push({ from: t.id, out: 'weiter', to: el.id });
    });
    patch({ cond: id });
    setState({ sel: { k: 'el', id }, lastAdded: id });
  };

  const applyOrder = () => {
    if (wz.order && getState().strategy?.els.some((e) => e.id === wz.order)) removeEl(wz.order);
    let id = '';
    update((st) => {
      const el = newEl('flow.place_order', L('Order aufgeben', 'Place order'));
      el.bind.ordertyp = { k: 'fixed', v: orderType };
      el.bind.richtung = { k: 'fixed', v: dirVal };
      if (orderType !== 'MarketOrder') el.bind.gueltigkeit = { k: 'fixed', v: 'bis_auf_widerruf' };
      st.els.push(el);
      id = el.id;
      const from = wz.cond ?? wz.trigger;
      const fe = from ? st.els.find((e) => e.id === from) : undefined;
      if (fe) st.conns.push({ from: fe.id, out: fe.type === 'flow.condition' ? 'wahr' : 'weiter', to: el.id });
      if (risk && !st.rules.some((r) => r.builtin === BUILTIN_RISK_ID)) {
        const t = builtinTemplates()[0];
        st.rules.push(newRuleFromTemplate(t, lang === 'en' ? 'Risk' : 'Risiko'));
      }
    });
    patch({ order: id });
    setState({ sel: { k: 'el', id }, wizard: null, lastAdded: id });
    runCheck();
    toast('Der Assistent ist fertig. Die Prüfung zeigt, was noch fehlt.', 'The assistant is done. The check shows what is still missing.');
  };

  const next = () => {
    if (step === 2) applyTrigger();
    if (step === 4) applyCondition();
    if (step === 5) { applyOrder(); return; }
    goto(step + 1);
  };

  return (
    <div className="props wizard" data-testid="wizard">
      <header className="props-head">
        <div className="badge b-trend"><Icon name="wand" size={20} /></div>
        <div className="props-title">
          <span className="props-kind">{L('Assistent', 'Assistant')} · {L(`Schritt ${step} von ${STEPS}`, `Step ${step} of ${STEPS}`)}</span>
          <h2>{stepTitles[step - 1]}</h2>
        </div>
      </header>
      <div className="wz-leave">
        <Btn kind="ghost" small icon="list" className="show-lib" onClick={() => setState({ panel: 'library' })} testid="wz-library" tip={L('Zeigt die Elementbibliothek. Der Assistent bleibt erhalten.', 'Shows the element library. The assistant stays open.')}>
          {L('Elementbibliothek zeigen', 'Show element library')}
        </Btn>
        <Btn kind="ghost" small icon="x" onClick={leave} testid="wz-leave" tip={L('Der Assistent hat bis hierher alles eingefügt. Sie arbeiten von Hand weiter.', 'The assistant has inserted everything up to here. You continue by hand.')}>
          {L('Ohne Assistent weiterarbeiten', 'Continue without assistant')}
        </Btn>
      </div>
      <ol className="steps" aria-label={L('Fortschritt', 'Progress')}>
        {stepTitles.map((t, i) => (
          <li key={t} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}><span>{i + 1}</span>{t}</li>
        ))}
      </ol>

      {step === 1 && (
        <div className="wz-body" data-testid="wz-step-1">
          <p>{L('Wie soll die Strategie heißen? Name und Beschreibung ändern Sie später jederzeit.', 'What should the strategy be called? You can change name and description at any time.')}</p>
          <label className="field"><span className="field-label">{L('Name', 'Name')}</span>
            <TextInput value={s.name} onChange={(v) => update((x) => { x.name = v; })} ariaLabel={L('Name der Strategie', 'Name of the strategy')} testid="wz-name" /></label>
          <label className="field"><span className="field-label">{L('Beschreibung', 'Description')}</span>
            <textarea className="input area" rows={3} value={s.description} onChange={(e) => update((x) => { x.description = e.target.value; })} aria-label={L('Beschreibung', 'Description')} /></label>
        </div>
      )}
      {step === 2 && (
        <div className="wz-body" data-testid="wz-step-2">
          <p>{L('Wann soll die Strategie rechnen? Der Auslöser startet jede Auswertung.', 'When should the strategy calculate? The trigger starts every evaluation.')}</p>
          <div className="choice-cards">
            <button type="button" className={trig === 'trigger.candle_close' ? 'on' : ''} onClick={() => setTrig('trigger.candle_close')} data-testid="wz-trigger-candle"><Icon name="clock" size={20} /><b>{L('Kerzenschluss', 'Candle close')}</b><span>{L('Bei jeder abgeschlossenen Kerze', 'At every completed candle')}</span></button>
            <button type="button" className={trig === 'trigger.tick' ? 'on' : ''} onClick={() => setTrig('trigger.tick')} data-testid="wz-trigger-tick"><Icon name="bolt" size={20} /><b>Tick</b><span>{L('Bei jedem neuen Kurs', 'At every new quote')}</span></button>
          </div>
          {trig === 'trigger.candle_close' && (
            <>
              <label className="field"><span className="field-label">{L('Zeiteinheit', 'Time unit')}</span>
                <ValueByType dtype="time_unit" value={unit} onChange={(v) => setUnit(String(v))} testid="wz-unit" /></label>
              <label className="toggle"><input type="checkbox" checked={asParam} onChange={(e) => setAsParam(e.target.checked)} /><span className="toggle-box">{asParam && <Icon name="check" size={13} />}</span><span>{L('Als Strategieparameter anlegen (empfohlen: so ändern Sie die Zeiteinheit an einer Stelle)', 'Create as strategy parameter (recommended: change the time unit in one place)')}</span></label>
            </>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="wz-body" data-testid="wz-step-3">
          <p>{L('Welche Indikatoren braucht die Strategie? Sie liegen auf der Fläche bei dem Element, das sie zuerst verwendet, hier der Bedingung.', 'Which indicators does the strategy need? They lie on the canvas at the element that uses them first, here the condition.')}</p>
          <div className="btn-row">
            {['EMA', 'ATR', 'ZigZag', 'Markttechnik'].map((t) => (
              <Btn key={t} icon="plus" testid={`wz-add-${t}`} onClick={() => addIndicator(t)}>{typeLabel(t, lang)}</Btn>
            ))}
          </div>
          {(wz.inds ?? []).map((id) => {
            const el = s.els.find((e) => e.id === id) as El | undefined;
            if (!el) return null;
            return (
              <div key={id} className="own-row" data-testid="wz-indicator">
                <TextInput value={el.name} onChange={(v) => update((x) => { const q = x.els.find((e) => e.id === id); if (q) q.name = v; })} ariaLabel={L('Name', 'Name')} />
                <span className="chip">{typeLabel(el.type, lang)}</span>
                {TYPES[el.type].params.some((p) => p.id === 'periode') && (
                  <NumberInput value={(el.bind.periode as { v?: number } | undefined)?.v ?? 0} onChange={(v) => update((x) => { const q = x.els.find((e) => e.id === id); if (q) q.bind.periode = { k: 'fixed', v: v === '' ? 0 : v }; })} ariaLabel={L('Periode', 'Period')} />
                )}
                <Btn kind="quiet" small icon="x" title={L('Entfernen', 'Remove')} onClick={() => { removeEl(id); patch({ inds: (getState().wizard?.inds ?? []).filter((x) => x !== id) }); }} />
              </div>
            );
          })}
          {(wz.inds ?? []).length === 0 && <p className="empty-note">{L('Noch kein Indikator. Sie können diesen Schritt auch überspringen.', 'No indicator yet. You can also skip this step.')}</p>}
        </div>
      )}
      {step === 4 && (
        <div className="wz-body" data-testid="wz-step-4">
          <p>{L('Wann soll gehandelt werden? Stellen Sie eine einfache Bedingung zusammen. Feinere Bedingungen bauen Sie später aus Bausteinen.', 'When should the strategy trade? Put together a simple condition. Finer conditions can be built later from blocks.')}</p>
          {optionList.length < 2 ? (
            <p className="hint-box"><Icon name="info" size={16} /><span>{L('Für eine Bedingung brauchen Sie zwei Werte. Gehen Sie zurück und legen Sie zwei Indikatoren an, oder überspringen Sie den Schritt.', 'A condition needs two values. Go back and create two indicators, or skip this step.')}</span></p>
          ) : (
            <>
              <label className="field"><span className="field-label">{L('Wert A', 'Value A')}</span>
                <Select value={a} onChange={setA} testid="wz-a"><option value="">{L('Wert wählen …', 'Choose value …')}</option>{optionList.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</Select></label>
              <label className="field"><span className="field-label">{L('Vergleich', 'Comparison')}</span>
                <Select value={cmp} onChange={(v) => setCmp(v as typeof cmp)} testid="wz-cmp"><option value="cross">{L('kreuzt', 'crosses')}</option><option value="gt">{L('ist größer als', 'is greater than')}</option><option value="lt">{L('ist kleiner als', 'is less than')}</option></Select></label>
              <label className="field"><span className="field-label">{L('Wert B', 'Value B')}</span>
                <Select value={b} onChange={setB} testid="wz-b"><option value="">{L('Wert wählen …', 'Choose value …')}</option>{optionList.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</Select></label>
            </>
          )}
        </div>
      )}
      {step === 5 && (
        <div className="wz-body" data-testid="wz-step-5">
          <p>{L('Was soll bei „wahr“ geschehen? Hier wählen Sie die Order. Feinheiten wie den Stop-Loss stellen Sie danach in den Eigenschaften ein.', 'What should happen on "true"? Choose the order here. Details such as the stop loss are set afterwards in the properties.')}</p>
          <label className="field"><span className="field-label">{L('Ordertyp', 'Order type')}</span>
            <Select value={orderType} onChange={setOrderType} testid="wz-ordertype">{ORDER_TYPES.map((o) => <option key={o.id} value={o.id}>{tx(o, lang)}</option>)}</Select></label>
          <label className="field"><span className="field-label">{L('Richtung', 'Direction')}</span>
            <Select value={dirVal} onChange={setDirVal} testid="wz-direction"><option value="buy">buy</option><option value="sell">sell</option></Select></label>
          <label className="toggle"><input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} /><span className="toggle-box">{risk && <Icon name="check" size={13} />}</span><span>{L('Regel „Risiko je Trade“ anwenden (bestimmt das Volumen)', 'Apply the rule "Risk per trade" (determines the volume)')}</span></label>
        </div>
      )}

      <footer className="wz-foot">
        <span className="spacer" />
        {step > 1 && <Btn kind="ghost" icon="left" onClick={() => goto(step - 1)} testid="wz-back">{L('Zurück', 'Back')}</Btn>}
        {step > 1 && step < STEPS && <Btn kind="quiet" onClick={() => goto(step + 1)} testid="wz-skip">{L('Überspringen', 'Skip')}</Btn>}
        <Btn kind="primary" onClick={next} testid="wz-next">{step === STEPS ? L('Fertig', 'Finish') : L('Weiter', 'Next')}</Btn>
      </footer>
    </div>
  );
}
