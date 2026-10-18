import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

/** Waits until the type descriptions are loaded, which enables "New strategy" and "Open". */
export async function waitForReady(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /^(Neue Strategie|New strategy)$/ })).toBeEnabled();
  });
}

/** Presses an entry of the menu. */
export async function menu(user: UserEvent, name: string | RegExp): Promise<void> {
  await user.click(within(screen.getByRole('navigation', { name: /^(Menü|Menu)$/ })).getByRole('button', { name }));
}

/** Opens a stored strategy by the list of the menu. */
export async function openStored(user: UserEvent, title: string): Promise<void> {
  await menu(user, /^(Öffnen|Open)$/);
  const dialog = await screen.findByRole('dialog', { name: /^(Strategie öffnen|Open strategy)$/ });
  await user.click(await within(dialog).findByRole('button', { name: title }));
}

/** Puts an entry of the element library onto the drawing area with the keyboard (select it, press Enter). */
export async function insertFromLibrary(user: UserEvent, name: string | RegExp): Promise<void> {
  const library = screen.getByRole('complementary', { name: /^(Elementbibliothek|Element library)$/ });
  await user.click(within(library).getByRole('option', { name }));
  await user.keyboard('{Enter}');
}

/** Clicks the empty drawing area: the property view of the strategy is shown. */
export function clickEmptyArea(): void {
  fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);
}

/** The nodes of the drawing area that are elements (not frames). */
export function elementNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.react-flow__node-element'));
}

/**
 * Clicks a node of the drawing area. React Flow selects a node when the drag
 * starts (`mousedown`) and its drag library reads `event.view`, which the events of
 * `user-event` do not carry; so the events are sent with the window as view.
 */
export function clickNode(node: HTMLElement): void {
  function send(target: Element | Window, type: string): void {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 });
    Object.defineProperty(event, 'view', { value: window });
    fireEvent(target, event);
  }
  send(node, 'mousedown');
  send(window, 'mouseup');
  send(node, 'click');
}

/** The node of an element by the text it shows as title. */
export function nodeByTitle(title: string): HTMLElement {
  const node = elementNodes().find((candidate) => candidate.querySelector('.element-node-title')?.textContent === title);
  if (node === undefined) {
    throw new Error(`No node with the title ${title}`);
  }
  return node;
}

/** Opens the settings with the menu, in whichever language the interface shows. */
export async function openSettings(user: UserEvent): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: /^(Einstellungen|Settings)$/ }));
  return screen.getByRole('dialog', { name: /^(Einstellungen|Settings)$/ });
}

/** Closes the settings dialog. */
export async function closeSettings(user: UserEvent): Promise<void> {
  const dialog = screen.getByRole('dialog', { name: /^(Einstellungen|Settings)$/ });
  await user.click(within(dialog).getByRole('button', { name: /^(Schließen|Close)$/ }));
  await waitFor(() => {
    expectNoDialog();
  });
}

function expectNoDialog(): void {
  if (screen.queryByRole('dialog') !== null) {
    throw new Error('A dialog is still open');
  }
}

/**
 * Changes the language of the interface in the settings (the selection moved
 * there from the header) and closes the settings again.
 */
export async function switchLanguage(user: UserEvent, to: 'Deutsch' | 'English'): Promise<void> {
  const dialog = await openSettings(user);
  await user.selectOptions(within(dialog).getByLabelText(/^(Sprache|Language)$/), to);
  await waitFor(() => {
    const select = within(dialog).getByLabelText(/^(Sprache|Language)$/);
    if (select.hasAttribute('disabled')) {
      throw new Error('The language is still being saved');
    }
  });
  await closeSettings(user);
}
