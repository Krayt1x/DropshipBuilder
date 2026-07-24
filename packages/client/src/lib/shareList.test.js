import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareList.js';

describe('buildShareText', () => {
  const unit = {
    id: 1,
    name: 'Test Mech',
    manufacturer: 'Corp A',
    size: 'Medium',
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
  const gun = {
    id: 2,
    manufacturer: 'Corp A',
    type: 'Weapon',
    name: 'Small Gun',
    size: 'Small',
    weight: 3,
  };
  const equipment = [legs, gun];

  it('lists equipped items per slot for a standard unit', () => {
    const rosterUnits = [
      { unit, equipment: { Movement: [1], Left: [2], Right: [], Head: [] } },
    ];
    const text = buildShareText({
      listName: 'My List',
      manufacturer: 'Corp A',
      totalWeight: 5,
      weightLimit: 100,
      rosterUnits,
      units: [unit],
      equipment,
      entryWeight: () => 5,
    });

    expect(text).toBe(
      [
        'My List (Corp A)',
        'Weight: 5t / 100t',
        '',
        'Test Mech - 5t',
        '  Left: Small Gun',
        '  Movement: Legs',
      ].join('\n'),
    );
  });

  it('lists only the single equipment item for a drop pod', () => {
    const dropPodUnit = {
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
    const rosterUnits = [{ unit: dropPodUnit, equipment: { Movement: [5] } }];
    const text = buildShareText({
      listName: 'Pod List',
      manufacturer: 'Corp A',
      totalWeight: 4,
      weightLimit: 50,
      rosterUnits,
      units: [dropPodUnit],
      equipment: [thruster],
      entryWeight: () => 4,
    });

    expect(text).toBe(
      [
        'Pod List (Corp A)',
        'Weight: 4t / 50t',
        '',
        'Pod - 4t',
        '  Equipment: Thruster Pack',
      ].join('\n'),
    );
  });

  it('omits an empty equipment line for a drop pod with nothing loaded', () => {
    const dropPodUnit = {
      id: 2,
      name: 'Pod',
      manufacturer: 'Corp A',
      size: 'Drop Pod',
    };
    const rosterUnits = [{ unit: dropPodUnit, equipment: {} }];
    const text = buildShareText({
      listName: 'Pod List',
      manufacturer: 'Corp A',
      totalWeight: 0,
      weightLimit: 50,
      rosterUnits,
      units: [dropPodUnit],
      equipment: [],
      entryWeight: () => 0,
    });

    expect(text).toBe(
      ['Pod List (Corp A)', 'Weight: 0t / 50t', '', 'Pod - 0t'].join('\n'),
    );
  });

  it('produces just the header lines with no trailing blank line for an empty roster', () => {
    const text = buildShareText({
      listName: 'Empty List',
      manufacturer: 'Corp A',
      totalWeight: 0,
      weightLimit: 100,
      rosterUnits: [],
      units: [],
      equipment: [],
      entryWeight: () => 0,
    });

    expect(text).toBe('Empty List (Corp A)\nWeight: 0t / 100t');
  });
});
