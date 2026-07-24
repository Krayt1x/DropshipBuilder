import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RosterConfigPanel from './RosterConfigPanel.jsx';

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
const legs = {
  id: 1,
  manufacturer: 'Corp A',
  type: 'Movement',
  name: 'Legs',
  movement: 4,
  weight: 2,
};
const smallGun = {
  id: 2,
  manufacturer: 'Corp A',
  type: 'Weapon',
  name: 'Small Gun',
  size: 'Small',
  weight: 3,
};
const bigGun = {
  id: 3,
  manufacturer: 'Corp A',
  type: 'Weapon',
  name: 'Big Gun',
  size: 'Large',
  weight: 5,
};
const equipmentCatalog = [legs, smallGun, bigGun];

function findSlotCard(container, label) {
  return [...container.querySelectorAll('.slot-card')].find((el) =>
    el.textContent.startsWith(label),
  );
}

describe('RosterConfigPanel', () => {
  it('renders the unit name and stats line', () => {
    const entry = { unit, equipment: { Movement: [1] } };
    render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={equipmentCatalog}
        totalWeight={2}
        onAssignEquipment={vi.fn()}
      />,
    );
    expect(screen.getByText('Test Mech')).toBeDefined();
    expect(screen.getByText('Armor — · HP 10 · Move 4')).toBeDefined();
  });

  it('opens a slot picker showing only equipment the unit can carry, filtering by manufacturer', () => {
    const otherGun = {
      ...smallGun,
      id: 20,
      manufacturer: 'Corp B',
      name: 'Foreign Gun',
    };
    const entry = {
      unit,
      equipment: { Movement: [1], Left: [], Right: [], Head: [] },
    };
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={[...equipmentCatalog, otherGun]}
        totalWeight={2}
        onAssignEquipment={vi.fn()}
      />,
    );

    fireEvent.click(findSlotCard(container, 'Left'));

    expect(screen.getByText('Small Gun')).toBeDefined();
    expect(screen.queryByText('Foreign Gun')).toBeNull();
  });

  it('assigns a fitting weapon and calls onAssignEquipment with slot -1 for a new pick', () => {
    const entry = {
      unit,
      equipment: { Movement: [1], Left: [], Right: [], Head: [] },
    };
    const onAssignEquipment = vi.fn();
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={equipmentCatalog}
        totalWeight={2}
        onAssignEquipment={onAssignEquipment}
      />,
    );

    fireEvent.click(findSlotCard(container, 'Left'));
    fireEvent.click(screen.getByText('Small Gun'));

    expect(onAssignEquipment).toHaveBeenCalledWith('Left', -1, 2);
  });

  it('does not assign a weapon that does not fit the remaining slot capacity', () => {
    const entry = {
      unit,
      equipment: { Movement: [1], Left: [], Right: [], Head: [] },
    };
    const onAssignEquipment = vi.fn();
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={equipmentCatalog}
        totalWeight={2}
        onAssignEquipment={onAssignEquipment}
      />,
    );

    // unit only has 1 Left slot; Big Gun needs 3, so it should show as
    // not-fitting and clicking it should be a no-op.
    fireEvent.click(findSlotCard(container, 'Left'));
    expect(screen.getByText('Not enough room in this slot')).toBeDefined();
    fireEvent.click(screen.getByText('Big Gun'));

    expect(onAssignEquipment).not.toHaveBeenCalled();
  });

  it('clears an equipped weapon via "— None —"', () => {
    const entry = {
      unit,
      equipment: { Movement: [1], Left: [2], Right: [], Head: [] },
    };
    const onAssignEquipment = vi.fn();
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={equipmentCatalog}
        totalWeight={5}
        onAssignEquipment={onAssignEquipment}
      />,
    );

    fireEvent.click(findSlotCard(container, 'Left'));
    fireEvent.click(screen.getByText('— None —'));

    expect(onAssignEquipment).toHaveBeenCalledWith('Left', 0, 0);
  });

  it('marks a slot card invalid when its equipped item exceeds slot capacity', () => {
    const entry = {
      unit,
      equipment: { Movement: [1], Left: [3], Right: [], Head: [] },
    };
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={equipmentCatalog}
        totalWeight={7}
        onAssignEquipment={vi.fn()}
      />,
    );

    const card = findSlotCard(container, 'Left 1');
    expect(card.className).toContain('invalid');
  });

  it('assigns drop pod equipment to the Movement slot', () => {
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
    const entry = { unit: podUnit, equipment: {} };
    const onAssignEquipment = vi.fn();
    const { container } = render(
      <RosterConfigPanel
        entry={entry}
        units={[]}
        equipment={[thruster]}
        totalWeight={0}
        onAssignEquipment={onAssignEquipment}
      />,
    );

    fireEvent.click(findSlotCard(container, 'Equipment'));
    fireEvent.click(screen.getByText('Thruster Pack'));

    expect(onAssignEquipment).toHaveBeenCalledWith('Movement', 0, 5);
  });
});
