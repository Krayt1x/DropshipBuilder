import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Nav from './Nav.jsx';

afterEach(cleanup);

describe('Nav', () => {
  it('opens and closes the mobile menu', () => {
    render(<Nav page="list" />);

    // The desktop link is always in the DOM (hidden on mobile via CSS media query,
    // which jsdom doesn't apply), so the mobile menu adds a second matching link.
    expect(
      screen.getAllByRole('link', { name: 'Manage available models' }),
    ).toHaveLength(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle navigation menu' }),
    );
    const links = screen.getAllByRole('link', {
      name: 'Manage available models',
    });
    expect(links).toHaveLength(2);

    fireEvent.click(links[1]);
    expect(
      screen.getAllByRole('link', { name: 'Manage available models' }),
    ).toHaveLength(1);
  });
});
