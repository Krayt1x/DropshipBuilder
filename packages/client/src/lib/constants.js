export const UNIT_SIZES = {
  Small: 'Micro - 1',
  Medium: 'Small - 2',
  Large: 'Medium - 3',
  Huge: 'Large - 4',
  'Drop Pod': 'Drop Pod (special)',
};

export const UNIT_SIZE_TIER = {
  Small: 1,
  Medium: 2,
  Large: 3,
  Huge: 4,
};

export const DICE_COLORS = ['blue', 'red', 'green'];
export const SLOTS = ['Movement', 'Left', 'Right'];
export const DROP_POD_SIZE = 'Drop Pod';
export const EQUIPMENT_TYPES = ['Movement', 'Weapon'];

export function sizeLabel(size) {
  return UNIT_SIZES[size] ?? size;
}

export function sizeTier(size) {
  return UNIT_SIZE_TIER[size] ?? 1;
}

export function diceLines(unit) {
  return DICE_COLORS.filter((color) => Number(unit[`dice_${color}`]) > 0).map(
    (color) =>
      `${Number(unit[`dice_${color}`])} ${color[0].toUpperCase()}${color.slice(1)}`,
  );
}

export function diceSummary(unit) {
  const parts = diceLines(unit);
  return parts.length ? parts.join(', ') : 'None';
}
