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
import { findOption, matchChoice, type ValueGroup, type ValueGroupId, type ValueOption } from './options';

/**
 * The block editor (specification 5.4, req-ui-015): a value is chosen from lists, a condition is put together from
 * comparisons, crossings and connections. The tree it works on is the one the expression endpoint reads out of the
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
    const option = findOption(ctx.groups, block.path);
    if (option !== undefined && option.choices.length > 0) {
      return { choices: option.choices };
    }
  }
  if (block.kind === 'if') {
    return hintOf(child(block, 1), ctx) ?? hintOf(child(block, 2), ctx);
  }
  return undefined;
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
}: {
  value: Block;
  onChange: (block: Block) => void;
  ctx: EditorContext;
  hint?: ValueHint;
  testid?: string;
}) {
  const { t } = useTranslation();
  const key = valueKey(value);
  const known = key === '' || !key.startsWith('n:') || findOption(ctx.groups, value.path) !== undefined;
  const empty = isEmptyBlock(value);
  const functions = useMemo(() => valueFunctions(ctx.functions), [ctx.functions]);
  const sub = (block: Block, change: (next: Block) => void, nested?: ValueHint) => (
    <ValueEditor value={block} onChange={change} ctx={ctx} hint={nested} />
  );
  const pick = (selected: string): void => {
    onChange(blockForKey(selected, value));
  };
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
        {ctx.groups.map((group) => (
          <optgroup key={group.id} label={t(groupLabelKey(group.id))}>
            {group.options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
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

      {value.kind === 'function' && value.function === 'PREVIOUS' ? (
        <span className="vb-inner">{sub(child(value, 0), (next) => { onChange(withChildren(value, [next])); }, hint)}</span>
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

const CONDITION_KINDS: readonly ConditionKind[] = ['compare', 'cross', 'and', 'or', 'not', 'value'];

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

      {kind === 'cross' && shown.kind === 'crossing' ? (
        <div className="cb-row">
          <ValueEditor value={left} onChange={(next) => { onChange(withChild(shown, 0, next)); }} ctx={ctx} testid="cross-a" />
          <span className="cb-word">{t('expression.crosses')}</span>
          <ValueEditor value={right} onChange={(next) => { onChange(withChild(shown, 1, next)); }} ctx={ctx} testid="cross-b" />
          <Select
            value={shown.direction ?? 'up'}
            onChange={(direction) => {
              onChange({ ...shown, direction: direction as 'up' | 'down' | 'any' });
            }}
            ariaLabel={t('expression.crossDirection')}
            testid="cross-dir"
          >
            <option value="up">{t('expression.directions.up')}</option>
            <option value="down">{t('expression.directions.down')}</option>
            <option value="any">{t('expression.directions.any')}</option>
          </Select>
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
