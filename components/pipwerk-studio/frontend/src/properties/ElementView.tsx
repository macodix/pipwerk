import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PropertyDescription, TypeDescription } from '../api/elementTypes';
import { getOwn } from '../document/own';
import { sectionOf } from '../document/ops';
import type { Binding, ElementDocument, InstanceDocument } from '../document/types';
import { elementName, isCardElement, propertyRows } from '../model/elements';
import { bindingSlot } from '../model/describe';
import { iconOf, kindClassOf, labelText, orderSelector } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Btn, Info, Section, Select, TextInput } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { contentKind } from '../model/objectContent';
import { FieldRow, applies, specOfParameter, specOfProperty, type FieldSpec } from './fields';
import { FindingsList } from './FindingsList';
import { InstanceList, InstancePanel } from './Instances';

/** The own parameters of an instance (from a template of the user) as entries that can be assigned. */
function ownSpecs(instance: InstanceDocument | null | undefined): FieldSpec[] {
  return (instance?.parameters ?? []).map((definition) => ({
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

function SectionPicker({ element }: { element: ElementDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const current = sectionOf(document, element.id) ?? '';
  const options = document.sections.filter((section) => section.flow === (element.management_of ?? null));
  const create = (): void => {
    if (name.trim() !== '') {
      studio.actions.createSection(element.id, name.trim());
      setAdding(false);
      setName('');
    }
  };
  return (
    <div>
      <Select
        value={current}
        onChange={(chosen) => {
          if (chosen === '__new') {
            setAdding(true);
          } else {
            studio.actions.setSection(element.id, chosen === '' ? null : chosen);
          }
        }}
        testid="section-select"
        ariaLabel={t('properties.section')}
      >
        <option value="">{t('properties.noSection')}</option>
        {options.map((section) => (
          <option key={section.id} value={section.id}>
            {section.name}
          </option>
        ))}
        <option value="__new">{t('properties.newSection')}</option>
      </Select>
      {adding ? (
        <div className="inline-new">
          <TextInput
            value={name}
            onChange={setName}
            placeholder={t('properties.sectionNamePlaceholder')}
            ariaLabel={t('properties.sectionName')}
            testid="section-name"
            autoFocus
            onEnter={create}
          />
          <Btn small kind="primary" testid="section-create" disabled={name.trim() === ''} onClick={create}>
            {t('properties.createSection')}
          </Btn>
        </div>
      ) : null}
      {current !== '' ? <p className="muted">{t('properties.sectionHint')}</p> : null}
    </div>
  );
}

/** The management the step belongs to, as a choice (the way without dragging, specification 5.1). */
function ManagementPicker({ element }: { element: ElementDocument }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const owners = document.elements.filter((candidate) => {
    if (candidate.id === element.id) {
      return false;
    }
    const type = types.byId.get(candidate.type);
    return type !== undefined && type.outputs.some((output) => output.holdsManagement);
  });
  return (
    <Select
      value={element.management_of ?? ''}
      onChange={(chosen) => {
        studio.actions.setManagement(element.id, chosen === '' ? null : chosen);
      }}
      testid="management-select"
      ariaLabel={t('properties.belongsTo')}
    >
      <option value="">{t('properties.mainFlow')}</option>
      {owners.map((owner) => (
        <option key={owner.id} value={owner.id}>
          {t('properties.managementOf', { name: elementName(owner, types, studio.language) })}
        </option>
      ))}
    </Select>
  );
}

function bindingOf(element: ElementDocument, scope: 'parameters' | 'properties' | 'instance', id: string): Binding | undefined {
  if (scope === 'instance') {
    return getOwn(element.instance?.parameter_values, id);
  }
  return getOwn(element[scope], id);
}

/** The properties view of an element: name, origin, settings, the properties it supplies, inputs, rules, section, management. */
export function ElementView({ element }: { element: ElementDocument }) {
  const { studio, types, findings, expressions } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const { actions, language } = studio;
  const type: TypeDescription | undefined = types.byId.get(element.type);
  const card = isCardElement(element, types);
  const mine = findings.ofElement(element.id);
  const instance = element.instance ?? null;
  const name = elementName(element, types, language);
  const cls = kindClassOf(type);

  if (type === undefined) {
    return (
      <div className="props" data-testid="props-unknown">
        <header className="props-head">
          <div className="badge b-unknown">
            <Icon name="warn" size={20} />
          </div>
          <div className="props-title">
            <span className="props-kind">{element.type}</span>
            <TextInput
              value={name}
              onChange={(value) => {
                actions.renameElement(element.id, value);
              }}
              ariaLabel={t('properties.name')}
              testid="element-name"
              className="title-input"
            />
          </div>
        </header>
        <p className="hint-box" data-testid="unknown-type-note">
          <Icon name="info" size={16} />
          <span>{t('properties.unknownType', { type: element.type })}</span>
        </p>
        <FindingsList items={mine} />
        <Section title={t('properties.storedAssignments')} testid="sec-stored">
          {[...Object.entries(element.parameters), ...Object.entries(element.properties)].length === 0 ? (
            <p className="empty-note">{t('properties.noAssignments')}</p>
          ) : (
            <ul className="prop-list">
              {[...Object.entries(element.parameters), ...Object.entries(element.properties)].map(([key, binding]) => (
                <li key={key} className="prop-row">
                  <span className="prop-name">{key}</span>
                  <span className="dtype-chip">{t(`binding.${binding.kind}`)}</span>
                  <span className="prop-values">{typeof binding.value === 'string' ? binding.value : JSON.stringify(binding.value ?? null)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <footer className="props-foot">
          <Btn
            icon="trash"
            kind="quiet"
            testid="remove-element"
            onClick={() => {
              void actions.requestRemoveElement(element.id);
            }}
          >
            {t('properties.remove')}
          </Btn>
        </footer>
      </div>
    );
  }

  const scope: 'parameters' | 'instance' = card ? 'instance' : 'parameters';
  const valueOf = (id: string): unknown => {
    const binding = bindingOf(element, 'properties', id) ?? bindingOf(element, scope, id);
    return binding?.kind === 'fixed' ? binding.value : undefined;
  };
  const answerFor = (where: 'parameters' | 'properties' | 'instance', id: string) =>
    expressions.answer(bindingSlot(element.id, where, id));
  const lvl = (id: string): 'error' | 'hint' | null => {
    const own = mine.filter((finding) => {
      const field = finding.details.field;
      return typeof field === 'string' && field.endsWith(`:${id}`);
    });
    return own.some((finding) => finding.level === 'error') ? 'error' : own.length > 0 ? 'hint' : null;
  };

  const row = (spec: FieldSpec, where: 'parameters' | 'properties' | 'instance', note?: string) => (
    <FieldRow
      key={`${where}-${spec.id}`}
      spec={spec}
      binding={bindingOf(element, where, spec.id)}
      level={lvl(spec.id)}
      language={language}
      document={document}
      types={types}
      element={element}
      answer={answerFor(where, spec.id)}
      note={note}
      scope={where}
      condition={spec.datatype === 'expression' && type.named && type.properties.some((property) => property.datatype === 'boolean')}
      onChange={(binding) => {
        actions.setBinding(element.id, where, spec.id, binding);
      }}
      onCreateParameter={(parameterName) =>
        actions.addParameter({
          name: parameterName,
          datatype: spec.datatype,
          object_type: spec.objectType,
          value: spec.default ?? undefined,
          at_application: false,
          choices: spec.datatype === 'choice' ? spec.choices.map((choice) => choice.id) : [],
        })
      }
    />
  );

  const typeSpecs: FieldSpec[] = type.parameters.map(specOfParameter);
  const own = ownSpecs(instance);
  const exprSpecs = [...typeSpecs, ...own].filter((spec) => spec.bindings.length === 1 && spec.bindings[0] === 'expression');
  const settingSpecs = [...typeSpecs, ...own].filter(
    (spec) => !(spec.bindings.length === 1 && spec.bindings[0] === 'expression') && applies(spec, valueOf),
  );
  const selector = orderSelector(types, type);
  const chosenOrder = selector === null ? undefined : getOwn(element.parameters, selector.parameter.id)?.value;
  const orderType = selector?.orderTypes.find((candidate) => candidate.id === chosenOrder);
  const orderSpecs: FieldSpec[] = (orderType?.properties ?? [])
    .filter((property: PropertyDescription) => property.setByUser)
    .map(specOfProperty)
    .filter((spec) => applies(spec, valueOf));

  // The properties the object supplies, with the elements that use them.
  const supplied = propertyRows(type, instance, language);
  const used = new Map<string, string[]>();
  if (card && instance !== null) {
    for (const other of document.elements) {
      const hits = new Set<string>();
      for (const input of other.inputs) {
        if (input.instance.toLowerCase() === instance.key.toLowerCase()) {
          hits.add(input.property);
        }
      }
      for (const reference of expressions.references.get(other.id) ?? []) {
        if (reference.instance.toLowerCase() === instance.key.toLowerCase()) {
          hits.add(reference.property);
        }
      }
      hits.forEach((property) => {
        used.set(property, [...(used.get(property) ?? []), elementName(other, types, language)]);
      });
    }
  }

  const objects = document.elements.filter((candidate) => isCardElement(candidate, types) && candidate.id !== element.id);
  const originText = (() => {
    const origin = instance?.origin;
    if (!card || origin === undefined || origin === null) {
      return '';
    }
    const objectType = types.byId.get(origin.object_type);
    const objectTypeName = objectType === undefined ? origin.object_type : labelText(objectType.name, language);
    if (origin.template_id === null || origin.template_id === undefined) {
      return t('properties.originType', { name, type: objectTypeName });
    }
    const delivered = types.templates.find((template) => template.id === origin.template_id);
    const templateName = delivered === undefined ? (origin.template_name ?? '') : labelText(delivered.label, language);
    return t('properties.originTemplate', { name, template: templateName, type: objectTypeName });
  })();
  const sections = !card;

  return (
    <div className="props" data-testid="props-element" data-kind={element.type} data-element-id={element.id}>
      <header className="props-head">
        <div className={`badge b-${cls}`}>
          <Icon name={iconOf(type)} size={20} />
        </div>
        <div className="props-title">
          <span className="props-kind">{labelText(type.name, language)}</span>
          <TextInput
            value={name}
            onChange={(value) => {
              actions.renameElement(element.id, value);
            }}
            ariaLabel={t('properties.name')}
            testid="element-name"
            className="title-input"
          />
        </div>
      </header>
      {originText !== '' ? (
        <p className="origin" data-testid="element-origin">
          <Icon name="tag" size={14} />
          {originText}
        </p>
      ) : null}
      <p className="type-tip">{labelText(type.explanation, language)}</p>
      <FindingsList items={mine} />

      {exprSpecs.map((spec) => (
        <Section key={spec.id} title={labelText(spec.label, language)} testid={`sec-${spec.id}`}>
          {row(spec, scope)}
        </Section>
      ))}

      {settingSpecs.length > 0 ? (
        <Section title={t(card ? 'properties.settingsOfObject' : 'properties.settings')} testid="sec-settings">
          {settingSpecs.map((spec) => row(spec, scope))}
        </Section>
      ) : null}

      {orderSpecs.length > 0 ? (
        <Section title={t('properties.orderProperties')} testid="sec-order">
          <p className="muted">{t('properties.orderPropertiesHint')}</p>
          {orderSpecs.map((spec) => row(spec, 'properties'))}
        </Section>
      ) : null}

      {supplied.length > 0 && (card || type.named) ? (
        <Section
          title={t('properties.delivers')}
          testid="sec-delivers"
          aside={<span className="muted">{t('properties.deliversHint')}</span>}
        >
          <ul className="prop-list">
            {supplied.map((property) => {
              const users = used.get(property.id);
              return (
                <li
                  key={property.id}
                  className="prop-row"
                  data-tip={property.explanation === '' ? undefined : property.explanation}
                  data-testid="prop-row"
                >
                  <span className="prop-name">{property.label}</span>
                  <span className="dtype-chip">{t(`datatype.${property.datatype}`)}</span>
                  {property.choices.length > 0 ? (
                    <span className="prop-values" data-testid="prop-values">
                      {property.choices.map((choice) => labelText(choice.label, language)).join(' · ')}
                    </span>
                  ) : null}
                  {users !== undefined ? (
                    <span className="prop-used">
                      <Icon name="link" size={12} />
                      {users.join(', ')}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section
        title={t('properties.inputs')}
        testid="sec-inputs"
        aside={<Info tip={t('properties.inputsHint')} label={t('fields.explanation')} />}
      >
        {element.inputs.length === 0 ? <p className="empty-note">{t('properties.noInputs')}</p> : null}
        <div className="chips">
          {element.inputs.map((input, position) => {
            const source = objects.find((candidate) => candidate.instance?.key.toLowerCase() === input.instance.toLowerCase());
            const property = source === undefined ? undefined : propertyRows(types.byId.get(source.type), source.instance, language).find((row2) => row2.id === input.property);
            return (
              <span key={`${position}:${input.instance}.${input.property}`} className="chip chip-input" data-testid="input-chip">
                <Icon name="link" size={12} />
                {source === undefined ? input.instance : elementName(source, types, language)} › {property?.label ?? input.property}
                <button
                  type="button"
                  aria-label={t('properties.removeInput')}
                  onClick={() => {
                    actions.removeInput(element.id, input);
                  }}
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            );
          })}
        </div>
        <Select
          value=""
          onChange={(chosen) => {
            if (chosen === '') {
              return;
            }
            const [instanceKey, property] = chosen.split('|');
            if (instanceKey !== undefined && property !== undefined) {
              actions.addInput(element.id, { instance: instanceKey, property });
            }
          }}
          ariaLabel={t('properties.connectValue')}
          testid="input-add"
        >
          <option value="">{t('properties.connectValueOption')}</option>
          {objects.map((object) => (
            <optgroup key={object.id} label={elementName(object, types, language)}>
              {propertyRows(types.byId.get(object.type), object.instance, language).map((property) => (
                <option key={property.id} value={`${object.instance?.key ?? ''}|${property.id}`}>
                  {elementName(object, types, language)} › {property.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Section>

      {card && contentKind(type) !== null ? (
        <Section title={t('instances.content')} testid="sec-content">
          <InstancePanel refTo={{ root: { kind: 'object', id: element.id }, steps: [] }} card />
        </Section>
      ) : null}

      {type.rulesAllowed ? (
        <Section title={t('properties.rulesOfElement')} testid="sec-element-rules">
          <p className="muted">{t('properties.rulesOfElementHint')}</p>
          <InstanceList list={{ root: { kind: 'element', id: element.id }, steps: [], list: 'rules' }} kind="rules" />
        </Section>
      ) : null}

      {sections ? (
        <Section
          title={t('properties.section')}
          testid="sec-section"
          aside={<Info tip={t('properties.sectionInfo')} label={t('fields.explanation')} />}
        >
          <SectionPicker element={element} />
        </Section>
      ) : null}

      {sections ? (
        <Section title={t('properties.belongsTo')} testid="sec-management">
          <ManagementPicker element={element} />
          <p className="muted">{t('properties.belongsToHint')}</p>
        </Section>
      ) : null}

      <footer className="props-foot">
        <Btn
          icon="trash"
          kind="quiet"
          testid="remove-element"
          onClick={() => {
            void actions.requestRemoveElement(element.id);
          }}
        >
          {t('properties.remove')}
        </Btn>
      </footer>
    </div>
  );
}
