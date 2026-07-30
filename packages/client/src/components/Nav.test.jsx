import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Nav from './Nav.jsx';

afterEach(cleanup);

describe('Nav', () => {
  it('renders the primary links without the app name or a Manage available models label', () => {
    render(<Nav page="list" />);
    expect(screen.getByRole('link', { name: 'List builder' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Configuration' })).toBeDefined();
    expect(screen.queryByText('Manage available models')).toBeNull();
    expect(screen.queryByText('Dropship Builder')).toBeNull();
  });

  it('opens the Rules dropdown to reveal Math reference and Rule book', () => {
    render(<Nav page="list" />);

    expect(screen.queryByRole('link', { name: 'Rule book' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Rules' }));
    expect(screen.getByRole('link', { name: 'Math reference' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Rule book' })).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: 'Rule book' }));
    expect(screen.queryByRole('link', { name: 'Rule book' })).toBeNull();
  });

  it('marks the Rules trigger active when on the math or rulebook page', () => {
    render(<Nav page="rulebook" />);
    expect(screen.getByRole('button', { name: 'Rules' }).className).toMatch(
      /active/,
    );
  });

  it('opens the hamburger menu to reveal dark mode toggle and the Dropship Simulator link', () => {
    render(<Nav page="list" />);

    expect(
      screen.queryByRole('link', { name: 'Dropship Simulator' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Toggle dark mode' }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle navigation menu' }),
    );
    expect(
      screen.getByRole('link', { name: 'Dropship Simulator' }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Toggle dark mode' }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: 'Dropship Simulator' }));
    expect(
      screen.queryByRole('link', { name: 'Dropship Simulator' }),
    ).toBeNull();
  });

  it('closes the Rules dropdown when the hamburger menu is opened', () => {
    render(<Nav page="list" />);

    fireEvent.click(screen.getByRole('button', { name: 'Rules' }));
    expect(screen.getByRole('link', { name: 'Math reference' })).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle navigation menu' }),
    );
    expect(screen.queryByRole('link', { name: 'Math reference' })).toBeNull();
  });
});
