import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { requestExpressions, type ExpressionAnswer, type ExpressionQuery } from '../api/objects';
import { referencesOfBlocks } from '../arrange/input';
import type { StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { bindingPointer, bindingSlot } from '../model/describe';
import type { ExpressionReference } from '../model/elements';

/**
 * The expressions of a strategy as the backend reads them (specification E2): a sentence for the drawing area and the
 * properties view, the blocks for the values an expression uses. The user interface neither parses nor evaluates an
 * expression.
 */

export type ExpressionSlot = { elementId: string; slot: string; query: ExpressionQuery };

/** Every expression of the elements of the document with its place. */
export function expressionSlots(document: StrategyDocument): ExpressionSlot[] {
  const found: ExpressionSlot[] = [];
  document.elements.forEach((element, index) => {
    const records: ['parameters' | 'properties' | 'instance', Record<string, { kind: string; value?: unknown }> | undefined][] = [
      ['parameters', element.parameters],
      ['properties', element.properties],
      ['instance', element.instance?.parameter_values],
    ];
    for (const [scope, record] of records) {
      for (const [key, binding] of Object.entries(record ?? {})) {
        if (binding.kind === 'expression' && typeof binding.value === 'string' && binding.value !== '') {
          found.push({
            elementId: element.id,
            slot: bindingSlot(element.id, scope, key),
            query: { pointer: bindingPointer(index, scope, key), stored: binding.value },
          });
        }
      }
    }
  });
  return found;
}

/** The parts of the document that decide what an expression says; moving a step or folding a frame does not. */
function signature(document: StrategyDocument): string {
  return JSON.stringify([
    document.parameters,
    document.rules,
    document.elements.map((element) => [
      element.id,
      element.type,
      element.name,
      element.key,
      element.parameters,
      element.properties,
      element.instance,
      element.rules,
    ]),
  ]);
}

export type Expressions = {
  /** The answer for the expression of an assignment (see `bindingSlot`). */
  answer: (slot: string) => ExpressionAnswer | undefined;
  /** Per element the values of objects that its expressions address. */
  references: ReadonlyMap<string, readonly ExpressionReference[]>;
};

const none: Expressions = { answer: () => undefined, references: new Map() };

/** A value that follows `value` after `delay` milliseconds without a change. */
function useDelayed<T>(value: T, delay: number): T {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDelayed(value);
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);
  return delayed;
}

/**
 * Asks the backend for the sentences and blocks of all expressions of the open strategy, a short time after the last
 * change. While the answer is on its way the previous answers stay.
 */
export function useExpressions(document: StrategyDocument | null, language: SupportedLanguage, enabled: boolean): Expressions {
  const current = useMemo(() => (document === null ? null : { document, sign: signature(document) }), [document]);
  const settled = useDelayed(current, 250);
  const sign = settled?.sign ?? '';
  const query = useQuery({
    queryKey: ['expressions', language, sign],
    queryFn: async ({ signal }) => {
      const slots = settled === null ? [] : expressionSlots(settled.document);
      const answers =
        settled === null || slots.length === 0
          ? []
          : await requestExpressions(settled.document, language, slots.map((item) => item.query), signal);
      return { slots, answers };
    },
    enabled: enabled && settled !== null,
    retry: false,
    networkMode: 'always',
    placeholderData: keepPreviousData,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return useMemo(() => {
    const data = query.data;
    if (data === undefined) {
      return none;
    }
    const bySlot = new Map<string, ExpressionAnswer>();
    const references = new Map<string, ExpressionReference[]>();
    data.slots.forEach((item, index) => {
      const answer = data.answers[index];
      if (answer === undefined) {
        return;
      }
      bySlot.set(item.slot, answer);
      const list = references.get(item.elementId) ?? [];
      list.push(...referencesOfBlocks(answer.blocks));
      references.set(item.elementId, list);
    });
    return { answer: (slot: string) => bySlot.get(slot), references };
  }, [query.data]);
}
