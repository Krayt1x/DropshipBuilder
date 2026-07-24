import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RosterListItem from './RosterListItem.jsx';

afterEach(cleanup);

const unit = {
  id: 1,
  name: 'Test Mech',
  manufacturer: 'Corp A',
  size: 'Medium',
  max_weight: 20,
  max_drop_weight: 15,
  hp: 10,
  left_slots: 1,
  right_slots: 1,
  head_slots: 0,
};

function renderItem(overrides = {}) {
  const onSelect = vi.fn();
  const onRemove = vi.fn();
  const props = {
    entry: { unit, equipment: {} },
    units: [],
    equipment: [],
    totalWeight: 10,
    selected: false,
    onSelect,
    onRemove,
    ...overrides,
  };
  const utils = render(<RosterListItem {...props} />);
  return { ...utils, onSelect, onRemove };
}

describe('RosterListItem', () => {
  it('renders the unit name and current weight', () => {
    renderItem();
    expect(screen.getByText('Test Mech')).toBeDefined();
    expect(screen.getByText('10 t')).toBeDefined();
  });

  it('calls onSelect when clicked', () => {
    const { container, onSelect } = renderItem();
    fireEvent.click(container.querySelector('.roster-list-item'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove without triggering onSelect', () => {
    const { onSelect, onRemove } = renderItem();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('applies the selected class when selected', () => {
    const { container } = renderItem({ selected: true });
    expect(
      container.querySelector('.roster-list-item.selected'),
    ).not.toBeNull();
  });

  it('shows Empty placeholders for unfilled slots', () => {
    renderItem();
    expect(screen.getAllByText('Empty').length).toBeGreaterThan(0);
  });

  it('shows the over-max-weight warning icon when totalWeight exceeds max_weight', () => {
    renderItem({ totalWeight: 25 });
    expect(screen.getByTitle('Over max weight (20 t)')).toBeDefined();
  });

  it('marks an over-capacity slot as invalid', () => {
    const bigGun = {
      id: 10,
      manufacturer: 'Corp A',
      type: 'Weapon',
      name: 'Big Gun',
      size: 'Large',
      weight: 5,
    };
    const { container } = renderItem({
      entry: { unit, equipment: { Left: [10] } },
      equipment: [bigGun],
      totalWeight: 15,
    });
    expect(
      container.querySelector('.roster-condensed-tile.invalid'),
    ).not.toBeNull();
    expect(screen.getByText('Big Gun')).toBeDefined();
  });

  it('shows "Nothing loaded yet." for an empty drop pod', () => {
    const podUnit = {
      id: 2,
      name: 'Pod',
      manufacturer: 'Corp A',
      size: 'Drop Pod',
    };
    renderItem({ entry: { unit: podUnit, equipment: {} }, totalWeight: 0 });
    expect(screen.getByText('Nothing loaded yet.')).toBeDefined();
  });

  it('shows the equipped item for a loaded drop pod', () => {
    const podUnit = {
      id: 2,
      name: 'Pod',
      manufacturer: 'Corp A',
      size: 'Drop Pod',
    };
    const thruster = {
      id: 5,
      manufacturer: 'Corp A',
      type: 'Movement',
      name: 'Thruster Pack',
      weight: 4,
    };
    renderItem({
      entry: { unit: podUnit, equipment: { Movement: [5] } },
      equipment: [thruster],
      totalWeight: 4,
    });
    expect(screen.getByText('Thruster Pack')).toBeDefined();
    expect(screen.queryByText('Nothing loaded yet.')).toBeNull();
  });
});
