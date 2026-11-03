import type { ExpressionBlock, LiteralType } from '../api/objects';

/**
 * The tree of blocks of an expression and the changes the block editor makes to it (specification 3.4). The tree is
 * what the backend reads out of an expression and turns back into one (`/api/v1/expressions`); this module never
 * reads or writes the text of an expression (E2).
 */

export type Block = ExpressionBlock;

export const EMPTY: Block = { kind: 'empty' };

export const COMPARE_OPERATORS = ['=', '<>', '<', '<=', '>', '>='] as const;
export const ARITHMETIC_OPERATORS = ['+', '-', '*', '/'] as const;

export function nameBlock(path: readonly string[]): Block {
  return { kind: 'name', path: [...path] };
}

/** The result of a method of an instance: the name with `call`, its children are the blocks of the arguments. */
export function methodBlock(path: readonly string[], args: readonly Block[]): Block {
  return { kind: 'name', path: [...path], call: true, children: [...args] };
}

/** The block of a fixed value an argument or an input carries. */
export function argumentBlock(value: string | number | boolean): Block {
  if (typeof value === 'number') {
    return numberBlock(value);
  }
  return typeof value === 'boolean' ? literalBlock(value, 'boolean') : literalBlock(value, 'text');
}

/** The fixed values of the arguments of a call if every argument is a fixed value; `null` if one is an expression or empty. */
export function fixedArguments(block: Block): (string | number | boolean)[] | null {
  const values: (string | number | boolean)[] = [];
  for (const part of block.children ?? []) {
    if (part.kind !== 'literal' || part.value === undefined) {
      return null;
    }
    values.push(part.value);
  }
  return values;
}

export function literalBlock(value: string | number | boolean, datatype: LiteralType): Block {
  return { kind: 'literal', value, datatype };
}

/** A number the user typed: whole numbers are integers. */
export function numberBlock(value: number): Block {
  return literalBlock(value, Number.isInteger(value) ? 'integer' : 'number');
}

export function comparisonBlock(operator: string, left: Block, right: Block): Block {
  return { kind: 'comparison', operator, children: [left, right] };
}

export function arithmeticBlock(operator: string, left: Block, right: Block): Block {
  return { kind: 'arithmetic', operator, children: [left, right] };
}

export function logicBlock(operator: 'and' | 'or' | 'not', children: Block[]): Block {
  return { kind: 'logic', operator, children };
}

export function ifBlock(condition: Block, whenTrue: Block, whenFalse: Block): Block {
  return { kind: 'if', children: [condition, whenTrue, whenFalse] };
}

export function functionBlock(name: string, children: Block[]): Block {
  return { kind: 'function', function: name, children };
}

export function childrenOf(block: Block): Block[] {
  return block.children ?? [];
}

export function child(block: Block, index: number): Block {
  return block.children?.[index] ?? EMPTY;
}

/** The block with its child at `index` replaced (a missing child is added as far as needed). */
export function withChild(block: Block, index: number, replacement: Block): Block {
  const children = [...childrenOf(block)];
  while (children.length < index) {
    children.push(EMPTY);
  }
  children[index] = replacement;
  return { ...block, children };
}

export function withChildren(block: Block, children: Block[]): Block {
  return { ...block, children };
}

export function isEmptyBlock(block: Block): boolean {
  return block.kind === 'empty';
}

/** Some place in the tree is still empty: the expression is not finished. */
export function hasEmptyPlace(block: Block): boolean {
  return isEmptyBlock(block) || (block.children ?? []).some(hasEmptyPlace);
}

/** The key of a name for lists: the identifiers of its path. */
export function pathKey(path: readonly string[]): string {
  return path.map((part) => part.toLowerCase()).join('\u001f');
}

/** Every name in the tree, in the order of the expression. */
export function namesIn(block: Block): string[][] {
  const found: string[][] = [];
  const visit = (current: Block): void => {
    if (current.kind === 'name' && current.path !== undefined) {
      found.push(current.path);
    }
    for (const part of current.children ?? []) {
      visit(part);
    }
  };
  visit(block);
  return found;
}

