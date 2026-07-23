import { useMemo } from 'react';
import { useLocalStorageState, makeKey } from '../lib/storage.js';
import { SLOTS, DROP_POD_SIZE, sizeLabel } from '../lib/constants.js';
import RosterEntry from '../components/RosterEntry.jsx';
import DiceIcons from '../components/DiceIcons.jsx';

function emptyEquipmentSlots() {
  return SLOTS.reduce((acc, slot) => {
    acc[slot] = [];
    return acc;
  }, {});
}

function bestMovementId(equipmentCatalog, manufacturer) {
  const options = equipmentCatalog
    .filter(
      (item) =>
        item.manufacturer === manufacturer &&
        (item.type ?? 'Movement') === 'Movement',
    )
    .slice()
    .sort((a, b) => Number(b.movement ?? 0) - Number(a.movement ?? 0));
  return options[0]?.id ?? null;
}

function equipmentWeight(entrySlots, equipmentCatalog) {
  return SLOTS.reduce((sum, slot) => {
    const ids = entrySlots?.[slot] ?? [];
    return (
      sum +
      ids.reduce((slotSum, id) => {
        if (!id) return slotSum;
        const item = equipmentCatalog.find((e) => Number(e.id) === Number(id));
        if (!item) return slotSum;
        return slotSum + Number(item.weight ?? 0);
      }, 0)
    );
  }, 0);
}

function carriedWeight(carried, unitsCatalog) {
  return (carried ?? []).reduce((sum, c) => {
    const carriedUnit = unitsCatalog.find(
      (u) => Number(u.id) === Number(c.unit_id),
    );
    return sum + Number(carriedUnit?.weight ?? 0);
  }, 0);
}

