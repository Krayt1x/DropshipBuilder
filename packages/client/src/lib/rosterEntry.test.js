import { describe, it, expect } from 'vitest';
import {
  requiredTypeForSlot,
  itemStatSummary,
  computeRosterStats,
} from './rosterEntry.js';

describe('requiredTypeForSlot', () => {
  it('maps Movement to Movement', () => {
    expect(requiredTypeForSlot('Movement')).toBe('Movement');
  });

  it('maps Head to Augment', () => {
    expect(requiredTypeForSlot('Head')).toBe('Augment');
  });

  it('maps Left and Right to Weapon', () => {
    expect(requiredTypeForSlot('Left')).toBe('Weapon');
    expect(requiredTypeForSlot('Right')).toBe('Weapon');
  });
});

describe('itemStatSummary', () => {
  it('returns an empty string for no item', () => {
    expect(itemStatSummary(null)).toBe('');
    expect(itemStatSummary(undefined)).toBe('');
  });

  it('summarizes a weapon', () => {
    const item = {
      type: 'Weapon',
      size: 'Large',
      weight: 5,
      range: '12"',
      heat_rating: 'Low',
      hit_dice: '1d6',
    };
    expect(itemStatSummary(item)).toBe(
      'Large (3 slots) · 5t · Range 12" · Heat Low · 1d6',
    );
  });

  it('uses singular "slot" for a weapon needing exactly one slot', () => {
    const item = { type: 'Weapon', size: 'Small', weight: 1 };
    expect(itemStatSummary(item)).toBe(
      'Small (1 slot) · 1t · Range — · Heat — · —',
    );
  });

  it('summarizes movement gear, defaulting to type Movement when unset', () => {
    expect(itemStatSummary({ movement: 4, weight: 2 })).toBe('4 move · 2t');
    expect(itemStatSummary({ type: 'Movement', movement: 4, weight: 2 })).toBe(
      '4 move · 2t',
    );
  });

  it('summarizes an augment', () => {
    expect(itemStatSummary({ type: 'Augment', weight: 1 })).toBe('1 slot · 1t');
  });

  it('falls back to just weight for an unrecognized type', () => {
    expect(itemStatSummary({ type: 'Other', weight: 3 })).toBe('3t');
  });
});

describe('computeRosterStats', () => {
  const unit = {
    id: 1,
    name: 'Test Mech',
    manufacturer: 'Corp A',
    size: 'Medium',
    armor: '2/2/2/1',
    max_weight: 20,
    max_drop_weight: 15,
    hp: 10,
    left_slots: 2,
    right_slots: 1,
    head_slots: 1,
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
  const helmet = {
    id: 4,
    manufacturer: 'Corp A',
    type: 'Augment',
    name: 'Sensor Helm',
    weight: 1,
    effect_stats: [{ stat: 'hp', amount: 5 }],
  };
  const equipment = [legs, smallGun, bigGun, helmet];
  const entry = {
    unit,
    equipment: { Movement: [1], Left: [2], Right: [3], Head: [4] },
  };

  it('applies effect_stats bonuses, tracks weight segments, and flags over-capacity slots', () => {
    const stats = computeRosterStats(entry, [], equipment, 21);

    expect(stats.isDropPod).toBe(false);
    expect(stats.slotCounts).toEqual({
      Movement: 1,
      Left: 2,
      Right: 1,
      Head: 1,
    });
    // Sensor Helm grants +5 hp -> 10 base + 5 = 15
    expect(stats.statsLine).toBe('Armor 2/2/2/1 · HP 15 · Move 0');
    expect(stats.overMaxWeight).toBe(true);
    // overDropWeight is only set when not already over max weight
    expect(stats.overDropWeight).toBe(false);
    // Big Gun (Large, 3 slots) exceeds the unit's single Right slot
    expect(stats.overCapacitySlots).toEqual({
      Left: false,
      Right: true,
      Head: false,
    });
    expect(stats.equippedWeights).toEqual([
      { key: 'Movement-0', name: 'Legs', weight: 2 },
      { key: 'Left-0', name: 'Small Gun', weight: 3 },
      { key: 'Right-0', name: 'Big Gun', weight: 5 },
      { key: 'Head-0', name: 'Sensor Helm', weight: 1 },
    ]);
    // 21 total - (2+3+5+1) equipped = 10 hull
    expect(stats.hullWeight).toBe(10);
    expect(stats.equippedWithEffects).toEqual([
      { key: 'Head-0', item: helmet },
    ]);
  });

  it('reduces effective movement by excess weight over the max drop weight', () => {
    const stats = computeRosterStats(entry, [], equipment, 21);
    // gear movement 4, 6t over the 15t max drop weight -> clamped to 0
    expect(stats.movementGearStat).toBe(4);
    expect(stats.excessDropWeight).toBe(6);
    expect(stats.effectiveMovement).toBe(0);
  });

  it('does not penalize movement when under the max drop weight', () => {
    const lightEntry = {
      unit,
      equipment: { Movement: [1], Left: [], Right: [], Head: [] },
    };
    const stats = computeRosterStats(lightEntry, [], equipment, 12);
    expect(stats.excessDropWeight).toBe(0);
    expect(stats.effectiveMovement).toBe(4);
    expect(stats.overMaxWeight).toBe(false);
    expect(stats.overDropWeight).toBe(false);
  });

  it('handles drop pod units via the single equipment slot', () => {
    const dropPodUnit = {
      id: 2,
      name: 'Pod',
      manufacturer: 'Corp A',
      size: 'Drop Pod',
      max_weight: 0,
      max_drop_weight: 0,
      hp: 5,
    };
    const thruster = {
      id: 5,
      manufacturer: 'Corp A',
      type: 'Movement',
      name: 'Thruster Pack',
      weight: 4,
    };
    const podEntry = { unit: dropPodUnit, equipment: { Movement: [5] } };
    const stats = computeRosterStats(podEntry, [], [thruster], 4);

    expect(stats.isDropPod).toBe(true);
    expect(stats.dropPodSelected).toEqual(thruster);
    expect(stats.overCapacitySlots).toEqual({});
    expect(stats.statsLine).toBe('Armor — · HP 5 · Move 0');
    expect(stats.equippedWeights).toEqual([
      { key: 'equipment', name: 'Thruster Pack', weight: 4 },
    ]);
    expect(stats.hullWeight).toBe(0);
  });

  it('excludes drop-pod-restricted equipment from drop pod options', () => {
    const dropPodUnit = {
      id: 2,
      name: 'Pod',
      manufacturer: 'Corp A',
      size: 'Drop Pod',
    };
    const restricted = {
      id: 6,
      manufacturer: 'Corp A',
      type: 'Movement',
      name: 'Restricted Gear',
      no_drop_pod: true,
    };
    const podEntry = { unit: dropPodUnit, equipment: {} };
    const stats = computeRosterStats(podEntry, [], [restricted], 0);
    expect(stats.dropPodEquipmentOptions).toEqual([]);
    expect(stats.dropPodSelected).toBeUndefined();
  });
});
