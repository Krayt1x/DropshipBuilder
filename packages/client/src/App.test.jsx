import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  it('renders the primary navigation', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'List builder' })).toBeDefined();
  });
});
