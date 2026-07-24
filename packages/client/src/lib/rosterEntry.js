import { SLOTS, DROP_POD_SIZE } from './constants.js';

export const WEIGHT_SEGMENT_COLORS = [
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
];

export function requiredTypeForSlot(slot) {
  if (slot === 'Movement') return 'Movement';
  if (slot === 'Head') return 'Augment';
  return 'Weapon';
}

export function computeRosterStats(entry, units, equipment, totalWeight) {
  const { unit } = entry;
  const isDropPod = unit.size === DROP_POD_SIZE;
  const unitEquipment = equipment.filter(
    (item) => item.manufacturer === unit.manufacturer,
  );
  const carried = entry.carried ?? [];
  const hasMech = carried.length > 0;
  const carryOptions = isDropPod
    ? units.filter(
        (u) =>
          u.manufacturer === unit.manufacturer &&
          u.size !== DROP_POD_SIZE &&
          Number(u.id) !== Number(unit.id),
      )
    : [];

  const dropPodEquipmentId = entry.equipment?.Movement?.[0] ?? 0;
  const hasEquipment = Boolean(dropPodEquipmentId);
  const dropPodEquipmentOptions = unitEquipment.filter(
    (item) => !item.no_drop_pod,
  );
  const dropPodSelected = dropPodEquipmentOptions.find(
    (item) => Number(item.id) === Number(dropPodEquipmentId),
  );

  function resolveEquippedItems(slot) {
    const requiredType = requiredTypeForSlot(slot);
    const slotOptions = unitEquipment.filter(
      (item) => (item.type ?? 'Movement') === requiredType,
    );
    return (entry.equipment?.[slot] ?? [])
      .map((id) => slotOptions.find((item) => Number(item.id) === Number(id)))
      .filter(Boolean);
  }

  const allEquippedItems = isDropPod
    ? dropPodSelected
      ? [dropPodSelected]
      : []
    : SLOTS.flatMap((slot) => resolveEquippedItems(slot));

  const statBonus = allEquippedItems.reduce(
    (bonus, item) => {
      (item.effect_stats ?? []).forEach(({ stat, amount }) => {
        if (stat in bonus) bonus[stat] += Number(amount) || 0;
      });
      return bonus;
    },
    { base_movement: 0, hp: 0, left_slots: 0, right_slots: 0, head_slots: 0 },
  );

  const effectiveHp = Number(unit.hp ?? 0) + statBonus.hp;

  const slotCounts = {
    Movement: 1,
    Left: Math.max(0, Number(unit.left_slots ?? 1) + statBonus.left_slots),
    Right: Math.max(0, Number(unit.right_slots ?? 1) + statBonus.right_slots),
    Head: Math.max(0, Number(unit.head_slots ?? 0) + statBonus.head_slots),
  };

  const maxWeight = Number(unit.max_weight) || 0;
  const maxDropWeight = Number(unit.max_drop_weight) || 0;
  const overMaxWeight = maxWeight > 0 && totalWeight > maxWeight;
  const overDropWeight =
    !overMaxWeight && maxDropWeight > 0 && totalWeight > maxDropWeight;

  const movementItem = isDropPod ? null : resolveEquippedItems('Movement')[0];
  const movementGearStat =
    Number(movementItem?.movement ?? 0) + statBonus.base_movement;
  const excessDropWeight =
    maxDropWeight > 0 ? Math.max(0, totalWeight - maxDropWeight) : 0;
  const effectiveMovement = Math.max(0, movementGearStat - excessDropWeight);

  const statsLine = [
    `Armor ${unit.armor || '—'}`,
    `HP ${effectiveHp}`,
    `Move ${effectiveMovement}`,
  ].join(' · ');

  const equippedWithEffects = [];
  const equippedWeights = [];
  if (isDropPod) {
    if (dropPodSelected?.effects || dropPodSelected?.effect_stats?.length) {
      equippedWithEffects.push({ key: 'equipment', item: dropPodSelected });
    }
    if (dropPodSelected) {
      const weight = Number(dropPodSelected.weight ?? 0);
      if (weight > 0) {
        equippedWeights.push({
          key: 'equipment',
          name: dropPodSelected.name,
          weight,
        });
      }
    }
  } else {
    SLOTS.forEach((slot) => {
      const requiredType = requiredTypeForSlot(slot);
      const slotOptions = unitEquipment.filter(
        (item) => (item.type ?? 'Movement') === requiredType,
      );
      const ids = entry.equipment?.[slot] ?? [];
      ids.forEach((selectedId, i) => {
        const selected = slotOptions.find(
          (item) => Number(item.id) === Number(selectedId),
        );
        if (selected?.effects || selected?.effect_stats?.length) {
          equippedWithEffects.push({ key: `${slot}-${i}`, item: selected });
        }
        if (selected) {
          const weight = Number(selected.weight ?? 0);
          if (weight > 0) {
            equippedWeights.push({
              key: `${slot}-${i}`,
              name: selected.name,
              weight,
            });
          }
        }
      });
    });
  }
  const hullWeight = Math.max(
    0,
    totalWeight - equippedWeights.reduce((sum, item) => sum + item.weight, 0),
  );

  return {
    unit,
    isDropPod,
    unitEquipment,
    carried,
    hasMech,
    carryOptions,
    dropPodEquipmentId,
    hasEquipment,
    dropPodEquipmentOptions,
    dropPodSelected,
    resolveEquippedItems,
    slotCounts,
    maxWeight,
    maxDropWeight,
    overMaxWeight,
    overDropWeight,
    movementGearStat,
    excessDropWeight,
    effectiveMovement,
    statsLine,
    equippedWithEffects,
    equippedWeights,
    hullWeight,
  };
}
