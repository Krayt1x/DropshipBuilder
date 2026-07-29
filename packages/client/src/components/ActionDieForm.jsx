import { ACTION_DICE_SIDE_KEYS, ACTION_DICE_FACES } from '../lib/constants.js';

function ActionDieForm({ editing, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="stat-grid">
        <div className="field">
          <label htmlFor="color">Colour</label>
          <input
            type="text"
            id="color"
            name="color"
            placeholder="e.g. blue"
            defaultValue={editing?.color ?? ''}
            required
          />
        </div>
        {ACTION_DICE_SIDE_KEYS.map((key, i) => (
          <div className="field" key={key}>
            <label htmlFor={key}>Side {i + 1}</label>
            <select
              id={key}
              name={key}
              defaultValue={editing?.[key] ?? ACTION_DICE_FACES[0]}
            >
              {ACTION_DICE_FACES.map((face) => (
                <option key={face} value={face}>
                  {face}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit">
          {editing ? 'Save changes' : 'Add action die'}
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

export default ActionDieForm;
