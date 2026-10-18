import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataType } from '../api/elementTypes';
import { allOrderProperties } from '../model/typeIndex';
import { comparisons, type Comparison, type ParameterDefinition, type RulePath } from '../document/types';
import { getRule, setInstanceBinding, updateRule } from '../document/ops';
import { uniqueName } from '../document/ids';
import { getOwn, hasOwn, removeOwn, setOwn } from '../document/own';
import { ExpressionInput } from '../expression/ExpressionInput';
import { ruleNames } from '../findings/findingsModel';
import { FindingsList } from '../findings/FindingsList';
import { typeName } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { BindingEditor } from './BindingEditor';
import { ChoicesInput } from './ChoicesInput';
import { RulesSection } from './RulesSection';
import { definitionSpecs, visibleSpecs } from './specs';
import { strategyParameterTypes } from './StrategyProperties';
import { ValueInput } from './ValueInput';

/** The own parameters of a rule: name, datatype, required, standard value (item 6 of the order). */
function ParameterDefinitions({ path }: { path: RulePath }) {
  const { t } = useTranslation();
  const { document, language, edit } = useStudio();
  const rule = getRule(document, path);
  if (rule === undefined) {
    return null;
  }
  const definitions = rule.parameters ?? [];

  function update(index: number, patch: Partial<ParameterDefinition>): void {
    edit((current) => {
      const instance = getRule(current, path);
      if (instance === undefined) {
        return current;
      }
      const list = (instance.parameters ?? []).map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      );
      return updateRule(current, path, { parameters: list });
    });
  }

  function rename(index: number, name: string): void {
    edit((current) => {
      const instance = getRule(current, path);
      const old = instance?.parameters?.[index];
      if (instance === undefined || old === undefined) {
        return current;
      }
      const values = { ...(instance.parameter_values ?? {}) };
      if (hasOwn(values, old.name) && name !== old.name) {
        const moved = getOwn(values, old.name);
        removeOwn(values, old.name);
        if (moved !== undefined) {
          setOwn(values, name, moved);
        }
      }
      const list = (instance.parameters ?? []).map((item, position) =>
        position === index ? { ...item, name } : item,
      );
      return updateRule(current, path, { parameters: list, parameter_values: values });
    });
  }

  return (
    <section className="rule-parameters">
      <h3>{t('ruleView.parameterDefinitions')}</h3>
      <ul className="parameter-list">
        {definitions.map((definition, index) => {
          const choices = definition.choices ?? [];
          return (
            <li key={index} className="parameter-row">
              <input
                type="text"
                aria-label={t('properties.parameterName', { number: index + 1 })}
                value={definition.name}
                onChange={(event) => {
                  rename(index, event.target.value);
                }}
              />
              <select
                aria-label={t('properties.parameterType', { name: definition.name })}
                value={definition.datatype}
                onChange={(event) => {
                  update(index, { datatype: event.target.value as DataType, default: null });
                }}
              >
                {strategyParameterTypes.map((datatype) => (
                  <option key={datatype} value={datatype}>
                    {t(`datatype.${datatype}`)}
                  </option>
                ))}
              </select>
              {definition.datatype === 'choice' ? (
                <ChoicesInput
                  values={choices}
                  label={t('properties.parameterChoices', { name: definition.name })}
                  placeholder={t('properties.choicesHint')}
                  onChange={(list) => {
                    update(index, { choices: list });
                  }}
                />
              ) : null}
              <label className="parameter-application">
                <input
                  type="checkbox"
                  checked={definition.required === true}
                  onChange={(event) => {
                    update(index, { required: event.target.checked });
                  }}
                />{' '}
                {t('ruleView.required')}
              </label>
              <ValueInput
                datatype={definition.datatype}
                value={definition.default}
                choices={choices.map((id) => ({ id, label: { de: id, en: id } }))}
                language={language}
                label={t('ruleView.standardValue', { name: definition.name })}
                onChange={(value) => {
                  update(index, { default: value });
                }}
              />
              <button
                type="button"
                aria-label={t('properties.removeParameter', { name: definition.name })}
                onClick={() => {
                  edit((current) => {
                    const instance = getRule(current, path);
                    if (instance === undefined) {
                      return current;
                    }
                    const values = { ...(instance.parameter_values ?? {}) };
                    removeOwn(values, definition.name);
                    return updateRule(current, path, {
                      parameters: (instance.parameters ?? []).filter((_, position) => position !== index),
                      parameter_values: values,
                    });
                  });
                }}
              >
                {t('properties.remove')}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          edit((current) => {
            const instance = getRule(current, path);
            if (instance === undefined) {
              return current;
            }
            const name = uniqueName(
              t('properties.newParameterName'),
              (instance.parameters ?? []).map((item) => item.name),
            );
            const definition: ParameterDefinition = {
              name,
              datatype: 'number',
              required: false,
              default: null,
              choices: [],
            };
            return updateRule(current, path, { parameters: [...(instance.parameters ?? []), definition] });
          });
        }}
      >
        {t('properties.addParameter')}
      </button>
    </section>
  );
}

/**
 * The property view of a rule or a rule set (item 6 of the order): origin,
 * name, parameters, expression and the findings of the rule. For a rule set the
 * rules inside it and its result expression.
 */
export function RuleProperties({ path }: { path: RulePath }) {
  const { t } = useTranslation();
  const { document, types, language, findings, edit, select } = useStudio();
  const nameId = useId();
  const propertyId = useId();
  const comparisonId = useId();
  const rule = getRule(document, path);
  if (rule === undefined) {
    return null;
  }
  const type = types.byId.get(rule.object_type);
  const category = type?.category ?? null;
  const isRuleSet = category === 'ruleset';
  const names = ruleNames(document, path) ?? [rule.name];
  const subject = names.join('.');
  const ownerElement = path.owner.kind === 'element' ? path.owner.id : null;
  const parentPath: RulePath | null =
    path.indices.length > 1 ? { owner: path.owner, indices: path.indices.slice(0, -1) } : null;
  const parentName = ownerElement === null ? t('properties.strategy') : (document.elements.find((e) => e.id === ownerElement)?.title ?? '');
  const specs = visibleSpecs(definitionSpecs(rule.parameters ?? []), rule.parameter_values ?? {});
  const origin = rule.origin;
  const determinable = allOrderProperties(types).filter((property) => property.setByUser);

  const originText =
    origin?.template_id !== undefined && origin.template_id !== null
      ? t('properties.originTemplate', { name: rule.name, title: origin.template_title ?? origin.template_id })
      : t('properties.originType', { name: rule.name, type: typeName(types, origin?.object_type ?? rule.object_type, language) });

  return (
    <div className="properties-rule">
      <h2>{rule.name}</h2>
      <p>
        <button
          type="button"
          onClick={() => {
            if (parentPath !== null) {
              select({ kind: 'rule', path: parentPath });
            } else if (ownerElement !== null) {
              select({ kind: 'elements', ids: [ownerElement] });
            } else {
              select({ kind: 'strategy' });
            }
          }}
        >
          {t('ruleView.back', { owner: parentPath !== null ? (ruleNames(document, parentPath)?.at(-1) ?? '') : parentName })}
        </button>
      </p>
      <p className="origin">{originText}</p>
      <div className="field">
        <label htmlFor={nameId}>{t('properties.name')}</label>
        <input
          id={nameId}
          type="text"
          value={rule.name}
          onChange={(event) => {
            const value = event.target.value;
            edit((current) => updateRule(current, path, { name: value }));
          }}
        />
      </div>

      <FindingsList findings={findings.ofRuleItself(document, path)} heading={t('findings.ofRule')} />

      <ParameterDefinitions path={path} />

      {specs.length > 0 ? (
        <section className="binding-section">
          <h3>{t('ruleView.parameterValues')}</h3>
          {specs.map((spec) => (
            <BindingEditor
              key={spec.key}
              spec={spec}
              binding={getOwn(rule.parameter_values, spec.key)}
              place={{ element: ownerElement, subject, field: `parameter:${spec.key}` }}
              context={{ kind: 'rule', path }}
              onChange={(binding) => {
                edit((current) => setInstanceBinding(current, { kind: 'rule', path }, spec.key, binding));
              }}
            />
          ))}
        </section>
      ) : null}

      {isRuleSet ? (
        <>
          <section className="rule-expression">
            <h3>{t('ruleView.resultExpression')}</h3>
            <ExpressionInput
              value={rule.result_expression ?? ''}
              place={{ element: ownerElement, subject, field: 'result_expression' }}
              context={{ kind: 'rulesetResult', path }}
              label={t('ruleView.resultExpression')}
              onChange={(text) => {
                edit((current) => updateRule(current, path, { result_expression: text === '' ? null : text }));
              }}
            />
          </section>
          <RulesSection owner={path.owner} inside={path.indices} rules={rule.rules ?? []} />
        </>
      ) : (
        <>
          <section className="rule-expression">
            <h3>{t('ruleView.expression')}</h3>
            <ExpressionInput
              value={rule.expression ?? ''}
              place={{ element: ownerElement, subject, field: 'expression' }}
              context={{ kind: 'rule', path }}
              label={t('ruleView.expression')}
              onChange={(text) => {
                edit((current) => updateRule(current, path, { expression: text }));
              }}
            />
          </section>
          <div className="field">
            <label htmlFor={propertyId}>{t('ruleView.determinedProperty')}</label>
            <select
              id={propertyId}
              value={rule.determined_property ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                edit((current) => updateRule(current, path, { determined_property: value === '' ? null : value }));
              }}
            >
              <option value="">{t('ruleView.checkOnly')}</option>
              {determinable.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label[language]}
                </option>
              ))}
              {rule.determined_property !== null &&
              rule.determined_property !== undefined &&
              !determinable.some((property) => property.id === rule.determined_property) ? (
                <option value={rule.determined_property}>{rule.determined_property}</option>
              ) : null}
            </select>
          </div>
          <div className="field">
            <label htmlFor={comparisonId}>{t('ruleView.comparison')}</label>
            <select
              id={comparisonId}
              value={rule.comparison ?? ''}
              onChange={(event) => {
                const value = event.target.value as Comparison | '';
                edit((current) => updateRule(current, path, { comparison: value === '' ? null : value }));
              }}
            >
              <option value="">{t('properties.unset')}</option>
              {comparisons.map((comparison) => (
                <option key={comparison} value={comparison}>
                  {t(`ruleView.comparisons.${comparison}`)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
