import { describe, it, expect } from 'vitest';
import { armorLabel, effectStatChipText } from './constants.js';

describe('armorLabel', () => {
  it('joins front/left/right/rear armor with slashes', () => {
    expect(
      armorLabel({
        front_armor: 1,
        left_armor: 2,
        right_armor: 3,
        rear_armor: 4,
      }),
    ).toBe('1/2/3/4');
  });

  it('defaults a missing individual value to 0', () => {
    expect(armorLabel({ front_armor: 2, left_armor: 2, right_armor: 2 })).toBe(
      '2/2/2/0',
    );
  });

  it('returns an em dash when no armor values are set at all', () => {
    expect(armorLabel({})).toBe('—');
    expect(armorLabel(null)).toBe('—');
    expect(armorLabel(undefined)).toBe('—');
  });
});

describe('effectStatChipText', () => {
  it('formats a numeric stat effect with a sign and its label', () => {
    expect(effectStatChipText({ stat: 'hp', amount: 5 })).toBe('+5 HP');
    expect(effectStatChipText({ stat: 'left_slots', amount: -1 })).toBe(
      '-1 Left slots',
    );
  });

  it('formats a dice stat effect as "+1 <Colour> die"', () => {
    expect(effectStatChipText({ stat: 'dice', amount: 'blue' })).toBe(
      '+1 Blue die',
    );
  });
});
