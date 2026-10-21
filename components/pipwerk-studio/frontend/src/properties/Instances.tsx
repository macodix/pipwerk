import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataType } from '../api/elementTypes';
import { createKey } from '../api/objects';
import {
  addParameterDefinition,
  addPropertyDefinition,
  entryRef,
  moveInList,
  readList,
  removeFromList,
  removeParameterDefinition,
  removePropertyDefinition,
  renameInstance,
  setComparison,
  setDeterminedProperty,
  setInstanceBinding,
  updateParameterDefinition,
  updatePropertyDefinition,
  type ListRef,
} from '../document/instanceOps';
import { getOwn } from '../document/own';
import { resolveInstance, type InstanceRef } from '../document/places';
import type { InstanceDocument, ParameterDefinition } from '../document/types';
import { ExpressionPanel } from '../expression/ExpressionPanel';
import { allowsContainedInstances, allowsContainedRules, allowsOwnParameters, allowsOwnProperties, contentKind, OWN_DATATYPES } from '../model/objectContent';
import { iconOf, labelText, timeUnitChoices } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Btn, Section, Select, TextInput, Toggle } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { FieldRow, applies, initialValue, specOfParameter, type FieldSpec, ValueInput } from './fields';

/**
 * The contents of the instances of a strategy (specification 3.3, 5.4): rules and rulesets of the strategy and of the
 * elements, and what an instance of an own indicator, an own trend or an own ruleset holds: own parameters and
 * properties with their expressions, contained indicators, rules and rulesets.
 */

function ownSpecs(instance: InstanceDocument): FieldSpec[] {
  return (instance.parameters ?? []).map((definition) => ({
    id: definition.key,
    datatype: definition.datatype,
    label: { de: definition.name, en: definition.name },
    explanation: { de: '', en: '' },
    bindings: ['fixed', 'parameter', 'connection', 'expression', 'application'],
    choices: (definition.choices ?? []).map((id) => ({ id, label: { de: id, en: id } })),
    default: definition.default ?? null,
    objectType: definition.object_type ?? null,
    appliesWhen: null,
    required: definition.required === true,
  }));
}

// ---- the parameters of an instance -----------------------------------------------------------------------------------