/** A property or method of an instance that an expression addresses. `arguments` is `null` if an argument is no fixed value. */
export type MemberReference = { instance: string; property: string; kind: 'property' | 'method'; arguments: (string | number | boolean)[] | null };

/**
 * The properties and methods of instances an expression addresses: the first two identifiers of every name (specification
 * 3.3); a name with `call` is a method, its fixed arguments are the arguments of the reference.
 */
export function instanceReferences(block: Block | null): MemberReference[] {
  if (block === null) {
    return [];
  }
  const found: MemberReference[] = [];
  const visit = (current: Block): void => {
    if (current.kind === 'name' && current.path !== undefined) {
      const [instance, property] = current.path;
      if (instance !== undefined && property !== undefined) {
        found.push(
          current.call === true
            ? { instance, property, kind: 'method', arguments: fixedArguments(current) }
            : { instance, property, kind: 'property', arguments: [] },
        );
      }
    }
    for (const part of current.children ?? []) {
      visit(part);
    }
  };
  visit(block);
  return found;
}

/** The tree with every block for which `replace` answers a block replaced by it (the children of a replaced block stay out of it). */
export function mapBlocks(block: Block, replace: (current: Block) => Block | undefined): Block {
  const replaced = replace(block);
  if (replaced !== undefined) {
    return replaced;
  }
  if (block.children === undefined) {
    return block;
  }
  return { ...block, children: block.children.map((part) => mapBlocks(part, replace)) };
}

/** Whether the block names the property or method of the instance (without regard to case). */
export function isMember(block: Block, instance: string, name: string, kind: 'property' | 'method'): boolean {
  const path = block.path ?? [];
  return (
    block.kind === 'name' &&
    path.length === 2 &&
    path[0]?.toLowerCase() === instance.toLowerCase() &&
    path[1]?.toLowerCase() === name.toLowerCase() &&
    (block.call === true) === (kind === 'method')
  );
}

/** The tree with every name for which `matches` is true replaced by an empty place (specification 3.4, "Entfernen"). */
export function emptyWhere(block: Block, matches: (path: readonly string[]) => boolean): Block {
  if (block.kind === 'name' && block.path !== undefined && matches(block.path)) {
    return EMPTY;
  }
  if (block.children === undefined) {
    return block;
  }
  return { ...block, children: block.children.map((part) => emptyWhere(part, matches)) };
}

export function usesName(block: Block, matches: (path: readonly string[]) => boolean): boolean {
  return namesIn(block).some((path) => matches(path));
}

// ---- the kinds a value can have -----------------------------------------------------------------------------------

/** What the choice of a value shows for a block: a name, or one of the kinds of value (`k:...`). */
export function valueKey(block: Block): string {
  switch (block.kind) {
    case 'name':
      return `${block.call === true ? 'm' : 'n'}:${(block.path ?? []).join('\u001f')}`;
    case 'literal':
      return block.datatype === 'text' ? 'k:str' : block.datatype === 'boolean' ? 'k:bool' : 'k:num';
    case 'arithmetic':
      return 'k:calc';
    case 'comparison':
    case 'logic':
      return 'k:cond';
    case 'if':
      return 'k:if';
    case 'function':
      return block.function === 'PREVIOUS' ? 'k:prev' : 'k:func';
    case 'empty':
      return '';
  }
}

export function pathOfKey(key: string): string[] {
  return key.slice(2).split('\u001f');
}

/** The block a choice in the list of values stands for; what was there before becomes the first operand where that fits. */
export function blockForKey(key: string, current: Block): Block {
  if (key.startsWith('n:')) {
    return nameBlock(pathOfKey(key));
  }
  const keep = isEmptyBlock(current) ? EMPTY : current;
  switch (key) {
    case 'k:num':
      return numberBlock(0);
    case 'k:str':
      return literalBlock('', 'text');
    case 'k:bool':
      return literalBlock(true, 'boolean');
    case 'k:prev':
      return functionBlock('PREVIOUS', [keep]);
    case 'k:calc':
      return arithmeticBlock('+', keep, EMPTY);
    case 'k:if':
      return ifBlock(EMPTY, keep, EMPTY);
    case 'k:func':
      return functionBlock('MIN', [keep, EMPTY]);
    case 'k:cond':
      return comparisonBlock('>', EMPTY, EMPTY);
    default:
      return EMPTY;
  }
}

