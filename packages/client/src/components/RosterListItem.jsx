import { SLOTS, sizeLabel } from '../lib/constants.js';
import {
  WEIGHT_SEGMENT_COLORS,
  computeRosterStats,
} from '../lib/rosterEntry.js';
import DiceIcons from './DiceIcons.jsx';

function RosterListItem({
  entry,
  units,
  equipment,
  totalWeight,
  selected,
  onSelect,
  onRemove,
}) {
  const stats = computeRosterStats(entry, units, equipment, totalWeight);
  const {
    unit,
    isDropPod,
    carried,
    slotCounts,
    resolveEquippedItems,
    dropPodSelected,
    maxWeight,
    maxDropWeight,
    overMaxWeight,
    overDropWeight,
    statsLine,
    hullWeight,
    equippedWeights,
  } = stats;

  function renderCompactChips() {
    if (isDropPod) {
      const chips = [];
      if (dropPodSelected) {
        chips.push(
          <div
            className="slot-card"
            style={{ cursor: 'default' }}
            key="equipment"
          >
            <span className="slot-card-label">Equipment</span>
            <span className="slot-card-item">{dropPodSelected.name}</span>
            <span className="slot-card-wt">{dropPodSelected.weight ?? 0}t</span>
          </div>,
        );
      }
      carried.forEach((carriedEntry) => {
        const carriedUnit = units.find(
          (u) => Number(u.id) === Number(carriedEntry.unit_id),
        );
        if (!carriedUnit) return;
        chips.push(
          <div
            className="slot-card"
            style={{ cursor: 'default' }}
            key={carriedEntry.key}
          >
            <span className="slot-card-label">Carried</span>
            <span className="slot-card-item">{carriedUnit.name}</span>
            <span className="slot-card-wt">{carriedUnit.weight}t</span>
          </div>,
        );
      });
      if (chips.length === 0) {
        return (
          <p className="empty" style={{ padding: '4px 0' }}>
            Nothing loaded yet.
          </p>
        );
      }
      return <div className="equipment-slots">{chips}</div>;
    }

    const chips = SLOTS.flatMap((slot) => {
      if (slot === 'Head' && slotCounts.Head <= 0) return [];
      return resolveEquippedItems(slot).map((item, i) => (
        <div
          className="slot-card"
          style={{ cursor: 'default' }}
          key={`${slot}-${i}`}
        >
          <span className="slot-card-label">{slot}</span>
          <span className="slot-card-item">{item.name}</span>
          <span className="slot-card-wt">
            {slot === 'Movement'
              ? `${item.movement ?? 0} move`
              : `${item.weight ?? 0}t`}
          </span>
        </div>
      ));
    });
    if (chips.length === 0) {
      return (
        <p className="empty" style={{ padding: '4px 0' }}>
          No equipment equipped.
        </p>
      );
    }
    return <div className="equipment-slots">{chips}</div>;
  }

  return (
    <div
      className={`unit-row roster-list-item ${selected ? 'selected' : ''} ${overMaxWeight ? 'over-max-weight' : ''}`}
      style={{ alignItems: 'flex-start', flexWrap: 'wrap', cursor: 'pointer' }}
      onClick={onSelect}
    >
      <div className="unit-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p className="unit-name" style={{ flex: 1, minWidth: 0 }}>
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
                title={`Over Maximum Safe Weight (${unit.max_drop_weight} t)`}
              >
                ⚠️
              </span>
            )}
            {unit.name} {isDropPod && <span className="badge">Drop Pod</span>}
          </p>
          <button
            type="button"
            className="ghost"
            aria-label="Remove"
            style={{ padding: '4px 8px', fontSize: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ✕
          </button>
        </div>
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
                  MSW {maxDropWeight}t
                </span>
              )}
              <span>Max {maxWeight}t</span>
            </div>
          </div>
        )}
        <p className="unit-stats">{sizeLabel(unit.size)}</p>
        <p className="unit-stats">{statsLine}</p>
        <p className="unit-stats">
          <DiceIcons unit={unit} />
        </p>
        {renderCompactChips()}
      </div>
    </div>
  );
}

export default RosterListItem;
