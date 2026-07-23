import { useState } from 'react';
import { SLOTS, DROP_POD_SIZE, sizeLabel, sizeTier } from '../lib/constants.js';
import DiceIcons from './DiceIcons.jsx';

const WEIGHT_SEGMENT_COLORS = [
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
];

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

function SlotCard({ label, item, isOpen, disabled, onToggle }) {
  return (
    <button
      type="button"
      className={`slot-card ${isOpen ? 'open' : ''}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="slot-card-label">{label}</span>
      <span className="slot-card-item">{item?.name ?? 'Empty'}</span>
      {item && <span className="slot-card-wt">{item.weight ?? 0}t</span>}
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
  weightMultiplier,
  onSelect,
}) {
  const multiplier = weightMultiplier ?? 1;
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
      {options.map((item) => (
        <div
          key={item.id}
          className={`slot-picker-row ${!isWeapon && item.effects ? 'slot-picker-row-stack' : ''} ${Number(selectedId) === Number(item.id) ? 'selected' : ''}`}
          onClick={() => onSelect(Number(item.id))}
        >
          <div className="slot-picker-row-main">
            <span className="slot-picker-name">{item.name}</span>
            <span className="slot-picker-stats">
              {isWeapon
                ? `${item.weight ?? 0}t · ${item.range || '—'} · ${item.heat_rating || '—'} · ${item.hit_dice || '—'}`
                : `${(item.weight ?? 0) * Number(item.weight_ratio ?? 1) * multiplier}t`}
            </span>
          </div>
          {!isWeapon && item.effects && (
            <span className="slot-picker-row-effects">{item.effects}</span>
          )}
        </div>
      ))}
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
  const slotCounts = {
    Movement: 1,
    Left: Math.max(0, Number(unit.left_slots ?? 1)),
    Right: Math.max(0, Number(unit.right_slots ?? 1)),
    Head: Math.max(0, Number(unit.head_slots ?? 0)),
  };

  const statsLine = [
    `Armor ${unit.armor || '—'}`,
    `HP ${unit.hp ?? 0}`,
    `Move ${unit.base_movement ?? 0}`,
  ].join(' · ');

  const maxWeight = Number(unit.max_weight) || 0;
  const maxDropWeight = Number(unit.max_drop_weight) || 0;
  const overMaxWeight = maxWeight > 0 && totalWeight > maxWeight;
  const overDropWeight =
    !overMaxWeight && maxDropWeight > 0 && totalWeight > maxDropWeight;
  const spareCapacity = maxWeight - totalWeight;
  const effectiveMovement = spareCapacity + Number(unit.base_movement ?? 0);

  const [openSlotKey, setOpenSlotKey] = useState(null);

  const dropPodEquipmentId = entry.equipment?.Movement?.[0] ?? 0;
  const hasEquipment = Boolean(dropPodEquipmentId);
  const dropPodEquipmentOptions = unitEquipment.filter(
    (item) => !item.no_drop_pod,
  );
  const dropPodSelected = dropPodEquipmentOptions.find(
    (item) => Number(item.id) === Number(dropPodEquipmentId),
  );

  function toggleSlot(key) {
    setOpenSlotKey((current) => (current === key ? null : key));
  }

  function renderSlotCards(slot) {
    const requiredType = slot === 'Movement' ? 'Movement' : 'Weapon';
    const slotOptions = unitEquipment.filter(
      (item) => (item.type ?? 'Movement') === requiredType,
    );
    const count = slotCounts[slot];
    return Array.from({ length: count }, (_, i) => {
      const selectedId = entry.equipment?.[slot]?.[i] ?? 0;
      const selected = slotOptions.find(
        (item) => Number(item.id) === Number(selectedId),
      );
      const key = `${slot}-${i}`;
      return (
        <SlotCard
          key={key}
          label={count > 1 ? `${slot} ${i + 1}` : slot}
          item={selected}
          isOpen={openSlotKey === key}
          disabled={slotOptions.length === 0}
          onToggle={() => toggleSlot(key)}
        />
      );
    });
  }

  const equippedWithEffects = [];
  const equippedWeights = [];
  const tier = sizeTier(unit.size);
  if (isDropPod) {
    if (dropPodSelected?.effects) {
      equippedWithEffects.push({ key: 'equipment', item: dropPodSelected });
    }
    if (dropPodSelected) {
      const isMovement = (dropPodSelected.type ?? 'Movement') === 'Movement';
      const ratio = isMovement ? Number(dropPodSelected.weight_ratio ?? 1) : 1;
      const weight =
        Number(dropPodSelected.weight ?? 0) * ratio * (isMovement ? tier : 1);
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
      const requiredType = slot === 'Movement' ? 'Movement' : 'Weapon';
      const slotOptions = unitEquipment.filter(
        (item) => (item.type ?? 'Movement') === requiredType,
      );
      const count = slotCounts[slot];
      for (let i = 0; i < count; i += 1) {
        const selectedId = entry.equipment?.[slot]?.[i] ?? 0;
        const selected = slotOptions.find(
          (item) => Number(item.id) === Number(selectedId),
        );
        if (selected?.effects) {
          equippedWithEffects.push({ key: `${slot}-${i}`, item: selected });
        }
        if (selected) {
          const isMovement = requiredType === 'Movement';
          const ratio = isMovement ? Number(selected.weight_ratio ?? 1) : 1;
          const weight =
            Number(selected.weight ?? 0) * ratio * (isMovement ? tier : 1);
          if (weight > 0) {
            equippedWeights.push({
              key: `${slot}-${i}`,
              name: selected.name,
              weight,
            });
          }
        }
      }
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
              {maxDropWeight > 0 && <span>Max drop {maxDropWeight}t</span>}
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
            Effective movement: <b>{effectiveMovement}</b> (base{' '}
            {unit.base_movement ?? 0} {spareCapacity >= 0 ? '+' : '-'}{' '}
            {Math.abs(spareCapacity)} spare capacity)
          </p>
        )}

        {isDropPod ? (
          <div className="equipment-slots">
            <SlotCard
              label="Equipment"
              item={dropPodSelected}
              isOpen={openSlotKey === 'equipment'}
              disabled={hasMech || dropPodEquipmentOptions.length === 0}
              onToggle={() => toggleSlot('equipment')}
            />
          </div>
        ) : (
          <div className="equipment-slots-grid">
            <div className="equipment-slots-panel">
              <div className="equipment-slots-panel-label">Left</div>
              {renderSlotCards('Left')}
            </div>
            <div className="equipment-slots-panel">
              <div className="equipment-slots-panel-label">Right</div>
              {renderSlotCards('Right')}
            </div>
            <div className="equipment-slots-panel equipment-slots-panel-movement">
              <div className="equipment-slots-panel-label">Movement</div>
              {renderSlotCards('Movement')}
            </div>
            {slotCounts.Head > 0 && (
              <div className="equipment-slots-panel equipment-slots-panel-head">
                <div className="equipment-slots-panel-label">Head</div>
                {renderSlotCards('Head')}
              </div>
            )}
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
            const i = Number(indexStr);
            const requiredType = slot === 'Movement' ? 'Movement' : 'Weapon';
            const slotOptions = unitEquipment
              .filter((item) => (item.type ?? 'Movement') === requiredType)
              .sort((a, b) =>
                slot === 'Movement'
                  ? Number(a.weight ?? 0) * Number(a.weight_ratio ?? 1) -
                    Number(b.weight ?? 0) * Number(b.weight_ratio ?? 1)
                  : 0,
              );
            const count = slotCounts[slot];
            const selectedId = entry.equipment?.[slot]?.[i] ?? 0;
            return (
              <SlotPicker
                title={count > 1 ? `${slot} ${i + 1}` : slot}
                options={slotOptions}
                selectedId={selectedId}
                allowNone={slot !== 'Movement'}
                isWeapon={requiredType === 'Weapon'}
                weightMultiplier={slot === 'Movement' ? tier : 1}
                onSelect={(id) => {
                  onAssignEquipment(slot, i, id);
                  setOpenSlotKey(null);
                }}
              />
            );
          })()}

        {equippedWithEffects.map(({ key, item }) => (
          <p key={key} className="equipment-effects">
            {item.name}: {item.effects}
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
          className="inline remove-row"
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
