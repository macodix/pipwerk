import { TYPES } from './catalog';

/** The colour class of an element type, as in the strategy designer. */
export const kindClass = (type: string): string => {
  const d = TYPES[type];
  if (!d) return 'unknown';
  if (d.kind === 'trigger') return 'trg';
  if (d.id === 'flow.condition') return 'cond';
  if (d.id === 'flow.calculation' || d.id === 'flow.set_parameter') return 'calc';
  if (d.id === 'flow.place_order') return 'order';
  if (d.kind === 'flow') return 'act';
  if (d.kind === 'app') return 'app';
  if (d.kind === 'trend' || d.id === 'Markttechnik') return 'trend';
  return 'ind';
};
