import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test-utils';
import { percentToShare, shareToPercent, ValueInput } from './ValueInput';

describe('shareToPercent', () => {
  it.each([
    [0.07, '7'],
    [0.29, '29'],
    [0.5, '50'],
    [1, '100'],
    [0, '0'],
    [0.000025, '0.0025'],
    [1e-7, '0.00001'],
    [1.5e-9, '0.00000015'],
    [-1e-7, '-0.00001'],
    [1e21, '100000000000000000000000'],
  ])('shows the share %s as %s percent, never as NaN', (share, text) => {
    expect(shareToPercent(share)).toBe(text);
  });

  it('gives a text that percentToShare takes back', () => {
    for (const share of [0.07, 0.29, 1e-7, 3.3e-8, 0.0125]) {
      expect(percentToShare(shareToPercent(share))).toBe(share);
    }
  });
});

describe('the number input', () => {
  async function typeInto(datatype: 'number' | 'integer' | 'percent', text: string, initial?: number) {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<ValueInput datatype={datatype} value={initial} language="de" label="Feld" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Feld' });
    await user.clear(input);
    onChange.mockClear();
    await user.type(input, text);
    return { input, onChange };
  }

  it.each([
    ['.5', 0.5],
    [',5', 0.5],
    ['-.5', -0.5],
    ['0.5', 0.5],
  ])('takes %s as %s', async (text, value) => {
    const { input, onChange } = await typeInto('number', text);

    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('takes .5 percent as the share 0.005', async () => {
    expect((await typeInto('percent', '.5')).onChange).toHaveBeenLastCalledWith(0.005);
  });

  it('shows a small share without NaN', () => {
    renderWithProviders(<ValueInput datatype="percent" value={1e-7} language="de" label="Feld" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Feld' })).toHaveValue('0.00001');
  });

  // The last value stored while typing is the one of the longest valid beginning; the text itself is never taken.
  it.each([
    ['1e3', 1],
    ['1E3', 1],
    ['5e-2', 5],
    ['1.5e', 1.5],
    ['.', undefined],
    ['-', undefined],
    ['1..5', 1],
    ['abc', undefined],
  ])('rejects %s and says which notation applies', async (text, lastStored) => {
    const { input, onChange } = await typeInto('number', text);

    if (lastStored === undefined) {
      expect(onChange).not.toHaveBeenCalled();
    } else {
      expect(onChange).toHaveBeenLastCalledWith(lastStored);
    }
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('ohne Exponent');
    expect(input).toHaveAccessibleDescription(/ohne Exponent/);
  });

  it('says that a whole number has no decimal places', async () => {
    const { input, onChange } = await typeInto('integer', '2.5');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Ganzzahl');
  });

  it('shows no hint for a valid input (counter-check)', async () => {
    const { input } = await typeInto('number', '2.5');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
