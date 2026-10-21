import { bindingKinds, dataTypes } from '../api/elementTypes';
import {
  expectArray,
  expectBoolean,
  expectNumber,
  expectRecord,
  expectString,
  isScalar,
  ResponseFormatError,
  type JsonRecord,
} from '../api/http';
import { setOwn } from './own';
import {
  STRATEGY_FORMAT,
  isConnectionValue,
  type Binding,
  type Bindings,
  type ConnectionDocument,
  type ElementDocument,
  type InputDocument,
  type InstanceDocument,
  type Orientation,
  type SectionDocument,
  type StrategyDocument,
  type StrategyParameter,
} from './types';

function parseBinding(value: unknown, what: string): Binding {
  const record = expectRecord(value, what);
  const kind = record.kind;
  if (typeof kind !== 'string' || !(bindingKinds as readonly string[]).includes(kind)) {
    throw new ResponseFormatError(`${what}.kind`);
  }
  if (record.value !== undefined && !isScalar(record.value) && !isConnectionValue(record.value)) {
    throw new ResponseFormatError(`${what}.value`);
  }
  return record as Binding;
}

function parseBindings(value: unknown, what: string): Bindings {
  if (value === undefined) {
    return {};
  }
  const record = expectRecord(value, what);
  const result: Bindings = {};
  for (const [key, item] of Object.entries(record)) {
    setOwn(result, key, parseBinding(item, `${what}.${key}`));
  }
  return result;
}

function parseDefinitions(value: unknown, what: string): void {
  for (const [index, item] of expectArray(value, what).entries()) {
    const record = expectRecord(item, `${what}[${index}]`);
    expectString(record.key, `${what}[${index}].key`);
    expectString(record.name, `${what}[${index}].name`);
    if (typeof record.datatype !== 'string' || !(dataTypes as readonly string[]).includes(record.datatype)) {
      throw new ResponseFormatError(`${what}[${index}].datatype`);
    }
  }
}

/** Checks an instance (of an element or a rule) and the instances inside it. The instance is kept as it is. */
function parseInstance(value: unknown, what: string): InstanceDocument {
  const record = expectRecord(value, what);
  expectString(record.name, `${what}.name`);
  expectString(record.key, `${what}.key`);
  expectString(record.object_type, `${what}.object_type`);
  if (record.parameter_values !== undefined) {
    parseBindings(record.parameter_values, `${what}.parameter_values`);
  }
  if (record.parameters !== undefined) {
    parseDefinitions(record.parameters, `${what}.parameters`);
  }
  if (record.properties !== undefined) {
    parseDefinitions(record.properties, `${what}.properties`);
  }
  for (const key of ['instances', 'rules'] as const) {
    if (record[key] !== undefined) {
      for (const [index, item] of expectArray(record[key], `${what}.${key}`).entries()) {
        parseInstance(item, `${what}.${key}[${index}]`);
      }
    }
  }
  return record as InstanceDocument;
}

function parseInstances(value: unknown, what: string): InstanceDocument[] {
  if (value === undefined) {
    return [];
  }
  return expectArray(value, what).map((item, index) => parseInstance(item, `${what}[${index}]`));
}

function parseInput(value: unknown, what: string): InputDocument {
  const record = expectRecord(value, what);
  expectString(record.instance, `${what}.instance`);
  expectString(record.property, `${what}.property`);
  return record as InputDocument;
}

function parseElement(value: unknown, what: string): ElementDocument {
  const record = expectRecord(value, what);
  const id = expectString(record.id, `${what}.id`);
  const type = expectString(record.type, `${what}.type`);
  const name = record.name;
  if (name !== undefined && name !== null && typeof name !== 'string') {
    throw new ResponseFormatError(`${what}.name`);
  }
  const key = record.key;
  if (key !== undefined && key !== null && typeof key !== 'string') {
    throw new ResponseFormatError(`${what}.key`);
  }
  const managementOf = record.management_of;
  if (managementOf !== undefined && managementOf !== null && typeof managementOf !== 'string') {
    throw new ResponseFormatError(`${what}.management_of`);
  }
  let position: ElementDocument['position'] = null;
  if (record.position !== undefined && record.position !== null) {
    const place = expectRecord(record.position, `${what}.position`);
    position = { x: expectNumber(place.x, `${what}.position.x`), y: expectNumber(place.y, `${what}.position.y`) };
  }
  const element: ElementDocument = {
    ...record,
    id,
    type,
    name: name === undefined ? null : name,
    key: key === undefined ? null : key,
    position,
    parameters: parseBindings(record.parameters, `${what}.parameters`),
    properties: parseBindings(record.properties, `${what}.properties`),
    inputs: record.inputs === undefined ? [] : expectArray(record.inputs, `${what}.inputs`).map((item, index) => parseInput(item, `${what}.inputs[${index}]`)),
    rules: parseInstances(record.rules, `${what}.rules`),
    management_of: managementOf === undefined ? null : managementOf,
  };
  if (record.instance !== undefined && record.instance !== null) {
    element.instance = parseInstance(record.instance, `${what}.instance`);
  }
  return element;
}

