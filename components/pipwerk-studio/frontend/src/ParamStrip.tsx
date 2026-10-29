// Structure, class names and test identifiers follow the prototype (specification E8: an aid, not a template); a few
// lines are equal to it. See docs/technical/pipwerk-studio.md, section 2.3.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataType } from './api/elementTypes';
import type { StrategyParameter } from './document/types';
import { fixedText } from './model/describe';
import { dataTypeWord, objectTypeChoices, objectTypesInUse, timeUnitChoices, labelText } from './model/typeIndex';
import { initialValue, ValueInput } from './properties/fields';
import { useStudio } from './state/StudioContext';
import { Btn, Select, TextInput, Toggle } from './ui/controls';
import { Icon } from './ui/Icon';

const PLAIN_TYPES: DataType[] = ['number', 'integer', 'percent', 'boolean', 'text', 'time_unit'];

function ParameterEditor({ parameter }: { parameter: StrategyParameter }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  if (types === null) {
    return null;
  }
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
            const next: DataType = chosen.startsWith('object:') ? 'object' : (chosen as DataType);
            const nextObjectType = chosen.startsWith('object:') ? chosen.slice(7) : null;
            const nextChoices = next === 'time_unit' ? timeUnits : next === 'object' ? objectTypeChoices(types, nextObjectType) : [];
            actions.updateParameter(parameter.key, {
              datatype: next,
              object_type: nextObjectType,
              value: initialValue(next, { default: null, choices: nextChoices }, timeUnits),
              choices: [],
            });
          }}
          ariaLabel={t('params.datatype')}
          testid="param-type"
        >
          {PLAIN_TYPES.map((id) => (
            <option key={id} value={id}>
              {dataTypeWord(types, id, language)}
            </option>
          ))}
          {objectTypesInUse(types).map((id) => (
            <option key={id} value={`object:${id}`}>
              {types.byId.get(id) === undefined ? id : labelText((types.byId.get(id) as { name: { de: string; en: string } }).name, language)}
            </option>
          ))}
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

/** The strip under the header: name and state of the strategy, the strategy parameters with their values, "Neu" (specification 5.1). */
export function ParamStrip() {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const onDown = (event: PointerEvent): void => {
      if (root.current !== null && event.target instanceof Node && !root.current.contains(event.target)) {
        setOpen(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);
  const { state, actions, language } = studio;
  const strategy = state.document;
  const current = strategy?.parameters.find((parameter) => parameter.key === open);
  const timeUnits = types === null ? [] : timeUnitChoices(types);

  const add = (): void => {
    void actions
      .addParameter({ name: t('params.newName'), datatype: 'number', value: 0, at_application: false, choices: [] })
      .then((key) => {
        if (key !== null) {
          setOpen(key);
        }
      });
  };

  return (
    <section className="region params" data-region="params" data-testid="param-strip" ref={root} aria-label={t('params.title')}>
      {strategy !== null ? (
        <button
          type="button"
          className={`status-pill${studio.dirty ? ' dirty' : ''}`}
          onClick={() => {
            actions.select({ kind: 'strategy' }, 'props');
          }}
          data-testid="status-pill"
          data-tip={t('params.statusTip')}
        >
          <span className="dot" />
          <span className="status-name">{strategy.name}</span>
          <span className="status-state">{t(studio.dirty ? 'params.unsaved' : 'params.saved')}</span>
        </button>
      ) : null}
      <div className="strip-label">
        <Icon name="params" size={16} />
        <span>{t('params.title')}</span>
      </div>
      {strategy === null ? <span className="strip-note">{t('params.openFirst')}</span> : null}
      {strategy !== null ? (
        <div className="chips strip-chips">
          {strategy.parameters.length === 0 ? <span className="strip-note">{t('params.none')}</span> : null}
          {strategy.parameters.map((parameter) => (
            <button
              key={parameter.key}
              type="button"
              className={`chip chip-param${open === parameter.key ? ' on' : ''}`}
              onClick={() => {
                setOpen(open === parameter.key ? null : parameter.key);
              }}
              data-testid="param-chip"
              data-tip={t('params.clickToChange')}
            >
              <b>{parameter.name}</b>
              <span>
                {parameter.at_application === true
                  ? t('binding.atApplicationShort')
                  : fixedText(
                      parameter.value,
                      parameter.datatype,
                      parameter.datatype === 'object' && types !== null ? objectTypeChoices(types, parameter.object_type ?? null) : [],
                      language,
                      t,
                      timeUnits,
                    )}
              </span>
            </button>
          ))}
          <button type="button" className="chip chip-add" data-testid="param-new" onClick={add} data-tip={t('params.newTip')}>
            <Icon name="plus" size={14} />
            {t('params.new')}
          </button>
        </div>
      ) : null}
      {current !== undefined ? (
        <div className="popover" data-testid="param-popover">
          <ParameterEditor parameter={current} />
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
        </div>
      ) : null}
    </section>
  );
}
