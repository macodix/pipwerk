import type { NameOccurrence } from '../api/objects';
import { findMember, type Member } from './scope';

/** Suggestions for the expression input and the display of names in the language of the interface. */

export type Suggestion = {
  /** The identifier, as it is written in the expression. */
  id: string;
  /** What is inserted: the identifier, or a function name with its opening bracket. */
  insert: string;
  /** The name in the language of the interface. */
  label: string;
  detail: string;
  kind: 'name' | 'function';
};

export type FunctionItem = { name: string; description: string };

export type CompletionResult = {
  /** The part of the text the suggestion replaces: from `start` to the caret. */
  start: number;
  end: number;
  suggestions: Suggestion[];
};

const NAME_CHARACTER = /[A-Za-z0-9_.]/;

function insideText(text: string, caret: number): boolean {
  let quotes = 0;
  for (let index = 0; index < caret; index += 1) {
    if (text[index] === '"') {
      quotes += 1;
    }
  }
  return quotes % 2 === 1;
}

function startsWith(member: string, prefix: string): boolean {
  return member.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * What can be written at the caret. After a name and a point: the properties of
 * that object, and for objects with instances or rules inside them (an
 * indicator, a trend, a rule set) these too, so that multi-part names such as
 * `trend.ema.value` and `ruleset.rule.result` are entered the same way (hint S19).
 * Without a point: the names visible at this place and the functions, as soon
 * as one character is typed.
 */
export function completionsAt(
  text: string,
  caret: number,
  roots: readonly Member[],
  functions: readonly FunctionItem[],
): CompletionResult | null {
  if (insideText(text, caret)) {
    return null;
  }
  let start = caret;
  while (start > 0 && NAME_CHARACTER.test(text[start - 1] ?? '')) {
    start -= 1;
  }
  const token = text.slice(start, caret);
  if (token === '' || /^[0-9]/.test(token)) {
    return null;
  }
  const parts = token.split('.');
  const prefix = parts[parts.length - 1] ?? '';
  const path = parts.slice(0, -1);
  if (path.some((part) => part === '')) {
    return null;
  }
  if (path.length === 0) {
    const names: Suggestion[] = roots
      .filter((member) => startsWith(member.id, prefix))
      .map((member) => ({ id: member.id, insert: member.id, label: member.label, detail: member.detail, kind: 'name' }));
    const calls: Suggestion[] = functions
      .filter((item) => startsWith(item.name, prefix))
      .map((item) => ({
        id: item.name,
        insert: `${item.name}(`,
        label: item.name,
        detail: item.description,
        kind: 'function',
      }));
    const suggestions = [...names, ...calls];
    return suggestions.length === 0 ? null : { start, end: caret, suggestions };
  }
  let level: readonly Member[] = roots;
  for (const part of path) {
    const member = findMember(level, part);
    if (member === undefined) {
      return null;
    }
    level = member.children();
  }
  const suggestions: Suggestion[] = level
    .filter((member) => startsWith(member.id, prefix))
    .map((member) => ({ id: member.id, insert: member.id, label: member.label, detail: member.detail, kind: 'name' }));
  return suggestions.length === 0 ? null : { start: caret - prefix.length, end: caret, suggestions };
}

/** The text and the caret after a suggestion is chosen. */
export function applySuggestion(
  text: string,
  result: CompletionResult,
  suggestion: Suggestion,
): { text: string; caret: number } {
  const next = text.slice(0, result.start) + suggestion.insert + text.slice(result.end);
  return { text: next, caret: result.start + suggestion.insert.length };
}

/**
 * The expression with the names in the language of the interface. `names` are
 * the names that the check recognized in exactly this text; a part of a name
 * that is not known (an instance, a rule, a parameter) stays as written.
 */
export function displayExpression(text: string, names: readonly NameOccurrence[], roots: readonly Member[]): string {
  const replacements: { start: number; end: number; label: string }[] = [];
  for (const name of names) {
    let level: readonly Member[] = roots;
    for (const segment of name.segments) {
      const member = findMember(level, segment.identifier);
      if (member === undefined) {
        break;
      }
      if (member.label !== text.slice(segment.start, segment.end)) {
        replacements.push({ start: segment.start, end: segment.end, label: member.label });
      }
      level = member.children();
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let result = text;
  for (const replacement of replacements) {
    result = result.slice(0, replacement.start) + replacement.label + result.slice(replacement.end);
  }
  return result;
}
