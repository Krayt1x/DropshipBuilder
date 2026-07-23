import { EQUIPMENT_TYPES } from '../lib/constants.js';

function EquipmentForm({ manufacturers, editing, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="stat-grid">
        <div className="field">
          <label htmlFor="equipment_name">Name</label>
          <input
            type="text"
            id="equipment_name"
            name="name"
            placeholder="Auto-cannon"
            defaultValue={editing?.name ?? ''}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="equipment_manufacturer">Manufacturer</label>
          <select
            id="equipment_manufacturer"
            name="manufacturer"
            defaultValue={editing?.manufacturer ?? manufacturers[0]}
          >
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="equipment_type">Equipment type</label>
          <select
            id="equipment_type"
            name="type"
            defaultValue={editing?.type ?? 'Movement'}
          >
            {EQUIPMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="equipment_weight">Weight (tonnes)</label>
          <input
            type="number"
            id="equipment_weight"
            name="weight"
            min="0"
            step="1"
            defaultValue={editing?.weight ?? 0}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="range">Range</label>
          <input
            type="number"
            id="range"
            name="range"
            min="0"
            step="1"
            defaultValue={editing?.range ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="heat_rating">Heat rating</label>
          <input
            type="text"
            id="heat_rating"
            name="heat_rating"
            placeholder="e.g. 3/3"
            defaultValue={editing?.heat_rating ?? ''}
          />
        </div>
        <div className="field">
          <label htmlFor="hit_dice">Hit dice</label>
          <input
            type="text"
            id="hit_dice"
            name="hit_dice"
            placeholder="e.g. 1d4"
            defaultValue={editing?.hit_dice ?? ''}
          />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label htmlFor="effects">Effects</label>
        <textarea
          id="effects"
          name="effects"
          rows={3}
          placeholder="What happens when this is equipped?"
          defaultValue={editing?.effects ?? ''}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit">
          {editing ? 'Save changes' : 'Add equipment'}
        </button>
        {editing && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default EquipmentForm;
