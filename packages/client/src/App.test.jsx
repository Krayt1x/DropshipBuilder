import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  it('renders the Dropship Builder heading', () => {
    render(<App />);
    expect(screen.getByText('Dropship Builder')).toBeDefined();
  });
});
