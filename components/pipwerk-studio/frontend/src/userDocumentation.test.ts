import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import de from './locales/de.json';
import { loadTestcaseRaw, realTypes } from './testing/fixtures';

/**
 * The user documentation (`docs/user/pipwerk-studio.md`) against the test case documents and the
 * texts of the interface. The guide for each test case (sections 9 and 10) shows every expression
 * that the user types in a box of the kind `ausdruck`; the boxes must be the expressions of the test
 * case document, in the order of its elements. Names, titles, values and connections must stand in
 * the guide as well. Section 8 must name every finding with the text of the interface.
 */

const guide = readFileSync(resolve(import.meta.dirname, '../../../../docs/user/pipwerk-studio.md'), 'utf-8');

type Binding = { kind: string; value?: unknown };
type Instance = {
  name: string;
  origin?: { template_id?: string | null };
  parameter_values?: Record<string, Binding>;
  expression?: string | null;
};
type Element = {
  id: string;
  type: string;
  title: string;
  name: string | null;
  parameters: Record<string, Binding>;
  properties: Record<string, Binding>;
  rules: Instance[];
  instance: Instance | null;
};
type Testcase = {
  title: string;
  description: string;
  parameters: { name: string; datatype: string; value: unknown }[];
  rules: Instance[];
  elements: Element[];
  connections: { source: string; output: string; target: string }[];
};

function testcase(name: 'str-01' | 'str-03'): Testcase {
  return loadTestcaseRaw(name) as Testcase;
}

/** The text of the section of the guide that starts with the heading `## <number>. …`. */
function section(text: string, number: number): string {
  const start = text.indexOf(`\n## ${number}. `);
  expect(start, `section ${number}`).toBeGreaterThanOrEqual(0);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
}

/** The boxes of the kind `ausdruck` of a section, in the order of the guide. */
function expressionBoxes(text: string): string[] {
  return [...text.matchAll(/^[ \t]*```ausdruck\n([\s\S]*?)\n[ \t]*```/gm)].map((match) =>
    (match[1] ?? '')
      .split('\n')
      .map((line) => line.trim())
      .join('\n'),
  );
}

/** The expressions that the user types for a test case: those of the bindings and of the rules that are not copies of a template. */
function typedExpressions(document: Testcase): string[] {
  const found: string[] = [];
  const own = (rule: Instance): boolean => rule.origin?.template_id === null || rule.origin?.template_id === undefined;
  for (const rule of document.rules) {
    if (own(rule) && typeof rule.expression === 'string' && rule.expression !== '') {
      found.push(rule.expression);
    }
  }
  for (const element of document.elements) {
    const bindings = [
      ...Object.values(element.instance === null ? element.parameters : (element.instance.parameter_values ?? {})),
      ...Object.values(element.properties),
    ];
    for (const binding of bindings) {
      if (binding.kind === 'expression') {
        found.push(String(binding.value));
      }
    }
    for (const rule of element.rules) {
      if (own(rule) && typeof rule.expression === 'string') {
        found.push(rule.expression);
      }
    }
  }
  return found;
}

/** German labels of the values of all choices of the real type descriptions, by identifier. */
const choiceLabels = new Map<string, string>();
for (const type of realTypes.list) {
  for (const row of [...type.parameters, ...type.properties]) {
    for (const choice of row.choices) {
      if (!choiceLabels.has(choice.id)) {
        choiceLabels.set(choice.id, choice.label.de);
      }
    }
  }
}

const outputLabels = new Map<string, string>();
for (const type of realTypes.list) {
  for (const output of type.outputs) {
    outputLabels.set(output.id, output.label.de);
  }
}

function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * What the guide of a test case has to name and does not: titles, names, parameters, values and
 * connections of the test case document, besides the expressions (those are compared as a list).
 */
function missingInGuide(text: string, document: Testcase): string[] {
  const missing: string[] = [];
  const code = (value: string): void => {
    if (!text.includes(`\`${value}\``)) {
      missing.push(`\`${value}\``);
    }
  };
  code(document.title);
  code(document.description);
  for (const parameter of document.parameters) {
    code(parameter.name);
    const label = choiceLabels.get(String(parameter.value));
    code(parameter.datatype === 'time_unit' && label !== undefined ? label : String(parameter.value));
  }
  const rules = (list: Instance[]): void => {
    for (const rule of list) {
      code(rule.name);
    }
  };
  rules(document.rules);
  for (const element of document.elements) {
    code(element.title);
    if (element.name !== null) {
      code(element.name);
    }
    if (element.instance !== null) {
      code(element.instance.name);
    }
    const bindings = [
      ...Object.values(element.instance === null ? element.parameters : (element.instance.parameter_values ?? {})),
      ...Object.values(element.properties),
    ];
    for (const binding of bindings) {
      if (binding.kind === 'parameter') {
        code(String(binding.value));
      } else if (binding.kind === 'fixed') {
        const label = choiceLabels.get(String(binding.value));
        if (label !== undefined) {
          if (!text.includes(label)) {
            missing.push(label);
          }
        } else {
          code(String(binding.value));
        }
      }
    }
    rules(element.rules);
  }

  // A row of a table of connections: `Von` ("Ausgang") | `Nach`.
  const rows = text.split('\n').filter((line) => /^\| `.+` \(„.+“\)/.test(line));
  if (rows.length !== document.connections.length) {
    missing.push(`${document.connections.length} rows of connections, found ${rows.length}`);
  }
  const titleOf = new Map(document.elements.map((element) => [element.id, element.title]));
  for (const connection of document.connections) {
    const source = titleOf.get(connection.source) ?? '';
    const target = titleOf.get(connection.target) ?? '';
    const output = outputLabels.get(connection.output) ?? connection.output;
    const pattern = new RegExp(`^\\| \`${escaped(source)}\` \\(„${escaped(output)}“\\)[^|]*\\| [^|]*\`${escaped(target)}\``);
    if (!rows.some((row) => pattern.test(row))) {
      missing.push(`connection ${source} (${output}) -> ${target}`);
    }
  }
  return missing;
}

