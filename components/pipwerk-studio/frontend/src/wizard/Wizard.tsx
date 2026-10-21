import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { removeElement } from '../document/ops';
import { crossingBlock, comparisonBlock, nameBlock, type Block } from '../expression/blocks';
import { orderSelector, labelText, timeUnitChoices } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Btn, NumberInput, Select, TextInput, Toggle } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { conditionType, indicatorEntries, numericValues, orderStepType, requiredNumbers, ruleEntry, triggerTypes } from './model';

/**
 * The guided setup of a new strategy (specification 5.5): name, trigger, indicators, condition, order. Every step lays
 * out the same elements as the work by hand (the entries of the element library) and can be left at any time; what it
 * laid out stays. The strategy is saved only with "Speichern".
 */

const STEP_IDS = ['name', 'trigger', 'indicators', 'condition', 'order'] as const;
type Comparison = 'cross' | 'gt' | 'lt';

export function Wizard() {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const { actions, language } = studio;
  const wizard = studio.state.wizard;
  const document = studio.state.document;
  const [triggerId, setTriggerId] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [asParameter, setAsParameter] = useState(true);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [comparison, setComparison] = useState<Comparison>('cross');
  const [orderTypeId, setOrderTypeId] = useState('');
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [withRule, setWithRule] = useState(true);
  const [busy, setBusy] = useState(false);

  const triggers = useMemo(() => (types === null ? [] : triggerTypes(types)), [types]);
  const entries = useMemo(() => (types === null ? [] : indicatorEntries(studio.library, types)), [studio.library, types]);
  const values = useMemo(
    () => (document === null || types === null ? [] : numericValues(document, types, language)),
    [document, language, types],
  );
  if (wizard === null || document === null || types === null) {
    return null;
  }
  const step = wizard.step;
  const timeUnits = timeUnitChoices(types);
  const chosenTrigger = triggers.find((type) => type.id === triggerId);
  const unitParameter = chosenTrigger?.parameters.find((parameter) => parameter.datatype === 'time_unit');
  const stepTitles = STEP_IDS.map((id) => t(`wizard.steps.${id}`));
  const flowType = orderStepType(types);
  const selector = flowType === undefined ? null : orderSelector(types, flowType);
  const orderTypes = selector?.orderTypes ?? [];
  const chosenOrder = orderTypes.find((type) => type.id === orderTypeId) ?? orderTypes[0];
  const askedProperties = (chosenOrder?.properties ?? []).filter(
    (property) => property.setByUser && property.must && property.datatype === 'choice' && property.choices.length > 0,
  );
  const rule = ruleEntry(studio.library);
  const stillThere = (id: string | null): boolean => id !== null && document.elements.some((candidate) => candidate.id === id);

  const goto = (next: number): void => {
    actions.dispatch({ type: 'wizard', wizard: { step: next } });
  };
  const patch = (part: Partial<NonNullable<typeof wizard>>): void => {
    actions.dispatch({ type: 'wizard', wizard: part });
  };
  const leave = (): void => {
    actions.dispatch({ type: 'wizard', wizard: null });
  };
  const removeLaid = (id: string | null): void => {
    if (id !== null && stillThere(id)) {
      actions.edit((latest) => removeElement(latest, types, id));
    }
  };

  const applyTrigger = async (): Promise<void> => {
    if (chosenTrigger === undefined) {
      return;
    }
    removeLaid(wizard.trigger);
    let key: string | null = null;
    if (unitParameter !== undefined && asParameter) {
      const existing = document.parameters.find((parameter) => parameter.datatype === 'time_unit');
      if (existing !== undefined) {
        key = existing.key;
        actions.updateParameter(existing.key, { value: unit });
      } else {
        key = await actions.addParameter({ name: t('wizard.timeUnitName'), datatype: 'time_unit', value: unit, at_application: false, choices: [] });
      }
    }
    const id = await actions.insert(`type:${chosenTrigger.id}`, { after: null, flow: null });
    if (id === null) {
      return;
    }
    if (unitParameter !== undefined) {
      actions.setBinding(id, 'parameters', unitParameter.id, key === null ? { kind: 'fixed', value: unit } : { kind: 'parameter', value: key });
    }
    patch({ trigger: id });
  };

  const addIndicator = async (entryKey: string): Promise<void> => {
    const id = await actions.insert(entryKey, { after: null, flow: null });
    if (id === null) {
      return;
    }
    const element = studio.state.document?.elements.find((candidate) => candidate.id === id);
    const type = element === undefined ? undefined : types.byId.get(element.type);
    const unitParam = type?.parameters.find((parameter) => parameter.datatype === 'time_unit');
    const strategyUnit = studio.state.document?.parameters.find((parameter) => parameter.datatype === 'time_unit');
    if (unitParam !== undefined && strategyUnit !== undefined) {
      actions.setBinding(id, 'parameters', unitParam.id, { kind: 'parameter', value: strategyUnit.key });
    }
    patch({ indicators: [...wizard.indicators, id] });
  };

  const applyCondition = async (): Promise<void> => {
    const kind = conditionType(types);
    const a = values.find((value) => value.key === first);
    const b = values.find((value) => value.key === second);
    if (kind === undefined || a === undefined || b === undefined) {
      return;
    }
    removeLaid(wizard.condition);
    const expressionParameter = kind.parameters.find((parameter) => parameter.datatype === 'expression');
    const id = await actions.insert(`type:${kind.id}`, { after: stillThere(wizard.trigger) ? wizard.trigger : null, flow: null });
    if (id === null || expressionParameter === undefined) {
      return;
    }
    actions.renameElement(id, t(comparison === 'cross' ? 'wizard.crossName' : 'wizard.compareName'));
    const left = nameBlock([a.instance, a.property]);
    const right = nameBlock([b.instance, b.property]);
    const tree: Block = comparison === 'cross' ? crossingBlock('any', left, right) : comparisonBlock(comparison === 'gt' ? '>' : '<', left, right);
    await actions.writeBlocks({ kind: 'binding', element: id, scope: 'parameters', key: expressionParameter.id }, tree);
    patch({ condition: id });
  };

  const finish = async (): Promise<void> => {
    if (flowType === undefined || chosenOrder === undefined || selector === null) {
      leave();
      return;
    }
    const after = stillThere(wizard.condition) ? wizard.condition : stillThere(wizard.trigger) ? wizard.trigger : null;
    const id = await actions.insert(`type:${flowType.id}`, { after, flow: null });
    if (id !== null) {
      actions.setBinding(id, 'parameters', selector.parameter.id, { kind: 'fixed', value: chosenOrder.id });
      for (const property of askedProperties) {
        const chosen = choices[property.id] ?? property.choices[0]?.id;
        if (chosen !== undefined) {
          actions.setBinding(id, 'properties', property.id, { kind: 'fixed', value: chosen });
        }
      }
    }
    if (withRule && rule !== undefined) {
      await actions.insert(rule.key, { ruleList: { root: { kind: 'strategy' }, steps: [], list: 'rules' } });
    }
    leave();
    if (id !== null) {
      actions.showElement(id);
    }
    void actions.check();
    actions.notify('wizard.done');
  };

  const next = async (): Promise<void> => {
    setBusy(true);
    try {
      if (step === 2) {
        await applyTrigger();
      } else if (step === 4) {
        await applyCondition();
      } else if (step === 5) {
        await finish();
        return;
      }
      goto(step + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="props wizard" data-testid="wizard">
      <header className="props-head">
        <div className="badge b-trend">
          <Icon name="wand" size={20} />
        </div>
        <div className="props-title">
          <span className="props-kind">
            {t('wizard.title')} · {t('wizard.step', { step, count: STEP_IDS.length })}
          </span>
          <h2>{stepTitles[step - 1]}</h2>
        </div>
      </header>
      <div className="wz-leave">
        <Btn kind="ghost" small icon="x" onClick={leave} testid="wz-leave" tip={t('wizard.leaveTip')}>
          {t('wizard.leave')}
        </Btn>
      </div>
      <ol className="steps" aria-label={t('wizard.progress')}>
        {stepTitles.map((title, index) => (
          <li key={STEP_IDS[index]} className={index + 1 === step ? 'on' : index + 1 < step ? 'done' : ''}>
            <span>{index + 1}</span>
            {title}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="wz-body" data-testid="wz-step-1">
          <p>{t('wizard.nameText')}</p>
          <label className="field">
            <span className="field-label">{t('properties.strategyName')}</span>
            <TextInput value={document.name} onChange={actions.setName} ariaLabel={t('properties.strategyName')} testid="wz-name" />
          </label>
          <label className="field">
            <span className="field-label">{t('properties.description')}</span>
            <textarea
              className="input area"
              rows={3}
              value={document.description}
              onChange={(event) => {
                actions.setDescription(event.target.value);
              }}
              aria-label={t('properties.description')}
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wz-body" data-testid="wz-step-2">
          <p>{t('wizard.triggerText')}</p>
          <div className="choice-cards">
            {triggers.map((type) => (
              <button
                key={type.id}
                type="button"
                className={type.id === triggerId ? 'on' : ''}
                onClick={() => {
                  setTriggerId(type.id);
                  const firstUnit = timeUnits[0]?.id ?? '';
                  if (unit === '') {
                    setUnit(document.parameters.find((parameter) => parameter.datatype === 'time_unit')?.value?.toString() ?? firstUnit);
                  }
                }}
                data-testid="wz-trigger"
                data-type={type.id}
              >
                <Icon name="clock" size={20} />
                <b>{labelText(type.name, language)}</b>
                <span>{labelText(type.explanation, language)}</span>
              </button>
            ))}
          </div>
          {unitParameter !== undefined ? (
            <>
              <label className="field">
                <span className="field-label">{labelText(unitParameter.label, language)}</span>
                <Select value={unit} onChange={setUnit} ariaLabel={labelText(unitParameter.label, language)} testid="wz-unit">
                  {timeUnits.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {labelText(choice.label, language)}
                    </option>
                  ))}
                </Select>
              </label>
              <Toggle checked={asParameter} onChange={setAsParameter} label={t('wizard.asParameter')} testid="wz-as-parameter" />
            </>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wz-body" data-testid="wz-step-3">
          <p>{t('wizard.indicatorsText')}</p>
          <div className="btn-row">
            {entries.map((entry) => (
              <Btn
                key={entry.key}
                icon="plus"
                testid="wz-add-indicator"
                onClick={() => {
                  void addIndicator(entry.key);
                }}
              >
                {entry.name}
              </Btn>
            ))}
          </div>
          {wizard.indicators.filter(stillThere).map((id) => {
            const element = document.elements.find((candidate) => candidate.id === id);
            if (element === undefined) {
              return null;
            }
            return (
              <div key={id} className="own-row" data-testid="wz-indicator">
                <TextInput
                  value={element.instance?.name ?? ''}
                  onChange={(name) => {
                    actions.renameElement(id, name);
                  }}
                  ariaLabel={t('instances.name')}
                  testid="wz-indicator-name"
                />
                {requiredNumbers(element, types).map((parameter) => {
                  const binding = element.instance?.parameter_values?.[parameter.id];
                  return (
                    <NumberInput
                      key={parameter.id}
                      value={binding?.kind === 'fixed' && typeof binding.value === 'number' ? binding.value : ''}
                      onChange={(typed) => {
                        actions.setBinding(id, 'instance', parameter.id, typed === '' ? null : { kind: 'fixed', value: typed });
                      }}
                      ariaLabel={labelText(parameter.label, language)}
                      testid={`wz-indicator-${parameter.id}`}
                    />
                  );
                })}
                <Btn
                  kind="quiet"
                  small
                  icon="x"
                  title={t('wizard.removeIndicator')}
                  onClick={() => {
                    removeLaid(id);
                    patch({ indicators: wizard.indicators.filter((candidate) => candidate !== id) });
                  }}
                />
              </div>
            );
          })}
          {wizard.indicators.filter(stillThere).length === 0 ? <p className="empty-note">{t('wizard.noIndicators')}</p> : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wz-body" data-testid="wz-step-4">
          <p>{t('wizard.conditionText')}</p>
          {values.length < 2 ? (
            <p className="hint-box">
              <Icon name="info" size={16} />
              <span>{t('wizard.needTwoValues')}</span>
            </p>
          ) : (
            <>
              <label className="field">
                <span className="field-label">{t('wizard.valueA')}</span>
                <Select value={first} onChange={setFirst} ariaLabel={t('wizard.valueA')} testid="wz-a">
                  <option value="">{t('expression.chooseValueOption')}</option>
                  {values.map((value) => (
                    <option key={value.key} value={value.key}>
                      {value.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span className="field-label">{t('wizard.comparison')}</span>
                <Select value={comparison} onChange={(chosen) => { setComparison(chosen as Comparison); }} ariaLabel={t('wizard.comparison')} testid="wz-cmp">
                  <option value="cross">{t('wizard.cross')}</option>
                  <option value="gt">{t('expression.compare.>')}</option>
                  <option value="lt">{t('expression.compare.<')}</option>
                </Select>
              </label>
              <label className="field">
                <span className="field-label">{t('wizard.valueB')}</span>
                <Select value={second} onChange={setSecond} ariaLabel={t('wizard.valueB')} testid="wz-b">
                  <option value="">{t('expression.chooseValueOption')}</option>
                  {values.map((value) => (
                    <option key={value.key} value={value.key}>
                      {value.label}
                    </option>
                  ))}
                </Select>
              </label>
            </>
          )}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wz-body" data-testid="wz-step-5">
          <p>{t('wizard.orderText')}</p>
          {orderTypes.length > 0 ? (
            <label className="field">
              <span className="field-label">{selector === null ? '' : labelText(selector.parameter.label, language)}</span>
              <Select
                value={chosenOrder?.id ?? ''}
                onChange={setOrderTypeId}
                ariaLabel={selector === null ? '' : labelText(selector.parameter.label, language)}
                testid="wz-ordertype"
              >
                {orderTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {labelText(selector?.parameter.choices.find((choice) => choice.id === type.id)?.label ?? type.name, language)}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {askedProperties.map((property) => (
            <label key={property.id} className="field">
              <span className="field-label">{labelText(property.label, language)}</span>
              <Select
                value={choices[property.id] ?? property.choices[0]?.id ?? ''}
                onChange={(chosen) => {
                  setChoices({ ...choices, [property.id]: chosen });
                }}
                ariaLabel={labelText(property.label, language)}
                testid={`wz-property-${property.id}`}
              >
                {property.choices.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {labelText(choice.label, language)}
                  </option>
                ))}
              </Select>
            </label>
          ))}
          {rule !== undefined ? <Toggle checked={withRule} onChange={setWithRule} label={t('wizard.withRule', { name: rule.name })} testid="wz-rule" /> : null}
        </div>
      ) : null}

      <footer className="wz-foot">
        <span className="spacer" />
        {step > 1 ? (
          <Btn
            kind="ghost"
            icon="left"
            onClick={() => {
              goto(step - 1);
            }}
            testid="wz-back"
          >
            {t('wizard.back')}
          </Btn>
        ) : null}
        {step > 1 && step < STEP_IDS.length ? (
          <Btn
            kind="quiet"
            onClick={() => {
              goto(step + 1);
            }}
            testid="wz-skip"
          >
            {t('wizard.skip')}
          </Btn>
        ) : null}
        <Btn
          kind="primary"
          disabled={busy}
          onClick={() => {
            void next();
          }}
          testid="wz-next"
        >
          {step === STEP_IDS.length ? t('wizard.finish') : t('wizard.next')}
        </Btn>
      </footer>
    </div>
  );
}
