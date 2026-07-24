import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ListBuilderPage from './ListBuilderPage.jsx';

const manufacturers = ['Corp A'];
const units = [
  { id: 1, name: 'A10', manufacturer: 'Corp A', size: 'Medium', weight: 10 },
];
const equipment = [];

afterEach(cleanup);

describe('ListBuilderPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a catalog unit to the roster', () => {
    render(
      <ListBuilderPage
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />,
    );

    expect(screen.getByText('No units added yet.')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.queryByText('No units added yet.')).toBeNull();
    expect(screen.getAllByText('A10')).toHaveLength(2);
  });

  it('removes a unit from the roster', () => {
    render(
      <ListBuilderPage
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.getByText('No units added yet.')).toBeDefined();
  });

  it('adds movement equipment weight without any size-based scaling', () => {
    const movementItem = {
      id: 1,
      name: 'Heavy Legs',
      manufacturer: 'Corp A',
      type: 'Movement',
      weight: 2,
      movement: 5,
    };
    const { container } = render(
      <ListBuilderPage
        manufacturers={manufacturers}
        units={units}
        equipment={[movementItem]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Adding a unit auto-equips its best movement item — "Heavy Legs" is
    // the only option here. Its 2t weight is added as-is, for a total of
    // 10 (unit) + 2 (equipment) = 12t.
    const weightValue = container.querySelector(
      '.weight-label span:last-child',
    );
    expect(weightValue.textContent).toBe('12 t / 100 t');
  });
});
