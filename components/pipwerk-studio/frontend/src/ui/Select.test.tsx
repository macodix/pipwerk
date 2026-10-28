import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { choiceGroups } from '../testing/actions';
import { Select } from './controls';

// Specification 5.1 (E4): the lists of choices of the properties view and the settings are controls of the interface,
// not the lists of the browser: operable with the keyboard, named for assistive technology, in every window size.

function Harness({ initial = 'b', onPick }: { initial?: string; onPick?: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <label htmlFor="field">Wahl</label>
      <Select
        id="field"
        value={value}
        testid="field-select"
        onChange={(next) => {
          setValue(next);
          onPick?.(next);
        }}
      >
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
        <option value="c" disabled>
          Gamma
        </option>
        <optgroup label="Mehr">
          <option value="d">Delta</option>
          <option value="e">Epsilon</option>
        </optgroup>
      </Select>
      <button type="button">danach</button>
    </div>
  );
}

const field = (): HTMLElement => screen.getByRole('combobox', { name: 'Wahl' });

describe('a list of choices (E4)', () => {
  it('is a designed control with a name, no list of the browser, and shows the chosen entry', () => {
    const { container } = render(<Harness />);

    expect(container.querySelector('select, option, optgroup')).toBeNull();
    expect(field()).toHaveTextContent('Beta');
    expect(field()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).toHaveValue('b');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens with a click, shows groups and marks the chosen and the unavailable entries', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(field());

    const list = screen.getByRole('listbox');
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(field()).toHaveAttribute('aria-controls', list.id);
    expect(choiceGroups(list)).toEqual([
      { label: null, options: ['Alpha', 'Beta', 'Gamma'] },
      { label: 'Mehr', options: ['Delta', 'Epsilon'] },
    ]);
    expect(within(list).getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    expect(within(list).getByRole('option', { name: 'Gamma' })).toHaveAttribute('aria-disabled', 'true');
    // the active entry is the chosen one
    expect(field()).toHaveAttribute('aria-activedescendant', within(list).getByRole('option', { name: 'Beta' }).id);
  });

  it('chooses by click and closes; a disabled entry cannot be chosen', async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    render(<Harness onPick={(value) => picked.push(value)} />);

    await user.click(field());
    await user.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Delta' }));

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field()).toHaveTextContent('Delta');
    expect(picked).toEqual(['d']);
    expect(field()).toHaveFocus();
  });

  it('works with the keyboard: arrow keys, Home, End, Enter, Space, Escape, letters', async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    render(<Harness onPick={(value) => picked.push(value)} />);
    field().focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // from "Beta" the next entry is "Delta": "Gamma" is not available
    await user.keyboard('{ArrowDown}');
    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Delta' }).id);
    await user.keyboard('{End}');
    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Epsilon' }).id);
    await user.keyboard('{Home}');
    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Alpha' }).id);
    await user.keyboard('{ArrowUp}');
    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Alpha' }).id);

    // Escape closes without choosing
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field()).toHaveTextContent('Beta');
    expect(picked).toEqual([]);

    await user.keyboard('{Enter}{End}{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field()).toHaveTextContent('Epsilon');

    await user.keyboard(' {Home} ');
    expect(field()).toHaveTextContent('Alpha');
    expect(picked).toEqual(['e', 'a']);
  });

  it('jumps to the entry that begins with the typed letters', async () => {
    const user = userEvent.setup();
    render(<Harness initial="a" />);
    field().focus();

    // closed: the typed letters choose
    await user.keyboard('d');
    expect(field()).toHaveTextContent('Delta');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('al');
    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Alpha' }).id);
  });

  it('closes on a click outside and on Tab, without choosing', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(field());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.click(field());
    await user.tab();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'danach' })).toHaveFocus();
    expect(field()).toHaveTextContent('Beta');
  });

  it('stays closed after a choice also inside of a label, which would press the field again with the click on the entry', async () => {
    const user = userEvent.setup();
    render(
      <label>
        Wahl in der Beschriftung
        <Select value="a" onChange={() => undefined} ariaLabel="Innen">
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </Select>
      </label>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Innen' }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does not open while disabled', async () => {
    const user = userEvent.setup();
    render(
      <Select value="a" onChange={() => undefined} ariaLabel="Gesperrt" disabled>
        <option value="a">Alpha</option>
      </Select>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Gesperrt' }));

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps the whole list in a small window: it lies inside the window and has a height limit with scrolling', async () => {
    const user = userEvent.setup();
    window.innerWidth = 390;
    window.innerHeight = 844;
    render(<Harness />);

    await user.click(field());

    const list = screen.getByRole('listbox');
    // a narrow window: the list spans the width of the window with a margin on both sides
    expect(list.style.left).toBe('8px');
    expect(list.style.width).toBe('374px');
    expect(Number.parseInt(list.style.maxHeight, 10)).toBeLessThanOrEqual(320);
  });
});
