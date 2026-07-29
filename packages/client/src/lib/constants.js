export const UNIT_SIZES = {
  Micro: 'Micro - 1',
  Small: 'Small - 2',
  Medium: 'Medium - 3',
  Large: 'Large - 4',
  'Drop Pod': 'Drop Pod (special) - 1',
};

export const DICE_COLORS = ['blue', 'red', 'green'];
export const ACTION_DICE_SIDE_KEYS = [
  'side1',
  'side2',
  'side3',
  'side4',
  'side5',
  'side6',
];
export const ACTION_DICE_FACES = ['Action', 'Attack', 'Move'];
export const SLOTS = ['Movement', 'Left', 'Right', 'Head'];
export const DROP_POD_SIZE = 'Drop Pod';
export const EQUIPMENT_TYPES = ['Movement', 'Weapon', 'Augment'];
export const WEAPON_SIZES = ['Small', 'Medium', 'Large'];
const WEAPON_SIZE_SLOTS = { Small: 1, Medium: 2, Large: 3 };
export const EFFECT_STATS = [
  { key: 'base_movement', label: 'Movement' },
  { key: 'hp', label: 'HP' },
  { key: 'left_slots', label: 'Left slots' },
  { key: 'right_slots', label: 'Right slots' },
  { key: 'head_slots', label: 'Head slots' },
  { key: 'dice', label: 'Dice' },
];
// Bump this whenever the seed data (manufacturers/units/equipment.json)
// changes, so browsers with older cached data merge in the new seed
// content instead of silently going stale (see mergeSeedRecords in
// lib/storage.js).
export const DATA_VERSION = 24;

export function sizeLabel(size) {
  return UNIT_SIZES[size] ?? size;
}

export function armorLabel(unit) {
  const parts = [
    unit?.front_armor,
    unit?.left_armor,
    unit?.right_armor,
    unit?.rear_armor,
  ];
  if (parts.every((v) => v == null)) return '—';
  return parts.map((v) => v ?? 0).join('/');
}

export function weaponSlotCost(item) {
  return WEAPON_SIZE_SLOTS[item?.size] ?? 1;
}

export function effectStatLabel(key) {
  return EFFECT_STATS.find((s) => s.key === key)?.label ?? key;
}

export function effectStatChipText(effect) {
  if (effect.stat === 'dice') {
    const color = String(effect.amount ?? '');
    const label = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
    return `+1 ${label} die`;
  }
  const sign = effect.amount > 0 ? '+' : '';
  return `${sign}${effect.amount} ${effectStatLabel(effect.stat)}`;
}
