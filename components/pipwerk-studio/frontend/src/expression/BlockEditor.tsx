import { Fragment, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FunctionDescription } from '../api/elementTypes';
import type { VisibleChoice } from '../api/objects';
import type { SupportedLanguage } from '../i18n';
import { Btn, NumberInput, Select, TextInput } from '../ui/controls';
import {
  ARITHMETIC_OPERATORS,
  COMPARE_OPERATORS,
  EMPTY,
  blankComparison,
  blockForKey,
  child,
  childrenOf,
  conditionKind,
  convertCondition,
  functionBlock,
  isEmptyBlock,
  literalBlock,
  numberBlock,
  valueKey,
  withChild,
  withChildren,
  type Block,
  type ConditionKind,
} from './blocks';
import { blockOfOption, findOption, matchChoice, selectKeyOf, type ValueGroup, type ValueGroupId, type ValueOption } from './options';

/**
 * The block editor (specification 5.4, req-ui-015): a value is chosen from lists, a condition is put together from
 * comparisons and connections ("and", "or", "not"). A crossing of two values has no block of its own: it is made of
 * "previous value of", comparisons and "and". The tree it works on is the one the expression endpoint reads out of the
 * expression; every change goes back through the endpoint, which forms the expression (`ExpressionPanel`).
 */

export type EditorContext = {
  groups: readonly ValueGroup[];
  language: SupportedLanguage;
  functions: readonly FunctionDescription[];
};

/** What the value at a place is expected to be: the choices of the property that is compared or assigned. */
export type ValueHint = { choices: readonly VisibleChoice[] } | undefined;

/** Functions the lists of values offer under "Function": the ones that are no block of their own. */
const OWN_BLOCKS = ['IF', 'AND', 'OR', 'NOT', 'PREVIOUS', 'TRUE', 'FALSE'];

function valueFunctions(functions: readonly FunctionDescription[]): FunctionDescription[] {
  return functions.filter((fn) => !OWN_BLOCKS.includes(fn.name));
}

/** The hint a block gives to the block it is compared with: the choices of the property it names. */
function hintOf(block: Block, ctx: EditorContext): ValueHint {
  if (block.kind === 'name') {
    const option = findOption(ctx.groups, block.path, block.call === true);
    if (option !== undefined && option.choices.length > 0) {
      return { choices: option.choices };
    }
  }
  if (block.kind === 'if') {
    return hintOf(child(block, 1), ctx) ?? hintOf(child(block, 2), ctx);
  }
  return undefined;
}

/**
 * The values the list offers for the argument of "previous value of": only those with an earlier value (specification
 * 3.4, 5.4). The endpoint marks them (`previous_value`); the interface does not repeat the rule (E2).
 */
function withPrevious(groups: readonly ValueGroup[]): ValueGroup[] {
  return groups
    .map((group) => ({ ...group, options: group.options.filter((option) => option.previousValue) }))
    .filter((group) => group.options.length > 0);
}

function groupLabelKey(id: ValueGroupId): string {
  return `expression.groups.${id}`;
}

function padArguments(fn: FunctionDescription, existing: readonly Block[]): Block[] {
  const wanted = Math.max(fn.minArguments, fn.arguments.filter((argument) => !argument.optional).length, existing.length);
  const filled = [...existing];
  while (filled.length < wanted) {
    filled.push(EMPTY);
  }
  return filled;
}

// ---- value ------------------------------------------------------------------------------------------------------

