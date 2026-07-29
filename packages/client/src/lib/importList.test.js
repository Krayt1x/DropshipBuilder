import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareList.js';
import { parseShareText, matchImportedList } from './importList.js';

describe('parseShareText', () => {
  it('parses the header, weight limit, and unit/slot lines', () => {
    const text = [
      'My List (Corp A)',
      'Weight: 5t / 100t',
      '',
      'Test Mech - 5t',
      '  Left: Small Gun',
      '  Movement: Legs',
    ].join('\n');

    expect(parseShareText(text)).toEqual({
      listName: 'My List',
      manufacturer: 'Corp A',
      weightLimit: 100,
      units: [
        {
          name: 'Test Mech',
          weight: 5,
          slots: [
            { slotLabel: 'Left', itemName: 'Small Gun' },
            { slotLabel: 'Movement', itemName: 'Legs' },
          ],
        },
      ],
    });
  });

  it('strips a "(N)" duplicate suffix from unit names', () => {
    const text = ['List (Corp A)', 'Weight: 0t / 100t', '', 'Grunt (2) - 5t'].join(
      '\n',
    );
    expect(parseShareText(text).units).toEqual([
      { name: 'Grunt', weight: 5, slots: [] },
    ]);
  });

  it('parses a drop pod\'s single Equipment line', () => {
    const text = [
      'Pod List (Corp A)',
      'Weight: 4t / 50t',
      '',
      'Pod - 4t',
      '  Equipment: Thruster Pack',
    ].join('\n');
    expect(parseShareText(text).units).toEqual([
      {
        name: 'Pod',
        weight: 4,
        slots: [{ slotLabel: 'Equipment', itemName: 'Thruster Pack' }],
      },
    ]);
  });
});

describe('matchImportedList', () => {
  const unit = {
    id: 1,
    name: 'Test Mech',
    manufacturer: 'Corp A',
    size: 'Medium',
  };
  const legs = {
    id: 1,
    manufacturer: 'Corp A',
    type: 'Movement',
    name: 'Legs',
    weight: 2,
  };
  const gun = {
    id: 2,
    manufacturer: 'Corp A',
    type: 'Weapon',
    name: 'Small Gun',
    weight: 3,
  };
  const equipment = [legs, gun];
  const manufacturers = ['Corp A'];

  it('round-trips a share text export back into unit/equipment ids', () => {
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

    const parsed = parseShareText(text);
    const result = matchImportedList({
      parsed,
      manufacturers,
      units: [unit],
      equipment,
    });

    expect(result.listName).toBe('My List');
    expect(result.manufacturer).toBe('Corp A');
    expect(result.weightLimit).toBe(100);
    expect(result.warnings).toEqual([]);
    expect(result.matchedUnits).toHaveLength(1);
    expect(result.matchedUnits[0]).toMatchObject({
      unit_id: 1,
      equipment: { Movement: [1], Left: [2], Right: [], Head: [] },
      warnings: [],
    });
  });

  it('warns and skips when the manufacturer is unknown', () => {
    const parsed = {
      listName: 'My List',
      manufacturer: 'Unknown Corp',
      weightLimit: 100,
      units: [{ name: 'Test Mech', weight: 5, slots: [] }],
    };
    const result = matchImportedList({
      parsed,
      manufacturers,
      units: [unit],
      equipment,
    });

    expect(result.manufacturer).toBeNull();
    expect(result.matchedUnits).toEqual([]);
    expect(result.warnings).toEqual(['Manufacturer "Unknown Corp" not found.']);
  });

  it('skips an unmatched unit but keeps matching the rest', () => {
    const parsed = {
      listName: 'My List',
      manufacturer: 'Corp A',
      weightLimit: 100,
      units: [
        { name: 'Ghost Unit', weight: 5, slots: [] },
        { name: 'Test Mech', weight: 5, slots: [] },
      ],
    };
    const result = matchImportedList({
      parsed,
      manufacturers,
      units: [unit],
      equipment,
    });

    expect(result.matchedUnits).toHaveLength(1);
    expect(result.matchedUnits[0].unit_id).toBe(1);
    expect(result.warnings).toEqual(['Unit "Ghost Unit" not found — skipped.']);
  });

  it('records a per-unit warning for an unmatched equipment item without dropping the unit', () => {
    const parsed = {
      listName: 'My List',
      manufacturer: 'Corp A',
      weightLimit: 100,
      units: [
        {
          name: 'Test Mech',
          weight: 5,
          slots: [{ slotLabel: 'Left', itemName: 'Missing Gun' }],
        },
      ],
    };
    const result = matchImportedList({
      parsed,
      manufacturers,
      units: [unit],
      equipment,
    });

    expect(result.matchedUnits).toHaveLength(1);
    expect(result.matchedUnits[0].equipment).toEqual({
      Movement: [],
      Left: [],
      Right: [],
      Head: [],
    });
    expect(result.matchedUnits[0].warnings).toEqual(['"Missing Gun" not found']);
  });

  it('matches a drop pod\'s Equipment line regardless of equipment type', () => {
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
    const parsed = {
      listName: 'Pod List',
      manufacturer: 'Corp A',
      weightLimit: 50,
      units: [
        {
          name: 'Pod',
          weight: 4,
          slots: [{ slotLabel: 'Equipment', itemName: 'Thruster Pack' }],
        },
      ],
    };
    const result = matchImportedList({
      parsed,
      manufacturers,
      units: [dropPodUnit],
      equipment: [thruster],
    });

    expect(result.matchedUnits[0].equipment.Movement).toEqual([5]);
  });
});
