import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { InstanceDocument, RuleOwner } from '../document/types';
import { LIBRARY_DRAG_TYPE, findEntry, parseSource } from '../library/libraryModel';
import { typeName } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';

type RulesSectionProps = {
  owner: RuleOwner;
  /** The position of the rule set whose rules are listed; empty for the rules of the owner. */
  inside?: number[];
  rules: readonly InstanceDocument[];
};

/**
 * The rules and rule sets of the strategy, of an element or of a rule set
 * (item 6 of the order): choose one, add an entry of the element library or a
 * new rule, change the order, remove. The order is the order of evaluation.
 */
export function RulesSection({ owner, inside = [], rules }: RulesSectionProps) {
  const { t } = useTranslation();
  const { document, types, language, library, findings, select, addRuleFromLibrary, addNewRule, removeRule, moveRule } =
    useStudio();
  const selectId = useId();
  const [chosen, setChosen] = useState('');
  // Templates first: they are what is added most often; a new, empty rule has its own button.
  const usable = library.flatMap((group) =>
    group.entries.filter((entry) => entry.target === 'rules' && !entry.unreadable),
  );
  const entries = [
    ...usable.filter((entry) => entry.source.kind !== 'type'),
    ...usable.filter((entry) => entry.source.kind === 'type'),
  ];
  const chosenEntry = entries.find((entry) => entry.key === chosen) ?? entries[0];

  return (
    <section
      className="rules-section"
      aria-label={t('rules.title')}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(LIBRARY_DRAG_TYPE)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(event) => {
        const source = parseSource(event.dataTransfer.getData(LIBRARY_DRAG_TYPE));
        const entry = source === null ? undefined : findEntry(library, source);
        if (entry !== undefined && entry.target === 'rules' && !entry.unreadable) {
          event.preventDefault();
          addRuleFromLibrary(owner, entry.source, inside);
        }
      }}
    >
      <h3>{t('rules.title')}</h3>
      {rules.length === 0 ? <p className="rules-empty">{t('rules.none')}</p> : null}
      <ol className="rules-list">
        {rules.map((rule, position) => {
          const path = { owner, indices: [...inside, position] };
          const own = findings.ofRule(document, path);
          const errors = own.filter((finding) => finding.level === 'error').length;
          const hints = own.length - errors;
          const origin = rule.origin?.template_title ?? null;
          return (
            <li key={`${rule.name}:${position}`} className="rule-entry">
              <button
                type="button"
                className={`rule-select${errors > 0 ? ' has-error' : hints > 0 ? ' has-hint' : ''}`}
                aria-label={t('rules.select', { name: rule.name })}
                onClick={() => {
                  select({ kind: 'rule', path });
                }}
              >
                <span className="rule-name">{rule.name}</span>
                <span className="rule-kind">
                  {origin !== null ? origin : typeName(types, rule.object_type, language)}
                </span>
                {errors > 0 ? (
                  <span className="rule-findings finding-error">{t('rules.errors', { count: errors })}</span>
                ) : null}
                {hints > 0 ? (
                  <span className="rule-findings finding-hint">{t('rules.hints', { count: hints })}</span>
                ) : null}
              </button>
              <span className="rule-actions">
                <button
                  type="button"
                  aria-label={t('rules.up', { name: rule.name })}
                  disabled={position === 0}
                  onClick={() => {
                    moveRule(path, -1);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={t('rules.down', { name: rule.name })}
                  disabled={position === rules.length - 1}
                  onClick={() => {
                    moveRule(path, 1);
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={t('rules.remove', { name: rule.name })}
                  onClick={() => {
                    removeRule(path);
                  }}
                >
                  {t('rules.removeShort')}
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="rules-add">
        <label htmlFor={selectId}>{t('rules.fromLibrary')}</label>
        <select
          id={selectId}
          value={chosenEntry?.key ?? ''}
          disabled={entries.length === 0}
          onChange={(event) => {
            setChosen(event.target.value);
          }}
        >
          {entries.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.objectTypeName === null ? entry.label : `${entry.label} (${entry.objectTypeName})`}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={chosenEntry === undefined}
          onClick={() => {
            if (chosenEntry !== undefined) {
              addRuleFromLibrary(owner, chosenEntry.source, inside);
            }
          }}
        >
          {t('rules.add')}
        </button>
        <button
          type="button"
          onClick={() => {
            addNewRule(owner, inside);
          }}
        >
          {t('rules.new')}
        </button>
      </div>
    </section>
  );
}
