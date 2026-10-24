// Order 17, acceptance criterion 3: no text of the interface and of the user documentation names a
// limit for the number or the total size of the files of an import (acceptance report, attempt 2,
// M3). The patterns are in `forbiddenTexts.ts`; the browser test `e2e/texts.spec.ts` searches the
// built files and the screens with the same patterns.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { TOTAL_LIMIT_NAMES, TOTAL_LIMIT_TEXT } from './forbiddenTexts';

const frontend = join(dirname(fileURLToPath(import.meta.url)), '..');
const repository = join(frontend, '..', '..', '..');

function filesOf(directory: string, extensions: string[]): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      found.push(...filesOf(join(directory, entry.name), extensions));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      found.push(join(directory, entry.name));
    }
  }
  return found;
}

const isTest = (path: string) => /\.(test|spec)\.tsx?$/.test(path);

/** Code, texts and test tools of the interface; not the tests that name the words on purpose. */
const SHIPPED = [
  ...filesOf(join(frontend, 'src'), ['.ts', '.tsx', '.json', '.css']),
  ...filesOf(join(frontend, 'e2e'), ['.ts']),
].filter((path) => !isTest(path));

function hitsIn(paths: string[], pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const path of paths) {
    readFileSync(path, 'utf-8')
      .split('\n')
      .forEach((line, index) => {
        const found = pattern.exec(line);
        if (found !== null) {
          hits.push(`${relative(repository, path)}:${String(index + 1)}: ${found[0]}`);
        }
      });
  }
  return hits;
}

describe('no limit for the number or the total size of the files', () => {
  it('searches a meaningful number of files', () => {
    const names = SHIPPED.map((path) => relative(frontend, path));
    expect(names).toContain('src/ImportDialog.tsx');
    expect(names).toContain('src/importProcess.ts');
    expect(names).toContain('src/errors.ts');
    expect(names).toContain('src/locales/de.json');
    expect(names).toContain('src/locales/en.json');
    expect(names).toContain('e2e/fixtures.ts');
  });

  it('has no text in the interface that speaks of too many files or of files that are too large together', () => {
    expect(hitsIn(SHIPPED, TOTAL_LIMIT_TEXT)).toEqual([]);
  });

  it('has no trace of the removed limits in the code and the texts of the interface', () => {
    expect(hitsIn(SHIPPED, TOTAL_LIMIT_NAMES)).toEqual([]);
  });

  it('has no such text in the user documentation', () => {
    const documentation = join(repository, 'docs', 'user', 'pipwerk-replay.md');
    expect(existsSync(documentation)).toBe(true);
    expect(hitsIn([documentation], TOTAL_LIMIT_TEXT)).toEqual([]);
    expect(hitsIn([documentation], TOTAL_LIMIT_NAMES)).toEqual([]);
  });

  it('knows what it looks for', () => {
    for (const text of [
      'Importieren Sie weniger Dateien auf einmal.',
      'Die Dateien sind zusammen größer als erlaubt.',
      'Es sind zu viele Dateien auf einmal.',
      'Sie können höchstens 50 Dateien wählen.',
      'The files together are too large together.',
      'Import fewer files at once.',
    ]) {
      expect(TOTAL_LIMIT_TEXT.test(text), text).toBe(true);
    }
    for (const text of [
      'Es gibt keine Grenze für die Zahl der Dateien und ihre Gesamtgröße.',
      'Die Datei ist größer als die Grenze von 32 MiB je Datei.',
      '3 von 12 Dateien erledigt.',
    ]) {
      expect(TOTAL_LIMIT_TEXT.test(text), text).toBe(false);
    }
  });
});