export function ValueEditor({
  value,
  onChange,
  ctx,
  hint,
  testid,
  previousOnly,
}: {
  value: Block;
  onChange: (block: Block) => void;
  ctx: EditorContext;
  hint?: ValueHint;
  testid?: string;
  /** The list offers only values with an earlier value: the place is the argument of "previous value of". */
  previousOnly?: boolean;
}) {
  const { t } = useTranslation();
  const key = value.kind === 'name' ? selectKeyOf(value, ctx.groups) : valueKey(value);
  const known = key === '' || !(key.startsWith('n:') || key.startsWith('m:')) || findOption(ctx.groups, value.path, value.call === true) !== undefined;
  const empty = isEmptyBlock(value);
  const functions = useMemo(() => valueFunctions(ctx.functions), [ctx.functions]);
  const shownGroups = useMemo(() => (previousOnly === true ? withPrevious(ctx.groups) : ctx.groups), [ctx.groups, previousOnly]);
  // a value that is chosen but has no earlier value (a stored expression the endpoint accepted before) stays visible
  const current = previousOnly === true && value.kind === 'name' ? findOption(ctx.groups, value.path, value.call === true) : undefined;
  const currentHidden = current !== undefined && !shownGroups.some((group) => group.options.some((option) => option.key === current.key));
  const sub = (block: Block, change: (next: Block) => void, nested?: ValueHint, only?: boolean) => (
    <ValueEditor value={block} onChange={change} ctx={ctx} hint={nested} previousOnly={only} />
  );
  const pick = (selected: string): void => {
    const chosen = ctx.groups.flatMap((group) => group.options).find((option) => option.key === selected);
    onChange(chosen === undefined ? blockForKey(selected, value) : blockOfOption(chosen));
  };
  const method = value.kind === 'name' && value.call === true ? findOption(ctx.groups, value.path, true)?.method ?? null : null;
  const functionOf = (name: string | undefined): FunctionDescription | undefined => functions.find((fn) => fn.name === name);

  return (
    <span className="vb" data-testid={testid}>
      <Select
        value={key}
        onChange={pick}
        ariaLabel={t('expression.chooseValue')}
        className={empty ? 'select-empty' : ''}
        testid={testid === undefined ? 'value-select' : `${testid}-select`}
      >
        {key === '' ? <option value="">{t('expression.chooseValueOption')}</option> : null}
        {!known ? <option value={key}>{t('expression.gone')}</option> : null}
        {currentHidden && current !== undefined ? <option value={current.key}>{current.label}</option> : null}
        {shownGroups.map((group) => (
          <optgroup key={group.id} label={t(groupLabelKey(group.id))}>
            {group.options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.method !== null && option.args === null ? `${option.label} (${t('properties.method')})` : option.label}
              </option>
            ))}
          </optgroup>
        ))}
        {previousOnly === true ? null : (
          <optgroup label={t('expression.groups.fixed')}>
            <option value="k:num">{t('expression.kinds.number')}</option>
            <option value="k:str">{t('expression.kinds.text')}</option>
            <option value="k:bool">{t('expression.kinds.boolean')}</option>
            <option value="k:prev">{t('expression.kinds.previous')}</option>
            <option value="k:calc">{t('expression.kinds.calculation')}</option>
            <option value="k:if">{t('expression.kinds.if')}</option>
            <option value="k:func">{t('expression.kinds.function')}</option>
            <option value="k:cond">{t('expression.kinds.condition')}</option>
          </optgroup>
        )}
      </Select>

      {value.kind === 'literal' && value.datatype !== 'text' && value.datatype !== 'boolean' ? (
        <NumberInput
          value={typeof value.value === 'number' ? value.value : 0}
          onChange={(typed) => {
            onChange(value.datatype === 'percent' ? literalBlock(typed === '' ? 0 : typed, 'percent') : numberBlock(typed === '' ? 0 : typed));
          }}
          ariaLabel={t('expression.number')}
          testid={testid === undefined ? 'value-num' : `${testid}-num`}
        />
      ) : null}

      {value.kind === 'literal' && value.datatype === 'text' ? (
        hint !== undefined && hint.choices.length > 0 ? (
          <Select
            value={matchChoice(value.value, hint.choices)?.id ?? ''}
            onChange={(chosen) => {
              onChange(literalBlock(chosen, 'text'));
            }}
            ariaLabel={t('expression.choiceValue')}
            testid={testid === undefined ? 'value-choice' : `${testid}-choice`}
          >
            <option value="">{t('expression.chooseValueOption')}</option>
            {hint.choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label[ctx.language]}
              </option>
            ))}
          </Select>
        ) : (
          <TextInput
            value={typeof value.value === 'string' ? value.value : ''}
            onChange={(typed) => {
              onChange(literalBlock(typed, 'text'));
            }}
            ariaLabel={t('expression.text')}
            testid={testid === undefined ? 'value-text' : `${testid}-text`}
          />
        )
      ) : null}

      {value.kind === 'literal' && value.datatype === 'boolean' ? (
        <Select
          value={value.value === false ? 'false' : 'true'}
          onChange={(chosen) => {
            onChange(literalBlock(chosen === 'true', 'boolean'));
          }}
          ariaLabel={t('expression.truth')}
          testid={testid === undefined ? 'value-bool' : `${testid}-bool`}
        >
          <option value="true">{t('values.true')}</option>
          <option value="false">{t('values.false')}</option>
        </Select>
      ) : null}

      {value.kind === 'name' && value.call === true ? (
        <span className="vb-inner" data-testid="method-args">
          {childrenOf(value).map((argument, index) => {
            const description = method?.arguments[index];
            return (
              <Fragment key={index}>
                {description !== undefined ? (
                  <span className="vb-caption" data-tip={description.explanation === null ? undefined : description.explanation[ctx.language]}>
                    {description.label[ctx.language]}
                  </span>
                ) : null}
                {sub(argument, (next) => { onChange(withChild(value, index, next)); }, description === undefined || description.choices.length === 0 ? undefined : { choices: description.choices })}
              </Fragment>
            );
          })}
        </span>
      ) : null}

      {value.kind === 'function' && value.function === 'PREVIOUS' ? (
        <span className="vb-inner" data-testid="previous-value">
          {sub(child(value, 0), (next) => { onChange(withChild(value, 0, next)); }, hint, true)}
          <span className="vb-caption">{t('expression.candlesBack')}</span>
          <NumberInput
            value={childrenOf(value)[1]?.kind === 'literal' && typeof childrenOf(value)[1]?.value === 'number' ? (childrenOf(value)[1]?.value as number) : 1}
            onChange={(typed) => {
              const count = typed === '' || typed < 1 ? 1 : Math.floor(typed);
              onChange(withChildren(value, count === 1 ? [child(value, 0)] : [child(value, 0), numberBlock(count)]));
            }}
            ariaLabel={t('expression.candlesBackNumber')}
            testid={testid === undefined ? 'previous-count' : `${testid}-previous-count`}
          />
          <span className="vb-caption">{t('expression.candles')}</span>
        </span>
      ) : null}

      {value.kind === 'arithmetic' && childrenOf(value).length === 2 ? (
        <span className="vb-inner calc">
          {sub(child(value, 0), (next) => { onChange(withChild(value, 0, next)); })}
          <Select
            value={value.operator ?? '+'}
            onChange={(operator) => {
              onChange({ ...value, operator });
            }}
            ariaLabel={t('expression.operation')}
            testid="calc-op"
          >
            {ARITHMETIC_OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {t(`expression.arithmetic.${operator}`)}
              </option>
            ))}
          </Select>
          {sub(child(value, 1), (next) => { onChange(withChild(value, 1, next)); })}
        </span>
      ) : null}

      {value.kind === 'arithmetic' && childrenOf(value).length === 1 ? (
        <span className="vb-inner">
          {value.operator ?? '−'}
          {sub(child(value, 0), (next) => { onChange(withChild(value, 0, next)); })}
        </span>
      ) : null}

      {value.kind === 'if' ? (
        <span className="vb-inner stack">
          <span className="vb-line">
            <b>{t('expression.if')}</b>
            <CondEditor value={child(value, 0)} onChange={(next) => { onChange(withChild(value, 0, next)); }} ctx={ctx} />
          </span>
          <span className="vb-line">
            <b>{t('expression.then')}</b>
            {sub(child(value, 1), (next) => { onChange(withChild(value, 1, next)); }, hint ?? hintOf(child(value, 2), ctx))}
          </span>
          <span className="vb-line">
            <b>{t('expression.else')}</b>
            {sub(child(value, 2), (next) => { onChange(withChild(value, 2, next)); }, hint ?? hintOf(child(value, 1), ctx))}
          </span>
        </span>
      ) : null}

      {value.kind === 'function' && value.function !== 'PREVIOUS' ? (
        <span className="vb-inner">
          <Select
            value={functionOf(value.function)?.name ?? value.function ?? ''}
            onChange={(name) => {
              const fn = functionOf(name);
              if (fn !== undefined) {
                onChange(functionBlock(name, padArguments(fn, childrenOf(value))));
              }
            }}
            ariaLabel={t('expression.function')}
            testid="func-select"
          >
            {functionOf(value.function) === undefined ? <option value={value.function ?? ''}>{value.function ?? ''}</option> : null}
            {functions.map((fn) => (
              <option key={fn.name} value={fn.name}>
                {fn.label[ctx.language]}
              </option>
            ))}
          </Select>
          {childrenOf(value).map((argument, index) => {
            const fn = functionOf(value.function);
            const description = fn?.arguments[Math.min(index, (fn?.arguments.length ?? 1) - 1)];
            return (
              <Fragment key={index}>
                {fn !== undefined && fn.arguments.length > 1 && description !== undefined ? (
                  <span className="vb-caption" data-tip={description.explanation[ctx.language]}>
                    {description.label[ctx.language]}
                  </span>
                ) : null}
                {sub(argument, (next) => { onChange(withChild(value, index, next)); })}
              </Fragment>
            );
          })}
          {functionOf(value.function)?.variadic != null ? (
            <Btn
              kind="quiet"
              small
              icon="plus"
              title={t('expression.addValue')}
              onClick={() => {
                onChange(withChildren(value, [...childrenOf(value), EMPTY]));
              }}
            />
          ) : null}
        </span>
      ) : null}

      {key === 'k:cond' ? (
        <span className="vb-inner stack">
          <CondEditor value={value} onChange={onChange} ctx={ctx} depth={1} />
        </span>
      ) : null}
    </span>
  );
}

