import { useState } from 'react';

function ShareExportPanel({ text, listName, onClose }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  async function share() {
    try {
      await navigator.share({ title: listName, text });
    } catch {
      // user cancelled the native share sheet — nothing more to do
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. insecure context) — the text box below
      // can still be selected and copied by hand
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 15, margin: 0 }}>Export list</h2>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="unit-meta" style={{ margin: '8px 0' }}>
        Share it directly, or copy the text below.
      </p>
      <textarea
        readOnly
        value={text}
        rows={Math.min(20, text.split('\n').length + 1)}
        onFocus={(e) => e.target.select()}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {canShare && (
          <button type="button" onClick={share}>
            Share
          </button>
        )}
        <button type="button" className="ghost" onClick={copy}>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  );
}

export default ShareExportPanel;
