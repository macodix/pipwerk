// Structure, class names and test identifiers follow the prototype (specification E8: an aid, not a template); a few
// lines are equal to it. See docs/technical/pipwerk-studio.md, section 2.3.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BindingKind, Choice, DataType, Label, ParameterDescription, PropertyDescription } from '../api/elementTypes';
import type { ExpressionAnswer } from '../api/objects';
import type { BindingScope } from '../document/ops';
import { getOwn } from '../document/own';
import type { ExpressionPlace } from '../document/places';
import { isConnectionValue, type Binding, type ElementDocument, type StrategyDocument } from '../document/types';
import { ExpressionPanel } from '../expression/ExpressionPanel';
import type { SupportedLanguage } from '../i18n';
import { elementName, propertyRows } from '../model/elements';
import { compatibleDataTypes, dataTypeWord, labelText, objectTypeChoices, timeUnitChoices, type TypeIndex } from '../model/typeIndex';
import { Btn, Info, NumberInput, Select, TextInput } from '../ui/controls';
import { Icon } from '../ui/Icon';

/** An entry that can be assigned: a parameter or property of a type description, or an own parameter of an instance. */
export type FieldSpec = Pick<
  ParameterDescription,
  'id' | 'datatype' | 'label' | 'explanation' | 'bindings' | 'choices' | 'default' | 'objectType' | 'appliesWhen'
> & {
  required: boolean;
  /** The word for the data type the description carries; none for an own parameter of an instance. */
  datatypeLabel?: Label | null;
};

export function specOfParameter(parameter: ParameterDescription): FieldSpec {
  return { ...parameter };
}

export function specOfProperty(property: PropertyDescription): FieldSpec {
  return { ...property, required: property.must };
}

/**
 * The value of an object that stands in for "the one of the application" (specification 3.1, 5.4): the description names
 * it as the default and as one of the values of the field. The field shows it in words and offers the way to choose
 * another one, and the way back.
 */
export function presetChoice(spec: Pick<FieldSpec, 'datatype' | 'default' | 'choices'>): Choice | null {
  if (spec.datatype !== 'object' || spec.default === null) {
    return null;
  }
  return spec.choices.find((choice) => choice.id === spec.default) ?? null;
}

/** The value a new strategy parameter of the datatype starts with. */
export function initialValue(datatype: DataType, spec: Pick<FieldSpec, 'default' | 'choices'>, timeUnits: readonly Choice[]): string | number | boolean {
  if (spec.default !== null) {
    return spec.default;
  }
  switch (datatype) {
    case 'number':
    case 'integer':
    case 'percent':
      return 0;
    case 'boolean':
      return false;
    case 'time_unit':
      return (spec.choices[0] ?? timeUnits[0])?.id ?? '';
    case 'choice':
      return spec.choices[0]?.id ?? '';
    default:
      return '';
  }
}

/** The kinds of assignment the user can choose, in the order of the type description. */
export function kindsFor(spec: FieldSpec, current: BindingKind | undefined): BindingKind[] {
  const kinds: BindingKind[] = [...spec.bindings];
  if (current !== undefined && !kinds.includes(current)) {
    kinds.push(current);
  }
  return kinds;
}

/** Whether a field applies in the present state of the other assignments (specification 3.1: "gilt bei einem Wert"). */
export function applies(spec: FieldSpec, valueOf: (id: string) => unknown): boolean {
  return spec.appliesWhen === null || valueOf(spec.appliesWhen.name) === spec.appliesWhen.value;
}

