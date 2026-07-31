import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EquipmentForm from './EquipmentForm.jsx';

afterEach(cleanup);

describe('EquipmentForm', () => {
  it('labels the effects section "Equipment Effects" with "Effect"/"Type" fields (#269)', () => {
    render(<EquipmentForm manufacturers={['Corp A']} onSubmit={() => {}} />);

    expect(screen.getByText('Equipment Effects')).toBeDefined();
    fireEvent.click(screen.getByText('+ Add an effect'));
    expect(screen.getByLabelText('Effect')).toBeDefined();
    expect(screen.getByLabelText('Type')).toBeDefined();
  });

  it('adds a tag effect and renders it as a plain label with no "Tag:" prefix (#269)', () => {
    render(<EquipmentForm manufacturers={['Corp A']} onSubmit={() => {}} />);

    fireEvent.click(screen.getByText('+ Add an effect'));
    fireEvent.change(screen.getByLabelText('Effect'), {
      target: { value: 'tags' },
    });
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: 'flying' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Flying')).toBeDefined();
    expect(screen.queryByText(/Tag:/)).toBeNull();
  });
});
