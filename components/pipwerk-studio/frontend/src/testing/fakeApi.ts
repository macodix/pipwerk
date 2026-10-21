import { emaTrendfolge } from './emaTrendfolge';
import { identifierFromName } from './keys';
import { typeDescriptionsJson } from './typeDescriptions';

/**
 * A backend in memory for the tests of the interface: the Web API of specification 4.2 (type descriptions, lists,
 * strategies, check, identifiers, expressions) and the internal endpoints of the settings. It does what the interface
 * needs to be tested without the real backend; it does not parse expressions and checks only a few things. The browser
 * tests use it where the real backend of the branch does not speak format 2.0 yet; every test that runs against it says so.
 */

export type FakeCall = { method: string; url: string; body: unknown };
export type FakeResponse = { status: number; body: unknown };

type Json = Record<string, unknown>;

export type FakeFinding = { level: 'error' | 'hint'; code: string; element: string | null; subject: string | null; details: Record<string, unknown> };

export type FakeApiOptions = {
  /** The type descriptions the backend delivers; by default the ones of the product. */
  types?: Json;
  /** Strategies the backend holds at the start. By default "EMA-Trendfolge". */
  strategies?: Json[];
  /** Identifiers of files in the list that cannot be read. */
  unreadable?: string[];
  /** Stored templates by kind. */
  templates?: Partial<Record<'indicators' | 'trends' | 'rules' | 'rulesets', Json[]>>;
  language?: 'de' | 'en';
  directory?: { path: string | null; is_default: boolean };
  /** The findings a check reports; by default a small check (see `check`). */
  findings?: (document: Json) => FakeFinding[];
  /** Makes a kind of request fail with this answer. */
  fail?: Partial<Record<string, FakeResponse>>;
  /** Directories that already hold a file of the same name: moving there fails with a conflict. */
  conflictDirectories?: string[];
};

const ART = '(strategies|indicators|trends|rules|rulesets)';

function asRecord(value: unknown): Json {
  return typeof value === 'object' && value !== null ? (value as Json) : {};
}

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value as Json[]) : [];
}

/** A small check in the manner of the backend: a trigger without a connection, a step without an incoming connection. */
function check(document: Json, types: Map<string, Json>): FakeFinding[] {
  const found: FakeFinding[] = [];
  const elements = asArray(document.elements);
  const connections = asArray(document.connections);
  const hasTrigger = elements.some((element) => types.get(String(element.type))?.kind === 'trigger' && element.management_of === null);
  for (const element of elements) {
    const type = types.get(String(element.type));
    const id = String(element.id);
    if (type === undefined) {
      found.push({ level: 'error', code: 'type.unknown', element: id, subject: null, details: { kind: 'element', type: element.type } });
      continue;
    }
    if (type.kind === 'trigger' && !connections.some((connection) => connection.source === id)) {
      found.push({ level: 'error', code: 'trigger.unconnected', element: id, subject: null, details: {} });
    }
    if (type.kind === 'flow') {
      const incoming = connections.some((connection) => connection.target === id);
      if (!incoming) {
        found.push({ level: 'error', code: 'flow.not_reached', element: id, subject: null, details: {} });
      }
    }
  }
  if (elements.length > 0 && !hasTrigger) {
    found.push({ level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} });
  }
  return found;
}

/** The name nodes of the blocks of an expression: every `a.b` of the text, in lower case. */
function blocksOf(text: string): Json | null {
  if (text.trim() === '') {
    return { kind: 'empty' };
  }
  const children: Json[] = [];
  for (const match of text.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    children.push({ kind: 'name', path: [String(match[1]).toLowerCase(), String(match[2]).toLowerCase()] });
  }
  return { kind: 'function', function: 'IF', children };
}

export class FakeApi {
  readonly calls: FakeCall[] = [];
  readonly strategies = new Map<string, Json>();
  readonly types: Json;
  private readonly typeById = new Map<string, Json>();
  private language: 'de' | 'en';
  private directory: { path: string | null; is_default: boolean };
  private created = 0;

  constructor(private readonly options: FakeApiOptions = {}) {
    this.types = options.types ?? typeDescriptionsJson();
    for (const type of asArray(this.types.types)) {
      this.typeById.set(String(type.id), type);
    }
    for (const document of options.strategies ?? [emaTrendfolge()]) {
      this.strategies.set(String(document.id), document);
    }
    this.language = options.language ?? 'de';
    this.directory = options.directory ?? { path: '/var/objects', is_default: true };
  }

  /** The requests of a method whose path matches. */
  requests(method: string, pattern: RegExp): FakeCall[] {
    return this.calls.filter((call) => call.method === method && pattern.test(call.url));
  }

  private findings(document: Json): FakeFinding[] {
    return this.options.findings === undefined ? check(document, this.typeById) : this.options.findings(document);
  }

