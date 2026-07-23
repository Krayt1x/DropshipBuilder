import { UNIT_SIZES } from '../lib/constants.js';

function UnitForm({ manufacturers, editing, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="stat-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="New unit"
            defaultValue={editing?.name ?? ''}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="manufacturer">Manufacturer</label>
          <select
            id="manufacturer"
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
          <label htmlFor="size">Size</label>
          <select id="size" name="size" defaultValue={editing?.size ?? 'Small'}>
            {Object.entries(UNIT_SIZES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="weight">Weight (tonnes)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            min="0"
            step="1"
            defaultValue={editing?.weight ?? 50}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="armor">Armor</label>
          <input
            type="number"
            id="armor"
            name="armor"
            min="0"
            step="1"
            defaultValue={editing?.armor ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="max_weight">Max weight</label>
          <input
            type="number"
            id="max_weight"
            name="max_weight"
            min="0"
            step="1"
            defaultValue={editing?.max_weight ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="max_drop_weight">Max drop weight</label>
          <input
            type="number"
            id="max_drop_weight"
            name="max_drop_weight"
            min="0"
            step="1"
            defaultValue={editing?.max_drop_weight ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="hp">HP</label>
          <input
            type="number"
            id="hp"
            name="hp"
            min="0"
            step="1"
            defaultValue={editing?.hp ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="base_movement">Base movement</label>
          <input
            type="number"
            id="base_movement"
            name="base_movement"
            min="0"
            step="1"
            defaultValue={editing?.base_movement ?? 0}
          />
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: 10 }}>
        <div className="field">
          <label htmlFor="dice_blue">Blue dice</label>
          <input
            type="number"
            id="dice_blue"
            name="dice_blue"
            min="0"
            step="1"
            defaultValue={editing?.dice_blue ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="dice_red">Red dice</label>
          <input
            type="number"
            id="dice_red"
            name="dice_red"
            min="0"
            step="1"
            defaultValue={editing?.dice_red ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="dice_green">Green dice</label>
          <input
            type="number"
            id="dice_green"
            name="dice_green"
            min="0"
            step="1"
            defaultValue={editing?.dice_green ?? 0}
          />
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: 10 }}>
        <div className="field">
          <label htmlFor="left_slots">Left slots</label>
          <input
            type="number"
            id="left_slots"
            name="left_slots"
            min="0"
            step="1"
            defaultValue={editing?.left_slots ?? 1}
          />
        </div>
        <div className="field">
          <label htmlFor="right_slots">Right slots</label>
          <input
            type="number"
            id="right_slots"
            name="right_slots"
            min="0"
            step="1"
            defaultValue={editing?.right_slots ?? 1}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit">{editing ? 'Save changes' : 'Add unit'}</button>
        {editing && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default UnitForm;
