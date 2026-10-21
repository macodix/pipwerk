import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { inventedTypesJson } from './testing/inventedTypes';
import { typeDescriptionsJson } from './testing/typeDescriptions';

const here = dirname(fileURLToPath(import.meta.url));

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return name === 'testing' ? [] : sources(path);
    }
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('the user interface knows no single type (specification E2)', () => {
  const typeIds = [
    ...new Set([...(typeDescriptionsJson().types as { id: string }[]), ...inventedTypesJson.types].map((type) => type.id)),
  ];

  it('has identifiers of types to look for', () => {
    expect(typeIds).toContain('flow.condition');
    expect(typeIds).toContain('zz.start');
    expect(typeIds.length).toBeGreaterThan(30);
  });

  it('names no identifier of an element type or object type in its source code (the test data may)', () => {
    const found: string[] = [];
    for (const file of sources(here)) {
      const text = readFileSync(file, 'utf-8');
      for (const id of typeIds) {
        const quoted = new RegExp(`['"\`]${id.replace('.', '\\.')}['"\`]`);
        if (quoted.test(text)) {
          found.push(`${relative(here, file)}: ${id}`);
        }
      }
    }

    expect(found).toEqual([]);
  });

  it('names no identifier of a template either', () => {
    const found: string[] = [];
    for (const file of sources(here)) {
      if (/7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645/.test(readFileSync(file, 'utf-8'))) {
        found.push(relative(here, file));
      }
    }

    expect(found).toEqual([]);
  });
});

describe('no fixed path, port or machine name in the source code (rules of the project)', () => {
  it('has none in the source files of the interface', () => {
    const offenders: string[] = [];
    for (const file of sources(here)) {
      const text = readFileSync(file, 'utf-8');
      if (/localhost|127\.0\.0\.1|\/srv\/|\/home\/|https?:\/\/(?!github\.com\/macodix|www\.w3\.org)/.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) {
        offenders.push(relative(here, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
