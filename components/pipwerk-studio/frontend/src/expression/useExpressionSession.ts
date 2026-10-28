import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { requestExpressions, type ExpressionAnswer, type ExpressionQuery } from '../api/objects';
import { placePointer, placeStored, setPlaceStored, type ExpressionPlace } from '../document/places';
import type { StrategyDocument } from '../document/types';
import { useStudio } from '../state/StudioContext';
import { documentSignature } from '../state/useExpressions';
import { EMPTY, hasEmptyPlace, type Block } from './blocks';
import { ownerElement, withInputs } from './inputs';

/**
 * The state of the editor of one expression at one place (specification 5.4). The expression itself lives in the
 * document; what it says (blocks, tokens, findings, the names visible at the place) the expression endpoint tells.
 * A change in the blocks or in the formula goes through the endpoint, which forms the stored expression; only that
 * is written to the document. The user interface neither parses nor forms an expression (E2).
 */

export type ExpressionSession = {
  /** The place is not in the document (any more). */
  missing: boolean;
  stored: string;
  /** The answer for the stored expression; `undefined` until the endpoint has answered. */
  answer: ExpressionAnswer | undefined;
  /** The blocks to show: the draft of the user, else the blocks of the answer; `null` for an expression with a typing error. */
  tree: Block | null;
  setTree: (tree: Block) => void;
  /** The text of the formula view (display form). */
  text: string;
  setText: (text: string) => void;
  /** The answer for the text shown, with tokens and findings that refer to exactly this text. */
  formula: ExpressionAnswer | undefined;
  /** Follow the stored expression again (after the formula view lost the focus). */
  settle: () => void;
  /** The last change could not be turned into an expression. */
  failed: boolean;
  /**
   * A change is on its way (the endpoint has not formed it yet) or the answer for the stored expression has not arrived:
   * the sentence and with it the layout below it may still change.
   */
  pending: boolean;
};

const FORMULA_DELAY_MS = 200;

