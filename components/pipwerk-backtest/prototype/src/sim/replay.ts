// The replay of a simulated run for the single-step test: a cursor over the evaluations and their
// steps, and the values of all objects as they were at the cursor.
import type { EvalRec, InstView, RunOutput, StepRec, Val, WorldRec } from './engine';
import { isActing } from './engine';

export interface Cursor {
  e: number;
  s: number;
}

export type JumpResult = 'acting' | 'breakpoint' | 'end';

export class Replayer {
  readonly out: RunOutput;
  private readonly resultIndex = new Map<string, { seq: number; value: Val }[]>();
  /** Evaluations with their index, grouped by time for the order of management and main flow. */
  constructor(out: RunOutput) {
    this.out = out;
    for (const ev of out.evals) {
      for (const st of ev.steps) {
        if (st.value !== undefined) {
          let arr = this.resultIndex.get(st.el);
          if (!arr) { arr = []; this.resultIndex.set(st.el, arr); }
          arr.push({ seq: st.seq, value: st.value });
        }
      }
    }
  }

  get evals(): EvalRec[] {
    return this.out.evals;
  }

  evalAt(c: Cursor): EvalRec {
    return this.out.evals[c.e];
  }

  stepAt(c: Cursor): StepRec | undefined {
    return this.out.evals[c.e]?.steps[c.s];
  }

  seqAt(c: Cursor): number {
    const ev = this.out.evals[c.e];
    if (!ev) return 0;
    return ev.steps[c.s]?.end ?? ev.seq0;
  }

  first(): Cursor {
    return { e: 0, s: 0 };
  }

  /** The first acting place of the test period, or null. */
  firstActing(): Cursor | null {
    const i = this.out.evals.findIndex((e) => e.acting);
    return i < 0 ? null : { e: i, s: 0 };
  }

  /** One step to the next element; at the end of an evaluation to the first element of the next one. */
  next(c: Cursor): Cursor | null {
    const ev = this.out.evals[c.e];
    if (!ev) return null;
    if (c.s + 1 < ev.steps.length) return { e: c.e, s: c.s + 1 };
    if (c.e + 1 < this.out.evals.length) return { e: c.e + 1, s: 0 };
    return null;
  }

  prev(c: Cursor): Cursor | null {
    if (c.s > 0) return { e: c.e, s: c.s - 1 };
    if (c.e > 0) {
      const pe = this.out.evals[c.e - 1];
      return { e: c.e - 1, s: Math.max(0, pe.steps.length - 1) };
    }
    return null;
  }

  /** Jump to the next acting place or breakpoint, whichever comes first. */
  jump(c: Cursor, breakpoints: ReadonlySet<string>): { cursor: Cursor; why: JumpResult } {
    let cur: Cursor | null = this.next(c);
    // the rest of the current evaluation only stops at breakpoints
    while (cur) {
      const ev = this.out.evals[cur.e];
      const st = ev.steps[cur.s];
      if (st && breakpoints.has(st.el)) return { cursor: cur, why: 'breakpoint' };
      if (cur.s === 0 && ev.acting && cur.e !== c.e) return { cursor: cur, why: 'acting' };
      cur = this.next(cur);
    }
    return { cursor: c, why: 'end' };
  }

  // ---- state at the cursor ----

