/**
 * Access to records whose keys the user chooses (the bindings by parameter
 * name). Every key, `__proto__` included, is a field of its own: reading takes
 * only own fields, writing defines an own field and never touches the
 * prototype. A plain assignment `record[key] = value` does that for
 * `__proto__`, and a plain read finds the prototype instead of nothing.
 */

export function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/** The own field `key`, or `undefined`. */
export function getOwn<T>(record: Readonly<Record<string, T>> | null | undefined, key: string): T | undefined {
  if (record === null || record === undefined || !hasOwn(record, key)) {
    return undefined;
  }
  return record[key];
}

/** Defines the own field `key` on `record` (which the caller owns, usually a fresh copy). */
export function setOwn<R extends Record<string, unknown>>(record: R, key: string, value: R[string]): void {
  Object.defineProperty(record, key, { value, enumerable: true, writable: true, configurable: true });
}

/** Removes the own field `key` from `record` (which the caller owns). */
export function removeOwn(record: Record<string, unknown>, key: string): void {
  if (hasOwn(record, key)) {
    delete record[key];
  }
}
