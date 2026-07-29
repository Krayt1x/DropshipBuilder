import { useMemo, useState } from 'react';
import { parseShareText, matchImportedList } from '../lib/importList.js';

function ImportListPanel({ manufacturers, units, equipment, onImport, onClose }) {
  const [text, setText] = useState('');

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    const parsed = parseShareText(text);
    if (!parsed.listName || parsed.units.length === 0) return null;
    return matchImportedList({ parsed, manufacturers, units, equipment });
  }, [text, manufacturers, units, equipment]);

  const canImport = Boolean(preview?.manufacturer && preview.matchedUnits.length > 0);

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 15, margin: 0 }}>Import list</h2>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="unit-meta" style={{ margin: '8px 0' }}>
        Paste a list exported from Dropship Builder below.
      </p>
      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste exported list text..."
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      />
      {preview && (
        <div className="import-preview">
          <div className="import-preview-row">
            <span>
              <strong>{preview.listName}</strong>
              {preview.manufacturer ? ` · ${preview.manufacturer}` : ''} ·{' '}
              {preview.matchedUnits.length} unit
              {preview.matchedUnits.length === 1 ? '' : 's'}
            </span>
            <span
              className={
                preview.warnings.length > 0 ? 'import-tag-warn' : 'import-tag-ok'
              }
            >
              {canImport ? (preview.warnings.length > 0 ? 'Warnings' : 'Ready') : 'Nothing to import'}
            </span>
          </div>
          {preview.matchedUnits.map((u) => (
            <div className="import-preview-row" key={u.key}>
              <span>
                {u.name}
                {u.warnings.length > 0 ? ` — ${u.warnings.join(', ')}` : ''}
              </span>
              <span
                className={u.warnings.length > 0 ? 'import-tag-warn' : 'import-tag-ok'}
              >
                {u.warnings.length > 0 ? 'Partial match' : 'Matched'}
              </span>
            </div>
          ))}
          {preview.warnings.map((warning) => (
            <div className="import-preview-row" key={warning}>
              <span>{warning}</span>
              <span className="import-tag-warn">Skipped</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          type="button"
          onClick={() => onImport(preview)}
          disabled={!canImport}
        >
          Import as new list
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ImportListPanel;
