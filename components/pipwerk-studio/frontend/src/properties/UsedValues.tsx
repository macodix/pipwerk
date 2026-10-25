import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ArgumentDescription } from '../api/elementTypes';
import type { InputRef } from '../document/ops';
import type { ElementDocument, InputArgument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { isCardElement } from '../model/elements';
import { defaultArgument, inputRefOf, memberChoices, usedValueGroups, type MemberChoice, type UsedGroup, type UsedRow } from '../model/usedValues';
import { labelText } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Btn, Info, NumberInput, Section, Select, TextInput, Toggle } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { FindingsList } from './FindingsList';

/** The findings that belong to "Verwendete Werte": a value that is not usable here, one that cannot be refreshed, one with wrong arguments. */
const USED_VALUE_CODES = ['input.refresh_not_allowed', 'instance.not_usable', 'data.unknown'];

/** The control for the value of one argument of a method, by the data type the description names. */
function ArgumentField({
  argument,
  value,
  language,
  onChange,
  testid,
}: {
  argument: ArgumentDescription;
  value: InputArgument;
  language: SupportedLanguage;
  onChange: (value: InputArgument) => void;
  testid: string;
}) {
  const { t } = useTranslation();
  const label = labelText(argument.label, language);
  let control;
  switch (argument.datatype) {
    case 'number':
    case 'integer':
    case 'percent':
      control = (
        <NumberInput
          value={typeof value === 'number' ? value : ''}
          onChange={(typed) => {
            // an emptied field keeps the value until a number is typed
            if (typed !== '') {
              onChange(typed);
            }
          }}
          ariaLabel={label}
          testid={testid}
        />
      );
      break;
    case 'boolean':
      control = (
        <Select
          value={value === true ? 'true' : 'false'}
          onChange={(chosen) => {
            onChange(chosen === 'true');
          }}
          ariaLabel={label}
          testid={testid}
        >
          <option value="true">{t('values.true')}</option>
          <option value="false">{t('values.false')}</option>
        </Select>
      );
      break;
    default:
      control =
        argument.choices.length > 0 ? (
          <Select
            value={String(value)}
            onChange={onChange}
            ariaLabel={label}
            testid={testid}
          >
            {argument.choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {labelText(choice.label, language)}
              </option>
            ))}
          </Select>
        ) : (
          <TextInput value={String(value)} onChange={onChange} ariaLabel={label} testid={testid} />
        );
  }
  return (
    <label className="used-arg" data-tip={labelText(argument.explanation, language)}>
      <span className="used-arg-label">
        {label}
        {argument.required ? '' : ` (${t('used.optional')})`}
      </span>
      {control}
    </label>
  );
}

/** The arguments of a method, one control each; nothing for a property. */
function ArgumentFields({
  choice,
  values,
  language,
  onChange,
  testid,
}: {
  choice: MemberChoice;
  values: readonly InputArgument[];
  language: SupportedLanguage;
  onChange: (values: InputArgument[]) => void;
  testid: string;
}) {
  if (choice.kind !== 'method' || choice.arguments.length === 0) {
    return null;
  }
  return (
    <div className="used-args" data-testid={`${testid}-args`}>
      {choice.arguments.map((argument, index) => (
        <ArgumentField
          key={argument.id}
          argument={argument}
          value={values[index] ?? defaultArgument(argument)}
          language={language}
          testid={`${testid}-arg-${argument.id}`}
          onChange={(next) => {
            const updated = choice.arguments.map((entry, position) => (position === index ? next : (values[position] ?? defaultArgument(entry))));
            onChange(updated);
          }}
        />
      ))}
    </div>
  );
}