  world(c: Cursor): WorldRec | null {
    const seq = this.seqAt(c);
    const w = this.out.worlds;
    let lo = 0;
    let hi = w.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (w[mid].seq <= seq) lo = mid + 1;
      else hi = mid;
    }
    return lo > 0 ? w[lo - 1] : null;
  }

  /** Last result of a condition or calculation at or before the cursor, and whether it was computed in this evaluation. */
  resultAt(elId: string, c: Cursor): { value: Val; fresh: boolean } | null {
    const arr = this.resultIndex.get(elId);
    if (!arr) return null;
    const seq = this.seqAt(c);
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].seq <= seq) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) return null;
    const rec = arr[lo - 1];
    const ev = this.out.evals[c.e];
    const fresh = ev ? ev.steps.some((s, i) => i <= c.s && s.seq === rec.seq) : false;
    return { value: rec.value, fresh };
  }

  /** Order or position of the instance the cursor's evaluation belongs to. */
  instAt(c: Cursor): InstView | null {
    const ev = this.out.evals[c.e];
    const w = this.world(c);
    if (!ev || !w || ev.inst === null) return null;
    return w.insts.find((i) => i.id === ev.inst) ?? null;
  }

  /** Account values at the cursor: balance, open profit or loss, equity. */
  account(c: Cursor): { balance: number; open: number; equity: number } {
    const w = this.world(c);
    const ev = this.out.evals[c.e];
    const balance = w ? w.balance : this.out.startCapital;
    let open = 0;
    if (w && ev) {
      const ins = this.out.engine.input.instr;
      for (const i of w.insts) {
        if (!i.posOpen || i.entry === null) continue;
        const dist = i.dir === 'buy' ? ev.bid - i.entry : i.entry - ev.ask;
        open += (dist / ins.tickgroesse) * ins.tickwert * i.vol;
      }
    }
    return { balance, open, equity: balance + open };
  }

  /** Property value of an object at the cursor. */
  valueOf(obj: string, prop: string, c: Cursor): { value: Val; fresh?: boolean } {
    const eng = this.out.engine;
    const ev = this.out.evals[c.e];
    if (!ev) return { value: null };
    const el = eng.byId.get(obj);
    const tf = ev.tf ?? eng.tfNow;
    if (el && (el.type === 'flow.condition' || el.type === 'flow.calculation')) {
      const r = this.resultAt(el.id, c);
      return { value: r ? r.value : null, fresh: r?.fresh };
    }
    if (el) return { value: eng.valueAt(obj, prop, ev.t, tf) };
    switch (obj) {
      case 'Kerze': return { value: eng.valueAt('Kerze', prop, ev.t, tf) };
      case 'Tick': return { value: prop === 'geld' ? ev.bid : prop === 'brief' ? ev.ask : prop === 'zeitpunkt' ? ev.t : null };
      case 'Konto': {
        const a = this.account(c);
        return { value: prop === 'kapital' ? a.equity : prop === 'waehrung' ? eng.input.account.currency : prop === 'freie_margin' ? a.equity : null };
      }
      case 'Instrument': return { value: eng.valueAt('Instrument', prop, ev.t, tf) };
      case 'Order': {
        const i = this.instAt(c);
        if (!i) return { value: null };
        switch (prop) {
          case 'status': return { value: i.status };
          case 'richtung': return { value: i.dir };
          case 'volumen': return { value: i.vol };
          case 'preis': return { value: i.price };
          case 'stop_loss': return { value: i.sl };
          case 'take_profit': return { value: i.tp };
          case 'order_id': return { value: i.tag };
          default: return { value: null };
        }
      }
      case 'Position': {
        const i = this.instAt(c);
        if (!i || !i.posOpen) return { value: null };
        switch (prop) {
          case 'richtung': return { value: i.dir };
          case 'volumen': return { value: i.vol };
          case 'einstiegspreis': return { value: i.entry };
          case 'stop_loss': return { value: i.sl };
          case 'take_profit': return { value: i.tp };
          default: return { value: null };
        }
      }
      case 'Strategie': {
        const w = this.world(c);
        if (!w) return { value: null };
        if (prop === 'wartende_orders') return { value: w.insts.filter((i) => i.status === 'wartend').length };
        if (prop === 'offene_positionen') return { value: w.insts.filter((i) => i.posOpen).length };
        if (prop === 'bezeichnung') return { value: eng.input.strategy.name };
        return { value: null };
      }
      default: return { value: null };
    }
  }

  /** Whether the element at the cursor is an acting element. */
  isActingStep(c: Cursor): boolean {
    const st = this.stepAt(c);
    if (!st) return false;
    const el = this.out.engine.byId.get(st.el);
    return !!el && isActing(el.type);
  }
}
