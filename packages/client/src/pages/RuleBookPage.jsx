import rulebookText from '../data/rulebook.md?raw';
import { parseMarkdown } from '../lib/markdown.js';

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</b>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <i key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</i>;
    }
    return part;
  });
}

function RuleBookPage() {
  const blocks = parseMarkdown(rulebookText);

  return (
    <div className="container">
      {blocks.map((block, i) => {
        const key = `block-${i}`;
        if (block.type === 'h1')
          return <h1 key={key}>{renderInline(block.text, key)}</h1>;
        if (block.type === 'h2') {
          return (
            <h2 key={key} style={{ fontSize: 17, marginTop: 28 }}>
              {renderInline(block.text, key)}
            </h2>
          );
        }
        if (block.type === 'h3') {
          return (
            <h3 key={key} style={{ fontSize: 15, marginTop: 20 }}>
              {renderInline(block.text, key)}
            </h3>
          );
        }
        if (block.type === 'hr') {
          return (
            <hr
              key={key}
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '20px 0',
              }}
            />
          );
        }
        if (block.type === 'ul') {
          return (
            <ul
              key={key}
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                paddingLeft: 20,
                margin: '8px 0',
              }}
            >
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={key}
            className="unit-stats"
            style={{ fontSize: 13, margin: '8px 0' }}
          >
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}

export default RuleBookPage;
