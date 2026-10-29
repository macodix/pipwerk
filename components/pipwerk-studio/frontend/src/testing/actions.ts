import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

/** Waits until the type descriptions are loaded, which enables "New strategy". */
export async function waitForReady(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId('menu-new')).toBeEnabled();
  });
}

/** Presses an entry of the menu (the full menu is in the document at every width: styles do not apply in the tests). */
export async function menu(user: UserEvent, id: 'new' | 'open' | 'save' | 'check' | 'close' | 'delete' | 'settings'): Promise<void> {
  await user.click(screen.getByTestId(`menu-${id}`));
}

/** Opens the list of choices of a field with a click and returns the list. */
export async function openChoices(user: UserEvent, field: HTMLElement): Promise<HTMLElement> {
  await user.click(field);
  return screen.findByRole('listbox');
}

/** The texts of the entries a field offers: opens its list, reads it and closes it again with Escape. */
export async function offeredChoices(user: UserEvent, field: HTMLElement): Promise<string[]> {
  const list = await openChoices(user, field);
  const texts = within(list).getAllByRole('option').map((option) => option.textContent ?? '');
  await user.keyboard('{Escape}');
  return texts;
}

/** The groups a field offers with the texts of their entries: opens its list, reads it and closes it again with Escape. */
export async function offeredGroups(user: UserEvent, field: HTMLElement): Promise<{ label: string | null; options: string[] }[]> {
  const groups = choiceGroups(await openChoices(user, field));
  await user.keyboard('{Escape}');
  return groups;
}

/** The groups of an open list of choices with the texts of their entries; entries before the first group have the label `null`. */
export function choiceGroups(list: HTMLElement): { label: string | null; options: string[] }[] {
  const groups: { label: string | null; options: string[] }[] = [];
  for (const child of Array.from(list.children)) {
    if (child.classList.contains('select-group')) {
      groups.push({ label: child.textContent, options: [] });
    } else {
      if (groups.length === 0) {
        groups.push({ label: null, options: [] });
      }
      groups[groups.length - 1]?.options.push(child.textContent ?? '');
    }
  }
  return groups;
}

/**
 * Chooses an entry of a list of choices of the interface (the field that opens a list, specification 5.1): opens the list
 * with a click and clicks the entry whose text is `wanted`, or, failing that, whose value is `wanted`. Of several entries
 * with the same text the first one is taken.
 */
export async function choose(user: UserEvent, field: HTMLElement, wanted: string | RegExp): Promise<void> {
  const list = await openChoices(user, field);
  const options = within(list).getAllByRole('option');
  const byText = options.find((option) => (typeof wanted === 'string' ? option.textContent === wanted : wanted.test(option.textContent ?? '')));
  const entry = byText ?? options.find((option) => typeof wanted === 'string' && option.dataset.value === wanted);
  if (entry === undefined) {
    throw new Error(`The list has no entry ${String(wanted)}: ${options.map((option) => option.textContent).join(' | ')}`);
  }
  await user.click(entry);
}

/** Opens a stored strategy by the list of the menu. */
export async function openStored(user: UserEvent, name: string): Promise<void> {
  await menu(user, 'open');
  const dialog = await screen.findByRole('dialog', { name: /^(Strategie öffnen|Open strategy)$/ });
  await user.click(await within(dialog).findByRole('button', { name }));
}

/** The nodes of the drawing area that show a step or an object. */
export function elementNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="node"], [data-testid="card"]'));
}

/**
 * Clicks a node of the drawing area. The flow library starts a drag at `mousedown` and its drag library reads `event.view`,
 * which the events of `user-event` do not carry; so the events are sent with the window as view.
 */
export function clickNode(target: HTMLElement): void {
  function send(to: Element | Window, type: string): void {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 });
    Object.defineProperty(event, 'view', { value: window });
    fireEvent(to, event);
  }
  send(target, 'mousedown');
  send(window, 'mouseup');
  send(target, 'click');
}

/** The node of an element by its name. */
export function nodeByName(name: string): HTMLElement {
  const node = elementNodes().find((candidate) => candidate.dataset.nodeName === name);
  if (node === undefined) {
    throw new Error(`No node with the name ${name}`);
  }
  return node;
}

/** Opens the settings, in whichever language the interface shows. */
export async function openSettings(user: UserEvent): Promise<HTMLElement> {
  await menu(user, 'settings');
  return screen.getByRole('dialog', { name: /^(Einstellungen|Settings)$/ });
}

/** Closes the settings dialog. */
export async function closeSettings(user: UserEvent): Promise<void> {
  const dialog = screen.getByRole('dialog', { name: /^(Einstellungen|Settings)$/ });
  await user.click(within(dialog).getByRole('button', { name: /^(Schließen|Close)$/ }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
}

/** Changes the language of the interface in the settings and closes the settings again. */
export async function switchLanguage(user: UserEvent, to: 'Deutsch' | 'English'): Promise<void> {
  const dialog = await openSettings(user);
  await choose(user, within(dialog).getByLabelText(/^(Sprache|Language)$/), to);
  await waitFor(() => {
    expect(within(dialog).getByLabelText(/^(Sprache|Language)$/)).not.toBeDisabled();
  });
  await closeSettings(user);
}
