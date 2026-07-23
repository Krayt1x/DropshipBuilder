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
});