export function ValueInput({
  datatype,
  value,
  choices,
  language,
  onChange,
  testid,
  ariaLabel,
  other,
}: {
  datatype: DataType;
  value: unknown;
  choices: readonly Choice[];
  language: SupportedLanguage;
  onChange: (value: string | number | boolean) => void;
  testid?: string;
  ariaLabel?: string;
  /** Choices of a value of an object type: besides them the user may type the name of one. */
  other?: boolean;
}) {
  const { t } = useTranslation();
  if (datatype === 'time_unit' || datatype === 'choice') {
    return (
      <Select value={String(value ?? '')} onChange={onChange} testid={testid} ariaLabel={ariaLabel}>
        <option value="">{t('fields.choose')}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {labelText(choice.label, language)}
          </option>
        ))}
      </Select>
    );
  }
  if (datatype === 'boolean') {
    return (
      <Select
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(chosen) => {
          onChange(chosen === 'true');
        }}
        testid={testid}
        ariaLabel={ariaLabel}
      >
        <option value="true">{t('values.yes')}</option>
        <option value="false">{t('values.no')}</option>
      </Select>
    );
  }
  if (datatype === 'percent') {
    const shown = typeof value === 'number' ? Math.round(value * 10000) / 100 : '';
    return (
      <NumberInput
        value={shown}
        onChange={(typed) => {
          onChange(typed === '' ? '' : typed / 100);
        }}
        unit="%"
        testid={testid}
        ariaLabel={ariaLabel}
      />
    );
  }
  if (datatype === 'number' || datatype === 'integer') {
    return (
      <NumberInput
        value={typeof value === 'number' ? value : ''}
        onChange={(typed) => {
          onChange(typed);
        }}
        testid={testid}
        ariaLabel={ariaLabel}
      />
    );
  }
  if (datatype === 'date' || datatype === 'timestamp') {
    return (
      <input
        className="input"
        type={datatype === 'date' ? 'date' : 'datetime-local'}
        value={String(value ?? '')}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        data-testid={testid}
        aria-label={ariaLabel}
      />
    );
  }
  if (datatype === 'object' && choices.length > 0) {
    const text = String(value ?? '');
    const isChoice = choices.some((choice) => choice.id === text);
    return (
      <div className="object-value">
        <Select
          value={isChoice ? text : other === true && text !== '' ? '__other' : ''}
          onChange={(chosen) => {
            onChange(chosen === '__other' ? ' ' : chosen);
          }}
          testid={testid}
          ariaLabel={ariaLabel}
        >
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {labelText(choice.label, language)}
            </option>
          ))}
          <option value="__other">{t('fields.otherObject')}</option>
        </Select>
        {!isChoice && text !== '' ? (
          <TextInput
            value={text.trim()}
            onChange={onChange}
            placeholder={t('fields.otherObjectPlaceholder')}
            ariaLabel={t('fields.otherObjectLabel')}
            testid={testid === undefined ? undefined : `${testid}-text`}
            autoFocus
          />
        ) : null}
      </div>
    );
  }
  return <TextInput value={String(value ?? '')} onChange={onChange} testid={testid} ariaLabel={ariaLabel} />;
}

/**
 * An entry that names a strategy parameter: a text that only a fixed value can fill and that has no values of its own
 * (for example the strategy parameter a step changes). The type descriptions have no field for this; it follows from
 * their form, without knowing a single type (specification 3.1).
 */
export function isParameterReference(spec: FieldSpec): boolean {
  return spec.datatype === 'text' && spec.bindings.length === 1 && spec.bindings[0] === 'fixed' && spec.choices.length === 0;
}

function compatibleParameter(spec: FieldSpec, parameter: StrategyDocument['parameters'][number]): boolean {
  if (spec.datatype === 'object') {
    return parameter.datatype === 'object' && (parameter.object_type ?? null) === spec.objectType;
  }
  if (spec.datatype === 'choice') {
    return parameter.datatype === 'choice' || parameter.datatype === 'text';
  }
  return compatibleDataTypes(spec.datatype, parameter.datatype);
}