describe.each([
  ['str-03', 9],
  ['str-01', 10],
] as const)('the guide for the test case %s (section %i)', (name, number) => {
  const document = testcase(name);
  const text = section(guide, number);

  it('is the section of that test case', () => {
    expect(text).toContain(`\`${name}\``);
    expect(text).toContain(document.title);
  });

  it('shows exactly the expressions of the test case document, in the order of its elements', () => {
    const boxes = expressionBoxes(text);

    expect(boxes.length).toBeGreaterThan(5);
    expect(boxes).toEqual(typedExpressions(document));
  });

  it('names every title, name, parameter, value and connection of the test case document', () => {
    expect(missingInGuide(text, document)).toEqual([]);
  });

  it('counter test: a changed character in an expression, a missing box, a missing title and a missing connection are found', () => {
    const [first] = typedExpressions(document);
    expect(first).toBeDefined();
    const changed = text.replace(first as string, `${(first as string).slice(0, -1)}X`);
    expect(expressionBoxes(changed)).not.toEqual(typedExpressions(document));

    const withoutBox = text.replace(/^[ \t]*```ausdruck\n[\s\S]*?\n[ \t]*```/m, '');
    expect(expressionBoxes(withoutBox)).not.toEqual(typedExpressions(document));

    const element = document.elements.find((candidate) => candidate.instance === null && candidate.name === null)!;
    expect(missingInGuide(text.replaceAll(`\`${element.title}\``, 'x'), document)).not.toEqual([]);

    const row = text.split('\n').find((line) => /^\| `.+` \(„.+“\)/.test(line))!;
    expect(missingInGuide(text.replace(`${row}\n`, ''), document)).not.toEqual([]);
  });
});

describe('section 8 of the guide: the findings', () => {
  const text = section(guide, 8);
  const findings = de.findings as Record<string, unknown>;
  const notCodes = new Set([
    'title',
    'ofStrategy',
    'ofElement',
    'ofRule',
    'level',
    'count_one',
    'count_other',
    'countDetail',
    'unknown',
    'fields',
    'issues',
    'syntax',
    'connectionReasons',
    'bindingReasons',
    'resultReasons',
    'referenceKinds',
  ]);

  /** The static pieces of a text with `{{…}}` places, long enough to be found. */
  function pieces(template: string): string[] {
    return template
      .split(/\{\{[^}]+\}\}/)
      .map((piece) => piece.trim())
      .filter((piece) => piece.length >= 4);
  }

  function leaves(value: unknown): string[] {
    if (typeof value === 'string') {
      return [value];
    }
    return typeof value === 'object' && value !== null ? Object.values(value).flatMap(leaves) : [];
  }

  const codes = Object.entries(findings)
    .filter(([key, value]) => !notCodes.has(key) && typeof value === 'object')
    .flatMap(([group, value]) => Object.keys(value as Record<string, unknown>).map((leaf) => `${group}.${leaf}`));

  it('has the codes it expects', () => {
    expect(codes).toContain('flow.no_incoming');
    expect(codes).toContain('candle.no_instance');
    expect(codes).not.toContain('strategy.no_trigger');
    expect(codes.length).toBeGreaterThan(20);
  });

  it.each(codes)('names the finding %s with its text of the interface', (code) => {
    expect(text).toContain(`\`${code}\``);
    const template = code.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], findings);
    expect(typeof template).toBe('string');
    const missing = pieces(template as string).filter((piece) => !text.includes(piece));
    expect(missing).toEqual([]);
  });

  it('names the problems, reasons and kinds of reference with their texts of the interface', () => {
    const wanted = [
      findings.issues,
      findings.syntax,
      findings.connectionReasons,
      findings.bindingReasons,
      findings.resultReasons,
      findings.referenceKinds,
    ].flatMap(leaves);
    const missing = wanted.flatMap(pieces).filter((piece) => !text.includes(piece));

    expect(missing).toEqual([]);
  });

  it('names no finding that the library no longer reports', () => {
    expect(text).not.toContain('strategy.no_trigger');
  });

  it('counter test: a text of the interface that the section does not contain is found', () => {
    const changed = text.replace('Zu diesem Element des Ablaufs führt keine Verbindung.', 'Anderer Text.');
    const template = (findings.flow as Record<string, string>).no_incoming!;

    expect(pieces(template).filter((piece) => !changed.includes(piece))).toEqual([template]);
  });
});
