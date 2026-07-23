import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ManagePage from './ManagePage.jsx';

afterEach(cleanup);

describe('ManagePage', () => {
  it('adds a new manufacturer', () => {
    const setManufacturers = vi.fn();
    render(
      <ManagePage
        manufacturers={[]}
        setManufacturers={setManufacturers}
        units={[]}
        setUnits={() => {}}
        equipment={[]}
        setEquipment={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Manufacturer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));

    expect(setManufacturers).toHaveBeenCalled();
    expect(
      screen.getByText('Added manufacturer "Test Manufacturer".'),
    ).toBeDefined();
  });

  it('rejects a duplicate manufacturer name', () => {
    const setManufacturers = vi.fn();
    render(
      <ManagePage
        manufacturers={['Corp A']}
        setManufacturers={setManufacturers}
        units={[]}
        setUnits={() => {}}
        equipment={[]}
        setEquipment={() => {}}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('New Manufacturer'), {
      target: { value: 'Corp A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));

    expect(setManufacturers).not.toHaveBeenCalled();
    expect(
      screen.getByText('A manufacturer named "Corp A" already exists.'),
    ).toBeDefined();
  });
});
