import { vi } from 'vitest';

import { FakeApi, type FakeApiOptions } from './fakeApi';

/** Mocks `fetch` with a fake backend in memory (see `FakeApi`). A request the fake does not know fails like an unmocked call. */
export function mockApi(options: FakeApiOptions = {}): FakeApi {
  const fake = new FakeApi(options);
  vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();
    const body: unknown = init?.body !== undefined ? JSON.parse(String(init.body)) : undefined;
    const answer = fake.handle({ method, url, body });
    if (answer === undefined) {
      return Promise.reject(new Error(`Unmocked fetch call: ${method} ${url}`));
    }
    if (answer.status === 204) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(
      new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'Content-Type': 'application/json' } }),
    );
  });
  return fake;
}
