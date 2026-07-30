import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DiceNet, DiceSwatch } from './DiceNet.jsx';

afterEach(cleanup);

const die = {
  id: 1,
  color: 'blue',
  side1: 'Move',
  side2: 'Move',
  side3: 'Move',
  side4: 'Action',
  side5: 'Action',
  side6: 'Attack',
};

describe('DiceNet', () => {
  it('renders all six side labels', () => {
    render(<DiceNet die={die} />);
    expect(screen.getAllByText('Move')).toHaveLength(3);
    expect(screen.getAllByText('Action')).toHaveLength(2);
    expect(screen.getAllByText('Attack')).toHaveLength(1);
  });
});

describe('DiceSwatch', () => {
  it('shows the dice net on hover and hides it on mouse leave', () => {
    render(<DiceSwatch die={die} />);
    const icon = screen.getByLabelText('blue die faces');

    expect(screen.queryByText('Attack')).toBeNull();

    fireEvent.mouseEnter(icon);
    expect(screen.getByText('Attack')).toBeDefined();

    fireEvent.mouseLeave(icon);
    expect(screen.queryByText('Attack')).toBeNull();
  });

  it('colours the swatch icon to match the die color', () => {
    render(<DiceSwatch die={die} />);
    const icon = screen.getByLabelText('blue die faces');
    expect(icon.style.background).toBe('blue');
  });
});
