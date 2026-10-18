import { readFileSync } from 'node:fs';

import { parseElementTypes } from '../api/elementTypes';
import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import { createTypeIndex } from '../model/typeIndex';
import typesJson from './element-types.json';

/**
 * Type descriptions as `GET /api/v1/element-types` delivers them (a copy of the
 * answer of the backend, kept in `element-types.json` for the tests) and the two
 * test case documents of the contracts.
 */
export const realTypes = createTypeIndex(parseElementTypes(typesJson));

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf-8')) as unknown;
}

const testcasesDirectory = '../../../../../contracts/strategies/v1/testcases/';

export function loadTestcase(name: 'str-01' | 'str-03'): StrategyDocument {
  return parseStrategyDocument(readJson(`${testcasesDirectory}${name}.strategy.json`));
}

export function loadTestcaseRaw(name: 'str-01' | 'str-03'): unknown {
  return readJson(`${testcasesDirectory}${name}.strategy.json`);
}
