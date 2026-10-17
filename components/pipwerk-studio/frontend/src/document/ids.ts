/**
 * A random UUID (version 4) in lower case. `crypto.randomUUID()` exists only in
 * secure contexts, and the user interface is also reached by address over the
 * network, so the identifier is built from `crypto.getRandomValues()`.
 */
export function newUuid(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * Builds an identifier from a name by the rule of the specification (3.1):
 * lower case, ä, ö, ü as ae, oe, ue, ß as ss, space and hyphen as `_`, other
 * characters dropped. A result that is empty or starts with a digit gets the
 * prefix `n_`, so that it is a valid name in an expression.
 */
export function identifierFromName(name: string): string {
  let result = '';
  for (const character of name.toLowerCase()) {
    if (character in UMLAUTS) {
      result += UMLAUTS[character];
    } else if (character === ' ' || character === '-' || character === '_') {
      result += '_';
    } else if (/^[a-z0-9]$/.test(character)) {
      result += character;
    }
  }
  if (result === '' || /^[0-9]/.test(result)) {
    result = `n_${result}`;
  }
  return result;
}

/** A name that is not in `taken` (compared without regard to case): `base`, then `base1`, `base2`, … */
export function uniqueName(base: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (name) => name.toLowerCase()));
  if (!used.has(base.toLowerCase())) {
    return base;
  }
  for (let counter = 1; ; counter += 1) {
    const candidate = `${base}${counter}`;
    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

/** Whether a text is a valid name of an instance, element or rule: ASCII letters, digits and `_`, starting with a letter or `_`. */
export function isValidName(text: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text);
}