/** The values of the parameters of an instance: those of its type and its own. */
function ParameterValues({ refTo, instance }: { refTo: InstanceRef; instance: InstanceDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const type = types.byId.get(instance.object_type);
  const valueOf = (id: string): unknown => getOwn(instance.parameter_values, id)?.value;
  const specs = [...(type?.parameters ?? []).map(specOfParameter), ...ownSpecs(instance)].filter((spec) => applies(spec, valueOf));
  if (specs.length === 0) {
    return null;
  }
  return (
    <Section title={t('instances.parameters')} testid="sec-instance-parameters">
      {specs.map((spec) => (
        <FieldRow
          key={spec.id}
          spec={spec}
          binding={getOwn(instance.parameter_values, spec.id)}
          level={null}
          language={studio.language}
          document={document}
          types={types}
          answer={undefined}
          place={{ kind: 'parameter', ref: refTo, key: spec.id }}
          onChange={(binding) => {
            studio.actions.edit((latest) => setInstanceBinding(latest, refTo, spec.id, binding));
          }}
          onCreateParameter={(name) =>
            studio.actions.addParameter({
              name,
              datatype: spec.datatype,
              object_type: spec.objectType,
              value: spec.default ?? undefined,
              at_application: false,
              choices: spec.datatype === 'choice' ? spec.choices.map((choice) => choice.id) : [],
            })
          }
        />
      ))}
    </Section>
  );
}

/** The own parameters of an instance (definitions): name, datatype, required, standard value. */
function OwnParameters({ refTo, instance }: { refTo: InstanceRef; instance: InstanceDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  const [name, setName] = useState('');
  const [datatype, setDatatype] = useState<DataType>('number');
  if (document === null || types === null) {
    return null;
  }
  const timeUnits = timeUnitChoices(types);
  const found = resolveInstance(document, refTo);
  const add = (): void => {
    const trimmed = name.trim();
    if (trimmed === '' || found === null) {
      return;
    }
    void createKey(document, `${found.pointer}/parameters`, trimmed, undefined, { kind: 'parameter' }).then((key) => {
      const definition: ParameterDefinition = {
        key,
        name: trimmed,
        datatype,
        object_type: null,
        required: false,
        default: null,
        choices: [],
      };
      studio.actions.edit((latest) => addParameterDefinition(latest, refTo, definition));
      setName('');
    });
  };
  return (
    <Section title={t('instances.ownParameters')} testid="sec-own-parameters">
      <p className="muted">{t('instances.ownParametersHint')}</p>
      {(instance.parameters ?? []).length === 0 ? <p className="empty-note">{t('instances.noOwnParameters')}</p> : null}
      {(instance.parameters ?? []).map((definition) => (
        <div key={definition.key} className="own-prop" data-testid="own-parameter">
          <div className="own-row">
            <TextInput
              value={definition.name}
              onChange={(next) => {
                studio.actions.edit((latest) => updateParameterDefinition(latest, refTo, definition.key, { name: next }));
              }}
              ariaLabel={t('instances.name')}
              testid="own-parameter-name"
            />
            <span className="dtype-chip">{t(`datatype.${definition.datatype}`)}</span>
            <Btn
              small
              kind="quiet"
              icon="trash"
              title={t('instances.removeParameter', { name: definition.name })}
              onClick={() => {
                studio.actions.edit((latest) => removeParameterDefinition(latest, refTo, definition.key));
              }}
            />
          </div>
          <Toggle
            checked={definition.required === true}
            onChange={(checked) => {
              studio.actions.edit((latest) => updateParameterDefinition(latest, refTo, definition.key, { required: checked }));
            }}
            label={t('instances.required')}
          />
          <div className="own-row">
            <span className="muted">{t('instances.standardValue')}</span>
            <ValueInput
              datatype={definition.datatype}
              value={definition.default ?? initialValue(definition.datatype, { default: null, choices: [] }, timeUnits)}
              choices={definition.datatype === 'time_unit' ? timeUnits : []}
              language={studio.language}
              onChange={(value) => {
                studio.actions.edit((latest) => updateParameterDefinition(latest, refTo, definition.key, { default: value }));
              }}
              ariaLabel={t('instances.standardValue')}
            />
          </div>
        </div>
      ))}
      <div className="inline-new">
        <TextInput value={name} onChange={setName} placeholder={t('instances.newParameterName')} ariaLabel={t('instances.newParameterName')} testid="own-parameter-new-name" onEnter={add} />
        <Select value={datatype} onChange={(next) => { setDatatype(next as DataType); }} ariaLabel={t('instances.datatype')} testid="own-parameter-new-type">
          {OWN_DATATYPES.map((entry) => (
            <option key={entry} value={entry}>
              {t(`datatype.${entry}`)}
            </option>
          ))}
        </Select>
        <Btn small kind="primary" icon="plus" disabled={name.trim() === ''} testid="own-parameter-add" onClick={add}>
          {t('instances.addParameter')}
        </Btn>
      </div>
    </Section>
  );
}

// ---- the properties of an instance -----------------------------------------------------------------------------------

/** The properties of an own indicator or trend with the expression that gives each its value. */
function Properties({ refTo, instance }: { refTo: InstanceRef; instance: InstanceDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  const [name, setName] = useState('');
  const [datatype, setDatatype] = useState<DataType>('number');
  if (document === null || types === null) {
    return null;
  }
  const type = types.byId.get(instance.object_type);
  const kind = contentKind(type);
  const found = resolveInstance(document, refTo);
  const defined = new Set((instance.properties ?? []).map((property) => property.key));
  // The properties the type names get their value from an expression of the user (a trend: its direction).
  const missing = kind === 'trend' ? (type?.properties ?? []).filter((property) => property.setByUser && !defined.has(property.id)) : [];
  const own = allowsOwnProperties(kind) && kind === 'indicator';
  const add = (): void => {
    const trimmed = name.trim();
    if (trimmed === '' || found === null) {
      return;
    }
    void createKey(document, `${found.pointer}/properties`, trimmed, undefined, { kind: 'property' }).then((key) => {
      studio.actions.edit((latest) => addPropertyDefinition(latest, refTo, { key, name: trimmed, datatype, expression: '' }));
      setName('');
    });
  };
  return (
    <Section title={t('instances.properties')} testid="sec-instance-properties">
      <p className="muted">{t(kind === 'trend' ? 'instances.propertiesHintTrend' : 'instances.propertiesHint')}</p>
      {missing.map((property) => (
        <div key={property.id} className="own-prop" data-testid="property-missing">
          <div className="own-row">
            <b>{labelText(property.label, studio.language)}</b>
            <span className="dtype-chip">{t(`datatype.${property.datatype}`)}</span>
            <Btn
              small
              kind="primary"
              icon="plus"
              testid={`property-define-${property.id}`}
              onClick={() => {
                studio.actions.edit((latest) =>
                  addPropertyDefinition(latest, refTo, {
                    key: property.id,
                    name: labelText(property.label, studio.language),
                    datatype: property.datatype,
                    expression: '',
                  }),
                );
              }}
            >
              {t('instances.defineProperty', { name: labelText(property.label, studio.language) })}
            </Btn>
          </div>
        </div>
      ))}
      {(instance.properties ?? []).map((property) => {
        const fromType = type?.properties.some((candidate) => candidate.id === property.key) === true;
        return (
          <div key={property.key} className="own-prop" data-testid="instance-property" data-property={property.key}>
            <div className="own-row">
              {fromType ? (
                <b>{property.name}</b>
              ) : (
                <TextInput
                  value={property.name}
                  onChange={(next) => {
                    studio.actions.edit((latest) => updatePropertyDefinition(latest, refTo, property.key, { name: next }));
                  }}
                  ariaLabel={t('instances.name')}
                  testid="own-property-name"
                />
              )}
              <span className="dtype-chip">{t(`datatype.${property.datatype}`)}</span>
              {fromType ? null : (
                <Btn
                  small
                  kind="quiet"
                  icon="trash"
                  title={t('instances.removeProperty', { name: property.name })}
                  onClick={() => {
                    studio.actions.edit((latest) => removePropertyDefinition(latest, refTo, property.key));
                  }}
                />
              )}
            </div>
            <ExpressionPanel
              place={{ kind: 'property', ref: refTo, key: property.key }}
              mode="value"
              hint={undefined}
              testid={`property-expression-${property.key}`}
            />
          </div>
        );
      })}
      {own ? (
        <div className="inline-new">
          <TextInput value={name} onChange={setName} placeholder={t('instances.newPropertyName')} ariaLabel={t('instances.newPropertyName')} testid="own-property-new-name" onEnter={add} />
          <Select value={datatype} onChange={(next) => { setDatatype(next as DataType); }} ariaLabel={t('instances.datatype')} testid="own-property-new-type">
            {OWN_DATATYPES.map((entry) => (
              <option key={entry} value={entry}>
                {t(`datatype.${entry}`)}
              </option>
            ))}
          </Select>
          <Btn small kind="primary" icon="plus" disabled={name.trim() === ''} testid="own-property-add" onClick={add}>
            {t('instances.addProperty')}
          </Btn>
        </div>
      ) : null}
    </Section>
  );
}

// ---- rules ---------------------------------------------------------------------------------------------------------

/** Rule: the expression, the property it determines and the comparison it checks with. */
function RuleBody({ refTo, instance }: { refTo: InstanceRef; instance: InstanceDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  if (types === null) {
    return null;
  }
  const language = studio.language;
  // The properties a rule can determine: those the user sets for an order, from the descriptions of the order types.
  const determinable = new Map<string, { label: string; choices: { id: string; label: { de: string; en: string } }[] }>();
  for (const type of types.list) {
    if (type.kind !== 'order_type') {
      continue;
    }
    for (const property of type.properties) {
      if (property.setByUser && !determinable.has(property.id)) {
        determinable.set(property.id, { label: labelText(property.label, language), choices: property.choices });
      }
    }
  }
  const determined = instance.determined_property ?? '';
  const choices = determinable.get(determined)?.choices ?? [];
  return (
    <>
      <Section title={t('instances.ruleExpression')} testid="sec-rule-expression">
        <p className="muted">{t(determined === '' ? 'instances.ruleCheckHint' : 'instances.ruleDetermineHint')}</p>
        <ExpressionPanel
          place={{ kind: 'rule', ref: refTo, field: 'expression' }}
          mode={determined === '' ? 'condition' : 'value'}
          hint={choices.length > 0 ? { choices } : undefined}
          testid="rule-expression"
        />
      </Section>
      <Section title={t('instances.ruleDetermines')} testid="sec-rule-determines">
        <Select
          value={determined}
          onChange={(next) => {
            studio.actions.edit((latest) => setDeterminedProperty(latest, refTo, next === '' ? null : next));
          }}
          ariaLabel={t('instances.determinedProperty')}
          testid="rule-determined"
        >
          <option value="">{t('instances.determinesNothing')}</option>
          {[...determinable.entries()].map(([id, entry]) => (
            <option key={id} value={id}>
              {entry.label}
            </option>
          ))}
        </Select>
        {determined !== '' ? (
          <label className="kind-row">
            <span className="kind-cap">{t('instances.comparison')}</span>
            <Select
              value={instance.comparison ?? 'hoechstens'}
              onChange={(next) => {
                studio.actions.edit((latest) => setComparison(latest, refTo, next));
              }}
              ariaLabel={t('instances.comparison')}
              testid="rule-comparison"
            >
              {['hoechstens', 'mindestens', 'gleich'].map((entry) => (
                <option key={entry} value={entry}>
                  {t(`instances.comparisons.${entry}`)}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
      </Section>
    </>
  );
}

// ---- lists ---------------------------------------------------------------------------------------------------------

/** One instance in a list with its name, its origin, the order and the way to remove it; opened it shows its content. */
function InstanceCard({ list, instance, index, count, startOpen }: { list: ListRef; instance: InstanceDocument; index: number; count: number; startOpen: boolean }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const [open, setOpen] = useState(startOpen);
  const refTo = entryRef(list, instance.key);
  if (types === null) {
    return null;
  }
  const type = types.byId.get(instance.object_type);
  const language = studio.language;
  const origin = instance.origin;
  const delivered = origin?.template_id === null || origin?.template_id === undefined ? undefined : types.templates.find((template) => template.id === origin.template_id);
  const originName = type === undefined ? instance.object_type : labelText(type.name, language);
  const originText =
    origin?.template_id === null || origin?.template_id === undefined
      ? originName
      : `${delivered === undefined ? (origin.template_name ?? '') : labelText(delivered.label, language)} · ${originName}`;
  return (
    <li className="rule-edit" data-testid={list.list === 'rules' ? 'rule-card' : 'instance-card'} data-key={instance.key}>
      <div className="rule-head">
        <Btn
          small
          kind="quiet"
          icon={open ? 'down' : 'right'}
          title={t(open ? 'instances.fold' : 'instances.unfold', { name: instance.name })}
          testid="instance-toggle"
          onClick={() => {
            setOpen(!open);
          }}
        />
        <Icon name={iconOf(type)} size={15} />
        <TextInput
          value={instance.name}
          onChange={(name) => {
            studio.actions.edit((latest) => renameInstance(latest, refTo, name));
          }}
          ariaLabel={t('instances.name')}
          testid="instance-name"
        />
        <Btn
          small
          kind="quiet"
          icon="up"
          title={t('instances.up', { name: instance.name })}
          disabled={index === 0}
          testid="instance-up"
          onClick={() => {
            studio.actions.edit((latest) => moveInList(latest, list, instance.key, -1));
          }}
        />
        <Btn
          small
          kind="quiet"
          icon="down"
          title={t('instances.down', { name: instance.name })}
          disabled={index >= count - 1}
          testid="instance-down"
          onClick={() => {
            studio.actions.edit((latest) => moveInList(latest, list, instance.key, 1));
          }}
        />
        <Btn
          small
          kind="quiet"
          icon="trash"
          title={t('instances.remove', { name: instance.name })}
          testid="instance-remove"
          onClick={() => {
            studio.actions.edit((latest) => removeFromList(latest, list, instance.key));
          }}
        />
      </div>
      <span className="muted" data-testid="instance-origin">
        {originText}
      </span>
      {open ? <InstancePanel refTo={refTo} /> : null}
    </li>
  );
}

/**
 * The instances of a list with the choice that adds one: rules and rulesets of the strategy, of an element or of a
 * ruleset, or the indicators an own indicator or trend contains (specification 5.4, req-ui-012).
 */
export function InstanceList({ list, kind, testid }: { list: ListRef; kind: 'rules' | 'indicators'; testid?: string }) {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  const items = document === null ? [] : readList(document, list);
  const previous = useRef(items.length);
  const [opened, setOpened] = useState<string | null>(null);
  useEffect(() => {
    if (items.length > previous.current) {
      setOpened(items[items.length - 1]?.key ?? null);
    }
    previous.current = items.length;
  }, [items]);
  const entries = useMemo(
    () =>
      studio.library
        .flatMap((group) => group.entries)
        .filter((entry) => !entry.unreadable && (kind === 'rules' ? entry.target === 'rules' : entry.target === 'canvas' && entry.style === 'ind')),
    [kind, studio.library],
  );
  if (document === null) {
    return null;
  }
  return (
    <div className="instance-list" data-testid={testid}>
      {items.length === 0 ? <p className="empty-note">{t(kind === 'rules' ? 'properties.noRules' : 'instances.noContained')}</p> : null}
      <ul className="prop-list" data-testid={kind === 'rules' ? 'rule-list' : 'contained-list'}>
        {items.map((instance, index) => (
          <InstanceCard key={instance.key} list={list} instance={instance} index={index} count={items.length} startOpen={opened === instance.key} />
        ))}
      </ul>
      <Select
        value=""
        onChange={(entryKey) => {
          if (entryKey !== '') {
            void studio.actions.insert(entryKey, kind === 'rules' ? { ruleList: list } : { instanceList: list });
          }
        }}
        ariaLabel={t(kind === 'rules' ? 'instances.addRule' : 'instances.addContained')}
        testid={kind === 'rules' ? 'rule-add-select' : 'contained-add-select'}
      >
        <option value="">{t(kind === 'rules' ? 'instances.addRuleOption' : 'instances.addContainedOption')}</option>
        {entries.map((entry) => (
          <option key={entry.key} value={entry.key}>
            {entry.own ? `${entry.name} (${t('library.own')})` : entry.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

// ---- the content of one instance ------------------------------------------------------------------------------------

/** What an instance holds, by the kind of its object type. `card` is the instance an element shows: its parameters stand elsewhere. */
export function InstancePanel({ refTo, card = false }: { refTo: InstanceRef; card?: boolean }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const found = resolveInstance(document, refTo);
  if (found === null) {
    return null;
  }
  const instance = found.instance;
  const type = types.byId.get(instance.object_type);
  const kind = contentKind(type);
  const list = (name: 'rules' | 'instances'): ListRef => ({ root: refTo.root, steps: refTo.steps, list: name });
  return (
    <div className="instance-panel" data-testid="instance-panel" data-kind={kind ?? ''}>
      {card ? null : <ParameterValues refTo={refTo} instance={instance} />}
      {allowsOwnParameters(kind) ? <OwnParameters refTo={refTo} instance={instance} /> : null}
      {kind === 'rule' ? <RuleBody refTo={refTo} instance={instance} /> : null}
      {kind === 'indicator' || kind === 'trend' ? <Properties refTo={refTo} instance={instance} /> : null}
      {allowsContainedInstances(kind) ? (
        <Section title={t('instances.contained')} testid="sec-contained">
          <InstanceList list={list('instances')} kind="indicators" />
        </Section>
      ) : null}
      {allowsContainedRules(kind) ? (
        <Section title={t(kind === 'ruleset' ? 'instances.rulesOfRuleset' : 'instances.rulesContained')} testid="sec-contained-rules">
          <InstanceList list={list('rules')} kind="rules" />
        </Section>
      ) : null}
      {kind === 'ruleset' ? (
        <Section title={t('instances.resultExpression')} testid="sec-result">
          <p className="muted">{t('instances.resultHint')}</p>
          <ExpressionPanel place={{ kind: 'rule', ref: refTo, field: 'result_expression' }} mode="value" testid="result-expression" />
        </Section>
      ) : null}
      {kind === null && !card ? <p className="muted">{t('instances.noContent')}</p> : null}
    </div>
  );
}