export function useExpressionSession(place: ExpressionPlace): ExpressionSession {
  const { studio, types } = useStudio();
  const document = studio.state.document;
  const language = studio.language;
  const documentRef = useRef(document);
  documentRef.current = document;
  const placeRef = useRef(place);
  placeRef.current = place;
  const typesRef = useRef(types);
  typesRef.current = types;

  const pointer = document === null ? null : placePointer(document, place);
  const stored = document === null ? '' : placeStored(document, place);
  const sign = useMemo(() => documentSignature(document), [document]);

  const query = useQuery({
    queryKey: ['expression', language, sign, pointer, stored],
    queryFn: async ({ signal }) => {
      const answers = await requestExpressions(document as StrategyDocument, language, [{ pointer: pointer as string, stored }], signal);
      return answers[0] as ExpressionAnswer;
    },
    enabled: document !== null && pointer !== null && types !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  });
  const answer = query.data;

  const [draft, setDraft] = useState<Block | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [formula, setFormula] = useState<{ text: string; answer: ExpressionAnswer } | null>(null);
  const [failed, setFailed] = useState(false);
  const [changing, setChanging] = useState(0);
  const emitted = useRef<string | null>(null);
  const sequence = useRef(0);
  const inflight = useRef(0);
  const timer = useRef<number | null>(null);

  // A change from outside (rename, another editor, undo of the document) ends what the user had in progress here.
  useEffect(() => {
    if (emitted.current !== null && stored !== emitted.current) {
      emitted.current = null;
      setDraft(null);
      setTyped(null);
      setFormula(null);
    }
  }, [stored]);

  // Once the answer for what was written has arrived, the blocks follow the answer again. An unfinished tree stays as the
  // user made it: with empty places the expression text cannot tell what was meant (a crossing becomes two comparisons).
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    if (answer !== undefined && answer.stored === emitted.current && inflight.current === 0 && !(draftRef.current !== null && hasEmptyPlace(draftRef.current))) {
      setDraft(null);
    }
  }, [answer]);

  const waiting = useRef<(() => void) | null>(null);
  const endWaiting = useCallback(() => {
    waiting.current?.();
    waiting.current = null;
  }, []);
  const trackChange = studio.actions.trackChange;

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      endWaiting();
    },
    [endWaiting],
  );

  const convert = useCallback(
    async (part: Pick<ExpressionQuery, 'stored' | 'display' | 'blocks'>): Promise<ExpressionAnswer | null> => {
      const current = documentRef.current;
      const currentPointer = current === null ? null : placePointer(current, placeRef.current);
      if (current === null || currentPointer === null) {
        return null;
      }
      const answers = await requestExpressions(current, language, [{ pointer: currentPointer, ...part }]);
      return answers[0] ?? null;
    },
    [language],
  );

  const commit = useCallback((nextStored: string, blocks: Block | null) => {
    const index = typesRef.current;
    if (index === null) {
      return;
    }
    emitted.current = nextStored;
    const owner = ownerElement(placeRef.current);
    const context = studio.actions.inputContext();
    studio.actions.edit((latest) => withInputs(setPlaceStored(latest, index, placeRef.current, nextStored), owner, blocks, context));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.actions.edit, studio.actions.inputContext]);

  const setTree = useCallback(
    (tree: Block) => {
      const mine = sequence.current + 1;
      sequence.current = mine;
      inflight.current += 1;
      setChanging((count) => count + 1);
      setDraft(tree);
      setFailed(false);
      // saving and checking wait for this change: it reaches the document only with the answer of the endpoint
      trackChange(
        convert({ blocks: tree })
          .then((result) => {
            if (result === null || mine !== sequence.current) {
              return;
            }
            commit(result.stored, result.blocks ?? tree);
          })
          .catch(() => {
            if (mine === sequence.current) {
              setFailed(true);
            }
          })
          .finally(() => {
            inflight.current -= 1;
            setChanging((count) => count - 1);
          }),
      );
    },
    [commit, convert, trackChange],
  );

  const setText = useCallback(
    (text: string) => {
      setTyped(text);
      setDraft(null);
      setFailed(false);
      const mine = sequence.current + 1;
      sequence.current = mine;
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
      // the waiting time of the typed text counts as a change on its way too (saving waits for it)
      endWaiting();
      trackChange(
        new Promise<void>((resolve) => {
          waiting.current = resolve;
        }),
      );
      timer.current = window.setTimeout(() => {
        timer.current = null;
        inflight.current += 1;
        trackChange(
          convert({ display: text })
            .then((result) => {
              if (result === null || mine !== sequence.current) {
                return;
              }
              setFormula({ text, answer: result });
              if (result.stored !== placeStoredNow(documentRef.current, placeRef.current)) {
                commit(result.stored, result.blocks);
              }
            })
            .catch(() => {
              if (mine === sequence.current) {
                setFailed(true);
              }
            })
            .finally(() => {
              inflight.current -= 1;
            }),
        );
        endWaiting();
      }, FORMULA_DELAY_MS);
    },
    [commit, convert, endWaiting, trackChange],
  );

  const settle = useCallback(() => {
    if (timer.current === null && inflight.current === 0) {
      setTyped(null);
    }
  }, []);

  const current = [answer, formula?.answer].find((candidate) => candidate !== undefined && candidate.stored === stored) ?? answer;
  const text = typed ?? current?.display ?? stored;
  const tree = draft ?? (current === undefined ? (stored === '' ? EMPTY : null) : current.blocks);
  const shown = formula !== null && formula.text === text ? formula.answer : current !== undefined && current.display === text ? current : undefined;

  return {
    missing: document !== null && pointer === null,
    stored,
    answer: current,
    tree,
    setTree,
    text,
    setText,
    formula: shown,
    settle,
    failed,
    pending: changing > 0 || answer === undefined || answer.stored !== stored,
  };
}

function placeStoredNow(document: StrategyDocument | null, place: ExpressionPlace): string {
  return document === null ? '' : placeStored(document, place);
}