function ListBuilderPage({ manufacturers, units, equipment }) {
  const [settings, setSettings] = useLocalStorageState(
    'dropshipbuilder:settings',
    {
      list_name: 'New List',
      manufacturer: manufacturers[0] ?? '',
      weight_limit: 100,
    },
  );
  const [roster, setRoster] = useLocalStorageState(
    'dropshipbuilder:roster',
    [],
  );

  const manufacturer = manufacturers.includes(settings.manufacturer)
    ? settings.manufacturer
    : (manufacturers[0] ?? '');

  const catalog = useMemo(
    () =>
      units
        .filter((u) => u.manufacturer === manufacturer)
        .slice()
        .sort((a, b) => a.weight - b.weight),
    [units, manufacturer],
  );

  const rosterUnits = useMemo(
    () =>
      roster
        .map((entry) => {
          const unit = units.find(
            (u) => Number(u.id) === Number(entry.unit_id),
          );
          if (!unit) return null;
          return {
            key: entry.key,
            unit,
            equipment: entry.equipment ?? emptyEquipmentSlots(),
            carried: entry.carried ?? [],
          };
        })
        .filter(Boolean),
    [roster, units],
  );

  const totalWeight = rosterUnits.reduce(
    (sum, entry) =>
      sum +
      Number(entry.unit.weight) +
      equipmentWeight(entry.equipment, equipment) +
      carriedWeight(entry.carried, units),
    0,
  );
  const weightLimit = Number(settings.weight_limit) || 0;
  const pct =
    weightLimit > 0
      ? Math.min(100, Math.round((totalWeight / weightLimit) * 100))
      : 0;
  const over = totalWeight > weightLimit;

  function updateSettings(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setSettings({
      list_name:
        (form.get('list_name') || '').toString().trim() || 'Untitled list',
      manufacturer: manufacturers.includes(form.get('manufacturer'))
        ? form.get('manufacturer')
        : manufacturer,
      weight_limit: Math.max(1, Number(form.get('weight_limit')) || 100),
    });
  }

  function handleManufacturerChange(e) {
    setSettings((s) => ({ ...s, manufacturer: e.target.value }));
  }

  function addToList(unitId) {
    const unit = units.find((u) => Number(u.id) === Number(unitId));
    const initialEquipment = emptyEquipmentSlots();
    if (unit && unit.size !== DROP_POD_SIZE) {
      const best = bestMovementId(equipment, unit.manufacturer);
      if (best != null) initialEquipment.Movement = [best];
    }
    setRoster((r) => [
      ...r,
      {
        key: makeKey('r'),
        unit_id: unitId,
        equipment: initialEquipment,
        carried: [],
      },
    ]);
  }

  function removeFromList(key) {
    setRoster((r) => r.filter((entry) => entry.key !== key));
  }

  function assignEquipment(key, slot, slotIndex, equipmentId) {
    setRoster((r) =>
      r.map((entry) => {
        if (entry.key !== key) return entry;
        if (equipmentId > 0 && (entry.carried ?? []).length > 0) {
          return entry;
        }
        const nextEquipment = { ...(entry.equipment ?? emptyEquipmentSlots()) };
        const slotList = [...(nextEquipment[slot] ?? [])];
        if (slotIndex === -1) {
          if (equipmentId > 0) slotList.push(equipmentId);
        } else if (equipmentId > 0) {
          slotList[slotIndex] = equipmentId;
        } else {
          slotList.splice(slotIndex, 1);
        }
        nextEquipment[slot] = slotList;
        return { ...entry, equipment: nextEquipment };
      }),
    );
  }

  function addCarriedModel(key, carriedUnitId) {
    setRoster((r) =>
      r.map((entry) => {
        if (entry.key !== key || (entry.carried ?? []).length > 0) {
          return entry;
        }
        return {
          ...entry,
          carried: [{ key: makeKey('c'), unit_id: carriedUnitId }],
        };
      }),
    );
  }

  function removeCarriedModel(key, carriedKey) {
    setRoster((r) =>
      r.map((entry) =>
        entry.key === key
          ? {
              ...entry,
              carried: (entry.carried ?? []).filter(
                (c) => c.key !== carriedKey,
              ),
            }
          : entry,
      ),
    );
  }

  function clearList() {
    setRoster([]);
  }

  return (
    <div className="container">
      <h1>List builder</h1>

      <div className="card">
        <form className="settings-row" onSubmit={updateSettings}>
          <div className="field">
            <label htmlFor="list_name">List name</label>
            <input
              type="text"
              id="list_name"
              name="list_name"
              defaultValue={settings.list_name}
              key={settings.list_name}
            />
          </div>
          <div className="field">
            <label htmlFor="manufacturer">Manufacturer</label>
            <select
              id="manufacturer"
              name="manufacturer"
              value={manufacturer}
              onChange={handleManufacturerChange}
            >
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="weight_limit">Weight limit (tonnes)</label>
            <input
              type="number"
              id="weight_limit"
              name="weight_limit"
              defaultValue={settings.weight_limit}
              key={settings.weight_limit}
              min="0"
              step="1"
            />
          </div>
          <button type="submit">Update</button>
        </form>

        <div className="weight-label" style={{ marginTop: 14 }}>
          <span>Weight used</span>
          <span>
            {totalWeight.toLocaleString()} t / {weightLimit.toLocaleString()} t
          </span>
        </div>
        <div className="weight-bar-track">
          <div
            className={`weight-bar-fill ${over ? 'over' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="columns">
        <div>
          <h2 style={{ fontSize: 15 }}>Unit catalogue — {manufacturer}</h2>
          {catalog.length === 0 ? (
            <p className="empty">
              No units available for this manufacturer yet. Add some on the
              manage page.
            </p>
          ) : (
            catalog.map((unit) => (
              <div className="unit-row" key={unit.id}>
                <div className="unit-info">
                  <p className="unit-name">{unit.name}</p>
                  <p className="unit-meta">{unit.weight} t</p>
                  {Number(unit.max_weight ?? 0) > 0 && (
                    <p className="unit-stats">
                      Max weight {unit.max_weight}t · Max drop{' '}
                      {unit.max_drop_weight ?? 0}t
                    </p>
                  )}
                  <p className="unit-stats">
                    Armor {unit.armor || '—'} · HP {unit.hp ?? 0}
                  </p>
                  <p className="unit-stats">
                    <DiceIcons unit={unit} />
                  </p>
                  <p className="unit-stats">
                    Slots: L {unit.left_slots ?? 1} · R {unit.right_slots ?? 1}
                    {Number(unit.head_slots ?? 0) > 0
                      ? ` · H ${unit.head_slots}`
                      : ''}
                  </p>
                </div>
                <span className="badge">{sizeLabel(unit.size)}</span>
                <button type="button" onClick={() => addToList(unit.id)}>
                  Add
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 15 }}>Your roster</h2>
          <div className="card" style={{ padding: '0.75rem' }}>
            {rosterUnits.length === 0 ? (
              <p className="empty">No units added yet.</p>
            ) : (
              <>
                {rosterUnits.map((entry) => (
                  <RosterEntry
                    key={entry.key}
                    entry={entry}
                    units={units}
                    equipment={equipment}
                    totalWeight={
                      Number(entry.unit.weight) +
                      equipmentWeight(entry.equipment, equipment) +
                      carriedWeight(entry.carried, units)
                    }
                    onRemove={() => removeFromList(entry.key)}
                    onAssignEquipment={(slot, slotIndex, equipmentId) =>
                      assignEquipment(entry.key, slot, slotIndex, equipmentId)
                    }
                    onAddCarried={(carriedUnitId) =>
                      addCarriedModel(entry.key, carriedUnitId)
                    }
                    onRemoveCarried={(carriedKey) =>
                      removeCarriedModel(entry.key, carriedKey)
                    }
                  />
                ))}
                <form
                  className="inline"
                  style={{ display: 'block', marginTop: 10 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    clearList();
                  }}
                >
                  <button type="submit" className="ghost">
                    Clear list
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListBuilderPage;
