import { Fragment, useState } from 'react';
import {
  UNIT_SIZES,
  EQUIPMENT_TYPES,
  WEAPON_SIZES,
  sizeLabel,
} from '../lib/constants.js';
import { nextId, purgeCatalogCache } from '../lib/storage.js';
import UnitForm from '../components/UnitForm.jsx';
import EquipmentForm from '../components/EquipmentForm.jsx';
import ExportPanel from '../components/ExportPanel.jsx';
import DiceIcons from '../components/DiceIcons.jsx';

function trueWeight(item) {
  const raw = Number(item.weight ?? 0) * Number(item.weight_ratio ?? 1);
  return Number.isInteger(raw) ? raw : raw.toFixed(1);
}

function compareValues(a, b) {
  const an = Number(a);
  const bn = Number(b);
  const aIsNum = a !== '' && a != null && !Number.isNaN(an);
  const bIsNum = b !== '' && b != null && !Number.isNaN(bn);
  if (aIsNum && bIsNum) return an - bn;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

function sortRows(rows, sort) {
  return rows.slice().sort((a, b) => {
    const cmp = compareValues(a[sort.key], b[sort.key]);
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

function toggleSort(setSort, key) {
  setSort((s) =>
    s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' },
  );
}

function SortTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}
      {active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
}

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
  const [showManufacturerForm, setShowManufacturerForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [unitSort, setUnitSort] = useState({ key: 'weight', dir: 'asc' });
  const [movementSort, setMovementSort] = useState({
    key: 'weight',
    dir: 'asc',
  });
  const [weaponSort, setWeaponSort] = useState({ key: 'weight', dir: 'asc' });
  const [activeManufacturer, setActiveManufacturer] = useState(
    manufacturers[0] ?? null,
  );

  const currentManufacturer = manufacturers.includes(activeManufacturer)
    ? activeManufacturer
    : (manufacturers[0] ?? null);

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
    setEquipment((eq) => [
      ...eq,
      {
        id: nextId(eq),
        name: 'Standard Movement',
        manufacturer: name,
        type: 'Movement',
        effects: '',
        weight: 0,
        range: 0,
        heat_rating: '',
        hit_dice: '',
        no_drop_pod: false,
      },
    ]);
    showFlash(`Added manufacturer "${name}".`);
    setActiveManufacturer(name);
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
    setActiveManufacturer((current) =>
      current === oldName ? newName : current,
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
      armor: (form.get('armor') || '').toString().trim(),
      max_weight: Number(form.get('max_weight')) || 0,
      max_drop_weight: Number(form.get('max_drop_weight')) || 0,
      hp: Number(form.get('hp')) || 0,
      base_movement: Number(form.get('base_movement')) || 0,
      dice_blue: Math.max(0, Number(form.get('dice_blue')) || 0),
      dice_red: Math.max(0, Number(form.get('dice_red')) || 0),
      dice_green: Math.max(0, Number(form.get('dice_green')) || 0),
      left_slots: Math.max(0, Number(form.get('left_slots')) || 0),
      right_slots: Math.max(0, Number(form.get('right_slots')) || 0),
      head_slots: Math.max(0, Number(form.get('head_slots')) || 0),
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
      showFlash(`Added "${name}" to the catalogue.`);
      e.target.reset();
    }
  }

  function deleteUnit(id) {
    const unit = units.find((u) => Number(u.id) === id);
    setUnits((u) => u.filter((item) => Number(item.id) !== id));
    showFlash(
      unit ? `Removed "${unit.name}" from the catalogue.` : 'Unit removed.',
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

    const weightRatioRaw = form.get('weight_ratio');
    const payload = {
      name,
      manufacturer,
      type,
      effects: (form.get('effects') || '').toString().trim(),
      weight: Number(form.get('weight')) || 0,
      weight_ratio:
        weightRatioRaw != null && weightRatioRaw !== ''
          ? Math.max(0, Number(weightRatioRaw))
          : 1,
      range: (form.get('range') || '').toString().trim(),
      heat_rating: (form.get('heat_rating') || '').toString().trim(),
      hit_dice: (form.get('hit_dice') || '').toString().trim(),
      no_drop_pod: form.get('no_drop_pod') === 'on',
    };

    if (type === 'Weapon') {
      const sizeRaw = (form.get('size') || '').toString();
      payload.size = WEAPON_SIZES.includes(sizeRaw) ? sizeRaw : 'Small';
    }

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
      showFlash(`Added "${name}" to the equipment catalogue.`);
      e.target.reset();
    }
  }

  function deleteEquipment(id) {
    const item = equipment.find((e) => Number(e.id) === id);
    setEquipment((eq) => eq.filter((entry) => Number(entry.id) !== id));
    showFlash(
      item
        ? `Removed "${item.name}" from the equipment catalogue.`
        : 'Equipment removed.',
    );
    if (editingEquipmentId === id) setEditingEquipmentId(null);
  }

  function purgeCache() {
    if (
      !window.confirm(
        'This clears your saved manufacturers, units, and equipment and reloads the latest defaults. Your list and roster are not affected. Continue?',
      )
    ) {
      return;
    }
    purgeCatalogCache();
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="ghost"
            onClick={() => setShowManufacturerForm((v) => !v)}
          >
            {showManufacturerForm ? 'Cancel' : 'Add manufacturer'}
          </button>
          <button
            type="button"
            className="ghost"
            disabled={manufacturers.length === 0}
            title={
              manufacturers.length === 0
                ? 'Add a manufacturer first'
                : undefined
            }
            onClick={() => {
              setShowUnitForm((v) => !v);
              setEditingUnitId(null);
            }}
          >
            {showUnitForm ? 'Cancel' : 'Add unit'}
          </button>
          <button
            type="button"
            className="ghost"
            disabled={manufacturers.length === 0}
            title={
              manufacturers.length === 0
                ? 'Add a manufacturer first'
                : undefined
            }
            onClick={() => {
              setShowEquipmentForm((v) => !v);
              setEditingEquipmentId(null);
            }}
          >
            {showEquipmentForm ? 'Cancel' : 'Add equipment'}
          </button>
        </div>
      </div>

      {showManufacturerForm && (
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
      )}

      {manufacturers.length > 0 && showUnitForm && (
        <div className="card">
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Add a new unit</h2>
          <UnitForm
            key="new-unit"
            manufacturers={manufacturers}
            editing={null}
            onSubmit={submitUnit}
            onCancel={() => setShowUnitForm(false)}
          />
        </div>
      )}

      {manufacturers.length > 0 && showEquipmentForm && (
        <div className="card">
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Add equipment</h2>
          <EquipmentForm
            key="new-equipment"
            manufacturers={manufacturers}
            editing={null}
            onSubmit={submitEquipment}
            onCancel={() => setShowEquipmentForm(false)}
          />
        </div>
      )}

      {manufacturers.length > 0 && (
        <div className="card">
          <div className="manufacturer-tabs">
            {manufacturers.map((m) => (
              <button
                key={m}
                type="button"
                className={m === currentManufacturer ? 'tab active' : 'tab'}
                onClick={() => setActiveManufacturer(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentManufacturer &&
        (() => {
          const manufacturer = currentManufacturer;
          const manufacturerUnits = units.filter(
            (u) => u.manufacturer === manufacturer,
          );
          const manufacturerEquipment = equipment.filter(
            (e) => e.manufacturer === manufacturer,
          );
          const movementItems = sortRows(
            manufacturerEquipment.filter(
              (e) => (e.type ?? 'Movement') === 'Movement',
            ),
            movementSort,
          );
          const weaponItems = sortRows(
            manufacturerEquipment.filter((e) => e.type === 'Weapon'),
            weaponSort,
          );
          return (
            <div className="card">
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
              <h3
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: '16px 0 8px',
                }}
              >
                Units
              </h3>
              {manufacturerUnits.length === 0 ? (
                <p className="empty">
                  No units for this manufacturer yet. Add one above.
                </p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <SortTh
                          label="Name"
                          sortKey="name"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Size"
                          sortKey="size"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Weight (t)"
                          sortKey="weight"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Armor"
                          sortKey="armor"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Max wt"
                          sortKey="max_weight"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Max drop wt"
                          sortKey="max_drop_weight"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="HP"
                          sortKey="hp"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="Move"
                          sortKey="base_movement"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <th>Dice</th>
                        <SortTh
                          label="L slots"
                          sortKey="left_slots"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="R slots"
                          sortKey="right_slots"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <SortTh
                          label="H slots"
                          sortKey="head_slots"
                          sort={unitSort}
                          onSort={(k) => toggleSort(setUnitSort, k)}
                        />
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortRows(manufacturerUnits, unitSort).map((unit) => (
                        <Fragment key={unit.id}>
                          <tr>
                            <td>{unit.name}</td>
                            <td>
                              <span className="badge">
                                {sizeLabel(unit.size)}
                              </span>
                            </td>
                            <td>{unit.weight} t</td>
                            <td>{unit.armor || '—'}</td>
                            <td>{unit.max_weight ?? 0}</td>
                            <td>{unit.max_drop_weight ?? 0}</td>
                            <td>{unit.hp ?? 0}</td>
                            <td>{unit.base_movement ?? 0}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <DiceIcons unit={unit} />
                            </td>
                            <td>{unit.left_slots ?? 1}</td>
                            <td>{unit.right_slots ?? 1}</td>
                            <td>{unit.head_slots ?? 0}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => {
                                    setEditingUnitId(Number(unit.id));
                                    setShowUnitForm(false);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  aria-label="Remove"
                                  onClick={() => deleteUnit(Number(unit.id))}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                          {editingUnitId === Number(unit.id) && (
                            <tr>
                              <td colSpan={12}>
                                <UnitForm
                                  key={unit.id}
                                  manufacturers={manufacturers}
                                  editing={unit}
                                  onSubmit={submitUnit}
                                  onCancel={() => setEditingUnitId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
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

              <h4
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  margin: '0 0 6px',
                }}
              >
                Movement
              </h4>
              {movementItems.length === 0 ? (
                <p className="empty">
                  No movement equipment for this manufacturer yet.
                </p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <SortTh
                          label="Name"
                          sortKey="name"
                          sort={movementSort}
                          onSort={(k) => toggleSort(setMovementSort, k)}
                        />
                        <SortTh
                          label="Weight"
                          sortKey="weight"
                          sort={movementSort}
                          onSort={(k) => toggleSort(setMovementSort, k)}
                        />
                        <SortTh
                          label="Ratio"
                          sortKey="weight_ratio"
                          sort={movementSort}
                          onSort={(k) => toggleSort(setMovementSort, k)}
                        />
                        <th>True wt</th>
                        <SortTh
                          label="Drop Pod"
                          sortKey="no_drop_pod"
                          sort={movementSort}
                          onSort={(k) => toggleSort(setMovementSort, k)}
                        />
                        <th>Effects</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementItems.map((item) => (
                        <Fragment key={item.id}>
                          <tr>
                            <td>{item.name}</td>
                            <td>{item.weight ?? 0} t</td>
                            <td>{item.weight_ratio ?? 1}</td>
                            <td>{trueWeight(item)} t</td>
                            <td>{item.no_drop_pod ? '✕' : ''}</td>
                            <td>{item.effects || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => {
                                    setEditingEquipmentId(Number(item.id));
                                    setShowEquipmentForm(false);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  aria-label="Remove"
                                  onClick={() =>
                                    deleteEquipment(Number(item.id))
                                  }
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                          {editingEquipmentId === Number(item.id) && (
                            <tr>
                              <td colSpan={5}>
                                <EquipmentForm
                                  key={item.id}
                                  manufacturers={manufacturers}
                                  editing={item}
                                  onSubmit={submitEquipment}
                                  onCancel={() => setEditingEquipmentId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  margin: '16px 0 6px',
                }}
              >
                Weapons
              </h4>
              {weaponItems.length === 0 ? (
                <p className="empty">No weapons for this manufacturer yet.</p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <SortTh
                          label="Name"
                          sortKey="name"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Size"
                          sortKey="size"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Weight"
                          sortKey="weight"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Range"
                          sortKey="range"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Heat"
                          sortKey="heat_rating"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Hit dice"
                          sortKey="hit_dice"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <SortTh
                          label="Drop Pod"
                          sortKey="no_drop_pod"
                          sort={weaponSort}
                          onSort={(k) => toggleSort(setWeaponSort, k)}
                        />
                        <th>Effects</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {weaponItems.map((item) => (
                        <Fragment key={item.id}>
                          <tr>
                            <td>{item.name}</td>
                            <td>{item.size ?? 'Small'}</td>
                            <td>{item.weight ?? 0} t</td>
                            <td>{item.range || '—'}</td>
                            <td>{item.heat_rating || '—'}</td>
                            <td>{item.hit_dice || '—'}</td>
                            <td>{item.no_drop_pod ? '✕' : ''}</td>
                            <td>{item.effects || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => {
                                    setEditingEquipmentId(Number(item.id));
                                    setShowEquipmentForm(false);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  aria-label="Remove"
                                  onClick={() =>
                                    deleteEquipment(Number(item.id))
                                  }
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                          {editingEquipmentId === Number(item.id) && (
                            <tr>
                              <td colSpan={9}>
                                <EquipmentForm
                                  key={item.id}
                                  manufacturers={manufacturers}
                                  editing={item}
                                  onSubmit={submitEquipment}
                                  onCancel={() => setEditingEquipmentId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

      <ExportPanel
        manufacturers={manufacturers}
        units={units}
        equipment={equipment}
      />

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Reset catalogue</h2>
        <p className="unit-meta" style={{ marginBottom: 10 }}>
          Clears your saved manufacturers, units, and equipment and reloads the
          app&apos;s latest defaults. Your list and roster are not affected.
        </p>
        <button type="button" className="danger" onClick={purgeCache}>
          Purge cache
        </button>
      </div>
    </div>
  );
}

export default ManagePage;
