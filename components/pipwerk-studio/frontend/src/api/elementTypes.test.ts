import { describe, expect, it } from 'vitest';

import { labelText } from '../model/typeIndex';
import { testTypes } from '../testing/typeDescriptions';
import { parseElementTypes } from './elementTypes';

const template = { id: 'tpl-a', name: 'Risiko je Trade', description: 'Beschreibung', object_type: 'Regel' };

describe('the delivered templates in the answer of the element types (order 07, B2)', () => {
  it('take name and explanation in both languages from template_texts', () => {
    const answer = parseElementTypes({
      types: [],
      templates: [template],
      template_texts: [
        {
          id: 'tpl-a',
          name: { de: 'Risiko je Trade', en: 'Risk per trade' },
          explanation: { de: 'Begrenzt den Verlust.', en: 'Limits the loss.' },
          group: 'rules',
        },
      ],
      functions: [],
    });

    const parsed = answer.templates[0];
    expect(parsed?.name).toBe('Risiko je Trade');
    expect(labelText(parsed?.label ?? { de: '', en: '' }, 'de')).toBe('Risiko je Trade');
    expect(labelText(parsed?.label ?? { de: '', en: '' }, 'en')).toBe('Risk per trade');
    expect(parsed?.explanation).toEqual({ de: 'Begrenzt den Verlust.', en: 'Limits the loss.' });
  });

  it('keep the description of the document if the answer holds no texts for the template', () => {
    const answer = parseElementTypes({ types: [], templates: [template], functions: [] });

    expect(answer.templates[0]?.label).toEqual({ de: 'Risiko je Trade', en: 'Risiko je Trade' });
    expect(answer.templates[0]?.explanation).toEqual({ de: 'Beschreibung', en: 'Beschreibung' });
  });

  it('are shown with the English texts for the template of the product', () => {
    const delivered = testTypes().templates[0];

    expect(labelText(delivered?.label ?? { de: '', en: '' }, 'en')).toBe('Risk per trade');
    expect(labelText(delivered?.explanation ?? { de: '', en: '' }, 'en')).toMatch(/^Limits the loss/);
    expect(labelText(delivered?.explanation ?? { de: '', en: '' }, 'de')).toMatch(/^Begrenzt den Verlust/);
  });
});
