import { describe, expect, it } from 'vitest';

import { newUuid } from './ids';

describe('newUuid', () => {
  it('is a UUID of version 4 in lower case, and different each time', () => {
    const first = newUuid();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newUuid()).not.toBe(first);
  });
});
