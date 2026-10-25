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

describe('no fixed port in the browser tests and their configuration (rules of the project)', () => {
  const frontend = join(here, '..');

  function testFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((name) => {
      const path = join(directory, name);
      return statSync(path).isDirectory() ? testFiles(path) : /\.(tsx?|mjs|js)$/.test(name) ? [path] : [];
    });
  }

  const withoutComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  // a number of four or five digits behind a colon in an address, behind a name with "port" and an equals sign or
  // colon, or as the default value after `??` or `||` in a line with "port"
  const fixedPort = /\d:\d{4,5}\b|localhost:\d{4,5}\b|(?:\bport|[a-z]Port)\w*\s*[=:]\s*(?:Number\()?\d{4,5}\b|(?:\bport|[a-z]Port)[^\n]*(?:\?\?|\|\|)\s*\d{4,5}\b/;

  it('finds a fixed port in a sample (the rule works)', () => {
    expect(fixedPort.test("const backendPort = Number(process.env.X ?? 18000);")).toBe(true);
    expect(fixedPort.test("const url = 'http://127.0.0.1:15173';")).toBe(true);
    expect(fixedPort.test('const frontendPort = 15173;')).toBe(true);
    expect(fixedPort.test('const backendPort = requiredPort(name);')).toBe(false);
  });

  it('has none in playwright.config.ts and in the files of e2e/', () => {
    const files = [join(frontend, 'playwright.config.ts'), ...testFiles(join(frontend, 'e2e'))];
    expect(files.length).toBeGreaterThan(10);
    const offenders = files
      .filter((file) => fixedPort.test(withoutComments(readFileSync(file, 'utf-8'))))
      .map((file) => relative(frontend, file));

    expect(offenders).toEqual([]);
  });

  it('has no default value for the ports in the configuration', () => {
    const text = withoutComments(readFileSync(join(frontend, 'playwright.config.ts'), 'utf-8'));
    expect(text).not.toMatch(/PORT[^\n]*(\?\?|\|\|)/);
  });
});