function MemberSelect({
  choices,
  value,
  onChange,
  testid,
  ariaLabel,
  emptyLabel,
}: {
  choices: readonly MemberChoice[];
  value: string;
  onChange: (value: string) => void;
  testid: string;
  ariaLabel: string;
  emptyLabel?: string;
}) {
  const { t } = useTranslation();
  const properties = choices.filter((choice) => choice.kind === 'property');
  const methods = choices.filter((choice) => choice.kind === 'method');
  return (
    <Select value={value} onChange={onChange} ariaLabel={ariaLabel} testid={testid}>
      {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
      {properties.length > 0 && methods.length > 0 ? (
        <optgroup label={t('used.properties')}>
          {properties.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </optgroup>
      ) : (
        properties.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))
      )}
      {methods.length > 0 ? (
        <optgroup label={t('used.methods')}>
          {methods.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </optgroup>
      ) : null}
    </Select>
  );
}

function UsedRowView({ element, group, row }: { element: ElementDocument; group: UsedGroup; row: UsedRow }) {
  const { t } = useTranslation();
  const { studio } = useStudio();
  const { actions, language } = studio;
  const current = group.choices.find((choice) => choice.kind === row.member.kind && choice.id.toLowerCase() === row.member.name.toLowerCase());
  const from: InputRef = { instance: group.instance, property: row.member.name, kind: row.member.kind, arguments: row.member.arguments };
  const change = (to: InputRef, refresh: boolean): void => {
    void actions.changeUsedValue(element.id, from, row.input, to, refresh, row.expression || row.rule);
  };
  const usedIn = [
    row.input ? t('used.inInput') : null,
    row.expression ? t('used.inExpression') : null,
    row.rule ? t('used.inRule') : null,
    row.dataLink ? t('used.inAssignment') : null,
  ].filter((text): text is string => text !== null);
  const testid = `used-${group.instance}-${row.member.name}`;
  // a value an expression or an assignment uses cannot be removed here: it is removed where it is used
  const removable = row.input && !row.expression && !row.rule && !row.dataLink;
  return (
    <li className="used-row" data-testid="used-row" data-member={row.member.name} data-kind={row.member.kind}>
      {current === undefined ? (
        <span className="used-fixed" data-testid={`${testid}-name`}>
          {row.member.name}
        </span>
      ) : row.dataLink && !row.input && !row.expression && !row.rule ? (
        <span className="used-fixed" data-testid={`${testid}-name`} data-tip={current.explanation}>
          {current.label}
        </span>
      ) : (
        <MemberSelect
          choices={group.choices}
          value={current.value}
          ariaLabel={t('used.value')}
          testid={`${testid}-select`}
          onChange={(chosen) => {
            const next = group.choices.find((choice) => choice.value === chosen);
            if (next !== undefined) {
              change(inputRefOf(group.instance, next), row.refresh);
            }
          }}
        />
      )}
      {current !== undefined && current.kind === 'method' && !(row.dataLink && !row.input) ? (
        <ArgumentFields
          choice={current}
          values={row.member.arguments}
          language={language}
          testid={testid}
          onChange={(values) => {
            change(inputRefOf(group.instance, current, values), row.refresh);
          }}
        />
      ) : null}
      {group.canRefresh && !row.dataLink ? (
        <span className="used-refresh" data-tip={t('used.refreshTip')}>
          <Toggle
            checked={row.refresh}
            label={t('used.refresh')}
            testid={`${testid}-refresh`}
            onChange={(checked) => {
              change(
                current === undefined ? from : inputRefOf(group.instance, current, row.member.kind === 'method' ? row.member.arguments : undefined),
                checked,
              );
            }}
          />
        </span>
      ) : null}
      <span className="used-where muted" data-testid={`${testid}-where`}>
        {usedIn.join(' · ')}
        {removable ? null : usedIn.length > 0 && (row.expression || row.rule) ? ` – ${t('used.removeInExpression')}` : ''}
      </span>
      {removable ? (
        <Btn
          small
          kind="quiet"
          icon="x"
          title={t('used.removeInput')}
          testid={`${testid}-remove`}
          onClick={() => {
            actions.removeInput(element.id, from);
          }}
        />
      ) : null}
    </li>
  );
}

/** "Weiteren Wert verbinden": a object that is usable at this element, one of its values, and the arguments of a method. */
function AddValue({ element }: { element: ElementDocument }) {
  const { t } = useTranslation();
  const { studio, types, uses } = useStudio();
  const document = studio.state.document;
  const [card, setCard] = useState('');
  const [member, setMember] = useState('');
  const [args, setArgs] = useState<InputArgument[] | null>(null);
  if (document === null || types === null || uses === null) {
    return null;
  }
  const { language } = studio;
  const cards = document.elements.filter(
    (candidate) => candidate.instance !== undefined && candidate.instance !== null && uses.usable(candidate.id, element.id),
  );
  const chosen = cards.find((candidate) => candidate.id === card);
  const choices = chosen === undefined ? [] : memberChoices(types.byId.get(chosen.type), chosen.instance, language);
  const choice = choices.find((candidate) => candidate.value === member);
  const values = choice === undefined ? [] : (args ?? choice.arguments.map(defaultArgument));
  if (cards.length === 0) {
    return (
      <p className="muted" data-testid="used-none-usable">
        {t('used.noneUsable')}
      </p>
    );
  }
  return (
    <div className="used-add" data-testid="used-add">
      <p className="muted">{t('used.addHint')}</p>
      <div className="used-add-row">
        <Select
          value={card}
          onChange={(next) => {
            setCard(next);
            setMember('');
            setArgs(null);
          }}
          ariaLabel={t('used.chooseObject')}
          testid="used-add-object"
        >
          <option value="">{t('used.chooseObjectOption')}</option>
          {cards.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.instance?.name ?? ''}
            </option>
          ))}
        </Select>
        {chosen !== undefined ? (
          <MemberSelect
            choices={choices}
            value={member}
            ariaLabel={t('used.value')}
            testid="used-add-value"
            emptyLabel={t('used.chooseValueOption')}
            onChange={(next) => {
              setMember(next);
              setArgs(null);
            }}
          />
        ) : null}
      </div>
      {choice !== undefined ? (
        <ArgumentFields choice={choice} values={values} language={language} testid="used-add" onChange={setArgs} />
      ) : null}
      <Btn
        small
        kind="primary"
        icon="plus"
        testid="used-add-button"
        disabled={chosen?.instance === undefined || chosen.instance === null || choice === undefined}
        onClick={() => {
          if (chosen?.instance !== undefined && chosen.instance !== null && choice !== undefined) {
            studio.actions.connectMember(chosen.id, inputRefOf(chosen.instance.key, choice, values), element.id);
            setCard('');
            setMember('');
            setArgs(null);
          }
        }}
      >
        {t('used.connect')}
      </Btn>
    </div>
  );
}

