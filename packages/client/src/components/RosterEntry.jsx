import { SLOTS, DROP_POD_SIZE } from '../lib/constants.js';

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

function RosterEntry({
  entry,
  units,
  equipment,
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
  };

  const dropPodEquipmentId = entry.equipment?.Movement?.[0] ?? 0;
  const hasEquipment = Boolean(dropPodEquipmentId);
  const dropPodEquipmentOptions = unitEquipment.filter(
    (item) => !item.no_drop_pod,
  );

  return (
    <div
      className="unit-row"
      style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
      <div className="unit-info">
        <p className="unit-name">
          {unit.name} {isDropPod && <span className="badge">Drop Pod</span>}
        </p>
        <p className="unit-meta">{unit.weight} t</p>

        {isDropPod ? (
          <div className="equipment-slots">
            <label className="slot-label">
              Equipment
              <select
                value={dropPodEquipmentId}
                disabled={hasMech || dropPodEquipmentOptions.length === 0}
                onChange={(e) =>
                  onAssignEquipment('Movement', 0, Number(e.target.value))
                }
              >
                <option value={0}>None</option>
                {dropPodEquipmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="equipment-slots">
            {SLOTS.flatMap((slot) => {
              const requiredType = slot === 'Movement' ? 'Movement' : 'Weapon';
              const slotOptions = unitEquipment.filter(
                (item) => (item.type ?? 'Movement') === requiredType,
              );
              const count = slotCounts[slot];
              return Array.from({ length: count }, (_, i) => (
                <label className="slot-label" key={`${slot}-${i}`}>
                  {count > 1 ? `${slot} ${i + 1}` : slot}
                  <select
                    value={entry.equipment?.[slot]?.[i] ?? 0}
                    disabled={slotOptions.length === 0}
                    onChange={(e) =>
                      onAssignEquipment(slot, i, Number(e.target.value))
                    }
                  >
                    <option value={0}>None</option>
                    {slotOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ));
            })}
          </div>
        )}

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
      </div>
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          onRemove();
        }}
      >
        <button type="submit" className="danger">
          Remove
        </button>
      </form>
    </div>
  );
}

export default RosterEntry;
