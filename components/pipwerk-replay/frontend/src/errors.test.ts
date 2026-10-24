import { describe, expect, it } from 'vitest';

import {
  DELETION_ERROR_CODES,
  FILE_ERROR_CODES,
  REJECT_REASONS,
  describeError,
  fileErrorText,
  limitText,
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
      for (const code of DELETION_ERROR_CODES) {
        expect(t(`delete.error.${code}`), code).not.toBe(`delete.error.${code}`);
        expect(t(`delete.error.${code}`), code).toMatch(/Nächster Schritt|Next step/);
      }
    }
  });

  it('says "unknown" for a code it does not know', () => {
    expect(rejectReasonText(de, 'new_reason')).toBe('Grund unbekannt.');
    expect(fileErrorText(en, 'new_code')).toContain('The file was refused.');
    expect(fileErrorText(en, 42)).toContain('The file was refused.');
  });

  it('names the limit per file when the backend named it, in the unit of the user', () => {
    expect(fileErrorText(de, 'too_large', { kind: 'size', text: '32 MiB' }, 'de')).toContain('Grenze von 32 MiB je Datei');
    expect(fileErrorText(de, 'too_large', { kind: 'size', text: '1.5 GiB' }, 'de')).toContain('1,5 GiB');
    expect(fileErrorText(en, 'too_large', { kind: 'size', text: '1.5 GiB' }, 'en')).toContain('limit of 1.5 GiB per file');
    expect(fileErrorText(de, 'too_many_rows', { kind: 'rows', text: '500000' }, 'de')).toContain('500.000 Zeilen je Datei');
    expect(fileErrorText(en, 'too_many_rows', { kind: 'rows', text: '500000' }, 'en')).toContain('limit of 500,000 rows per file');
  });

  it('does not invent a limit when the backend named none', () => {
    expect(fileErrorText(de, 'too_large')).toContain('Grenze je Datei');
    expect(fileErrorText(de, 'too_large')).not.toMatch(/\d/);
    expect(fileErrorText(en, 'too_many_rows', null, 'en')).toContain('limit per file');
  });

  it('never speaks of the number or the total size of the files', () => {
    for (const t of [de, en]) {
      for (const code of FILE_ERROR_CODES) {
        expect(fileErrorText(t, code), code).not.toMatch(/weniger Dateien|zu viele Dateien|zusammen|fewer files|too many files|together/i);
      }
    }
  });

  it('formats the limit in the language', () => {
    expect(limitText({ kind: 'size', text: '512 KiB' }, 'de')).toBe('512 KiB');
    expect(limitText({ kind: 'rows', text: '1200000' }, 'en')).toBe('1,200,000');
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
    [409, { detail: 'x' }, 'errors.conflict'],
    [409, { detail: 'x', reason: 'import_running' }, 'errors.importRunning'],
  ])('maps the status %s', (status, body, key) => {
    expect(describeError(de, new ApiError(status, body))).toBe(de(key));
    expect(describeError(en, new ApiError(status, body))).toBe(en(key));
  });

  it.each(DELETION_ERROR_CODES)('takes the code of a deletion that is refused (404 %s)', (code) => {
    const error = new ApiError(404, { detail: 'x', code, message: 'x' });

    expect(describeError(de, error)).toBe(de(`delete.error.${code}`));
    expect(describeError(en, error)).toBe(en(`delete.error.${code}`));
  });

  it('names the next step in every text of an error', () => {
    for (const key of ['host', 'origin', 'conflict', 'importRunning', 'tooLarge', 'mediaType', 'invalid', 'busy', 'dataStock', 'server', 'network', 'unexpected']) {
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