function parseConnection(value: unknown, what: string): ConnectionDocument {
  const record = expectRecord(value, what);
  expectString(record.id, `${what}.id`);
  expectString(record.source, `${what}.source`);
  expectString(record.output, `${what}.output`);
  expectString(record.target, `${what}.target`);
  return record as ConnectionDocument;
}

function parseSection(value: unknown, what: string): SectionDocument {
  const record = expectRecord(value, what);
  const flow = record.flow;
  if (flow !== undefined && flow !== null && typeof flow !== 'string') {
    throw new ResponseFormatError(`${what}.flow`);
  }
  return {
    ...record,
    id: expectString(record.id, `${what}.id`),
    name: expectString(record.name, `${what}.name`),
    flow: flow === undefined ? null : flow,
    elements: expectArray(record.elements, `${what}.elements`).map((item, index) => expectString(item, `${what}.elements[${index}]`)),
    collapsed: record.collapsed === undefined ? false : expectBoolean(record.collapsed, `${what}.collapsed`),
  };
}

function parseParameter(value: unknown, what: string): StrategyParameter {
  const record = expectRecord(value, what);
  expectString(record.key, `${what}.key`);
  expectString(record.name, `${what}.name`);
  if (typeof record.datatype !== 'string' || !(dataTypes as readonly string[]).includes(record.datatype)) {
    throw new ResponseFormatError(`${what}.datatype`);
  }
  if (record.value !== undefined && !isScalar(record.value)) {
    throw new ResponseFormatError(`${what}.value`);
  }
  return record as StrategyParameter;
}

/**
 * Checks a strategy document that the backend delivered before it is used and
 * returns it. Fields that are missing but have a default in the format are
 * filled; every other field stays as it is, including fields this interface
 * does not know.
 */
export function parseStrategyDocument(value: unknown): StrategyDocument {
  const record: JsonRecord = expectRecord(value, 'strategy document');
  if (record.format !== STRATEGY_FORMAT) {
    throw new ResponseFormatError('format');
  }
  const formatVersion = expectString(record.format_version, 'format_version');
  const parameters = record.parameters === undefined ? [] : expectArray(record.parameters, 'parameters');
  const elements = record.elements === undefined ? [] : expectArray(record.elements, 'elements');
  const connections = record.connections === undefined ? [] : expectArray(record.connections, 'connections');
  const sections = record.sections === undefined ? [] : expectArray(record.sections, 'sections');
  const orientation: Orientation = record.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  if (record.orientation !== undefined && record.orientation !== 'horizontal' && record.orientation !== 'vertical') {
    throw new ResponseFormatError('orientation');
  }
  const collapsed =
    record.collapsed_managements === undefined
      ? []
      : expectArray(record.collapsed_managements, 'collapsed_managements').map((item, index) =>
          expectString(item, `collapsed_managements[${index}]`),
        );
  return {
    ...record,
    format: STRATEGY_FORMAT,
    format_version: formatVersion,
    id: expectString(record.id, 'id'),
    name: expectString(record.name, 'name'),
    description: record.description === undefined ? '' : expectString(record.description, 'description'),
    parameters: parameters.map((item, index) => parseParameter(item, `parameters[${index}]`)),
    rules: parseInstances(record.rules, 'rules'),
    elements: elements.map((item, index) => parseElement(item, `elements[${index}]`)),
    connections: connections.map((item, index) => parseConnection(item, `connections[${index}]`)),
    sections: sections.map((item, index) => parseSection(item, `sections[${index}]`)),
    orientation,
    collapsed_managements: collapsed,
  };
}

/** The text that is compared to find out whether the document was changed. */
export function serializeDocument(document: StrategyDocument): string {
  return JSON.stringify(document);
}
