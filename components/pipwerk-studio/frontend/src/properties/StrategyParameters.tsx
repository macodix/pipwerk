import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataType } from '../api/elementTypes';
import type { StrategyParameter } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { fixedText } from '../model/describe';
import { elementName } from '../model/elements';
import {
  compatibleDataTypes,
  dataTypeWord,
  objectTypeChoices,
  objectTypesInUse,
  timeUnitChoices,
  type TypeIndex,
} from '../model/typeIndex';
import type { ParameterVisit } from '../state/studioState';
import { useStudio } from '../state/StudioContext';
import { Btn, Select, TextInput, Toggle } from '../ui/controls';
import { initialValue, ValueInput } from './fields';

/** The data types a strategy parameter can have besides the object types the type descriptions name. */
const PLAIN_TYPES: DataType[] = ['number', 'integer', 'percent', 'boolean', 'text', 'time_unit'];

/** The entry of the data type list that stands for a value of a data type (and object type) of a field. */
export function typeChoiceFor(types: TypeIndex, datatype: string, objectType: string | null): string {
  if (datatype === 'object') {
    return objectType !== null && objectTypesInUse(types).includes(objectType) ? `object:${objectType}` : 'number';
  }
  if (datatype === 'choice') {
    return 'text';
  }
  return PLAIN_TYPES.find((plain) => plain === datatype) ?? PLAIN_TYPES.find((plain) => compatibleDataTypes(datatype as DataType, plain)) ?? 'number';
}

/** The data type list: the plain data types in the words of the library, then the object types. */
function typeOptions(types: TypeIndex, language: SupportedLanguage): React.ReactNode[] {
  // plain elements, not a component: the choice reads its entries from the elements it is given
  return [
    ...PLAIN_TYPES.map((id) => (
      <option key={id} value={id}>
        {dataTypeWord(types, id, language)}
      </option>
    )),
    ...objectTypesInUse(types).map((id) => (
      <option key={`object:${id}`} value={`object:${id}`}>
        {dataTypeWord(types, 'object', language, { objectType: id })}
      </option>
    )),
  ];
}

function splitType(chosen: string): { datatype: DataType; objectType: string | null } {
  return chosen.startsWith('object:')
    ? { datatype: 'object', objectType: chosen.slice(7) }
    : { datatype: chosen as DataType, objectType: null };
}

function ParameterEditor({ parameter, types }: { parameter: StrategyParameter; types: TypeIndex }) {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const { actions, language } = studio;
  const timeUnits = timeUnitChoices(types);
  const objectType = parameter.object_type ?? null;
  const typeValue = parameter.datatype === 'object' ? `object:${objectType ?? ''}` : parameter.datatype;
  const choices = parameter.datatype === 'time_unit' ? timeUnits : parameter.datatype === 'object' ? objectTypeChoices(types, objectType) : [];
  return (
    <div className="param-edit" data-testid="param-edit" data-field={`sp:${parameter.key}`}>
      <div className="param-line">
        <TextInput
          value={parameter.name}
          onChange={(name) => {
            actions.updateParameter(parameter.key, { name });
          }}
          ariaLabel={t('params.name')}
          testid="param-name"
        />
        <Btn
          kind="quiet"
          small
          icon="trash"
          title={t('params.remove')}
          testid="param-delete"
          onClick={() => {
            void actions.requestRemoveParameter(parameter.key);
          }}
        />
      </div>
      <div className="param-line">
        <Select
          value={typeValue}
          onChange={(chosen) => {
            const next = splitType(chosen);
            const nextChoices = next.datatype === 'time_unit' ? timeUnits : next.datatype === 'object' ? objectTypeChoices(types, next.objectType) : [];
            actions.updateParameter(parameter.key, {
              datatype: next.datatype,
              object_type: next.objectType,
              value: initialValue(next.datatype, { default: null, choices: nextChoices }, timeUnits),
              choices: [],
            });
          }}
          ariaLabel={t('params.datatype')}
          testid="param-type"
        >
          {typeOptions(types, language)}
        </Select>
        {parameter.at_application === true ? (
          <span className="muted">{t('params.atApplicationNote')}</span>
        ) : (
          <ValueInput
            datatype={parameter.datatype}
            value={parameter.value}
            choices={parameter.datatype === 'choice' ? (parameter.choices ?? []).map((id) => ({ id, label: { de: id, en: id } })) : choices}
            language={language}
            other={parameter.datatype === 'object'}
            onChange={(value) => {
              actions.updateParameter(parameter.key, { value });
            }}
            testid="param-value"
            ariaLabel={t('params.value')}
          />
        )}
      </div>
      <div className="param-line sub">
        <Toggle
          checked={parameter.at_application === true}
          onChange={(checked) => {
            actions.updateParameter(parameter.key, { at_application: checked });
          }}
          label={t('params.atApplication')}
          testid="param-at-application"
        />
      </div>
    </div>
  );
}

