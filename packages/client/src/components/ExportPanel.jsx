import { useState } from 'react';

function ExportPanel({ manufacturers, units, equipment }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify({ manufacturers, units, equipment }, null, 2);

  function download() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dropshipbuilder-catalog.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the textarea below still works.
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, marginTop: 0 }}>Export catalog</h2>
      <p className="unit-meta" style={{ marginBottom: 10 }}>
        Your edits are only saved in this browser. To make them the new defaults
        for everyone, download or copy this JSON and send it to Claude to commit
        into the repo.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={download}>
          Download JSON
        </button>
        <button type="button" className="ghost" onClick={copy}>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
      <textarea
        readOnly
        rows={8}
        value={json}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}

export default ExportPanel;
