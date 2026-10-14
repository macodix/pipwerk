import { describe, expect, it } from 'vitest';

import { buildRevision, parseBuildRevision } from './buildRevision';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const VALID = { commit: COMMIT, committedAt: '2026-10-09T14:52:03+02:00' };

describe('parseBuildRevision', () => {
  it('accepts a valid value', () => {
    expect(parseBuildRevision(VALID)).toEqual(VALID);
  });

  it.each([
    ['null', null],
    ['undefined (no value set by the build)', undefined],
    ['a text', 'abc'],
    ['an array', [COMMIT, '2026-10-09T14:52:03+02:00']],
    ['a field missing: committedAt', { commit: COMMIT }],
    ['a field missing: commit', { committedAt: VALID.committedAt }],
    ['an additional field', { ...VALID, extra: 1 }],
    ['a commit that is too short', { ...VALID, commit: COMMIT.slice(1) }],
    ['a commit that is too long', { ...VALID, commit: `${COMMIT}0` }],
    ['a commit with capital letters', { ...VALID, commit: COMMIT.toUpperCase() }],
    ['a commit with other characters', { ...VALID, commit: `${COMMIT.slice(1)}g` }],
    ['a commit that is no text', { ...VALID, commit: 123 }],
    ['a date that is null', { ...VALID, committedAt: null }],
    ['a date that is no text', { ...VALID, committedAt: 20261009 }],
    ['a date without time zone', { ...VALID, committedAt: '2026-10-09T14:52:03' }],
    ['an impossible date', { ...VALID, committedAt: '2026-02-31T14:52:03+02:00' }],
  ])('rejects %s', (_name, value) => {
    expect(parseBuildRevision(value)).toBeNull();
  });

  it('rejects a commit without a date', () => {
    expect(parseBuildRevision({ commit: COMMIT, committedAt: null })).toBeNull();
  });
});

describe('buildRevision', () => {
  it('is null or a checked value', () => {
    expect(buildRevision === null || parseBuildRevision(buildRevision) !== null).toBe(true);
  });
});