/** Choice of a strategy parameter, with the way to create one on the spot (specification 5.4). */
export function ParameterPicker({
  spec,
  value,
  parameters,
  onChange,
  onCreate,
  anyType,
}: {
  spec: FieldSpec;
  value: string;
  parameters: StrategyDocument['parameters'];
  onChange: (key: string) => void;
  onCreate: (name: string) => Promise<string | null>;
  /** Every strategy parameter fits (the entry names a strategy parameter and has no value of its own). */
  anyType?: boolean;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const list = parameters.filter((parameter) => anyType === true || compatibleParameter(spec, parameter));
  const none = list.length === 0;
  const create = (): void => {
    const trimmed = name.trim();
    if (trimmed === '') {
      return;
    }
    void onCreate(trimmed).then((key) => {
      if (key !== null) {
        setName('');
        setAdding(false);
        onChange(key);
      }
    });
  };
  return (
    <div className="parampick" data-testid="param-picker">
      {none ? (
        <p className="hint" data-testid="param-hint">
          <Icon name="info" size={15} />
          <span>{t(parameters.length === 0 ? 'fields.noParameterYet' : 'fields.noParameterFits')}</span>
        </p>
      ) : (
        <Select
          value={value}
          onChange={(chosen) => {
            if (chosen === '__new') {
              setAdding(true);
            } else {
              onChange(chosen);
            }
          }}
          testid="param-select"
          ariaLabel={t('fields.chooseParameter')}
        >
          <option value="">{t('fields.chooseParameterOption')}</option>
          {list.map((parameter) => (
            <option key={parameter.key} value={parameter.key}>
              {parameter.name}
            </option>
          ))}
          <option value="__new">{t('fields.newParameterOption')}</option>
        </Select>
      )}
      {none || adding ? (
        <div className="inline-new" data-testid="new-param-inline">
          <TextInput
            value={name}
            onChange={setName}
            placeholder={t('fields.newParameterName')}
            ariaLabel={t('fields.newParameterName')}
            testid="new-param-name"
            onEnter={create}
          />
          <Btn small kind="primary" icon="plus" testid="new-param-create" disabled={name.trim() === ''} onClick={create}>
            {t('fields.create')}
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

/** Choice of a value of an object: the instance, then one of its properties of a fitting datatype. */
export function ConnectionPicker({
  spec,
  value,
  document,
  types,
  language,
  self,
  onChange,
}: {
  spec: FieldSpec;
  value: Binding['value'];
  document: StrategyDocument;
  types: TypeIndex;
  language: SupportedLanguage;
  self: string;
  onChange: (value: { instance: string; property: string }) => void;
}) {
  const { t } = useTranslation();
  const current = isConnectionValue(value) ? value : { instance: '', property: '' };
  const [instance, setInstance] = useState(current.instance);
  const objects = document.elements.filter((candidate) => candidate.instance !== undefined && candidate.instance !== null && candidate.id !== self);
  if (objects.length === 0) {
    return (
      <p className="hint" data-testid="ref-hint">
        <Icon name="info" size={15} />
        <span>{t('fields.noObject')}</span>
      </p>
    );
  }
  const source = objects.find((candidate) => candidate.instance?.key === instance);
  const properties = source === undefined ? [] : propertyRows(types.byId.get(source.type), source.instance, language).filter((row) => row.datatype === 'object' ? spec.datatype === 'object' : compatibleDataTypes(row.datatype, spec.datatype));
  return (
    <div className="refpick">
      <Select value={instance} onChange={setInstance} testid="ref-object" ariaLabel={t('fields.chooseObject')}>
        <option value="">{t('fields.chooseObjectOption')}</option>
        {objects.map((candidate) => (
          <option key={candidate.id} value={candidate.instance?.key ?? ''}>
            {elementName(candidate, types, language)}
          </option>
        ))}
      </Select>
      <Select
        value={instance === current.instance ? current.property : ''}
        onChange={(property) => {
          if (property !== '') {
            onChange({ instance, property });
          }
        }}
        testid="ref-prop"
        ariaLabel={t('fields.chooseProperty')}
        disabled={instance === ''}
      >
        <option value="">{t('fields.choosePropertyOption')}</option>
        {properties.map((row) => (
          <option key={row.id} value={row.id}>
            {row.label}
          </option>
        ))}
      </Select>
      {instance !== '' && properties.length === 0 ? <p className="muted">{t('fields.noFittingProperty')}</p> : null}
    </div>
  );
}

/** An expression as the sentence the backend reads out of it, with the formula in the display form below (read only). */
export function ExpressionReadout({
  stored,
  answer,
  testid,
}: {
  stored: string;
  answer: ExpressionAnswer | undefined;
  testid?: string;
}) {
  const { t } = useTranslation();
  if (stored === '') {
    return (
      <div className="ep-sentence empty" data-testid={testid}>
        <span>{t('expression.empty')}</span>
      </div>
    );
  }
  return (
    <div className="ep" data-testid={testid}>
      <div className="ep-sentence" data-testid="expression-sentence">
        <Icon name="info" size={15} />
        <span>{answer === undefined ? '…' : answer.blocks === null ? t('expression.hasError') : answer.sentence}</span>
      </div>
      <p className="ep-label">{t('expression.formula')}</p>
      <code className="ep-formula" data-testid="expression-formula">
        {answer === undefined ? stored : answer.display}
      </code>
      <p className="muted">{t('expression.readOnly')}</p>
    </div>
  );
}

/** The editor of the expression an element holds for a field: blocks or formula (specification 5.4). */
function ExpressionEditor({ spec, place, selfKey, condition }: { spec: FieldSpec; place: ExpressionPlace; selfKey: string | null; condition: boolean }) {
  const hint = spec.choices.length > 0 ? { choices: spec.choices.map((choice) => ({ id: choice.id, label: choice.label })) } : undefined;
  return (
    <ExpressionPanel
      place={place}
      mode={condition ? 'condition' : 'value'}
      selfKey={selfKey}
      hint={hint}
      testid={`expression-${spec.id}`}
      focusField={place.kind === 'binding' ? `${place.scope === 'properties' ? 'property' : 'parameter'}:${place.key}` : undefined}
    />
  );
}

export type FieldRowProps = {
  spec: FieldSpec;
  binding: Binding | undefined;
  /** The assignment is shown, not changed (an element of an unknown type). */
  readOnly?: boolean;
  level: 'error' | 'hint' | null;
  language: SupportedLanguage;
  document: StrategyDocument;
  types: TypeIndex;
  /** The element the assignment belongs to; none for the parameter of an instance that lies in no element. */
  element?: ElementDocument;
  answer: ExpressionAnswer | undefined;
  onChange: (binding: Binding | null) => void;
  onCreateParameter: (name: string) => Promise<string | null>;
  /** The note under the label, for example which rule determines the value. */
  note?: string;
  /** Where the assignment lies in the element: needed to edit an expression there. */
  scope?: BindingScope;
  /** Where the expression of this field lies if that is not in an element (a parameter of a rule or a contained object). */
  place?: ExpressionPlace;
  /** An expression of this field is a condition (true or false) and not a value. */
  condition?: boolean;
};

/** One parameter or property with its label, its explanation, the kind of assignment and the value. */
export function FieldRow(props: FieldRowProps) {
  const { spec, binding, readOnly, level, language, document, types, element, answer, onChange, onCreateParameter, note, scope, condition } = props;
  const place: ExpressionPlace | null =
    props.place ?? (element !== undefined && scope !== undefined ? { kind: 'binding', element: element.id, scope, key: spec.id } : null);
  const { t } = useTranslation();
  const [chooseOther, setChooseOther] = useState(false);
  // The data type stands in the explanation shown when the field is pointed at, in the words of the library (E11).
  const typeSentence =
    spec.datatype === 'expression'
      ? ''
      : t('fields.expects', {
          word: dataTypeWord(types, spec.datatype, language, { specific: spec.datatypeLabel, objectType: spec.objectType }),
        });
  const tip = [labelText(spec.explanation, language), typeSentence].filter((part) => part !== '').join(' ');
  const preset = presetChoice(spec);
  // The name of the object type stands in the sentences of the field that holds the one of the application ("das Instrument …").
  const presetType = (() => {
    const name = dataTypeWord(types, 'object', language, { objectType: spec.objectType });
    return language === 'en' ? name.toLowerCase() : name;
  })();
  const atPreset = preset !== null && (binding === undefined || (binding.kind === 'fixed' && binding.value === preset.id));
  const showPreset = atPreset && !chooseOther && readOnly !== true;
  const kinds = kindsFor(spec, binding?.kind);
  const exprOnly = spec.bindings.length === 1 && spec.bindings[0] === 'expression';
  const current = binding?.kind ?? 'unset';
  const timeUnits = timeUnitChoices(types);
  const choices = spec.datatype === 'time_unit' && spec.choices.length === 0 ? timeUnits : spec.choices;
  const objectChoices = spec.datatype === 'object' && spec.choices.length === 0 ? objectTypeChoices(types, spec.objectType) : spec.choices;

  const setKind = (kind: string): void => {
    switch (kind) {
      case 'unset':
        onChange(null);
        break;
      case 'fixed':
        onChange({ kind: 'fixed', value: initialValue(spec.datatype, spec, timeUnits) });
        break;
      case 'parameter':
        onChange({ kind: 'parameter', value: '' });
        break;
      case 'connection':
        onChange({ kind: 'connection', value: { instance: '', property: '' } });
        break;
      case 'expression':
        onChange({ kind: 'expression', value: '' });
        break;
      case 'application':
        onChange({ kind: 'application' });
        break;
      default:
        break;
    }
  };

  const reference = isParameterReference(spec);
  const valueEditor = (): React.ReactNode => {
    if (reference) {
      return (
        <ParameterPicker
          spec={spec}
          anyType
          value={binding?.kind === 'fixed' && typeof binding.value === 'string' ? binding.value : ''}
          parameters={document.parameters}
          onChange={(key) => {
            onChange({ kind: 'fixed', value: key });
          }}
          onCreate={onCreateParameter}
        />
      );
    }
    if (binding === undefined) {
      return exprOnly && place !== null && readOnly !== true ? (
        <ExpressionEditor spec={spec} place={place} selfKey={element?.key ?? null} condition={condition === true} />
      ) : exprOnly ? (
        <ExpressionReadout stored="" answer={undefined} testid={`expression-${spec.id}`} />
      ) : (
        <p className="fixed-note muted">{t(spec.required ? 'fields.unsetRequired' : 'fields.unsetOptional')}</p>
      );
    }
    switch (binding.kind) {
      case 'fixed':
        return readOnly === true ? (
          <p className="fixed-note">{String(binding.value ?? '')}</p>
        ) : (
          <ValueInput
            datatype={spec.datatype}
            value={binding.value}
            choices={spec.datatype === 'object' ? objectChoices : choices}
            language={language}
            other={spec.datatype === 'object'}
            onChange={(value) => {
              onChange({ kind: 'fixed', value });
            }}
            testid={`value-${spec.id}`}
            ariaLabel={labelText(spec.label, language)}
          />
        );
      case 'parameter':
        return readOnly === true ? (
          <p className="fixed-note">{document.parameters.find((candidate) => candidate.key === binding.value)?.name ?? '?'}</p>
        ) : (
          <ParameterPicker
            spec={spec}
            value={typeof binding.value === 'string' ? binding.value : ''}
            parameters={document.parameters}
            onChange={(key) => {
              onChange({ kind: 'parameter', value: key });
            }}
            onCreate={onCreateParameter}
          />
        );
      case 'connection':
        return (
          <ConnectionPicker
            spec={spec}
            value={binding.value}
            document={document}
            types={types}
            language={language}
            self={element?.id ?? ''}
            onChange={(value) => {
              onChange({ kind: 'connection', value });
            }}
          />
        );
      case 'expression':
        return place !== null && readOnly !== true ? (
          <ExpressionEditor spec={spec} place={place} selfKey={element?.key ?? null} condition={condition === true} />
        ) : (
          <ExpressionReadout
            stored={typeof binding.value === 'string' ? binding.value : ''}
            answer={answer}
            testid={`expression-${spec.id}`}
          />
        );
      case 'application':
        return <p className="fixed-note">{t('fields.application')}</p>;
    }
  };

  return (
    <div
      className={`field${level === 'error' ? ' has-error' : level === 'hint' ? ' has-hint' : ''}`}
      data-testid={`field-${spec.id}`}
      data-field={spec.id}
    >
      <div className="field-label" data-tip={tip === '' ? undefined : tip}>
        <span>{labelText(spec.label, language)}</span>
        {spec.required ? (
          <span className="req" aria-label={t('fields.required')}>
            *
          </span>
        ) : null}
        <Info tip={tip} label={t('fields.explanation')} />
      </div>
      {note !== undefined ? (
        <div className="field-note">
          <Icon name="shield" size={14} />
          <span>{note}</span>
        </div>
      ) : null}
      {showPreset ? (
        <div className="preset" data-testid={`preset-${spec.id}`}>
          <p className="fixed-note" data-testid={`preset-text-${spec.id}`}>
            {t('fields.preset.value', { type: presetType })}
          </p>
          <p className="muted">{t('fields.preset.nothingToChoose')}</p>
          <Btn
            small
            kind="ghost"
            testid={`preset-other-${spec.id}`}
            onClick={() => {
              setChooseOther(true);
            }}
          >
            {t('fields.preset.other', { type: presetType })}
          </Btn>
        </div>
      ) : (
        <>
          {exprOnly || reference || readOnly === true ? null : (
            <label className="kind-row">
              <span className="kind-cap">{t('fields.source')}</span>
              <Select
                value={current}
                onChange={setKind}
                testid={`kind-${spec.id}`}
                ariaLabel={`${labelText(spec.label, language)}: ${t('fields.source')}`}
              >
                <option value="unset">{t('binding.unset')}</option>
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`binding.${kind}`)}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <div className="field-value">{valueEditor()}</div>
          {preset !== null && readOnly !== true ? (
            <Btn
              small
              kind="ghost"
              testid={`preset-back-${spec.id}`}
              onClick={() => {
                if (!atPreset) {
                  onChange({ kind: 'fixed', value: preset.id });
                }
                setChooseOther(false);
              }}
            >
              {t('fields.preset.back', { type: presetType })}
            </Btn>
          ) : null}
        </>
      )}
    </div>
  );
}

export { getOwn };
