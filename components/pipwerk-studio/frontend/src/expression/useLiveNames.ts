import { useEffect, useMemo, useRef, useState } from 'react';

import { checkDocument, type NameOccurrence } from '../api/objects';
import type { StrategyDocument } from '../document/types';
import { expressionText, placeKey, placeOf, type ExpressionPlace } from './fields';

/**
 * Pause after the last change of the document before the names of the
 * expressions are asked for, so that not every key press sends a request.
 */
export const NAMES_DEBOUNCE_MS = 400;

/** The names that the check recognized in an expression, with the text they belong to. */
export type RecognizedNames = { text: string; names: NameOccurrence[] };

export type LiveNames = {
  /** The names recognized in the expression at a place; `undefined` if there are none for its current text. */
  namesFor(place: ExpressionPlace, currentText: string): NameOccurrence[] | undefined;
};

/**
 * The document without the positions of its elements: a move on the drawing
 * area does not change any name. Only the position fields `x` and `y` of the
 * elements are left out; a binding named `x` or `y` counts.
 */
function semanticKey(document: StrategyDocument): string {
  const elements = document.elements.map((element) => {
    const { x: _x, y: _y, ...rest } = element;
    return rest;
  });
  return JSON.stringify({ ...document, elements });
}

/**
 * Asks the backend (`POST /api/v1/check`) for the names in the expressions of
 * the open strategy after a pause. An older answer never replaces a newer one:
 * a new change aborts the request that is running, and an answer counts only
 * for the request that was sent last.
 */
export function useLiveNames(document: StrategyDocument | null): LiveNames {
  const [recognized, setRecognized] = useState<ReadonlyMap<string, RecognizedNames>>(new Map());
  const latest = useRef(0);
  const documentRef = useRef(document);
  documentRef.current = document;
  const key = useMemo(() => (document === null ? null : semanticKey(document)), [document]);

  useEffect(() => {
    if (key === null) {
      latest.current += 1;
      setRecognized(new Map());
      return undefined;
    }
    const sent = documentRef.current;
    if (sent === null) {
      return undefined;
    }
    const controller = new AbortController();
    const sequence = latest.current + 1;
    latest.current = sequence;
    const timer = setTimeout(() => {
      checkDocument(sent, controller.signal)
        .then((result) => {
          if (latest.current !== sequence) {
            return;
          }
          const entries = new Map<string, RecognizedNames>();
          for (const expression of result.expressions) {
            const place = placeOf(expression);
            const text = expressionText(sent, place);
            if (text !== undefined) {
              entries.set(placeKey(place), { text, names: expression.names });
            }
          }
          setRecognized(entries);
        })
        .catch(() => {
          // Without the names the expression is shown as it was typed.
        });
    }, NAMES_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return useMemo(
    () => ({
      namesFor(place, currentText) {
        const entry = recognized.get(placeKey(place));
        return entry !== undefined && entry.text === currentText ? entry.names : undefined;
      },
    }),
    [recognized],
  );
}
