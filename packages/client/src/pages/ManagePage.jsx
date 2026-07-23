import { useState } from 'react';
import {
  UNIT_SIZES,
  EQUIPMENT_TYPES,
  diceSummary,
  sizeLabel,
} from '../lib/constants.js';
import { nextId } from '../lib/storage.js';
import UnitForm from '../components/UnitForm.jsx';
import EquipmentForm from '../components/EquipmentForm.jsx';
import ExportPanel from '../components/ExportPanel.jsx';

function ManagePage({
  manufacturers,
  setManufacturers,
  units,
  setUnits,
  equipment,
  setEquipment,
}) {
  const [flash, setFlash] = useState(null);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);

  const editingUnit =
    editingUnitId != null
      ? units.find((u) => Number(u.id) === editingUnitId)
      : null;
  const editingEquipmentItem =
    editingEquipmentId != null
      ? equipment.find((e) => Number(e.id) === editingEquipmentId)
      : null;

  function showFlash(message, isError = false) {
    setFlash({ message, isError });
  }

  function addManufacturer(e) {
    e.preventDefault();
    const name = (new FormData(e.target).get('name') || '').toString().trim();
    if (name === '') {
      showFlash('Manufacturer name cannot be empty.', true);
      return;
    }
    if (manufacturers.includes(name)) {
      showFlash(`A manufacturer named "${name}" already exists.`, true);
      return;
    }
    setManufacturers((m) => [...m, name]);
    showFlash(`Added manufacturer "${name}".`);
    e.target.reset();
  }

  function renameManufacturer(oldName, newNameRaw) {
    const newName = newNameRaw.trim();
    if (newName === '') {
      showFlash('Manufacturer name cannot be empty.', true);
      return;
    }
    if (newName !== oldName && manufacturers.includes(newName)) {
      showFlash(`A manufacturer named "${newName}" already exists.`, true);
      return;
    }
    setManufacturers((m) =>
      m.map((name) => (name === oldName ? newName : name)),
    );
    setUnits((u) =>
      u.map((unit) =>
        unit.manufacturer === oldName
          ? { ...unit, manufacturer: newName }
          : unit,
      ),
    );
    setEquipment((eq) =>
      eq.map((item) =>
        item.manufacturer === oldName
          ? { ...item, manufacturer: newName }
          : item,
      ),
    );
    showFlash(`Renamed "${oldName}" to "${newName}".`);
  }

  function submitUnit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = (form.get('name') || '').toString().trim();
    const manufacturer = (form.get('manufacturer') || '').toString();
    const size = (form.get('size') || '').toString();
    const weight = Number(form.get('weight')) || 0;

    if (
      name === '' ||
      !manufacturers.includes(manufacturer) ||
      !(size in UNIT_SIZES) ||
      weight < 1
    ) {
      showFlash(
        'Fill in every field with a valid value (weight must be at least 1 tonne).',
        true,
      );
      return;
    }

    const stats = {
      armor: Number(form.get('armor')) || 0,
      max_weight: Number(form.get('max_weight')) || 0,
      max_drop_weight: Number(form.get('max_drop_weight')) || 0,
      hp: Number(form.get('hp')) || 0,
      base_movement: Number(form.get('base_movement')) || 0,
      dice_blue: Math.max(0, Number(form.get('dice_blue')) || 0),
      dice_red: Math.max(0, Number(form.get('dice_red')) || 0),
      dice_green: Math.max(0, Number(form.get('dice_green')) || 0),
      left_slots: Math.max(0, Number(form.get('left_slots')) || 0),
      right_slots: Math.max(0, Number(form.get('right_slots')) || 0),
    };

    if (editingUnit) {
      const id = editingUnit.id;
      setUnits((u) =>
        u.map((unit) =>
          Number(unit.id) === Number(id)
            ? { id, name, manufacturer, size, weight, ...stats }
            : unit,
        ),
      );
      showFlash(`Saved changes to "${name}".`);
      setEditingUnitId(null);
    } else {
      setUnits((u) => [
        ...u,
        { id: nextId(u), name, manufacturer, size, weight, ...stats },
      ]);
      showFlash(`Added "${name}" to the catalog.`);
      e.target.reset();
    }
  }

  function deleteUnit(id) {
    const unit = units.find((u) => Number(u.id) === id);
    setUnits((u) => u.filter((item) => Number(item.id) !== id));
    showFlash(
      unit ? `Removed "${unit.name}" from the catalog.` : 'Unit removed.',
    );
    if (editingUnitId === id) setEditingUnitId(null);
  }

  function submitEquipment(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = (form.get('name') || '').toString().trim();
    const manufacturer = (form.get('manufacturer') || '').toString();
    const type = (form.get('type') || '').toString();

    if (
      name === '' ||
      !manufacturers.includes(manufacturer) ||
      !EQUIPMENT_TYPES.includes(type)
    ) {
      showFlash('Fill in every equipment field with a valid value.', true);
      return;
    }

    const payload = {
      name,
      manufacturer,
      type,
      effects: (form.get('effects') || '').toString().trim(),
      weight: Number(form.get('weight')) || 0,
      range: Number(form.get('range')) || 0,
      heat_rating: (form.get('heat_rating') || '').toString().trim(),
      hit_dice: (form.get('hit_dice') || '').toString().trim(),
    };

    if (editingEquipmentItem) {
      const id = editingEquipmentItem.id;
      setEquipment((eq) =>
        eq.map((item) =>
          Number(item.id) === Number(id) ? { id, ...payload } : item,
        ),
      );
      showFlash(`Saved changes to "${name}".`);
      setEditingEquipmentId(null);
    } else {
      setEquipment((eq) => [...eq, { id: nextId(eq), ...payload }]);
      showFlash(`Added "${name}" to the equipment catalog.`);
      e.target.reset();
    }
  }

  function deleteEquipment(id) {
    const item = equipment.find((e) => Number(e.id) === id);
    setEquipment((eq) => eq.filter((entry) => Number(entry.id) !== id));
    showFlash(
      item
        ? `Removed "${item.name}" from the equipment catalog.`
        : 'Equipment removed.',
    );
    if (editingEquipmentId === id) setEditingEquipmentId(null);
  }

  return (
    <div className="container">
      <h1>Manage available models</h1>

      {flash && (
        <div className={`flash ${flash.isError ? 'error' : ''}`}>
          {flash.message}
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Add a manufacturer</h2>
        <form
          style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
          onSubmit={addManufacturer}
        >
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="manufacturer_name">Name</label>
            <input
              type="text"
              id="manufacturer_name"
              name="name"
              placeholder="New Manufacturer"
              required
            />
          </div>
          <button type="submit">Add manufacturer</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>
          {editingUnit ? 'Edit unit' : 'Add a new unit'}
        </h2>
        {manufacturers.length === 0 ? (
          <p className="empty">Add a manufacturer above before adding units.</p>
        ) : (
          <UnitForm
            key={editingUnit?.id ?? 'new-unit'}
            manufacturers={manufacturers}
            editing={editingUnit}
            onSubmit={submitUnit}
            onCancel={() => setEditingUnitId(null)}
          />
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>
          {editingEquipmentItem ? 'Edit equipment' : 'Add equipment'}
        </h2>
        {manufacturers.length === 0 ? (
          <p className="empty">
            Add a manufacturer above before adding equipment.
          </p>
        ) : (
          <EquipmentForm
            key={editingEquipmentItem?.id ?? 'new-equipment'}
            manufacturers={manufacturers}
            editing={editingEquipmentItem}
            onSubmit={submitEquipment}
            onCancel={() => setEditingEquipmentId(null)}
          />
        )}
      </div>

      {manufacturers.map((manufacturer) => {
        const manufacturerUnits = units.filter(
          (u) => u.manufacturer === manufacturer,
        );
        const manufacturerEquipment = equipment.filter(
          (e) => e.manufacturer === manufacturer,
        );
        return (
          <div className="card" key={manufacturer}>
            <div className="manufacturer-header">
              <h2 style={{ fontSize: 15, margin: 0 }}>
                {manufacturer} ({manufacturerUnits.length})
              </h2>
              <form
                className="inline manufacturer-rename"
                onSubmit={(e) => {
                  e.preventDefault();
                  renameManufacturer(
                    manufacturer,
                    (new FormData(e.target).get('new_name') || '').toString(),
                  );
                }}
              >
                <input
                  type="text"
                  name="new_name"
                  defaultValue={manufacturer}
                  aria-label={`Rename ${manufacturer}`}
                />
                <button type="submit" className="ghost">
                  Rename
                </button>
              </form>
            </div>
            {manufacturerUnits.length === 0 ? (
              <p className="empty">
                No units for this manufacturer yet. Add one above.
              </p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Weight (t)</th>
                      <th>Armor</th>
                      <th>Max wt</th>
                      <th>Max drop wt</th>
                      <th>HP</th>
                      <th>Move</th>
                      <th>Dice</th>
                      <th>L slots</th>
                      <th>R slots</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manufacturerUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td>{unit.name}</td>
                        <td>
                          <span className="badge">{sizeLabel(unit.size)}</span>
                        </td>
                        <td>{unit.weight} t</td>
                        <td>{unit.armor ?? 0}</td>
                        <td>{unit.max_weight ?? 0}</td>
                        <td>{unit.max_drop_weight ?? 0}</td>
                        <td>{unit.hp ?? 0}</td>
                        <td>{unit.base_movement ?? 0}</td>
                        <td>{diceSummary(unit)}</td>
                        <td>{unit.left_slots ?? 1}</td>
                        <td>{unit.right_slots ?? 1}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => setEditingUnitId(Number(unit.id))}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => deleteUnit(Number(unit.id))}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '16px 0 8px',
              }}
            >
              Equipment
            </h3>
            {manufacturerEquipment.length === 0 ? (
              <p className="empty">
                No equipment for this manufacturer yet. Add some above.
              </p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Weight</th>
                      <th>Range</th>
                      <th>Heat</th>
                      <th>Hit dice</th>
                      <th>Effects</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manufacturerEquipment.map((item) => {
                      const isWeapon = (item.type ?? 'Movement') === 'Weapon';
                      return (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>
                            <span className="badge">
                              {item.type ?? 'Movement'}
                            </span>
                          </td>
                          <td>{item.weight ?? 0} t</td>
                          <td>{isWeapon ? (item.range ?? 0) : '—'}</td>
                          <td>{isWeapon ? item.heat_rating || '—' : '—'}</td>
                          <td>{isWeapon ? item.hit_dice || '—' : '—'}</td>
                          <td>{item.effects || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="ghost"
                                onClick={() =>
                                  setEditingEquipmentId(Number(item.id))
                                }
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => deleteEquipment(Number(item.id))}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <ExportPanel
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />
    </div>
  );
}

export default ManagePage;
