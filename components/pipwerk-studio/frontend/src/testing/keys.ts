const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * Forms the identifier in expressions from a name by the rule of the specification (3.1), as the backend does it:
 * lower case, ä, ö, ü as ae, oe, ue, ß as ss, space and hyphen as `_`, other characters dropped. A result that is empty
 * or starts with a digit gets the prefix `n_`. The user interface never forms an identifier itself (it asks the
 * backend, E2); only the fake backend of the tests does.
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
