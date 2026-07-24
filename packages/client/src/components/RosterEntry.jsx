import { useState } from 'react';
import {
  SLOTS,
  DROP_POD_SIZE,
  sizeLabel,
  weaponSlotCost,
  effectStatLabel,
} from '../lib/constants.js';
import DiceIcons from './DiceIcons.jsx';

const WEIGHT_SEGMENT_COLORS = [
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
];

function requiredTypeForSlot(slot) {
  if (slot === 'Movement') return 'Movement';
  if (slot === 'Head') return 'Augment';
  return 'Weapon';
}

function LoadMechForm({ options, onAdd }) {
  return (
    <form
      className="inline carried-add"
      onSubmit={(e) => {
        e.preventDefault();
        const id = Number(new FormData(e.target).get('carried_unit_id'));
        if (id > 0) onAdd(id);
      }}
    >
      <select name="carried_unit_id" defaultValue={options[0]?.id}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} ({option.weight} t)
          </option>
        ))}
      </select>
      <button type="submit">Load mech</button>
    </form>
  );
}

function SlotCard({ label, item, statOverride, isOpen, disabled, onToggle }) {
  return (
    <button
      type="button"
      className={`slot-card ${isOpen ? 'open' : ''}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="slot-card-label">{label}</span>
      <span className="slot-card-item">{item?.name ?? 'Empty'}</span>
      {item && (
        <span className="slot-card-wt">
          {statOverride ?? `${item.weight ?? 0}t`}
        </span>
      )}
      {!disabled && <span className="slot-card-edit">✎</span>}
    </button>
  );
}

function SlotPicker({
  title,
  options,
  selectedId,
  allowNone,
  isWeapon,
  weaponFit,
  onSelect,
}) {
  return (
    <div className="slot-picker">
      <p className="slot-picker-title">{title}</p>
      {allowNone && (
        <div
          className={`slot-picker-row ${Number(selectedId) === 0 ? 'selected' : ''}`}
          onClick={() => onSelect(0)}
        >
          <span className="slot-picker-name">— None —</span>
        </div>
      )}
      {options.map((item) => {
        const isSelected = Number(selectedId) === Number(item.id);
        const fits = !weaponFit || isSelected || weaponFit(item);
        const itemType = item.type ?? 'Movement';
        return (
          <div
            key={item.id}
            className={`slot-picker-row ${(!isWeapon && item.effects) || (weaponFit && !fits) ? 'slot-picker-row-stack' : ''} ${isSelected ? 'selected' : ''} ${!fits ? 'slot-picker-row-nofit' : ''}`}
            onClick={() => fits && onSelect(Number(item.id))}
          >
            <div className="slot-picker-row-main">
              <span className="slot-picker-name">{item.name}</span>
              <span className="slot-picker-stats">
                {isWeapon
                  ? `${item.size ?? 'Small'} (${weaponSlotCost(item)} slot${weaponSlotCost(item) > 1 ? 's' : ''}) · ${item.weight ?? 0}t · ${item.range || '—'} · ${item.heat_rating || '—'} · ${item.hit_dice || '—'}`
                  : itemType === 'Movement'
                    ? `${item.movement ?? 0} movement · ${item.weight ?? 0}t`
                    : itemType === 'Augment'
                      ? `${weaponSlotCost(item)} slot${weaponSlotCost(item) > 1 ? 's' : ''} · ${item.weight ?? 0}t`
                      : `${item.weight ?? 0}t`}
              </span>
            </div>
            {!isWeapon && item.effects && (
              <span className="slot-picker-row-effects">{item.effects}</span>
            )}
            {weaponFit && !fits && (
              <span className="slot-picker-row-effects">
                Not enough room in this slot
              </span>
            )}
          </div>
        );
      })}
      {options.length === 0 && !allowNone && (
        <p className="empty" style={{ padding: '6px 0' }}>
          No options available.
        </p>
      )}
    </div>
  );
}

function RosterEntry({
  entry,
  units,
  equipment,
  totalWeight,
  onRemove,
  onAssignEquipment,
  onAddCarried,
  onRemoveCarried,
}) {
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

  const [openSlotKey, setOpenSlotKey] = useState(null);

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

  function toggleSlot(key) {
    setOpenSlotKey((current) => (current === key ? null : key));
  }

  function weaponUsage(slot) {
    const requiredType = requiredTypeForSlot(slot);
    const slotOptions = unitEquipment.filter(
      (item) => (item.type ?? 'Movement') === requiredType,
    );
    const equippedItems = (entry.equipment?.[slot] ?? [])
      .filter(Boolean)
      .map((id) => slotOptions.find((item) => Number(item.id) === Number(id)))
      .filter(Boolean);
    const used = equippedItems.reduce(
      (sum, item) => sum + weaponSlotCost(item),
      0,
    );
    return { capacity: slotCounts[slot], used, equippedItems, slotOptions };
  }

  function renderSlotCards(slot) {
    if (slot === 'Movement') {
      const slotOptions = unitEquipment.filter(
        (item) => (item.type ?? 'Movement') === 'Movement',
      );
      const selectedId = entry.equipment?.Movement?.[0] ?? 0;
      const selected = slotOptions.find(
        (item) => Number(item.id) === Number(selectedId),
      );
      const key = 'Movement-0';
      return [
        <SlotCard
          key={key}
          label="Movement"
          item={selected}
          statOverride={selected ? `${selected.movement ?? 0} move` : undefined}
          isOpen={openSlotKey === key}
          disabled={slotOptions.length === 0}
          onToggle={() => toggleSlot(key)}
        />,
      ];
    }

    const { capacity, used, equippedItems, slotOptions } = weaponUsage(slot);
    const cards = equippedItems.map((item, i) => {
      const key = `${slot}-${i}`;
      return (
        <SlotCard
          key={key}
          label={`${slot} ${i + 1}`}
          item={item}
          isOpen={openSlotKey === key}
          disabled={false}
          onToggle={() => toggleSlot(key)}
        />
      );
    });
    if (used < capacity) {
      const addKey = `${slot}-new`;
      cards.push(
        <SlotCard
          key={addKey}
          label={slot}
          item={null}
          isOpen={openSlotKey === addKey}
          disabled={slotOptions.length === 0}
          onToggle={() => toggleSlot(addKey)}
        />,
      );
    }
    return cards;
  }

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

  return (
    <div
      className={`unit-row ${overMaxWeight ? 'over-max-weight' : ''}`}
      style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
      <div className="unit-info">
        <p className="unit-name">
          {overMaxWeight && (
            <span
              className="warning-icon warning-icon-max"
              title={`Over max weight (${unit.max_weight} t)`}
            >
              ⛔
            </span>
          )}
          {overDropWeight && (
            <span
              className="warning-icon warning-icon-drop"
              title={`Over max drop weight (${unit.max_drop_weight} t)`}
            >
              ⚠️
            </span>
          )}
          {unit.name} {isDropPod && <span className="badge">Drop Pod</span>}
        </p>
        <p className="unit-meta">{totalWeight} t</p>
        {maxWeight > 0 && (
          <div className="weight-bar-mini">
            <div className="weight-bar-mini-track">
              {hullWeight > 0 && (
                <div
                  className="weight-bar-mini-seg weight-bar-mini-seg-hull"
                  style={{
                    width: `${Math.min(100, (hullWeight / maxWeight) * 100)}%`,
                  }}
                  title={`${unit.name} hull: ${hullWeight}t`}
                />
              )}
              {equippedWeights.map((item, i) => (
                <div
                  key={item.key}
                  className="weight-bar-mini-seg"
                  style={{
                    width: `${Math.min(100, (item.weight / maxWeight) * 100)}%`,
                    background:
                      WEIGHT_SEGMENT_COLORS[i % WEIGHT_SEGMENT_COLORS.length],
                  }}
                  title={`${item.name}: ${item.weight}t`}
                />
              ))}
              {maxDropWeight > 0 && (
                <div
                  className="weight-bar-mini-drop-marker"
                  style={{
                    left: `${Math.min(100, (maxDropWeight / maxWeight) * 100)}%`,
                  }}
                />
              )}
            </div>
            <div className="weight-bar-mini-labels">
              <span>0t</span>
              {maxDropWeight > 0 && (
                <span
                  className={
                    totalWeight > maxDropWeight ? 'max-drop-exceeded' : ''
                  }
                >
                  Max drop {maxDropWeight}t
                </span>
              )}
              <span>Max {maxWeight}t</span>
            </div>
            {equippedWeights.length > 0 && (
              <div className="weight-legend">
                {equippedWeights.map((item, i) => (
                  <span className="legend-chip" key={item.key}>
                    <span
                      className="legend-swatch"
                      style={{
                        background:
                          WEIGHT_SEGMENT_COLORS[
                            i % WEIGHT_SEGMENT_COLORS.length
                          ],
                      }}
                    />
                    {item.name} {item.weight}t
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="unit-stats">{sizeLabel(unit.size)}</p>
        <p className="unit-stats">{statsLine}</p>
        <p className="unit-stats">
          <DiceIcons unit={unit} />
        </p>
        {maxWeight > 0 && (
          <p className="unit-stats">
            Effective movement: <b>{effectiveMovement}</b> (gear movement{' '}
            {movementGearStat}
            {excessDropWeight > 0
              ? ` − ${excessDropWeight}t over max drop`
              : ''}
            )
          </p>
        )}

        {isDropPod ? (
          <div className="equipment-slots">
            <SlotCard
              label="Equipment"
              item={dropPodSelected}
              statOverride={
                dropPodSelected &&
                (dropPodSelected.type ?? 'Movement') === 'Movement'
                  ? `${dropPodSelected.movement ?? 0} move`
                  : undefined
              }
              isOpen={openSlotKey === 'equipment'}
              disabled={hasMech || dropPodEquipmentOptions.length === 0}
              onToggle={() => toggleSlot('equipment')}
            />
          </div>
        ) : (
          <div className="equipment-slots-grid">
            {slotCounts.Head > 0 && (
              <div className="equipment-slots-panel equipment-slots-panel-head">
                <div className="equipment-slots-panel-label">
                  Head ({weaponUsage('Head').used}/{slotCounts.Head})
                </div>
                {renderSlotCards('Head')}
              </div>
            )}
            <div className="equipment-slots-panel">
              <div className="equipment-slots-panel-label">
                Left ({weaponUsage('Left').used}/{slotCounts.Left})
              </div>
              {renderSlotCards('Left')}
            </div>
            <div className="equipment-slots-panel">
              <div className="equipment-slots-panel-label">
                Right ({weaponUsage('Right').used}/{slotCounts.Right})
              </div>
              {renderSlotCards('Right')}
            </div>
            <div className="equipment-slots-panel equipment-slots-panel-movement">
              <div className="equipment-slots-panel-label">Movement</div>
              {renderSlotCards('Movement')}
            </div>
          </div>
        )}

        {isDropPod && openSlotKey === 'equipment' && (
          <SlotPicker
            title="Equipment"
            options={dropPodEquipmentOptions}
            selectedId={dropPodEquipmentId}
            allowNone
            isWeapon={false}
            onSelect={(id) => {
              onAssignEquipment('Movement', 0, id);
              setOpenSlotKey(null);
            }}
          />
        )}

        {!isDropPod &&
          openSlotKey &&
          (() => {
            const [slot, indexStr] = openSlotKey.split('-');

            if (slot === 'Movement') {
              const slotOptions = unitEquipment
                .filter((item) => (item.type ?? 'Movement') === 'Movement')
                .sort(
                  (a, b) => Number(b.movement ?? 0) - Number(a.movement ?? 0),
                );
              const selectedId = entry.equipment?.Movement?.[0] ?? 0;
              return (
                <SlotPicker
                  title="Movement"
                  options={slotOptions}
                  selectedId={selectedId}
                  allowNone={false}
                  isWeapon={false}
                  onSelect={(id) => {
                    onAssignEquipment('Movement', 0, id);
                    setOpenSlotKey(null);
                  }}
                />
              );
            }

            const { capacity, equippedItems, slotOptions } = weaponUsage(slot);
            const isNew = indexStr === 'new';
            const i = isNew ? equippedItems.length : Number(indexStr);
            const usedExcludingCurrent = equippedItems.reduce(
              (sum, item, idx) =>
                !isNew && idx === i ? sum : sum + weaponSlotCost(item),
              0,
            );
            const remaining = capacity - usedExcludingCurrent;
            const selectedId = isNew ? 0 : (equippedItems[i]?.id ?? 0);
            return (
              <SlotPicker
                title={`${slot} ${i + 1}`}
                options={slotOptions}
                selectedId={selectedId}
                allowNone={!isNew}
                isWeapon={requiredTypeForSlot(slot) === 'Weapon'}
                weaponFit={(item) => weaponSlotCost(item) <= remaining}
                onSelect={(id) => {
                  if (id > 0) {
                    const item = slotOptions.find(
                      (it) => Number(it.id) === Number(id),
                    );
                    if (item && weaponSlotCost(item) > remaining) return;
                  }
                  onAssignEquipment(slot, isNew ? -1 : i, id);
                  setOpenSlotKey(null);
                }}
              />
            );
          })()}

        {equippedWithEffects.map(({ key, item }) => (
          <p key={key} className="equipment-effects">
            {item.name}: {item.effects}
            {item.effects && item.effect_stats?.length > 0 ? ' · ' : ''}
            {item.effect_stats?.map((effect, i) => (
              <span className="effect-chip" key={`${key}-${effect.stat}-${i}`}>
                {effect.amount > 0 ? '+' : ''}
                {effect.amount} {effectStatLabel(effect.stat)}
              </span>
            ))}
          </p>
        ))}

        {isDropPod && (
          <div className="carried-models">
            <p className="carried-heading">Carried mech</p>
            {hasMech ? (
              carried.map((carriedEntry) => {
                const carriedUnit = units.find(
                  (u) => Number(u.id) === Number(carriedEntry.unit_id),
                );
                if (!carriedUnit) return null;
                return (
                  <div className="carried-row" key={carriedEntry.key}>
                    <span>
                      {carriedUnit.name}{' '}
                      <span className="unit-meta">
                        ({carriedUnit.weight} t)
                      </span>
                    </span>
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRemoveCarried(carriedEntry.key);
                      }}
                    >
                      <button type="submit" className="danger">
                        Remove
                      </button>
                    </form>
                  </div>
                );
              })
            ) : (
              <p className="empty" style={{ padding: '6px 0' }}>
                Nothing loaded yet.
              </p>
            )}
            {!hasMech &&
              !hasEquipment &&
              (carryOptions.length > 0 ? (
                <LoadMechForm options={carryOptions} onAdd={onAddCarried} />
              ) : (
                <p className="empty" style={{ padding: '6px 0' }}>
                  No other {unit.manufacturer} models to load.
                </p>
              ))}
          </div>
        )}

        <form
          className="remove-row"
          onSubmit={(e) => {
            e.preventDefault();
            onRemove();
          }}
        >
          <button type="submit" className="danger-ghost">
            ✕ Remove
          </button>
        </form>
      </div>
    </div>
  );
}

export default RosterEntry;
