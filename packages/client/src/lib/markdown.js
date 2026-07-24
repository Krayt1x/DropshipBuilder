export function parseMarkdown(text) {
  const blocks = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length) {
      blocks.push({ type: 'ul', items: list });
      list = [];
    }
  }

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }

    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: `h${headerMatch[1].length}`, text: headerMatch[2] });
      return;
    }

    if (line.trim() === '---') {
      flushParagraph();
      flushList();
      blocks.push({ type: 'hr' });
      return;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1]);
      return;
    }

    flushList();
    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  return blocks;
}
