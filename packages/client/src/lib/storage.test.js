import { describe, it, expect } from 'vitest';
import {
  nextId,
  makeKey,
  mergeSeedRecords,
  mergeManufacturers,
} from './storage.js';

describe('nextId', () => {
  it('returns one more than the highest existing id', () => {
    expect(nextId([{ id: 1 }, { id: 5 }, { id: 3 }])).toBe(6);
  });

  it('returns 1 for an empty list', () => {
    expect(nextId([])).toBe(1);
  });
});

describe('makeKey', () => {
  it('prefixes the generated key', () => {
    expect(makeKey('unit')).toMatch(/^unit-/);
  });

  it('generates distinct keys on successive calls', () => {
    expect(makeKey('unit')).not.toBe(makeKey('unit'));
  });
});

describe('mergeSeedRecords', () => {
  const prevSeed = [
    { id: 1, name: 'A10', hp: 10 },
    { id: 2, name: 'A20', hp: 20 },
  ];

  it('adds new seed records the user has never seen', () => {
    const nextSeed = [...prevSeed, { id: 3, name: 'A30', hp: 30 }];
    const merged = mergeSeedRecords(prevSeed, prevSeed, nextSeed);
    expect(merged.find((r) => r.id === 3)).toEqual({
      id: 3,
      name: 'A30',
      hp: 30,
    });
  });

  it('updates records the user has not edited since the last sync', () => {
    const local = [...prevSeed];
    const nextSeed = [
      { id: 1, name: 'A10', hp: 10 },
      { id: 2, name: 'A20', hp: 25 },
    ];
    const merged = mergeSeedRecords(local, prevSeed, nextSeed);
    expect(merged.find((r) => r.id === 2).hp).toBe(25);
  });

  it('preserves records the user has edited, ignoring the new seed value', () => {
    const local = [
      { id: 1, name: 'A10', hp: 999 },
      { id: 2, name: 'A20', hp: 20 },
    ];
    const nextSeed = [
      { id: 1, name: 'A10', hp: 10 },
      { id: 2, name: 'A20', hp: 20 },
    ];
    const merged = mergeSeedRecords(local, prevSeed, nextSeed);
    expect(merged.find((r) => r.id === 1).hp).toBe(999);
  });

  it('is independent of key order when detecting edits', () => {
    const local = [{ hp: 10, id: 1, name: 'A10' }, prevSeed[1]];
    const nextSeed = [{ id: 1, name: 'A10', hp: 15 }, prevSeed[1]];
    const merged = mergeSeedRecords(local, prevSeed, nextSeed);
    // key order differs but the value is unchanged, so it should be treated
    // as unedited and updated to the new seed's hp
    expect(merged.find((r) => r.id === 1).hp).toBe(15);
  });

  it('preserves user-created records with no match in either seed', () => {
    const local = [...prevSeed, { id: 999, name: 'Custom', hp: 1 }];
    const nextSeed = [...prevSeed];
    const merged = mergeSeedRecords(local, prevSeed, nextSeed);
    expect(merged.find((r) => r.id === 999)).toEqual({
      id: 999,
      name: 'Custom',
      hp: 1,
    });
  });

  it('falls back to always adding when there is no previous snapshot for a record', () => {
    // Simulates a user who was already on an older version before
    // seedSnapshot existed: no prevSeed entry means edits can't be detected,
    // so the local copy wins rather than being silently overwritten.
    const local = [{ id: 1, name: 'A10', hp: 50 }];
    const nextSeed = [{ id: 1, name: 'A10', hp: 10 }];
    const merged = mergeSeedRecords(local, [], nextSeed);
    expect(merged.find((r) => r.id === 1).hp).toBe(50);
  });
});

describe('mergeManufacturers', () => {
  it('adds new seed manufacturers not already present locally', () => {
    expect(mergeManufacturers(['Corp A'], ['Corp A', 'Corp B'])).toEqual([
      'Corp A',
      'Corp B',
    ]);
  });

  it('keeps local-only manufacturers the seed no longer lists', () => {
    expect(
      mergeManufacturers(['Corp A', 'Corp C'], ['Corp A', 'Corp B']),
    ).toEqual(['Corp A', 'Corp C', 'Corp B']);
  });

  it('does not duplicate manufacturers already present', () => {
    expect(mergeManufacturers(['Corp A'], ['Corp A'])).toEqual(['Corp A']);
  });
});
