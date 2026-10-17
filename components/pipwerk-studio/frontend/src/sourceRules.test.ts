import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { realTypes } from './testing/fixtures';
import { inventedList } from './testing/inventedTypes';

/**
 * Rules for the source code of the interface (acceptance criteria 3 and 5 of the order):
 * it knows no single element type, object type or order type, it never sets text as HTML,
 * and it has no fixed port, path or host.
 */

const sourceDirectory = import.meta.dirname;

function productionFiles(): { path: string; text: string }[] {
  return readdirSync(sourceDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name))
    .map((entry) => relative(sourceDirectory, join(entry.parentPath, entry.name)))
    .filter(
      (path) =>
        !/\.test\.(ts|tsx)$/.test(path) &&
        !path.startsWith('testing/') &&
        path !== 'test-utils.tsx' &&
        path !== 'test-setup.ts',
    )
    .map((path) => ({ path, text: readFileSync(join(sourceDirectory, path), 'utf-8') }));
}

/** The code without comments, so that a word in a comment is not taken for a use. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const files = productionFiles();

describe('the source of the interface', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files.some((file) => file.path === 'App.tsx')).toBe(true);
    expect(files.some((file) => file.path === 'canvas/flowModel.ts')).toBe(true);
    expect(files.some((file) => file.path.includes('test'))).toBe(false);
  });

  it.each([
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['innerHTML or outerHTML', /\b(inner|outer)HTML\b/],
    ['insertAdjacentHTML', /insertAdjacentHTML/],
    ['document.write', /document\.write\b/],
    ['eval', /\beval\s*\(/],
    ['new Function', /new\s+Function\b/],
    ['the component Trans, which evaluates HTML in translations', /\bTrans\b/],
  ])('does not use %s', (_name, pattern) => {
    const found = files.filter((file) => pattern.test(withoutComments(file.text))).map((file) => file.path);

    expect(found).toEqual([]);
  });

  it('has no fixed port, address, host or path', () => {
    const patterns = [/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b/, /:\d{4,5}\b/, /\/(?:home|srv|var|etc|usr|opt|tmp)\//, /[A-Z]:\\\\/];
    const found = files.flatMap((file) =>
      patterns.filter((pattern) => pattern.test(withoutComments(file.text))).map((pattern) => `${file.path} ${String(pattern)}`),
    );

    expect(found).toEqual([]);
  });

  it('names no element type, object type or order type of the real type descriptions in its code', () => {
    const ids = realTypes.list.map((type) => type.id);
    const found: string[] = [];
    for (const file of files) {
      const code = withoutComments(file.text);
      for (const id of ids) {
        if (new RegExp(`(['"\`])${id.replace(/\./g, '\\.')}\\1`).test(code)) {
          found.push(`${file.path}: ${id}`);
        }
      }
    }

    expect(found).toEqual([]);
  });

  it('names no type of the invented descriptions either (these exist only in the tests)', () => {
    const found = files.filter((file) => inventedList.some((type) => file.text.includes(type.id))).map((file) => file.path);

    expect(found).toEqual([]);
  });

  it('counter test: the rules find what they are meant to find and ignore comments', () => {
    const bad = "if (type === 'flow.condition') { el.innerHTML = x; }";
    const comment = "// the type 'flow.condition' and innerHTML are named here\n/* eval( */";

    expect(/(['"`])flow\.condition\1/.test(withoutComments(bad))).toBe(true);
    expect(/\b(inner|outer)HTML\b/.test(withoutComments(bad))).toBe(true);
    expect(/(['"`])flow\.condition\1/.test(withoutComments(comment))).toBe(false);
    expect(/\b(inner|outer)HTML\b/.test(withoutComments(comment))).toBe(false);
    expect(/\beval\s*\(/.test(withoutComments(comment))).toBe(false);
  });

  it('writes no text of the interface in the code of a component: the texts come from the translation files', () => {
    // A sample: the texts of the menu are keys, not literals.
    const menu = files.find((file) => file.path === 'MenuBar.tsx')!;

    expect(menu.text).not.toContain('Neue Strategie');
    expect(menu.text).toContain('t(`menu.${item.key}`)');
  });
});
