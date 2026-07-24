import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './markdown.js';

describe('parseMarkdown', () => {
  it('parses headers of each level', () => {
    const blocks = parseMarkdown('# Title\n## Section\n### Sub');
    expect(blocks).toEqual([
      { type: 'h1', text: 'Title' },
      { type: 'h2', text: 'Section' },
      { type: 'h3', text: 'Sub' },
    ]);
  });

  it('joins consecutive non-blank lines into a single paragraph', () => {
    const blocks = parseMarkdown('First line\nsecond line\n\nNew paragraph');
    expect(blocks).toEqual([
      { type: 'p', text: 'First line second line' },
      { type: 'p', text: 'New paragraph' },
    ]);
  });

  it('parses bullet lists using - or *', () => {
    const blocks = parseMarkdown('- one\n* two\n- three');
    expect(blocks).toEqual([{ type: 'ul', items: ['one', 'two', 'three'] }]);
  });

  it('parses a horizontal rule', () => {
    const blocks = parseMarkdown('Above\n\n---\n\nBelow');
    expect(blocks).toEqual([
      { type: 'p', text: 'Above' },
      { type: 'hr' },
      { type: 'p', text: 'Below' },
    ]);
  });

  it('flushes a paragraph when a list starts without a blank line between them', () => {
    const blocks = parseMarkdown('Intro text\n- item one\n- item two');
    expect(blocks).toEqual([
      { type: 'p', text: 'Intro text' },
      { type: 'ul', items: ['item one', 'item two'] },
    ]);
  });

  it('flushes a list when a paragraph starts without a blank line between them', () => {
    const blocks = parseMarkdown('- item one\nTrailing text');
    expect(blocks).toEqual([
      { type: 'ul', items: ['item one'] },
      { type: 'p', text: 'Trailing text' },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