/**
 * The element where an object is determined first (specification 5.4: "Die Eigenschaftenansicht einer Instanz nennt das
 * Element ihrer ersten Verwendung; dort wählt der Anwender es auch ohne Ziehen"). Only elements at which the object is
 * usable are offered.
 */
export function FirstUse({ element }: { element: ElementDocument }) {
  const { t } = useTranslation();
  const { studio, types, uses } = useStudio();
  const document = studio.state.document;
  if (document === null || types === null || uses === null || element.instance === undefined || element.instance === null) {
    return null;
  }
  const first = uses.firstUse(element.id);
  const steps = document.elements.filter((candidate) => !isCardElement(candidate, types) && (candidate.id === first || uses.usable(element.id, candidate.id)));
  const name = (id: string): string => studio.actions.elementDisplayName(id);
  return (
    <Section title={t('firstUse.title')} testid="sec-first-use" aside={<Info tip={t('firstUse.info')} label={t('fields.explanation')} />}>
      <p data-testid="first-use-text" data-first-use={first ?? ''}>
        {first === null ? t('firstUse.none') : t('firstUse.at', { element: name(first) })}
      </p>
      <Select
        value={first ?? ''}
        onChange={(chosen) => {
          if (chosen !== '') {
            studio.actions.chooseFirstUse(element.id, chosen);
          }
        }}
        ariaLabel={t('firstUse.choose')}
        testid="first-use-select"
      >
        {first === null ? <option value="">{t('firstUse.chooseOption')}</option> : null}
        {steps.map((step) => (
          <option key={step.id} value={step.id}>
            {name(step.id)}
          </option>
        ))}
      </Select>
      {first !== null ? (
        <Btn
          small
          kind="ghost"
          icon="right"
          testid="first-use-goto"
          onClick={() => {
            studio.actions.showElement(first);
          }}
        >
          {t('firstUse.goto')}
        </Btn>
      ) : null}
    </Section>
  );
}

/**
 * "Verwendete Werte" in the properties view of an element (specification 5.4, req-ui-014): per object the values the
 * element uses, each with the choice of property or method, the arguments of a method and "Aktualisieren" where the type
 * has it, and the connection of a further value without dragging.
 */
export function UsedValues({ element }: { element: ElementDocument }) {
  const { t } = useTranslation();
  const { studio, types, uses, findings } = useStudio();
  const document = studio.state.document;
  if (document === null || types === null || uses === null) {
    return null;
  }
  const groups = usedValueGroups(document, types, uses, element, studio.language);
  const mine = findings.ofElement(element.id).filter((finding) => USED_VALUE_CODES.includes(finding.code));
  return (
    <Section title={t('used.title')} testid="sec-used" aside={<Info tip={t('used.info')} label={t('fields.explanation')} />}>
      <FindingsList items={mine} />
      {groups.length === 0 ? <p className="empty-note" data-testid="used-empty">{t('used.empty')}</p> : null}
      {groups.map((group) => (
        <div key={group.card} className="used-group" data-testid="used-group" data-instance={group.instance}>
          <h4 className="used-object">
            <Icon name="link" size={13} />
            {group.name}
          </h4>
          <ul className="used-list">
            {group.rows.map((row) => (
              <UsedRowView key={row.key} element={element} group={group} row={row} />
            ))}
          </ul>
        </div>
      ))}
      <AddValue element={element} />
    </Section>
  );
}
