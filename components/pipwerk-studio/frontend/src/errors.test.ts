import { describe, expect, it } from 'vitest';

import { HttpError, RequestTimeoutError, ResponseFormatError } from './api/http';
import { describeCause } from './errors';
import { createI18n } from './i18n';

describe('the text of the cause of a failed request (specification 4.2, M4)', () => {
  it('comes from the identifier of the cause in the language of the interface, never from the English text of the answer', () => {
    const body = { detail: 'The object directory must be absolute.', code: 'object_directory.not_absolute', params: {} };
    const error = new HttpError(422, body.detail, body);

    for (const [language, expected] of [
      ['de', 'Das Objektverzeichnis muss mit dem vollständigen Pfad angegeben werden.'],
      ['en', 'The object directory must be given with its full path.'],
    ] as const) {
      const instance = createI18n(language);
      expect(describeCause(instance.t, instance, error).summary).toBe(expected);
    }
  });

  it('names the status and the identifier for a cause without a text, and only the status for an answer without an identifier', () => {
    const instance = createI18n('de');

    expect(describeCause(instance.t, instance, new HttpError(409, 'x', { code: 'neu.unbekannt', params: {} })).summary).toBe(
      'Das Backend hat die Anfrage abgelehnt (Status 409, Ursache neu.unbekannt).',
    );
    expect(describeCause(instance.t, instance, new HttpError(500, null, undefined)).summary).toBe(
      'Das Backend hat die Anfrage mit dem Status 500 abgelehnt.',
    );
  });

  it('tells a timeout, an unexpected answer and a backend that cannot be reached', () => {
    const instance = createI18n('en');

    expect(describeCause(instance.t, instance, new RequestTimeoutError(10)).summary).toBe('The backend did not answer in time.');
    expect(describeCause(instance.t, instance, new ResponseFormatError('x')).summary).toBe('The backend sent an unexpected answer.');
    expect(describeCause(instance.t, instance, new TypeError('network')).summary).toBe('The backend is not reachable.');
  });
});
