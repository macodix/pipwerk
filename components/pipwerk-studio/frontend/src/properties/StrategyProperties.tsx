import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataType } from '../api/elementTypes';
import {
  addStrategyParameter,
  removeStrategyParameter,
  setStrategyText,
  updateStrategyParameter,
} from '../document/ops';
import type { StrategyParameter } from '../document/types';
import { timeUnitChoices } from '../model/typeIndex';
import { FindingsList } from '../findings/FindingsList';
import { useStudio } from '../state/StudioContext';
import { ChoicesInput } from './ChoicesInput';
import { RulesSection } from './RulesSection';
import { ValueInput } from './ValueInput';

/** The datatypes a strategy parameter can have. */
export const strategyParameterTypes: readonly DataType[] = [
  'number',
  'integer',
  'percent',
  'boolean',
  'text',
  'choice',
  'time_unit',
  'timestamp',
  'date',
];

function startValue(datatype: DataType, choices: readonly string[]): StrategyParameter['value'] {
  switch (datatype) {
    case 'number':
    case 'integer':
    case 'percent':
      return 0;
    case 'boolean':
      return false;
    case 'choice':
      return choices[0] ?? '';
    default:
      return '';
  }
}

/** The property view of the strategy (item 5 of the order): title, description, parameters, rules and findings. */
export function StrategyProperties() {
  const { t } = useTranslation();
  const { document, types, language, findings, edit } = useStudio();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className="properties-strategy">
      <h2>{t('properties.strategy')}</h2>
      <div className="field">
        <label htmlFor={titleId}>{t('properties.title')}</label>
        <input
          id={titleId}
          type="text"
          value={document.title}
          onChange={(event) => {
            const value = event.target.value;
            edit((current) => setStrategyText(current, 'title', value));
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={descriptionId}>{t('properties.description')}</label>
        <textarea
          id={descriptionId}
          rows={3}
          value={document.description}
          onChange={(event) => {
            const value = event.target.value;
            edit((current) => setStrategyText(current, 'description', value));
          }}
        />
      </div>

      <FindingsList findings={findings.ofStrategy(document)} heading={t('findings.ofStrategy')} />

      <section className="strategy-parameters">
        <h3>{t('properties.parameters')}</h3>
        {document.parameters.length === 0 ? <p>{t('properties.noParameters')}</p> : null}
        <ul className="parameter-list">
          {document.parameters.map((parameter, index) => {
            const choices = parameter.choices ?? [];
            const atApplication = parameter.at_application === true;
            return (
              <li key={index} className="parameter-row">
                <input
                  type="text"
                  aria-label={t('properties.parameterName', { number: index + 1 })}
                  value={parameter.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    edit((current) => updateStrategyParameter(current, index, { name }));
                  }}
                />
                <select
                  aria-label={t('properties.parameterType', { name: parameter.name })}
                  value={parameter.datatype}
                  onChange={(event) => {
                    const datatype = event.target.value as DataType;
                    edit((current) =>
                      updateStrategyParameter(current, index, {
                        datatype,
                        value: atApplication ? null : startValue(datatype, choices),
                      }),
                    );
                  }}
                >
                  {strategyParameterTypes.map((datatype) => (
                    <option key={datatype} value={datatype}>
                      {t(`datatype.${datatype}`)}
                    </option>
                  ))}
                </select>
                {parameter.datatype === 'choice' ? (
                  <ChoicesInput
                    values={choices}
                    label={t('properties.parameterChoices', { name: parameter.name })}
                    placeholder={t('properties.choicesHint')}
                    onChange={(list) => {
                      edit((current) => updateStrategyParameter(current, index, { choices: list }));
                    }}
                  />
                ) : null}
                {atApplication ? null : (
                  <ValueInput
                    datatype={parameter.datatype}
                    value={parameter.value}
                    choices={
                      parameter.datatype === 'time_unit'
                        ? timeUnitChoices(types)
                        : choices.map((id) => ({ id, label: { de: id, en: id } }))
                    }
                    language={language}
                    label={t('properties.parameterValue', { name: parameter.name })}
                    onChange={(value) => {
                      edit((current) => updateStrategyParameter(current, index, { value }));
                    }}
                  />
                )}
                <label className="parameter-application">
                  <input
                    type="checkbox"
                    checked={atApplication}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      edit((current) =>
                        updateStrategyParameter(current, index, {
                          at_application: checked,
                          value: checked ? null : startValue(parameter.datatype, choices),
                        }),
                      );
                    }}
                  />{' '}
                  {t('properties.atApplication')}
                </label>
                <button
                  type="button"
                  aria-label={t('properties.removeParameter', { name: parameter.name })}
                  onClick={() => {
                    edit((current) => removeStrategyParameter(current, index));
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
            edit((current) => addStrategyParameter(current, t('properties.newParameterName')));
          }}
        >
          {t('properties.addParameter')}
        </button>
      </section>

      <RulesSection owner={{ kind: 'strategy' }} rules={document.rules} />
    </div>
  );
}
