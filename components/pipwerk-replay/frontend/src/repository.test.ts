import { describe, expect, it } from 'vitest';

import packageJson from '../package.json';
import { parseRepositoryUrl, repositoryUrl } from './repository';

describe('repository address', () => {
  it('is exactly the address in package.json', () => {
    expect(packageJson.repository.url).toBe('https://github.com/macodix/pipwerk');
    expect(repositoryUrl).toBe('https://github.com/macodix/pipwerk');
  });
});

describe('parseRepositoryUrl', () => {
  it.each(['https://github.com/macodix/pipwerk', 'https://github.com/a-b/c.d_e-f'])(
    'accepts %s',
    (value) => {
      expect(parseRepositoryUrl(value)).toBe(value);
    },
  );

  it.each([
    ['another host', 'https://example.com/macodix/pipwerk'],
    ['a host with a prefix', 'https://evilgithub.com/macodix/pipwerk'],
    ['http', 'http://github.com/macodix/pipwerk'],
    ['an additional path', 'https://github.com/macodix/pipwerk/issues'],
    ['a trailing slash', 'https://github.com/macodix/pipwerk/'],
    ['a query', 'https://github.com/macodix/pipwerk?x=1'],
    ['a fragment', 'https://github.com/macodix/pipwerk#x'],
    ['a space', 'https://github.com/macodix/pip werk'],
    ['a trailing new line', 'https://github.com/macodix/pipwerk\n'],
    ['a user name with a dot', 'https://github.com/mac.odix/pipwerk'],
    ['a missing repository name', 'https://github.com/macodix'],
    ['an empty text', ''],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['an object', { url: 'https://github.com/macodix/pipwerk' }],
  ])('rejects %s without an exception', (_name, value) => {
    expect(parseRepositoryUrl(value)).toBeNull();
  });
});
