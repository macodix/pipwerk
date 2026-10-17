import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import {
  findElement,
  setElementBinding,
  setInstanceBinding,
  updateElement,
  updateInstance,
} from '../document/ops';
import type { Binding, Bindings, ElementDocument } from '../document/types';
import { FindingsList } from '../findings/FindingsList';
import { hasNameField, holdsInstance, orderSelector, typeName } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { BindingEditor } from './BindingEditor';
import { RulesSection } from './RulesSection';
import {
  instanceParameterSpecs,
  orderPropertySpecs,
  parameterSpecs,
  visibleSpecs,
  type BindingSpec,
} from './specs';

/** The line that names where an instance comes from: "ema20, aus Objekttyp EMA" or "…, aus Vorlage <Bezeichnung>". */
function OriginLine({ element }: { element: ElementDocument }) {
  const { t } = useTranslation();
  const { types, language } = useStudio();
  const instance = element.instance;
  if (instance === undefined || instance === null) {
    return null;
  }
  const origin = instance.origin;
  const templateTitle = origin?.template_title;
  if (origin?.template_id !== undefined && origin.template_id !== null) {
    return (
      <p className="origin">
        {t('properties.originTemplate', {
          name: instance.name,
          title: templateTitle ?? origin.template_id,
        })}
      </p>
    );
  }
  return (
    <p className="origin">
      {t('properties.originType', {
        name: instance.name,
        type: typeName(types, origin?.object_type ?? instance.object_type, language),
      })}
    </p>
  );
}

function Section({
  title,
  specs,
  bindings,
  onChange,
  elementId,
  readOnly,
  place,
  fieldKind,
}: {
  title: string;
  specs: BindingSpec[];
  bindings: Bindings;
  onChange: (key: string, binding: Binding | null) => void;
  elementId: string;
  readOnly: boolean;
  /** Whether the values stand at the element or in its instance (then the check names the instance as subject). */
  place: 'element' | 'instance';
  fieldKind: 'parameter' | 'property';
}) {
  const { document } = useStudio();
  const element = findElement(document, elementId);
  if (specs.length === 0) {
    return null;
  }
  const rows = visibleSpecs(specs, bindings);
  return (
    <section className="binding-section">
      <h3>{title}</h3>
      {rows.map((spec) => (
        <BindingEditor
          key={spec.key}
          spec={spec}
          binding={bindings[spec.key]}
          readOnly={readOnly}
          onChange={(binding) => {
            onChange(spec.key, binding);
          }}
          place={{
            element: elementId,
            subject: place === 'instance' ? (element?.instance?.name ?? null) : null,
            field: `${fieldKind}:${spec.key}`,
          }}
          context={{ kind: 'element', elementId }}
        />
      ))}
    </section>
  );
}

/** The bindings of an element of an unknown type, shown as they are stored (item 10 of the order). */
function StoredBindings({ title, bindings }: { title: string; bindings: Bindings }) {
  const { t } = useTranslation();
  const entries = Object.entries(bindings);
  if (entries.length === 0) {
    return null;
  }
  return (
    <section className="binding-section">
      <h3>{title}</h3>
      <dl className="stored-bindings">
        {entries.map(([key, binding]) => (
          <div key={key} className="stored-binding">
            <dt>{key}</dt>
            <dd>
              {t(`properties.binding.${binding.kind}`)}
              {binding.value === undefined || binding.value === null ? '' : `: ${String(binding.value)}`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The property view of an element (item 5 of the order). */
export function ElementProperties({ elementId }: { elementId: string }) {
  const { t } = useTranslation();
  const { document, types, language, findings, edit } = useStudio();
  const titleId = useId();
  const nameId = useId();
  const element = findElement(document, elementId);
  if (element === undefined) {
    return null;
  }
  const type = types.byId.get(element.type);
  const known = type !== undefined;
  const hasInstance = element.instance !== undefined && element.instance !== null;
  const instanceBased = hasInstance || holdsInstance(type);
  const typeLabel = typeName(types, element.type, language);

  // Where the values of the parameters live: in the instance for an object, else in the element.
  const parameterBindings: Bindings = instanceBased ? (element.instance?.parameter_values ?? {}) : element.parameters;
  const parameterRows: BindingSpec[] =
    type === undefined
      ? []
      : instanceBased && element.instance !== undefined && element.instance !== null
        ? instanceParameterSpecs(element.instance, type, language)
        : parameterSpecs(type, language);
  const propertyRows = orderPropertySpecs(types, type, element, language);

  const readOnly = !known;
  const selector = type === undefined ? null : orderSelector(types, type);

  return (
    <div className="properties-element">
      <h2>
        {element.instance !== undefined && element.instance !== null && element.instance.name !== ''
          ? element.instance.name
          : element.title !== ''
            ? element.title
            : typeLabel}
      </h2>
      <p className="element-type">
        {known ? typeLabel : t('properties.unknownType', { type: element.type })}
      </p>
      {known && type !== undefined ? <p className="element-description">{type.description[language]}</p> : null}
      <OriginLine element={element} />

      <div className="field">
        <label htmlFor={titleId}>{t('properties.label')}</label>
        <input
          id={titleId}
          type="text"
          value={element.title}
          onChange={(event) => {
            const value = event.target.value;
            edit((current) => updateElement(current, elementId, { title: value }));
          }}
        />
      </div>
      {hasInstance && !readOnly ? (
        <div className="field">
          <label htmlFor={nameId}>{t('properties.name')}</label>
          <input
            id={nameId}
            type="text"
            value={element.instance?.name ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              edit((current) => updateInstance(current, { kind: 'element', id: elementId }, { name: value }));
            }}
          />
        </div>
      ) : null}
      {!hasInstance && hasNameField(type) ? (
        <div className="field">
          <label htmlFor={nameId}>{t('properties.name')}</label>
          <input
            id={nameId}
            type="text"
            value={element.name ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              edit((current) => updateElement(current, elementId, { name: value === '' ? null : value }));
            }}
          />
        </div>
      ) : null}

      <FindingsList findings={findings.ofElement(document, elementId)} heading={t('findings.ofElement')} />

      {readOnly ? (
        <>
          <StoredBindings title={t('properties.parameters')} bindings={element.parameters} />
          <StoredBindings title={t('properties.properties')} bindings={element.properties} />
          {element.instance !== undefined && element.instance !== null ? (
            <StoredBindings title={t('properties.instanceValues')} bindings={element.instance.parameter_values ?? {}} />
          ) : null}
        </>
      ) : (
        <>
          <Section
            title={t('properties.parameters')}
            specs={parameterRows}
            bindings={parameterBindings}
            elementId={elementId}
            readOnly={false}
            place={instanceBased ? 'instance' : 'element'}
            fieldKind="parameter"
            onChange={(key, binding) => {
              edit((current) =>
                instanceBased
                  ? setInstanceBinding(current, { kind: 'element', id: elementId }, key, binding)
                  : setElementBinding(current, elementId, 'parameters', key, binding),
              );
            }}
          />
          {selector !== null ? (
            <Section
              title={t('properties.orderProperties')}
              specs={propertyRows}
              bindings={element.properties}
              elementId={elementId}
              readOnly={false}
              place="element"
              fieldKind="property"
              onChange={(key, binding) => {
                edit((current) => setElementBinding(current, elementId, 'properties', key, binding));
              }}
            />
          ) : null}
          {type?.rulesAllowed === true ? (
            <RulesSection owner={{ kind: 'element', id: elementId }} rules={element.rules} />
          ) : null}
        </>
      )}
    </div>
  );
}
