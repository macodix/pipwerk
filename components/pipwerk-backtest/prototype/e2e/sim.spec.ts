import { expect, test } from '@playwright/test';
import { sampleStrategies } from '../src/samples';
import { runSync, summarize } from '../src/sim/engine';
import type { AccountVals } from '../src/sim/engine';
import { DAY, LAST_DAY, instrumentInfo } from '../src/sim/market';

// Own safeguard for the simulation behind the prototype: the three strategies must deliver what the
// prototype shows (handelnde Stellen, a rejected order, trades). No browser is involved.

const account: AccountVals = { capital: 10000, currency: 'USD', leverage: 30, spreadMode: 'candle', spreadFixed: 1.2, commission: 3.5 };
const strategies = sampleStrategies();

function go(sample: string, instr: string, days: number, trace: boolean, over: Record<string, string | number | boolean> = {}) {
  const s = strategies.find((x) => x.sample === sample);
  if (!s) throw new Error('strategy');
  const params: Record<string, string | number | boolean> = {};
  for (const p of s.params) params[p.id] = p.value;
  Object.assign(params, over);
  const t0 = Date.now();
  const out = runSync({
    strategy: s, params, instr: instrumentInfo(instr), brokerId: 'b1', account, from: LAST_DAY - (days - 1) * DAY, to: LAST_DAY, trace, manualStart: false,
  });
  const sm = summarize(out);
  const acting = out.evals.filter((e) => e.acting);
  console.log(sample, instr, days, 'ms', Date.now() - t0, 'evals', out.evals.length, 'acting', acting.length, 'trades', sm.trades, 'rejected', sm.rejected, 'net', sm.net.toFixed(2));
  return { out, sm, acting };
}

test('str-03, 30 days, delivers acting places and a rule of order of management and main flow', () => {
  const { out, acting } = go('str03', 'EURUSD', 30, true);
  console.log(acting.slice(0, 8).map((e) => `${new Date(e.t).toISOString().slice(5, 16)} ${e.flow ? 'M' : 'H'} ${e.steps.map((st) => `${st.el}>${st.out ?? ''}${st.reject ? '!' : ''}`).join(',')}`));
  expect(acting.length).toBeGreaterThan(1);
  expect(out.evals.length).toBeGreaterThan(100);
  // management is evaluated before the main flow at the same candle close
  const pairs = out.evals.filter((e, i) => i > 0 && e.t === out.evals[i - 1].t && out.evals[i - 1].flow !== null && e.flow === null && e.acting && out.evals[i - 1].acting);
  console.log('management before main flow, acting both:', pairs.map((e) => new Date(e.t).toISOString().slice(0, 16)));
  expect(pairs.length).toBeGreaterThan(0);
  // at the start the indicators have no values: the first crossing check counts as not satisfied
  const first = out.evals[0];
  console.log('first eval', first.steps.map((s) => `${s.el}>${s.out}${s.noValue ? ' (no value)' : ''}`));
  expect(first.steps.some((s) => s.noValue)).toBe(true);
});

test('str-03, two years', () => {
  const { sm } = go('str03', 'EURUSD', 730, false);
  console.log(JSON.stringify(sm));
  expect(sm.trades).toBeGreaterThan(5);
});

test('str-01, 30 days', () => {
  const { out, acting, sm } = go('str01', 'EURUSD', 30, true);
  console.log(acting.slice(0, 10).map((e) => `${new Date(e.t).toISOString().slice(5, 16)} ${e.kind} ${e.flow ? 'M' : 'H'} ${e.steps.map((st) => `${st.el}>${st.out ?? ''}${st.reject ? '!' : ''}`).join(',')}`));
  console.log(out.rejections.slice(0, 5).map((r) => `${new Date(r.t).toISOString().slice(5, 16)} ${r.elName}: ${r.reason.de}`));
  console.log(JSON.stringify(sm));
  expect(acting.length).toBeGreaterThan(0);
  expect(out.rejections.length).toBeGreaterThan(0);
  const first = out.evals[0];
  console.log('first eval', first.steps.map((s) => `${s.el}>${s.out}${s.noValue ? ' (no value)' : ''}`));
  expect(first.steps.some((s) => s.noValue)).toBe(true);
});

test('str-01, two years', () => {
  const { sm } = go('str01', 'EURUSD', 730, false);
  console.log(JSON.stringify(sm));
  expect(sm.trades).toBeGreaterThan(3);
});

test('strategy of the client, 30 days', () => {
  const { out, acting } = go('auftraggeber', 'EURUSD', 30, true);
  console.log(acting.slice(0, 5).map((e) => `${new Date(e.t).toISOString().slice(5, 16)} ${e.steps.map((st) => `${st.el}>${st.out ?? ''}${st.reject ? '!' : ''}`).join(',')}`));
  console.log(out.rejections.slice(0, 3).map((r) => r.reason.de));
});
