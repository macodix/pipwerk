import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Finding } from '../api/objects';
import { findingTexts } from '../findings/findingText';
import { useStudio } from '../state/StudioContext';
import { Icon } from '../ui/Icon';
import { callAt, completionsAt, matchingBrackets, methodCallAt, type Completion } from './formulaAssist';
import type { ExpressionSession } from './useExpressionSession';

/**
 * The formula view (specification 5.4, req-ui-013, req-ui-015): a multi-line editor for the display form of an
 * expression, with colours for names, functions and values, the brackets that belong together, errors underlined
 * where they are, suggestions after `Object.` and the explanation of the arguments of a function. The marks come from
 * the answer of the expression endpoint for exactly the text shown. The structure of the view and its class names and
 * test identifiers follow the prototype, a few lines are equal to it (specification E8: the prototype is an aid, not a
 * template); see docs/technical/pipwerk-studio.md, section 2.3.
 */

type Piece = { from: number; to: number; className: string; message?: string };

function tokenClass(kind: string, char: string): string {
  switch (kind) {
    case 'name':
      return 'tk-name';
    case 'function':
      return 'tk-fn';
    case 'value':
      return char === '"' ? 'tk-str' : 'tk-num';
    case 'operator':
      return 'tk-op';
    default:
      return '';
  }
}

/** The part of the text a finding refers to; findings without a place are not marked in the text. */
function rangeOf(finding: Finding, length: number): [number, number] | null {
  const start = finding.details.start;
  const end = finding.details.end;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return null;
  }
  const from = Math.min(Math.max(start, 0), length);
  return [from, Math.max(Math.min(end, length), Math.min(from + 1, length))];
}

