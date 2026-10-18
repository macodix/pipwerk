import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { realTypes } from '../testing/fixtures';
import { renderWithProviders } from '../test-utils';
import { ElementLibrary } from './ElementLibrary';
import { buildLibrary, LIBRARY_DRAG_TYPE, parseSource, type LibraryEntry } from './libraryModel';

const stored = {
  rules: [
    { id: 'r1', title: 'Gut', description: 'Eine Regel', objectType: 'Regel', modified: '2026-10-17T10:00:00Z', unreadable: false },
    { id: 'r2', title: 'Kaputt', description: null, objectType: 'Regel', modified: '2026-10-17T10:00:00Z', unreadable: true },
  ],
};

function render(options: { canInsert?: boolean; loadFailed?: boolean; storedFailed?: boolean } = {}) {
  const onInsert = vi.fn<(entry: LibraryEntry) => void>();
  const onRetry = vi.fn();
  renderWithProviders(
    <ElementLibrary
      groups={buildLibrary(realTypes, stored, 'de')}
      loadFailed={options.loadFailed ?? false}
      storedFailed={options.storedFailed ?? false}
      canInsert={options.canInsert ?? true}
      onRetry={onRetry}
      onInsert={onInsert}
    />,
  );
  return { onInsert, onRetry };
}

describe('ElementLibrary', () => {
  it('lists the entries of each group, with the object type of a template and the mark for rules', () => {
    render();

    const templates = screen.getByRole('listbox', { name: 'Gespeicherte Vorlagen' });
    expect(within(templates).getByRole('option', { name: /^Gut/ })).toHaveTextContent('Regel');
    expect(within(screen.getByRole('listbox', { name: 'Objekttypen' })).getByRole('option', { name: /^Regelwerk/ })).toHaveTextContent('für Regeln');
  });

  it('marks a template that cannot be read, and does not insert or drag it', async () => {
    const user = userEvent.setup();
    const { onInsert } = render();
    const broken = screen.getByRole('option', { name: /^Kaputt/ });

    expect(broken).toHaveAttribute('aria-disabled', 'true');
    expect(broken).toHaveTextContent('nicht lesbar');
    expect(broken).toHaveAttribute('draggable', 'false');
    broken.focus();
    await user.keyboard('{Enter}');

    expect(onInsert).not.toHaveBeenCalled();
  });

  it('selects an entry with a click or the space key, and inserts it with Enter', async () => {
    const user = userEvent.setup();
    const { onInsert } = render();
    const entry = screen.getByRole('option', { name: /^Bedingung/ });

    await user.click(entry);
    expect(entry).toHaveAttribute('aria-selected', 'true');
    expect(onInsert).not.toHaveBeenCalled();
    screen.getByRole('option', { name: /^Berechnung/ }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('option', { name: /^Berechnung/ })).toHaveAttribute('aria-selected', 'true');
    expect(entry).toHaveAttribute('aria-selected', 'false');
    expect(onInsert).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert.mock.calls[0]?.[0]).toMatchObject({ label: 'Berechnung', source: { kind: 'type', typeId: 'flow.calculation' } });
  });

  it('does not insert while no strategy is open and does not let the entries be dragged', async () => {
    const user = userEvent.setup();
    const { onInsert } = render({ canInsert: false });
    const entry = screen.getByRole('option', { name: /^Bedingung/ });

    entry.focus();
    await user.keyboard('{Enter}');

    expect(onInsert).not.toHaveBeenCalled();
    expect(entry).toHaveAttribute('draggable', 'false');
  });

  it('puts what the entry is into the drag, as text the drawing area can read back', () => {
    render();
    const entry = screen.getByRole('option', { name: /^Bedingung/ });
    const data: Record<string, string> = {};

    fireEvent.dragStart(entry, {
      dataTransfer: { setData: (type: string, value: string) => (data[type] = value), effectAllowed: '' },
    });

    expect(parseSource(data[LIBRARY_DRAG_TYPE] ?? '')).toEqual({ kind: 'type', typeId: 'flow.condition' });
  });

  it('tells when the type descriptions are missing and offers to try again', async () => {
    const user = userEvent.setup();
    const { onRetry } = render({ loadFailed: true });

    expect(screen.getByRole('alert')).toHaveTextContent('Die Typbeschreibungen konnten nicht geladen werden');
    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('tells when the stored templates cannot be read, if there are none to show', () => {
    renderWithProviders(
      <ElementLibrary
        groups={buildLibrary(realTypes, {}, 'de')}
        loadFailed={false}
        storedFailed
        canInsert
        onRetry={() => undefined}
        onInsert={() => undefined}
      />,
    );

    expect(screen.getByText('Die gespeicherten Vorlagen konnten nicht gelesen werden.')).toBeInTheDocument();
  });
});
