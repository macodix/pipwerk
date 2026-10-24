import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseElementTypes, type ElementTypesResponse } from '../api/elementTypes';
import { createTypeIndex, type TypeIndex } from '../model/typeIndex';

/**
 * Type descriptions as `GET /api/v1/element-types` delivers them: a copy of the answer of the backend, kept in
 * `element-types.json` for the tests (the test `test_frontend_type_copy.py` of the backend keeps it equal to the answer).
 * The copy is used as it is. Test data may name single types; the interface itself does not (specification E2).
 */

type Json = Record<string, unknown>;

/** The raw answer of the endpoint. */
export function typeDescriptionsJson(): Json {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, 'element-types.json'), 'utf-8')) as Json;
}

export function typeDescriptions(): ElementTypesResponse {
  return parseElementTypes(typeDescriptionsJson());
}

/** The type descriptions with their lookup, as the interface uses them. */
export function testTypes(): TypeIndex {
  return createTypeIndex(typeDescriptions());
}