export function FormulaEditor({ session, reveal = null }: { session: ExpressionSession; reveal?: { serial: number; code: string } | null }) {
  const { t, i18n } = useTranslation();
  const { studio, types } = useStudio();
  const language = studio.language;
  const area = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(true);
  const { text, formula } = session;
  const names = session.answer?.names ?? formula?.names ?? [];
  const functions = types?.functions ?? [];

  const suggestions = useMemo(
    () => (open ? completionsAt(text, caret, names, functions, types, language) : null),
    [caret, functions, language, names, open, text, types],
  );
  const hint = useMemo(
    () => (formula === undefined ? null : callAt(formula.tokens, text, caret, functions)),
    [caret, formula, functions, text],
  );
  const methodHint = useMemo(
    () => (formula === undefined ? null : methodCallAt(formula.tokens, text, caret, names)),
    [caret, formula, names, text],
  );
  const brackets = useMemo(() => (formula === undefined ? null : matchingBrackets(formula.tokens, caret)), [caret, formula]);
  const context = { document: studio.state.document, types, language };
  const marks = formula?.findings ?? [];
  const messages = useMemo(
    () => marks.map((finding) => findingTexts(t, i18n, finding, context).message),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marks, language, t, i18n],
  );

  // A click on a finding leads here: the spot of the finding is selected (the formula answer knows it for this text).
  const handled = useRef(0);
  useEffect(() => {
    if (reveal === null || handled.current === reveal.serial) {
      return;
    }
    const located = marks.filter((finding) => rangeOf(finding, text.length) !== null);
    const target = located.find((finding) => finding.code === reveal.code) ?? located[0];
    const range = target === undefined ? null : rangeOf(target, text.length);
    if (range === null) {
      return;
    }
    handled.current = reveal.serial;
    const element = area.current;
    if (element !== null) {
      element.focus();
      element.setSelectionRange(range[0], range[1]);
      setCaret(range[0]);
    }
  }, [marks, reveal, text]);

  useLayoutEffect(() => {
    const element = area.current;
    if (element !== null) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [text]);

  const pieces: Piece[] = [];
  const marksList: Piece[] = [];
  for (const token of formula?.tokens ?? []) {
    const className = tokenClass(token.kind, text[token.start] ?? '');
    if (className !== '') {
      marksList.push({ from: token.start, to: token.end, className });
    }
  }
  marks.forEach((finding, index) => {
    const range = rangeOf(finding, text.length);
    if (range !== null) {
      marksList.push({ from: range[0], to: range[1], className: 'tk-error', message: messages[index] });
    }
  });
  if (brackets !== null) {
    brackets.forEach((position) => marksList.push({ from: position, to: position + 1, className: 'tk-bracket' }));
  }
  const cuts = new Set<number>([0, text.length]);
  marksList.forEach((mark) => {
    cuts.add(mark.from);
    cuts.add(Math.min(mark.to, text.length));
  });
  const sorted = [...cuts].filter((cut) => cut >= 0 && cut <= text.length).sort((a, b) => a - b);
  for (let index = 0; index + 1 < sorted.length; index += 1) {
    const from = sorted[index] as number;
    const to = sorted[index + 1] as number;
    const covering = marksList.filter((mark) => mark.from <= from && mark.to >= to);
    pieces.push({
      from,
      to,
      className: covering.map((mark) => mark.className).join(' '),
      message: covering.find((mark) => mark.message !== undefined)?.message,
    });
  }
  const trailing = marks.findIndex((finding) => {
    const range = rangeOf(finding, text.length);
    return range !== null && range[0] >= text.length;
  });

  const insert = (completion: Completion): void => {
    if (suggestions === null) {
      return;
    }
    const element = area.current;
    const to = element === null ? caret : element.selectionStart;
    const next = text.slice(0, suggestions.from) + completion.insert + text.slice(to);
    session.setText(next);
    const position = suggestions.from + completion.insert.length;
    window.setTimeout(() => {
      element?.focus();
      element?.setSelectionRange(position, position);
      setCaret(position);
    }, 0);
  };

  const first = marks[0];
  const firstMessage = messages[0];

  return (
    <div className="fe" data-testid="formula-editor">
      <div className="fe-wrap">
        <textarea
          ref={area}
          className="fe-ta"
          value={text}
          spellCheck={false}
          rows={2}
          aria-label={t('expression.formulaLabel')}
          data-testid="formula-input"
          onChange={(event) => {
            session.setText(event.target.value);
            setCaret(event.target.selectionStart);
            setSelected(0);
            setOpen(true);
          }}
          onKeyUp={(event) => {
            setCaret((event.target as HTMLTextAreaElement).selectionStart);
          }}
          onClick={(event) => {
            setCaret((event.target as HTMLTextAreaElement).selectionStart);
          }}
          onKeyDown={(event) => {
            if (suggestions !== null && open) {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelected((selected + 1) % suggestions.items.length);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelected((selected + suggestions.items.length - 1) % suggestions.items.length);
              } else if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                const chosen = suggestions.items[Math.min(selected, suggestions.items.length - 1)];
                if (chosen !== undefined) {
                  insert(chosen);
                }
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              session.settle();
            }, 150);
          }}
          onFocus={() => {
            setOpen(true);
          }}
        />
        <div className="fe-hl" aria-hidden="true" data-testid="formula-marks">
          {pieces.map((piece) => (
            <span key={piece.from} className={piece.className === '' ? undefined : piece.className} data-tip={piece.message}>
              {text.slice(piece.from, piece.to)}
            </span>
          ))}
          {trailing >= 0 ? (
            <span className="tk-error tk-end" data-tip={messages[trailing]}>
              {' '}
            </span>
          ) : null}
          {text.endsWith('\n') ? <span>{'​'}</span> : null}
        </div>
      </div>

      {suggestions !== null && open ? (
        <ul className="fe-pop" role="listbox" data-testid="formula-suggestions">
          {suggestions.items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              role="option"
              aria-selected={index === selected}
              className={index === selected ? 'on' : ''}
              data-testid="formula-suggestion"
              onMouseDown={(event) => {
                event.preventDefault();
                insert(item);
              }}
              onMouseEnter={() => {
                setSelected(index);
              }}
            >
              <span className="fe-pop-label">{item.label}</span>
              <span className="fe-pop-detail">{item.method ? t('properties.method') : item.detail}</span>
              {item.tip !== '' ? <span className="fe-pop-tip">{item.tip}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {hint !== null ? (
        <div className="fe-hint" data-testid="formula-hint">
          <code>
            {hint.fn.name}(
            {hint.fn.arguments.map((argument, index) => (
              <Fragment key={argument.name}>
                {index > 0 ? '; ' : ''}
                <b className={index === Math.min(hint.argument, hint.fn.arguments.length - 1) ? 'cur' : ''}>{argument.label[language]}</b>
              </Fragment>
            ))}
            {hint.fn.variadic !== null ? '; …' : ''})
          </code>
          <span>{hint.fn.arguments[Math.min(hint.argument, hint.fn.arguments.length - 1)]?.explanation[language] ?? hint.fn.explanation[language]}</span>
        </div>
      ) : null}

      {methodHint !== null ? (
        <div className="fe-hint" data-testid="formula-hint-method">
          <code>
            {methodHint.method.label[language]}(
            {methodHint.method.arguments.map((argument, index) => (
              <Fragment key={argument.key}>
                {index > 0 ? '; ' : ''}
                <b className={index === Math.min(methodHint.argument, methodHint.method.arguments.length - 1) ? 'cur' : ''}>{argument.label[language]}</b>
              </Fragment>
            ))}
            )
          </code>
          <span>
            {methodHint.method.arguments[Math.min(methodHint.argument, methodHint.method.arguments.length - 1)]?.explanation?.[language] ??
              methodHint.method.explanation?.[language] ??
              ''}
          </span>
        </div>
      ) : null}

      {first !== undefined ? (
        <div className="fe-error" data-testid="formula-error">
          <Icon name="warn" size={15} />
          <span>{firstMessage}</span>
        </div>
      ) : (
        <div className="fe-ok">
          <Icon name="check" size={15} />
          <span>{text.trim() === '' ? t('expression.formulaEmpty') : t('expression.formulaFine')}</span>
        </div>
      )}
    </div>
  );
}
