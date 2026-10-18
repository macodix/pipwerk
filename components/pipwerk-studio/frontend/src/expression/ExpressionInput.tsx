import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStudio } from '../state/StudioContext';
import { applySuggestion, completionsAt, displayExpression, type Suggestion } from './completions';
import { placeKey, type ExpressionPlace } from './fields';
import { rootMembers, type ExpressionContext } from './scope';

type ExpressionInputProps = {
  value: string;
  onChange: (text: string) => void;
  /** Where the expression stands (as the check names it), to find the recognized names. */
  place: ExpressionPlace;
  /** Which names are visible at this place. */
  context: ExpressionContext;
  /** Accessible name. */
  label: string;
  disabled?: boolean;
};

/**
 * Input for an expression (item 7 of the order). After a name and a point it
 * suggests the properties of that object; the suggestions can be chosen with
 * keyboard and mouse. Below the input the expression is shown with the names in
 * the language of the interface, as far as the check has recognized them.
 */
export function ExpressionInput({ value, onChange, place, context, label, disabled }: ExpressionInputProps) {
  const { t } = useTranslation();
  const { document, types, language, liveNames, functions } = useStudio();
  const listId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [caret, setCaret] = useState(value.length);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);

  const roots = useMemo(
    () => rootMembers(document, types, language, context),
    [document, types, language, context],
  );
  const completion = useMemo(
    () => (focused && !dismissed && !(disabled ?? false) ? completionsAt(value, caret, roots, functions) : null),
    [focused, dismissed, disabled, value, caret, roots, functions],
  );
  const suggestions = completion?.suggestions ?? [];
  const current = Math.min(active, Math.max(0, suggestions.length - 1));

  useLayoutEffect(() => {
    const position = pendingCaret.current;
    if (position !== null && textareaRef.current !== null) {
      textareaRef.current.setSelectionRange(position, position);
      pendingCaret.current = null;
    }
  });

  const names = liveNames.namesFor(place, value);
  const shown = useMemo(
    () => (names === undefined ? value : displayExpression(value, names, roots)),
    [names, value, roots],
  );

  function choose(suggestion: Suggestion): void {
    if (completion === null) {
      return;
    }
    const result = applySuggestion(value, completion, suggestion);
    pendingCaret.current = result.caret;
    setCaret(result.caret);
    setActive(0);
    // What was chosen is complete: the list stays closed until the next key.
    setDismissed(true);
    onChange(result.text);
  }

  return (
    <div className="expression-input" data-place={placeKey(place)}>
      <textarea
        ref={textareaRef}
        className="expression-input-text"
        rows={Math.min(8, Math.max(2, value.split('\n').length))}
        spellCheck={false}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length > 0 ? listId : undefined}
        aria-activedescendant={suggestions.length > 0 ? `${listId}-${current}` : undefined}
        value={value}
        disabled={disabled}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          setDismissed(false);
        }}
        onChange={(event) => {
          setCaret(event.target.selectionStart);
          setDismissed(false);
          setActive(0);
          onChange(event.target.value);
        }}
        onSelect={(event) => {
          setCaret(event.currentTarget.selectionStart);
        }}
        onKeyDown={(event) => {
          if (suggestions.length === 0) {
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current - 1 + suggestions.length) % suggestions.length);
          } else if (event.key === 'Enter' || event.key === 'Tab') {
            const suggestion = suggestions[current];
            if (suggestion !== undefined && !event.shiftKey) {
              event.preventDefault();
              choose(suggestion);
            }
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setDismissed(true);
          }
        }}
      />
      {suggestions.length > 0 ? (
        <ul id={listId} role="listbox" className="expression-suggestions" aria-label={t('expression.suggestions')}>
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.kind}:${suggestion.id}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === current}
              className={index === current ? 'is-active' : undefined}
              onMouseDown={(event) => {
                // The input keeps the focus.
                event.preventDefault();
                choose(suggestion);
              }}
            >
              <span className="suggestion-label">{suggestion.label}</span>
              <span className="suggestion-detail">{suggestion.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {value !== '' ? (
        <p className="expression-display">
          <span className="expression-display-caption">{t('expression.display')}: </span>
          <code>{shown}</code>
        </p>
      ) : null}
    </div>
  );
}
