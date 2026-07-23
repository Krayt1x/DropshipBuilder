import { SLOTS, DROP_POD_SIZE } from '../lib/constants.js';

function CarriedAddForm({ options, onAdd }) {
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
      <button type="submit">Add model</button>
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
        <div className="equipment-slots">
          {SLOTS.flatMap((slot) => {
            const requiredType = slot === 'Movement' ? 'Movement' : 'Weapon';
            const slotOptions = unitEquipment.filter(
              (item) =>
                (item.type ?? 'Movement') === requiredType &&
                !(isDropPod && item.no_drop_pod),
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

        {isDropPod && (
          <div className="carried-models">
            <p className="carried-heading">Carried models</p>
            {(entry.carried ?? []).length === 0 ? (
              <p className="empty" style={{ padding: '6px 0' }}>
                Nothing carried yet.
              </p>
            ) : (
              entry.carried.map((carried) => {
                const carriedUnit = units.find(
                  (u) => Number(u.id) === Number(carried.unit_id),
                );
                if (!carriedUnit) return null;
                return (
                  <div className="carried-row" key={carried.key}>
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
                        onRemoveCarried(carried.key);
                      }}
                    >
                      <button type="submit" className="danger">
                        Remove
                      </button>
                    </form>
                  </div>
                );
              })
            )}
            {carryOptions.length > 0 ? (
              <CarriedAddForm options={carryOptions} onAdd={onAddCarried} />
            ) : (
              <p className="empty" style={{ padding: '6px 0' }}>
                No other {unit.manufacturer} models to carry.
              </p>
            )}
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
