import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ACQUISITION_IN_SOURCE, AREA_DIRECTIONS, REMOVED_HEADINGS } from './forbiddenTexts';

const frontend = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The files of a directory (not in sub-directories named in `skip`) with the extensions. */
function filesOf(directory: string, extensions: string[], skip: string[] = []): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skip.includes(entry.name)) {
        found.push(...filesOf(join(directory, entry.name), extensions, skip));
      }
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      found.push(join(directory, entry.name));
    }
  }
  return found;
}

const isTest = (path: string) => /\.(test|spec)\.tsx?$/.test(path);

/** Code, texts and test tools of the user interface; not the tests that name the words on purpose. */
const SHIPPED = [
  ...filesOf(join(frontend, 'src'), ['.ts', '.tsx', '.json', '.css']),
  ...filesOf(join(frontend, 'e2e'), ['.ts']),
  join(frontend, 'playwright.config.ts'),
  join(frontend, 'vite.config.ts'),
  join(frontend, 'index.html'),
  join(frontend, 'package.json'),
].filter((path) => !isTest(path));

describe('no acquisition and no source in the user interface', () => {
  it('searches a meaningful number of files', () => {
    const names = SHIPPED.map((path) => relative(frontend, path));
    expect(names).toContain('src/DataView.tsx');
    expect(names).toContain('src/locales/de.json');
    expect(names).toContain('src/locales/en.json');
    expect(names).toContain('src/marketDataApi.ts');
    expect(names).toContain('src/dataQueries.ts');
    expect(names).toContain('src/errors.ts');
    expect(names).toContain('e2e/stack.ts');
    expect(names).toContain('e2e/fixtures.ts');
    expect(names).toContain('playwright.config.ts');
    expect(names.length).toBeGreaterThan(25);
  });

  it('has nothing about an acquisition or a source in source code, texts and test tools', () => {
    const hits: string[] = [];
    for (const path of SHIPPED) {
      readFileSync(path, 'utf-8')
        .split('\n')
        .forEach((line, index) => {
          if (ACQUISITION_IN_SOURCE.test(line)) {
            hits.push(`${relative(frontend, path)}:${String(index + 1)}: ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it('has none of the removed headings in any file', () => {
    const hits: string[] = [];
    for (const path of SHIPPED) {
      const content = readFileSync(path, 'utf-8');
      for (const heading of REMOVED_HEADINGS) {
        if (content.includes(heading)) {
          hits.push(`${relative(frontend, path)}: ${heading}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('has no text that points to an area "below" or "above" in either language', () => {
    for (const language of ['de', 'en']) {
      const texts = JSON.parse(readFileSync(join(frontend, 'src', 'locales', `${language}.json`), 'utf-8')) as unknown;
      const hits: string[] = [];
      const walk = (node: unknown, path: string): void => {
        if (typeof node === 'string') {
          // "High is below open" in the reasons for rejected rows is about prices, not an area.
          if (AREA_DIRECTIONS.test(node) && !path.startsWith(`${language}.import.reject.`)) {
            hits.push(`${path}: ${node}`);
          }
        } else if (typeof node === 'object' && node !== null) {
          for (const [key, child] of Object.entries(node)) {
            walk(child, `${path}.${key}`);
          }
        }
      };
      walk(texts, language);
      expect(hits).toEqual([]);
    }
  });

  it('has no file of the former components of the acquisition', () => {
    for (const name of ['src/AcquireCard.tsx', 'src/ImportCard.tsx']) {
      expect(existsSync(join(frontend, name)), name).toBe(false);
    }
  });
});
