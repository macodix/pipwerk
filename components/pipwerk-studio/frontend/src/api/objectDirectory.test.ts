import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpError, ResponseFormatError } from './http';
import { causeOf, fetchObjectDirectory, parseObjectDirectory, updateObjectDirectory } from './objectDirectory';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('object directory', () => {
  it('reads path and default', () => {
    expect(parseObjectDirectory({ path: '/a', is_default: true })).toEqual({ path: '/a', isDefault: true });
    expect(parseObjectDirectory({ path: null, is_default: true })).toEqual({ path: null, isDefault: true });
  });

  it.each([[{}], [{ path: 1, is_default: true }], [{ path: '/a' }], [[]]])('rejects %j', (value) => {
    expect(() => parseObjectDirectory(value)).toThrow(ResponseFormatError);
  });

  it('reads and writes with path and move', async () => {
    const calls: { url: string; method?: string; body?: unknown }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method, body: init?.body });
      return Promise.resolve(new Response(JSON.stringify({ path: '/b', is_default: false }), { status: 200 }));
    });

    await expect(fetchObjectDirectory()).resolves.toEqual({ path: '/b', isDefault: false });
    await expect(updateObjectDirectory('/b', true)).resolves.toEqual({ path: '/b', isDefault: false });

    expect(calls[1]).toMatchObject({
      url: '/api/studio/settings/object-directory',
      method: 'PUT',
      body: '{"path":"/b","move":true}',
    });
  });
});

describe('causeOf', () => {
  it('names the status; the English text of the answer is not part of the cause', () => {
    expect(causeOf(new HttpError(409, 'Nothing was moved.', { detail: 'Nothing was moved.' }))).toEqual({
      status: 409,
      moveFailure: null,
    });
  });

  it('takes the directories and files from the data of the cause (`params`) as well', () => {
    const body = {
      detail: 'Moving failed.',
      code: 'object_directory.move_not_restored',
      params: { source_directory: '/old', target_directory: '/new', files: ['a.strategy.json'] },
    };

    expect(causeOf(new HttpError(500, body.detail, body)).moveFailure).toEqual({
      sourceDirectory: '/old',
      targetDirectory: '/new',
      files: ['a.strategy.json'],
    });
  });

  it('names both directories and the files of a failed move back', () => {
    const body = {
      detail: 'Moving the object files failed and some files could not be brought back.',
      source_directory: '/old',
      target_directory: '/new',
      files: ['a.strategy.json'],
    };

    expect(causeOf(new HttpError(500, body.detail, body)).moveFailure).toEqual({
      sourceDirectory: '/old',
      targetDirectory: '/new',
      files: ['a.strategy.json'],
    });
  });

  it('does not use directory fields of the wrong type', () => {
    const body = { detail: 'x', source_directory: 1, target_directory: '/new', files: [] };

    expect(causeOf(new HttpError(500, 'x', body)).moveFailure).toBeNull();
    expect(causeOf(new HttpError(500, 'x', { source_directory: 'a', target_directory: 'b', files: [1] })).moveFailure).toBeNull();
  });

  it('has no cause for an error that is not an answer of the backend', () => {
    expect(causeOf(new TypeError('network error'))).toEqual({ status: null, moveFailure: null });
  });
});
