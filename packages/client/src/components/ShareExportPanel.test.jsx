import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ShareExportPanel from './ShareExportPanel.jsx';

afterEach(() => {
  cleanup();
  delete navigator.share;
});

describe('ShareExportPanel', () => {
  it('shows the share text in a read-only text box', () => {
    render(
      <ShareExportPanel
        text={'My List (Corp A)\nWeight: 5t / 100t'}
        listName="My List"
        onClose={vi.fn()}
      />,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea.value).toBe('My List (Corp A)\nWeight: 5t / 100t');
    expect(textarea.readOnly).toBe(true);
  });

  it('copies the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ShareExportPanel
        text="Share text"
        listName="My List"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    expect(
      await screen.findByRole('button', { name: 'Copied!' }),
    ).toBeDefined();
    expect(writeText).toHaveBeenCalledWith('Share text');
  });

  it('does not render a Share button when the Web Share API is unavailable', () => {
    render(
      <ShareExportPanel
        text="Share text"
        listName="My List"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
  });

  it('renders a Share button that calls navigator.share when available', () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    render(
      <ShareExportPanel
        text="Share text"
        listName="My List"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({
      title: 'My List',
      text: 'Share text',
    });
  });

  it('calls onClose when the Close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ShareExportPanel
        text="Share text"
        listName="My List"
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
