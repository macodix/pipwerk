import { describe, expect, it } from 'vitest';

import {
  ACQUISITION_ERROR_CODES,
  FILE_ERROR_CODES,
  REJECT_REASONS,
  acquisitionErrorText,
  describeError,
  fileErrorText,
  rejectReasonText,
} from './errors';
import { ApiError } from './http';
import { createI18n } from './i18n';

const de = createI18n('de').t;
const en = createI18n('en').t;

describe('texts of codes', () => {
  it('has a text in both languages for every code the backend can name', () => {
    for (const t of [de, en]) {
      for (const code of REJECT_REASONS) {
        expect(rejectReasonText(t, code), code).not.toBe(`import.reject.${code}`);
      }
      for (const code of FILE_ERROR_CODES) {
        expect(fileErrorText(t, code), code).not.toBe(`import.fileError.${code}`);
      }
      for (const code of ACQUISITION_ERROR_CODES) {
        expect(acquisitionErrorText(t, code, 'reason', null), code).not.toContain('acquire.errors');
      }
    }
  });

  it('says "unknown" for a code it does not know', () => {
    expect(rejectReasonText(de, 'new_reason')).toBe('Grund unbekannt.');
    expect(fileErrorText(en, 'new_code')).toBe('The file was rejected.');
    expect(fileErrorText(en, 42)).toBe('The file was rejected.');
  });

  it('shows the reason of the source for a code it does not know', () => {
    expect(acquisitionErrorText(de, 'new_code', 'Neuer Grund', null)).toBe('Neuer Grund');
  });

  it('names the file error of a refused import', () => {
    expect(acquisitionErrorText(en, 'import_refused', 'x', 'no_rows')).toBe(
      'The import rejected the data of the source: The file contains no rows.',
    );
  });

  it('names "Keine Quelle eingerichtet" and "Quelle nicht erreichbar" in German', () => {
    expect(acquisitionErrorText(de, 'no_source', '', null)).toContain('Keine Quelle eingerichtet');
    expect(acquisitionErrorText(de, 'source_unreachable', '', null)).toContain('Quelle nicht erreichbar');
  });
});

describe('describeError', () => {
  it.each([
    [400, {}, 'errors.host'],
    [404, {}, 'errors.notFound'],
    [413, {}, 'errors.tooLarge'],
    [415, {}, 'errors.mediaType'],
    [422, {}, 'errors.invalid'],
    [429, {}, 'errors.busy'],
    [503, {}, 'errors.dataStock'],
    [500, {}, 'errors.server'],
    [409, { detail: 'No broker is given and no default source is set.' }, 'errors.server'],
  ])('maps the status %s', (status, body, key) => {
    expect(describeError(de, new ApiError(status, body))).toBe(de(key));
  });

  it('takes the code of a refused file', () => {
    const error = new ApiError(422, { detail: 'The file is refused.', code: 'timezone_unknown', message: 'x' });

    expect(describeError(de, error)).toBe(de('import.fileError.timezone_unknown'));
  });

  it('takes the code of a missing source', () => {
    const error = new ApiError(409, { detail: 'No source is set up.', code: 'no_source', reason: 'x' });

    expect(describeError(en, error)).toBe(en('acquire.errors.no_source'));
  });

  it('reports a network error and anything else', () => {
    expect(describeError(de, new TypeError('Failed to fetch'))).toBe(de('errors.network'));
    expect(describeError(de, new Error('x'))).toBe(de('errors.unexpected'));
    expect(describeError(de, 'x')).toBe(de('errors.unexpected'));
  });

  it('copes with a body that is not an object', () => {
    expect(describeError(de, new ApiError(422, null))).toBe(de('errors.invalid'));
    expect(describeError(de, new ApiError(422, 'text'))).toBe(de('errors.invalid'));
  });
});