// ---- condition --------------------------------------------------------------------------------------------------

const CONDITION_KINDS: readonly ConditionKind[] = ['compare', 'and', 'or', 'not', 'value'];

export function CondEditor({
  value,
  onChange,
  ctx,
  depth = 0,
}: {
  value: Block;
  onChange: (block: Block) => void;
  ctx: EditorContext;
  depth?: number;
}) {
  const { t } = useTranslation();
  // "The value is true" starts empty; it stays chosen until a value is picked.
  const [forced, setForced] = useState<ConditionKind | null>(null);
  const kind: ConditionKind = isEmptyBlock(value) && forced !== null ? forced : conditionKind(value);
  const shown: Block = isEmptyBlock(value) && kind === 'compare' ? blankComparison() : value;
  const left = child(shown, 0);
  const right = child(shown, 1);

  return (
    <div className={`cb cb-${kind}${depth > 0 ? ' cb-nested' : ''}`} data-testid="cond-block">
      <div className="cb-kind">
        <Select
          value={kind}
          onChange={(chosen) => {
            const next = convertCondition(chosen as ConditionKind, value);
            setForced(isEmptyBlock(next) ? (chosen as ConditionKind) : null);
            onChange(next);
          }}
          ariaLabel={t('expression.conditionKind')}
          testid="cond-kind"
        >
          {CONDITION_KINDS.map((entry) => (
            <option key={entry} value={entry}>
              {t(`expression.conditionKinds.${entry}`)}
            </option>
          ))}
        </Select>
      </div>

      {kind === 'compare' && shown.kind === 'comparison' ? (
        <div className="cb-row">
          <ValueEditor value={left} onChange={(next) => { onChange(withChild(shown, 0, next)); }} ctx={ctx} hint={hintOf(right, ctx)} testid="cmp-left" />
          <Select
            value={shown.operator ?? '>'}
            onChange={(operator) => {
              onChange({ ...shown, operator });
            }}
            ariaLabel={t('expression.comparison')}
            testid="cmp-op"
          >
            {COMPARE_OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {t(`expression.compare.${operator}`)}
              </option>
            ))}
          </Select>
          <ValueEditor value={right} onChange={(next) => { onChange(withChild(shown, 1, next)); }} ctx={ctx} hint={hintOf(left, ctx)} testid="cmp-right" />
        </div>
      ) : null}

      {(kind === 'and' || kind === 'or') && shown.kind === 'logic' ? (
        <div className="cb-list">
          {childrenOf(shown).map((entry, index) => (
            <Fragment key={index}>
              {index > 0 ? <div className="cb-join">{t(kind === 'and' ? 'expression.and' : 'expression.or')}</div> : null}
              <div className="cb-item">
                <CondEditor value={entry} onChange={(next) => { onChange(withChild(shown, index, next)); }} ctx={ctx} depth={depth + 1} />
                {childrenOf(shown).length > 2 ? (
                  <Btn
                    kind="quiet"
                    small
                    icon="x"
                    title={t('expression.removeCondition')}
                    onClick={() => {
                      onChange(withChildren(shown, childrenOf(shown).filter((_, position) => position !== index)));
                    }}
                  />
                ) : null}
              </div>
            </Fragment>
          ))}
          <Btn
            kind="quiet"
            small
            icon="plus"
            testid="cond-add"
            onClick={() => {
              onChange(withChildren(shown, [...childrenOf(shown), blankComparison()]));
            }}
          >
            {t('expression.addCondition')}
          </Btn>
        </div>
      ) : null}

      {kind === 'not' && shown.kind === 'logic' ? (
        <div className="cb-list">
          <CondEditor value={child(shown, 0)} onChange={(next) => { onChange(withChildren(shown, [next])); }} ctx={ctx} depth={depth + 1} />
        </div>
      ) : null}

      {kind === 'value' ? (
        <div className="cb-row">
          <ValueEditor value={value} onChange={onChange} ctx={ctx} testid="cond-value" />
          <span className="cb-word">{t('expression.isTrue')}</span>
        </div>
      ) : null}
    </div>
  );
}

export type { ValueOption };
