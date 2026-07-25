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

  function goToBuilder() {
    fireEvent.click(screen.getByRole('button', { name: /Build roster/ }));
  }

  it('adds a catalog unit to the roster', () => {
    render(
      <ListBuilderPage
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />,
    );
    goToBuilder();

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
    goToBuilder();

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.getByText('No units added yet.')).toBeDefined();
  });

  it('numbers duplicate units added to the roster, leaving a single unit unnumbered', () => {
    render(
      <ListBuilderPage
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />,
    );
    goToBuilder();

    // One roster entry: unnumbered, matching the catalog's own "A10" text.
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByText('A10')).toHaveLength(2);
    expect(screen.queryByText('A10 (1)')).toBeNull();

    // A second roster entry of the same unit: both get numbered, and the
    // catalog's own unnumbered "A10" is the only remaining exact match.
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByText('A10')).toHaveLength(1);
    expect(screen.getByText('A10 (1)')).toBeDefined();
    expect(screen.getByText('A10 (2)')).toBeDefined();
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
    goToBuilder();

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Adding a unit auto-equips its best movement item — "Heavy Legs" is
    // the only option here. Its 2t weight is added as-is, for a total of
    // 10 (unit) + 2 (equipment) = 12t.
    const weightValue = container.querySelector('.weight-label-value');
    expect(weightValue.textContent).toBe('12 t / 100 t');
  });
});
