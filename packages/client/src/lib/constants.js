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
export const SLOTS = ['Movement', 'Left', 'Right', 'Head'];
export const DROP_POD_SIZE = 'Drop Pod';
export const EQUIPMENT_TYPES = ['Movement', 'Weapon'];
export const WEAPON_SIZES = ['Small', 'Medium', 'Large'];
const WEAPON_SIZE_SLOTS = { Small: 1, Medium: 2, Large: 3 };
// Bump this whenever the seed data (manufacturers/units/equipment.json)
// changes, so browsers with older cached data get a "please purge cache"
// warning instead of silently going stale.
export const DATA_VERSION = 2;

export function sizeLabel(size) {
  return UNIT_SIZES[size] ?? size;
}

export function sizeTier(size) {
  return UNIT_SIZE_TIER[size] ?? 1;
}

export function weaponSlotCost(item) {
  return WEAPON_SIZE_SLOTS[item?.size] ?? 1;
}
