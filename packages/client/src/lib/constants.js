export const UNIT_SIZES = {
  Small: 'Micro - 1',
  Medium: 'Small - 2',
  Large: 'Medium - 3',
  Huge: 'Large - 4',
  'Drop Pod': 'Drop Pod (special)',
};

export const DICE_COLORS = ['blue', 'red', 'green'];
export const SLOTS = ['Movement', 'Left', 'Right'];
export const DROP_POD_SIZE = 'Drop Pod';
export const EQUIPMENT_TYPES = ['Movement', 'Weapon'];

export function sizeLabel(size) {
  return UNIT_SIZES[size] ?? size;
}

export function diceSummary(unit) {
  const parts = DICE_COLORS.filter(
    (color) => Number(unit[`dice_${color}`]) > 0,
  ).map(
    (color) =>
      `${Number(unit[`dice_${color}`])} ${color[0].toUpperCase()}${color.slice(1)}`,
  );
  return parts.length ? parts.join(', ') : 'None';
}
