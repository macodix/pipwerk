import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ExpressionPlace } from '../document/places';
import { useStudio } from '../state/StudioContext';
import { Btn } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { CondEditor, ValueEditor, type EditorContext, type ValueHint } from './BlockEditor';
import { EMPTY } from './blocks';
import { FormulaEditor } from './FormulaEditor';
import { buildValueGroups } from './options';
import { ownerElement } from './inputs';
import { useExpressionSession } from './useExpressionSession';

/**
 * The editor of one expression (specification 5.4): the sentence the expression says, and below it, to be switched,
 * the blocks or the formula. Both views show and change the same expression through the expression endpoint.
 */

export type ExpressionPanelProps = {
  place: ExpressionPlace;
  /** A condition (true or false) is put together from comparisons; a calculation is a value. */
  mode: 'condition' | 'value';
  /** The key in expressions of the element's own result, which the lists leave out (a step cannot use its own result). */
  selfKey?: string | null;
  /** The choices of the property that is assigned: a text may then be picked from them. */
  hint?: ValueHint;
  label?: string;
  testid?: string;
};

export function ExpressionPanel({ place, mode, selfKey = null, hint, label, testid }: ExpressionPanelProps) {
  const { t } = useTranslation();
  const { studio, types } = useStudio();
  const language = studio.language;
  const session = useExpressionSession(place);
  const [view, setView] = useState<'blocks' | 'formula'>('blocks');
  const document = studio.state.document;
  const owner = ownerElement(place);
  const inputs = useMemo(
    () => (owner === null ? [] : (document?.elements.find((candidate) => candidate.id === owner)?.inputs ?? [])),
    [document, owner],
  );
  const ctx = useMemo<EditorContext>(
    () => ({
      groups: buildValueGroups(session.answer?.names ?? [], inputs, selfKey, types, language),
      language,
      functions: types?.functions ?? [],
    }),
    [inputs, language, selfKey, session.answer?.names, types],
  );

  if (session.missing) {
    return null;
  }
  const sentence = session.answer?.sentence ?? null;
  const broken = session.tree === null && session.stored !== '' && session.answer !== undefined;

  return (
    <div className="ep" data-testid={testid ?? 'expr-panel'}>
      <div className="ep-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'blocks'}
          className={view === 'blocks' ? 'on' : ''}
          onClick={() => {
            setView('blocks');
          }}
          data-testid="view-blocks"
        >
          {t('expression.blocks')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'formula'}
          className={view === 'formula' ? 'on' : ''}
          onClick={() => {
            setView('formula');
          }}
          data-testid="view-formula"
        >
          {t('expression.formulaView')}
        </button>
      </div>
      {label !== undefined ? <div className="ep-label">{label}</div> : null}
      <div className={`ep-sentence${sentence !== null && sentence !== '' ? '' : ' empty'}`} data-testid="expr-sentence">
        <Icon name="book" size={15} />
        <span>
          {sentence !== null && sentence !== ''
            ? sentence
            : broken
              ? t('expression.hasError')
              : session.stored === ''
                ? t('expression.nothingYet')
                : '…'}
        </span>
      </div>
      {session.failed ? (
        <p className="fe-error" role="alert" data-testid="expr-failed">
          <Icon name="warn" size={15} />
          <span>{t('expression.cannotForm')}</span>
        </p>
      ) : null}
      {view === 'blocks' ? (
        session.answer === undefined && session.tree === null ? (
          <p className="muted">…</p>
        ) : session.tree === null ? (
          <div className="ep-bad" data-testid="expr-bad">
            <Icon name="warn" size={16} />
            <div>
              <p>{session.answer?.blocksOmitted === true ? t('expression.tooDeep') : t('expression.badExpression')}</p>
              <Btn
                small
                onClick={() => {
                  setView('formula');
                }}
              >
                {t('expression.toFormula')}
              </Btn>
              <Btn
                small
                kind="ghost"
                onClick={() => {
                  session.setTree(EMPTY);
                }}
              >
                {t('expression.startOver')}
              </Btn>
            </div>
          </div>
        ) : mode === 'condition' ? (
          <CondEditor value={session.tree} onChange={session.setTree} ctx={ctx} />
        ) : (
          <ValueEditor value={session.tree} onChange={session.setTree} ctx={ctx} hint={hint} testid="calc-root" />
        )
      ) : (
        <FormulaEditor session={session} />
      )}
    </div>
  );
}