/** The form of "Neuer Strategieparameter": name, data type and value; the data type may be preselected by a field. */
function NewParameter({ types, preselect, onClose }: { types: TypeIndex; preselect: ParameterVisit | null; onClose: () => void }) {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const { actions, language } = studio;
  const timeUnits = timeUnitChoices(types);
  const [name, setName] = useState('');
  const [typeValue, setTypeValue] = useState(() => (preselect === null ? 'number' : typeChoiceFor(types, preselect.datatype, preselect.objectType)));
  const { datatype, objectType } = splitType(typeValue);
  const choicesOf = (type: DataType, object: string | null) =>
    type === 'time_unit' ? timeUnits : type === 'object' ? objectTypeChoices(types, object) : [];
  const [value, setValue] = useState<string | number | boolean>(() => initialValue(datatype, { default: null, choices: choicesOf(datatype, objectType) }, timeUnits));
  const create = (): void => {
    const trimmed = name.trim();
    if (trimmed === '') {
      return;
    }
    void actions
      .addParameter({ name: trimmed, datatype, object_type: objectType, value, at_application: false, choices: [] })
      .then((key) => {
        if (key !== null) {
          onClose();
        }
      });
  };
  return (
    <div className="param-edit" data-testid="param-new-form">
      <div className="param-line">
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t('params.newNamePlaceholder')}
          ariaLabel={t('params.name')}
          testid="param-new-name"
          onEnter={create}
          autoFocus
        />
      </div>
      <div className="param-line">
        <Select
          value={typeValue}
          onChange={(chosen) => {
            const next = splitType(chosen);
            setTypeValue(chosen);
            setValue(initialValue(next.datatype, { default: null, choices: choicesOf(next.datatype, next.objectType) }, timeUnits));
          }}
          ariaLabel={t('params.datatype')}
          testid="param-new-type"
        >
          {typeOptions(types, language)}
        </Select>
        <ValueInput
          datatype={datatype}
          value={value}
          choices={choicesOf(datatype, objectType)}
          language={language}
          other={datatype === 'object'}
          onChange={setValue}
          testid="param-new-value"
          ariaLabel={t('params.value')}
        />
      </div>
      <div className="param-line sub">
        <Btn small kind="quiet" testid="param-new-cancel" onClick={onClose}>
          {t('common.cancel')}
        </Btn>
        <Btn small kind="primary" icon="plus" testid="param-new-create" disabled={name.trim() === ''} onClick={create}>
          {t('params.create')}
        </Btn>
      </div>
    </div>
  );
}

/**
 * The area "Strategieparameter" in the properties view of the strategy (specification 5.4): the only place where strategy
 * parameters are created, changed and removed. "Zur Strategie" in a field leads here with the data type of the field for
 * a new strategy parameter, and "Zurück zu …" leads back to the field.
 */
export function StrategyParameters() {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState<ParameterVisit | 'plain' | null>(null);
  const root = useRef<HTMLElement>(null);
  const visit = studio.state.parameterVisit;
  const serial = visit?.serial ?? null;
  // A visit from a field opens the form for a new strategy parameter with the data type of the field and shows the area.
  useEffect(() => {
    if (visit === null) {
      return;
    }
    setOpen(null);
    setCreating(visit);
    root.current?.scrollIntoView({ block: 'start' });
    // only a new visit counts, not the same visit again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial]);
  const document = studio.state.document;
  if (document === null || types === null) {
    return null;
  }
  const { language, actions } = studio;
  const timeUnits = timeUnitChoices(types);
  const origin = visit?.element === null || visit === null ? undefined : document.elements.find((candidate) => candidate.id === visit.element);
  return (
    <section className="psec" data-testid="sec-parameters" ref={root}>
      <header className="psec-head">
        <h3>{t('params.title')}</h3>
      </header>
      <div className="psec-body">
        {origin !== undefined ? (
          <div>
            <Btn
              small
              kind="ghost"
              icon="left"
              testid="param-back"
              onClick={() => {
                actions.backToField();
              }}
            >
              {t('params.backTo', { name: elementName(origin, types, language) })}
            </Btn>
          </div>
        ) : null}
        {document.parameters.length === 0 ? (
          <p className="empty-note" data-testid="param-empty">
            {t('params.none')}
          </p>
        ) : (
          <ul className="prop-list" data-testid="param-list">
            {document.parameters.map((parameter) => (
              <li key={parameter.key} className="param-item" data-key={parameter.key}>
                <button
                  type="button"
                  className={`param-row${open === parameter.key ? ' on' : ''}`}
                  onClick={() => {
                    setOpen(open === parameter.key ? null : parameter.key);
                  }}
                  data-testid="param-row"
                  data-tip={t('params.clickToChange')}
                  aria-expanded={open === parameter.key}
                >
                  <b className="param-name">{parameter.name}</b>
                  <span className="dtype-chip" data-testid="param-datatype">
                    {dataTypeWord(types, parameter.datatype, language, { objectType: parameter.object_type ?? null })}
                  </span>
                  <span className="param-value" data-testid="param-shown-value">
                    {parameter.at_application === true
                      ? t('binding.atApplicationShort')
                      : fixedText(
                          parameter.value,
                          parameter.datatype,
                          parameter.datatype === 'object' ? objectTypeChoices(types, parameter.object_type ?? null) : [],
                          language,
                          t,
                          timeUnits,
                        )}
                  </span>
                </button>
                {open === parameter.key ? (
                  <>
                    <ParameterEditor parameter={parameter} types={types} />
                    <Btn
                      small
                      kind="quiet"
                      testid="param-done"
                      onClick={() => {
                        setOpen(null);
                      }}
                    >
                      {t('params.done')}
                    </Btn>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {creating !== null ? (
          <NewParameter
            key={creating === 'plain' ? 'plain' : creating.serial}
            types={types}
            preselect={creating === 'plain' ? null : creating}
            onClose={() => {
              setCreating(null);
            }}
          />
        ) : (
          <div>
            <Btn
              small
              icon="plus"
              testid="param-new"
              title={t('params.newTip')}
              onClick={() => {
                setOpen(null);
                setCreating('plain');
              }}
            >
              {t('params.new')}
            </Btn>
          </div>
        )}
      </div>
    </section>
  );
}
