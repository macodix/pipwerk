import type { ElementTypesResponse } from '../api/elementTypes';
import type { ExpressionNames, Finding, ObjectListEntry } from '../api/objects';
import type { StrategyDocument } from '../document/types';
import { mockFetchRoutes, type RecordedCall, type RouteResponse } from '../test-utils';

/**
 * A backend in memory for the tests of the whole application: the Web API
 * for strategies, templates, the check and the object directory. Tests give the
 * answers they need (`fail`, `findings`, `expressions`) and read what was sent
 * (`calls`).
 */

export type MockBackendOptions = {
  strategies?: StrategyDocument[];
  /** Entries in the list that cannot be read, by identifier. */
  unreadable?: string[];
  /** Stored templates by kind: the entries of the list and their documents. */
  templates?: Partial<Record<'indicators' | 'trends' | 'rules' | 'rulesets', Record<string, unknown>[]>>;
  /** What the check and the save report. */
  findings?: Finding[] | ((document: StrategyDocument) => Finding[]);
  /** The names the check recognizes. */
  expressions?: ExpressionNames[] | ((document: StrategyDocument) => ExpressionNames[]);
  /** Makes a kind of request fail with this answer. */
  fail?: Partial<
    Record<
      'list' | 'read' | 'create' | 'replace' | 'delete' | 'check' | 'template' | 'directoryRead' | 'directoryWrite',
      RouteResponse
    >
  >;
  directory?: { path: string | null; is_default: boolean };
  /** The answer to a write of the directory; by default the new directory. */
  onDirectoryWrite?: (body: { path: string; move: boolean }) => RouteResponse;
  elementTypes?: ElementTypesResponse | Record<string, unknown>;
  language?: 'de' | 'en';
  revision?: RouteResponse;
};

export type MockBackend = {
  calls: RecordedCall[];
  /** The strategies the backend holds, by identifier. */
  strategies: Map<string, StrategyDocument>;
  /** The requests of a method on a path pattern, for assertions. */
  requests: (method: string, pattern: RegExp) => RecordedCall[];
};

const ART = '(strategies|indicators|trends|rules|rulesets)';

export function mockBackend(options: MockBackendOptions = {}): MockBackend {
  const strategies = new Map<string, StrategyDocument>((options.strategies ?? []).map((document) => [document.id, document]));
  let counter = 0;
  const unreadable = new Set(options.unreadable ?? []);

  function findingsFor(document: StrategyDocument): Finding[] {
    return typeof options.findings === 'function' ? options.findings(document) : (options.findings ?? []);
  }

  const { calls } = mockFetchRoutes({
    elementTypes: options.elementTypes === undefined ? undefined : { status: 200, body: options.elementTypes },
    getLanguage: { status: 200, body: { language: options.language ?? 'de' } },
    revision: options.revision,
    extra: (call) => {
      const { method, url } = call;
      const list = new RegExp(`^/api/v1/${ART}$`).exec(url);
      const item = new RegExp(`^/api/v1/${ART}/([^/]+)$`).exec(url);

      if (list !== null && method === 'GET') {
        if (options.fail?.list !== undefined) {
          return options.fail.list;
        }
        if (list[1] === 'strategies') {
          const items: ObjectListEntry[] = [
            ...Array.from(strategies.values(), (document) => ({
              id: document.id,
              title: document.title,
              description: document.description,
              objectType: null,
              modified: '2026-10-17T10:45:00Z',
              unreadable: false,
            })),
            ...Array.from(unreadable, (id) => ({
              id,
              title: null,
              description: null,
              objectType: null,
              modified: '2026-10-16T08:00:00Z',
              unreadable: true,
            })),
          ];
          return {
            status: 200,
            body: {
              items: items.map((entry) => ({
                id: entry.id,
                title: entry.title,
                description: entry.description,
                object_type: entry.objectType,
                modified: entry.modified,
                unreadable: entry.unreadable,
              })),
            },
          };
        }
        const art = list[1] as 'indicators' | 'trends' | 'rules' | 'rulesets';
        const documents = options.templates?.[art] ?? [];
        return {
          status: 200,
          body: {
            items: documents.map((document) => ({
              id: document.id,
              title: document.title,
              description: document.description ?? '',
              object_type: document.object_type,
              modified: '2026-10-17T10:45:00Z',
              unreadable: false,
            })),
          },
        };
      }

      if (list !== null && list[1] === 'strategies' && method === 'POST') {
        if (options.fail?.create !== undefined) {
          return options.fail.create;
        }
        counter += 1;
        const document = { ...(call.body as StrategyDocument), id: `00000000-0000-4000-8000-00000000000${counter}` };
        strategies.set(document.id, document);
        return { status: 201, body: { id: document.id, document, findings: findingsFor(document) } };
      }

      if (item !== null && item[1] === 'strategies') {
        const id = decodeURIComponent(item[2] ?? '');
        if (method === 'GET') {
          if (options.fail?.read !== undefined) {
            return options.fail.read;
          }
          const document = strategies.get(id);
          return document === undefined ? { status: 404, body: { detail: 'The object does not exist.' } } : { status: 200, body: document };
        }
        if (method === 'PUT') {
          if (options.fail?.replace !== undefined) {
            return options.fail.replace;
          }
          const document = call.body as StrategyDocument;
          strategies.set(id, document);
          return { status: 200, body: { id, document, findings: findingsFor(document) } };
        }
        if (method === 'DELETE') {
          if (options.fail?.delete !== undefined) {
            return options.fail.delete;
          }
          strategies.delete(id);
          return { status: 204, body: null };
        }
      }

      if (item !== null && item[1] !== 'strategies' && method === 'GET') {
        if (options.fail?.template !== undefined) {
          return options.fail.template;
        }
        const art = item[1] as 'indicators' | 'trends' | 'rules' | 'rulesets';
        const document = options.templates?.[art]?.find((candidate) => candidate.id === decodeURIComponent(item[2] ?? ''));
        return document === undefined ? { status: 404, body: { detail: 'The object does not exist.' } } : { status: 200, body: document };
      }

      if (url === '/api/v1/check' && method === 'POST') {
        if (options.fail?.check !== undefined) {
          return options.fail.check;
        }
        const document = call.body as StrategyDocument;
        const expressions =
          typeof options.expressions === 'function' ? options.expressions(document) : (options.expressions ?? []);
        return { status: 200, body: { findings: findingsFor(document), expressions, names_truncated: false } };
      }

      if (url === '/api/studio/settings/object-directory') {
        if (method === 'GET') {
          return (
            options.fail?.directoryRead ?? {
              status: 200,
              body: options.directory ?? { path: '/var/objects', is_default: true },
            }
          );
        }
        if (method === 'PUT') {
          const body = call.body as { path: string; move: boolean };
          return (
            options.fail?.directoryWrite ??
            options.onDirectoryWrite?.(body) ?? { status: 200, body: { path: body.path, is_default: false } }
          );
        }
      }
      return undefined;
    },
  });

  return {
    calls,
    strategies,
    requests: (method, pattern) => calls.filter((call) => call.method === method && pattern.test(call.url)),
  };
}
