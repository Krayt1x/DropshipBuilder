import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ImportListPanel from './ImportListPanel.jsx';

afterEach(cleanup);

const unit = { id: 1, name: 'Test Mech', manufacturer: 'Corp A', size: 'Medium' };
const gun = {
  id: 2,
  manufacturer: 'Corp A',
  type: 'Weapon',
  name: 'Small Gun',
  weight: 3,
};

function pasteText(value) {
  fireEvent.change(screen.getByPlaceholderText('Paste exported list text...'), {
    target: { value },
  });
}

describe('ImportListPanel', () => {
  it('shows no preview until text is pasted', () => {
    render(
      <ImportListPanel
        manufacturers={['Corp A']}
        units={[unit]}
        equipment={[gun]}
        onImport={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Ready')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Import as new list' }).disabled,
    ).toBe(true);
  });

  it('shows a live "Ready" preview for a fully-matched paste', () => {
    render(
      <ImportListPanel
        manufacturers={['Corp A']}
        units={[unit]}
        equipment={[gun]}
        onImport={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    pasteText(
      ['My List (Corp A)', 'Weight: 3t / 100t', '', 'Test Mech - 3t', '  Left: Small Gun'].join(
        '\n',
      ),
    );

    expect(screen.getByText('Ready')).toBeDefined();
    expect(screen.getByText('Test Mech', { selector: 'span' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Import as new list' }).disabled,
    ).toBe(false);
  });

  it('shows a warning tag and reason for an unmatched item, without blocking the rest', () => {
    render(
      <ImportListPanel
        manufacturers={['Corp A']}
        units={[unit]}
        equipment={[gun]}
        onImport={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    pasteText(
      [
        'My List (Corp A)',
        'Weight: 3t / 100t',
        '',
        'Test Mech - 3t',
        '  Left: Missing Gun',
      ].join('\n'),
    );

    expect(screen.getByText(/"Missing Gun" not found/)).toBeDefined();
    expect(screen.getByText('Partial match')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Import as new list' }).disabled,
    ).toBe(false);
  });

  it('calls onImport with the matched preview when clicked', () => {
    const onImport = vi.fn();
    render(
      <ImportListPanel
        manufacturers={['Corp A']}
        units={[unit]}
        equipment={[gun]}
        onImport={onImport}
        onClose={vi.fn()}
      />,
    );
    pasteText(
      ['My List (Corp A)', 'Weight: 3t / 100t', '', 'Test Mech - 3t', '  Left: Small Gun'].join(
        '\n',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Import as new list' }));

    expect(onImport).toHaveBeenCalledTimes(1);
    const preview = onImport.mock.calls[0][0];
    expect(preview.listName).toBe('My List');
    expect(preview.matchedUnits[0]).toMatchObject({ unit_id: 1 });
  });

  it('calls onClose when Close or Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImportListPanel
        manufacturers={['Corp A']}
        units={[unit]}
        equipment={[gun]}
        onImport={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
