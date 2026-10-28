import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { clickNode, closeSettings, elementNodes, menu, openSettings, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';

// E10: every field to type in or to choose from has a label for assistive technology (a text of its own, not the
// placeholder). The test goes through the interface in both languages: the strategy, every element and every object of
// "EMA-Trendfolge", the dialogs of "Öffnen" and "Einstellungen".

const FIELDS = 'input:not([type="hidden"]), textarea, select, [role="combobox"]';

/** The fields inside `root` without an accessible name. */
function unlabelled(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FIELDS))
    .filter((field) => {
      const label = field.getAttribute('aria-label')?.trim() ?? '';
      const labelled = (field.getAttribute('aria-labelledby') ?? '').trim() !== '';
      const wrapped = (field as HTMLInputElement).labels !== undefined && (field as HTMLInputElement).labels !== null && (field as HTMLInputElement).labels!.length > 0;
      return label === '' && !labelled && !wrapped;
    })
    .map((field) => `${field.tagName.toLowerCase()}[data-testid=${field.getAttribute('data-testid') ?? ''}]`);
}

async function openEma(language: 'Deutsch' | 'English') {
  const user = userEvent.setup();
  mockApi();
  renderWithProviders(<App />, 'de');
  await waitForReady();
  if (language === 'English') {
    await switchLanguage(user, 'English');
  }
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
  return user;
}

describe.each(['Deutsch', 'English'] as const)('every field has a label (E10), %s', (language) => {
  it('in the strategy, the library, the strip of the strategy parameters and every element', async () => {
    const user = await openEma(language);

    expect(unlabelled(document.body)).toEqual([]);
    // the properties view of the strategy
    await user.click(screen.getByTestId('status-pill'));
    await screen.findByTestId('sec-rules');
    expect(unlabelled(document.body)).toEqual([]);
    // every element and every object, one after the other
    const names = elementNodes().map((node) => node.dataset.nodeName ?? '');
    expect(names.length).toBeGreaterThan(5);
    for (const name of names) {
      const node = elementNodes().find((candidate) => candidate.dataset.nodeName === name) as HTMLElement;
      clickNode(node);
      await waitFor(() => {
        expect(screen.getByTestId('props-element')).toBeInTheDocument();
      });
      expect(unlabelled(screen.getByTestId('props-element')), name).toEqual([]);
    }
    // a strategy parameter in the strip
    await user.click(screen.getAllByTestId('param-chip')[0] as HTMLElement);
    expect(unlabelled(screen.getByTestId('param-popover'))).toEqual([]);
  });

  it('in the dialogs "Öffnen" and "Einstellungen"', async () => {
    const user = await openEma(language);

    expect(unlabelled(await openSettings(user))).toEqual([]);
    await closeSettings(user);
    await menu(user, 'open');
    expect(unlabelled(await screen.findByRole('dialog'))).toEqual([]);
  });
});