  /** Answers a request, or `undefined` if the fake does not know the path. */
  handle(call: FakeCall): FakeResponse | undefined {
    this.calls.push(call);
    const { method } = call;
    const url = call.url.split('?')[0] ?? call.url;
    const fail = (kind: string): FakeResponse | undefined => this.options.fail?.[kind];
    const body = asRecord(call.body);

    if (url === '/api/health') {
      return { status: 200, body: { status: 'ok' } };
    }
    if (url === '/api/studio/revision') {
      return { status: 200, body: { revision: null, commit: null, committed_at: null } };
    }
    if (url === '/api/studio/settings/language') {
      if (method === 'PUT') {
        this.language = body.language === 'en' ? 'en' : 'de';
      }
      return { status: 200, body: { language: this.language } };
    }
    if (url === '/api/studio/settings/object-directory') {
      if (method === 'GET') {
        return fail('directoryRead') ?? { status: 200, body: this.directory };
      }
      if (method === 'PUT') {
        const forced = fail('directoryWrite');
        if (forced !== undefined) {
          return forced;
        }
        const path = String(body.path ?? '');
        if (!path.startsWith('/')) {
          return { status: 422, body: { detail: 'The object directory must be absolute.', code: 'object_directory.not_absolute', params: {} } };
        }
        if (body.move === true && (this.options.conflictDirectories ?? []).includes(path)) {
          return { status: 409, body: { detail: 'A file of the same name exists.', code: 'object_directory.conflict', params: {} } };
        }
        this.directory = { path, is_default: false };
        return { status: 200, body: this.directory };
      }
    }
    if (url === '/api/v1/element-types' && method === 'GET') {
      return fail('types') ?? { status: 200, body: this.types };
    }

    const list = new RegExp(`^/api/v1/${ART}$`).exec(url);
    const item = new RegExp(`^/api/v1/${ART}/([^/]+)$`).exec(url);
    if (list !== null && method === 'GET') {
      const forced = fail('list');
      if (forced !== undefined) {
        return forced;
      }
      if (list[1] === 'strategies') {
        const items = [
          ...Array.from(this.strategies.values(), (document) => ({
            id: document.id,
            name: document.name,
            description: document.description,
            object_type: null,
            modified: '2026-10-17T10:45:00Z',
            unreadable: false,
          })),
          ...(this.options.unreadable ?? []).map((id) => ({ id, name: null, description: null, object_type: null, modified: '2026-10-16T08:00:00Z', unreadable: true })),
        ];
        return { status: 200, body: { items } };
      }
      const documents = this.options.templates?.[list[1] as 'indicators' | 'trends' | 'rules' | 'rulesets'] ?? [];
      return {
        status: 200,
        body: {
          items: documents.map((document) => ({
            id: document.id,
            name: document.name,
            description: document.description ?? '',
            object_type: document.object_type,
            modified: '2026-10-17T10:45:00Z',
            unreadable: false,
          })),
        },
      };
    }
    if (list !== null && list[1] === 'strategies' && method === 'POST') {
      const forced = fail('create');
      if (forced !== undefined) {
        return forced;
      }
      this.created += 1;
      const document = { ...body, id: typeof body.id === 'string' ? body.id : `00000000-0000-4000-9000-${String(this.created).padStart(12, '0')}` };
      this.strategies.set(String(document.id), document);
      return { status: 201, body: { id: document.id, document, findings: this.findings(document) } };
    }
    if (item !== null && item[1] === 'strategies') {
      const id = decodeURIComponent(item[2] ?? '');
      if (method === 'GET') {
        const forced = fail('read');
        if (forced !== undefined) {
          return forced;
        }
        const document = this.strategies.get(id);
        return document === undefined ? { status: 404, body: { detail: 'The object does not exist.', code: 'object.not_found', params: {} } } : { status: 200, body: document };
      }
      if (method === 'PUT') {
        const forced = fail('replace');
        if (forced !== undefined) {
          return forced;
        }
        this.strategies.set(id, body);
        return { status: 200, body: { id, document: body, findings: this.findings(body) } };
      }
      if (method === 'DELETE') {
        const forced = fail('delete');
        if (forced !== undefined) {
          return forced;
        }
        this.strategies.delete(id);
        return { status: 204, body: undefined };
      }
    }
    if (item !== null && method === 'GET') {
      const documents = this.options.templates?.[item[1] as 'indicators' | 'trends' | 'rules' | 'rulesets'] ?? [];
      const document = documents.find((candidate) => candidate.id === decodeURIComponent(item[2] ?? ''));
      return document === undefined ? { status: 404, body: { detail: 'The object does not exist.', code: 'object.not_found', params: {} } } : { status: 200, body: document };
    }
    if (url === '/api/v1/check' && method === 'POST') {
      return fail('check') ?? { status: 200, body: { findings: this.findings(body) } };
    }
    if (url === '/api/v1/keys' && method === 'POST') {
      const document = asRecord(body.document);
      const taken = new Set<string>();
      const collect = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(collect);
        } else if (typeof value === 'object' && value !== null) {
          const record = value as Json;
          if (typeof record.key === 'string') {
            taken.add(record.key.toLowerCase());
          }
          Object.values(record).forEach(collect);
        }
      };
      collect(document);
      const base = identifierFromName(String(body.name ?? ''));
      let key = base;
      for (let counter = 2; taken.has(key.toLowerCase()); counter += 1) {
        key = `${base}_${counter}`;
      }
      return { status: 200, body: { key } };
    }
    if (url === '/api/v1/expressions' && method === 'POST') {
      const items = asArray(body.items).map((entry) => {
        const stored = String(entry.stored ?? entry.display ?? '');
        return { stored, display: stored, sentence: stored, blocks: blocksOf(stored), tokens: [], findings: [], names: [] };
      });
      return { status: 200, body: { items } };
    }
    return undefined;
  }
}
