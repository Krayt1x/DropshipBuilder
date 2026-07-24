import { useMemo, useState } from 'react';
import { useLocalStorageState, makeKey } from '../lib/storage.js';
import { SLOTS, DROP_POD_SIZE, sizeLabel } from '../lib/constants.js';
import { buildShareText } from '../lib/shareList.js';
import RosterListItem from '../components/RosterListItem.jsx';
import RosterConfigPanel from '../components/RosterConfigPanel.jsx';
import DiceIcons from '../components/DiceIcons.jsx';

function emptyEquipmentSlots() {
  return SLOTS.reduce((acc, slot) => {
    acc[slot] = [];
    return acc;
  }, {});
}

function cheapestMovementId(equipmentCatalog, manufacturer) {
  const options = equipmentCatalog
    .filter(
      (item) =>
        item.manufacturer === manufacturer &&
        (item.type ?? 'Movement') === 'Movement',
    )
    .slice()
    .sort((a, b) => Number(a.weight ?? 0) - Number(b.weight ?? 0));
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
  const [selectedRosterKey, setSelectedRosterKey] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('catalogue');
  const [showSplash, setShowSplash] = useState(() => roster.length === 0);
  const [shareStatus, setShareStatus] = useState('idle');

  const manufacturer = manufacturers.includes(settings.manufacturer)
    ? settings.manufacturer
    : (manufacturers[0] ?? '');

  const [selectedManufacturer, setSelectedManufacturer] =
    useState(manufacturer);

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
          };
        })
        .filter(Boolean),
    [roster, units],
  );

  const totalWeight = rosterUnits.reduce(
    (sum, entry) =>
      sum +
      Number(entry.unit.weight) +
      equipmentWeight(entry.equipment, equipment),
    0,
  );
  const weightLimit = Number(settings.weight_limit) || 0;
  const pct =
    weightLimit > 0
      ? Math.min(100, Math.round((totalWeight / weightLimit) * 100))
      : 0;
  const over = totalWeight > weightLimit;

  function handleSplashSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const nextManufacturer = manufacturers.includes(form.get('manufacturer'))
      ? form.get('manufacturer')
      : manufacturer;

    if (nextManufacturer !== manufacturer && roster.length > 0) {
      const confirmed = window.confirm(
        'Changing manufacturers will start a new list and clear your current roster. Continue?',
      );
      if (!confirmed) return;
      setRoster([]);
      setSelectedRosterKey(null);
    }

    setSettings({
      list_name:
        (form.get('list_name') || '').toString().trim() || 'Untitled list',
      manufacturer: nextManufacturer,
      weight_limit: Math.max(1, Number(form.get('weight_limit')) || 100),
    });
    setShowSplash(false);
  }

  function openSettings() {
    setSelectedManufacturer(manufacturer);
    setShowSplash(true);
  }

  async function shareList() {
    const text = buildShareText({
      listName: settings.list_name,
      manufacturer,
      totalWeight,
      weightLimit,
      rosterUnits,
      units,
      equipment,
      entryWeight: (entry) =>
        Number(entry.unit.weight) + equipmentWeight(entry.equipment, equipment),
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: settings.list_name, text });
      } catch {
        // user cancelled the native share sheet — nothing more to do
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      // clipboard unavailable (e.g. insecure context) — nothing more we can do
    }
  }

  function addToList(unitId) {
    const unit = units.find((u) => Number(u.id) === Number(unitId));
    const initialEquipment = emptyEquipmentSlots();
    if (unit && unit.size !== DROP_POD_SIZE) {
      const cheapest = cheapestMovementId(equipment, unit.manufacturer);
      if (cheapest != null) initialEquipment.Movement = [cheapest];
    }
    setRoster((r) => [
      ...r,
      {
        key: makeKey('r'),
        unit_id: unitId,
        equipment: initialEquipment,
      },
    ]);
  }

  function removeFromList(key) {
    setRoster((r) => r.filter((entry) => entry.key !== key));
    setSelectedRosterKey((current) => (current === key ? null : current));
  }

  function selectRoster(key) {
    setSelectedRosterKey((current) => (current === key ? null : key));
  }

  function assignEquipment(key, slot, slotIndex, equipmentId) {
    setRoster((r) =>
      r.map((entry) => {
        if (entry.key !== key) return entry;
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

  function clearList() {
    setRoster([]);
    setSelectedRosterKey(null);
  }

  const selectedEntry =
    rosterUnits.find((entry) => entry.key === selectedRosterKey) ?? null;
  const catalogueMobileActive = activeMobileTab === 'catalogue';
  const rosterListMobileActive = activeMobileTab === 'roster' && !selectedEntry;
  const configureMobileActive =
    activeMobileTab === 'roster' && Boolean(selectedEntry);

  if (showSplash) {
    return (
      <div className="container splash-container">
        <h1>Build your list</h1>
        <p
          className="unit-meta"
          style={{ textAlign: 'center', marginBottom: 20 }}
        >
          Set the basics, then start adding units.
        </p>
        <form className="card splash-form" onSubmit={handleSplashSubmit}>
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
            <label>Manufacturer</label>
            <div className="manufacturer-tile-grid">
              {manufacturers.map((m) => (
                <button
                  type="button"
                  key={m}
                  className={`manufacturer-tile ${selectedManufacturer === m ? 'selected' : ''}`}
                  onClick={() => setSelectedManufacturer(m)}
                >
                  <span className="manufacturer-tile-icon">🏭</span>
                  <span className="manufacturer-tile-name">{m}</span>
                  {selectedManufacturer === m && (
                    <span className="manufacturer-tile-check">✓</span>
                  )}
                </button>
              ))}
            </div>
            <input
              type="hidden"
              name="manufacturer"
              value={selectedManufacturer}
            />
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
          <button type="submit" className="splash-submit">
            Build roster →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container-wide">
      <div className="workspace-settings-bar">
        <div>
          <b>{settings.list_name}</b> · {manufacturer} ·{' '}
          <span className="weight-label-value">{`${totalWeight.toLocaleString()} t / ${weightLimit.toLocaleString()} t`}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ghost"
            onClick={shareList}
            disabled={rosterUnits.length === 0}
          >
            {shareStatus === 'copied' ? 'Copied!' : '📤 Share'}
          </button>
          <button type="button" className="ghost" onClick={openSettings}>
            Edit settings
          </button>
        </div>
      </div>
      <div className="weight-bar-track" style={{ marginBottom: '1.5rem' }}>
        <div
          className={`weight-bar-fill ${over ? 'over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="workspace-tabs">
        <button
          type="button"
          className={`workspace-tab ${catalogueMobileActive ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('catalogue')}
        >
          Catalogue
        </button>
        <button
          type="button"
          className={`workspace-tab ${activeMobileTab === 'roster' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('roster')}
        >
          Roster
        </button>
      </div>

      <div className="workspace-columns">
        <div
          className={`workspace-col ${catalogueMobileActive ? 'mobile-active' : ''}`}
        >
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
                      Max weight {unit.max_weight}t · MSW{' '}
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

        <div
          className={`workspace-col ${rosterListMobileActive ? 'mobile-active' : ''}`}
        >
          <h2 style={{ fontSize: 15 }}>Your roster</h2>
          <div className="card" style={{ padding: '0.75rem' }}>
            {rosterUnits.length === 0 ? (
              <p className="empty">No units added yet.</p>
            ) : (
              <>
                {rosterUnits.map((entry) => (
                  <RosterListItem
                    key={entry.key}
                    entry={entry}
                    units={units}
                    equipment={equipment}
                    totalWeight={
                      Number(entry.unit.weight) +
                      equipmentWeight(entry.equipment, equipment)
                    }
                    selected={entry.key === selectedRosterKey}
                    onSelect={() => selectRoster(entry.key)}
                    onRemove={() => removeFromList(entry.key)}
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

        <div
          className={`workspace-col ${configureMobileActive ? 'mobile-active' : ''}`}
        >
          <h2 style={{ fontSize: 15 }}>Configure</h2>
          {configureMobileActive && (
            <button
              type="button"
              className="ghost workspace-back-button"
              onClick={() => setSelectedRosterKey(null)}
            >
              ‹ Back to roster
            </button>
          )}
          {selectedEntry ? (
            <RosterConfigPanel
              entry={selectedEntry}
              units={units}
              equipment={equipment}
              totalWeight={
                Number(selectedEntry.unit.weight) +
                equipmentWeight(selectedEntry.equipment, equipment)
              }
              onAssignEquipment={(slot, slotIndex, equipmentId) =>
                assignEquipment(selectedEntry.key, slot, slotIndex, equipmentId)
              }
            />
          ) : (
            <p className="empty" style={{ padding: '2rem 1rem' }}>
              Select a unit from your roster to configure it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListBuilderPage;
