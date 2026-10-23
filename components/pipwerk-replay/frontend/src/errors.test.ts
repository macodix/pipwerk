import { describe, expect, it } from 'vitest';

import {
  BATCH_ERROR_CODES,
  FILE_ERROR_CODES,
  REJECT_REASONS,
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
      for (const code of BATCH_ERROR_CODES) {
        expect(t(`import.batchError.${code}`), code).not.toBe(`import.batchError.${code}`);
      }
    }
  });

  it('says "unknown" for a code it does not know', () => {
    expect(rejectReasonText(de, 'new_reason')).toBe('Grund unbekannt.');
    expect(fileErrorText(en, 'new_code')).toContain('The file was refused.');
    expect(fileErrorText(en, 42)).toContain('The file was refused.');
  });
});

describe('describeError', () => {
  it.each([
    [400, {}, 'errors.host'],
    [403, { detail: 'The request comes from a web page of another origin.' }, 'errors.origin'],
    [404, {}, 'errors.notFound'],
    [413, { detail: 'The request body is larger than the limit.' }, 'errors.tooLarge'],
    [415, {}, 'errors.mediaType'],
    [422, {}, 'errors.invalid'],
    [429, {}, 'errors.busy'],
    [503, {}, 'errors.dataStock'],
    [500, {}, 'errors.server'],
    [409, { detail: 'x' }, 'errors.server'],
  ])('maps the status %s', (status, body, key) => {
    expect(describeError(de, new ApiError(status, body))).toBe(de(key));
    expect(describeError(en, new ApiError(status, body))).toBe(en(key));
  });

  it.each([
    [413, 'too_many_files'],
    [413, 'batch_too_large'],
    [422, 'no_files'],
  ])('takes the code of an import that is refused as a whole (%s %s)', (status, code) => {
    const error = new ApiError(status, { detail: 'The import is refused as a whole.', code, message: 'x' });

    expect(describeError(de, error)).toBe(de(`import.batchError.${code}`));
    expect(describeError(en, error)).toBe(en(`import.batchError.${code}`));
  });

  it('names the next step in every text of an error', () => {
    for (const key of ['host', 'origin', 'tooLarge', 'mediaType', 'invalid', 'busy', 'dataStock', 'server', 'network', 'unexpected']) {
      expect(de(`errors.${key}`), key).toContain('Nächster Schritt');
      expect(en(`errors.${key}`), key).toContain('Next step');
    }
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