// ---- the kinds a condition can have --------------------------------------------------------------------------------

export type ConditionKind = 'compare' | 'and' | 'or' | 'not' | 'value';

export function conditionKind(block: Block): ConditionKind {
  switch (block.kind) {
    case 'comparison':
      return 'compare';
    case 'logic':
      return block.operator === 'or' ? 'or' : block.operator === 'not' ? 'not' : 'and';
    case 'empty':
      return 'compare';
    default:
      return 'value';
  }
}

export const blankComparison = (): Block => comparisonBlock('>', EMPTY, EMPTY);

/**
 * Whether the user has entered something in the tree: a value, a number, a text, a function, or another comparison
 * sign than the one a new comparison starts with. Empty places and the frame of "und", "oder", "nicht" and of a blank
 * comparison are no entries.
 */
export function hasInput(block: Block): boolean {
  switch (block.kind) {
    case 'empty':
      return false;
    case 'comparison':
      return (block.operator ?? '>') !== '>' || childrenOf(block).some(hasInput);
    case 'logic':
      return childrenOf(block).some(hasInput);
    default:
      return true;
  }
}

/** The condition after a change of its kind, and whether entries of the user would be lost by it. */
export type Conversion = { result: Block; loses: boolean };

/**
 * The condition of the kind chosen (specification 5.4, table in docs/technical/pipwerk-studio.md, section "Wechsel der
 * Art einer Bedingung"). A change of the kind replaces the condition by a new one of that kind: the sentence of the new
 * kind stands alone and never behind the sentence of the old one (Mangel E13). Three changes keep what is there:
 * a comparison becomes the first part of "und" and "oder"; "und" and "oder" keep their parts when one becomes the other,
 * because the parts are the same and only the word between them changes; "und" or "oder" with a single comparison becomes
 * that comparison. Every other change loses what the user entered; `loses` says so, and the interface asks first.
 */
export function convertConditionWithLoss(kind: ConditionKind, current: Block): Conversion {
  const have = !isEmptyBlock(current);
  const currentKind = conditionKind(current);
  const lost = hasInput(current);
  switch (kind) {
    case 'compare': {
      if (currentKind === 'compare' && have) {
        return { result: current, loses: false };
      }
      const parts = childrenOf(current);
      const only = parts[0];
      if ((currentKind === 'and' || currentKind === 'or') && parts.length === 1 && only !== undefined && only.kind === 'comparison') {
        return { result: only, loses: false };
      }
      return { result: blankComparison(), loses: lost };
    }
    case 'and':
    case 'or': {
      if (current.kind === 'logic' && (current.operator === 'and' || current.operator === 'or')) {
        return { result: { ...current, operator: kind }, loses: false };
      }
      if (current.kind === 'comparison') {
        return { result: logicBlock(kind, [current, blankComparison()]), loses: false };
      }
      return { result: logicBlock(kind, [blankComparison(), blankComparison()]), loses: lost };
    }
    case 'not':
      return currentKind === 'not' && have ? { result: current, loses: false } : { result: logicBlock('not', [blankComparison()]), loses: lost };
    case 'value':
      return currentKind === 'value' && have ? { result: current, loses: false } : { result: EMPTY, loses: lost };
  }
}

export function convertCondition(kind: ConditionKind, current: Block): Block {
  return convertConditionWithLoss(kind, current).result;
}

/**
 * The block without its part at `index` (a part of "und", "oder", or an argument of a function that takes more). The
 * rest stays. Fewer than `minimum` parts are filled up with a blank part, so the result is always a block the user can
 * go on editing; the check reports the empty place.
 */
export function withoutPart(block: Block, index: number, blank: () => Block, minimum = 1): Block {
  const rest = childrenOf(block).filter((_, position) => position !== index);
  while (rest.length < Math.max(minimum, 1)) {
    rest.push(blank());
  }
  return withChildren(block, rest);
}
