import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ManagePage from './ManagePage.jsx';

afterEach(cleanup);

describe('ManagePage', () => {
  it('adds a new manufacturer and a free Standard Movement item for it', () => {
    const setManufacturers = vi.fn();
    const setEquipment = vi.fn();
    render(
      <ManagePage
        manufacturers={[]}
        setManufacturers={setManufacturers}
        units={[]}
        setUnits={() => {}}
        equipment={[]}
        setEquipment={setEquipment}
        actionDice={[]}
        setActionDice={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Manufacturer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));

    expect(setManufacturers).toHaveBeenCalled();
    expect(
      screen.getByText('Added manufacturer "Test Manufacturer".'),
    ).toBeDefined();

    expect(setEquipment).toHaveBeenCalled();
    const nextEquipment = setEquipment.mock.calls[0][0]([]);
    expect(nextEquipment).toEqual([
      expect.objectContaining({
        name: 'Standard Movement',
        manufacturer: 'Test Manufacturer',
        type: 'Movement',
        weight: 0,
      }),
    ]);
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
        actionDice={[]}
        setActionDice={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));
    fireEvent.change(screen.getByPlaceholderText('New Manufacturer'), {
      target: { value: 'Corp A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add manufacturer' }));

    expect(setManufacturers).not.toHaveBeenCalled();
    expect(
      screen.getByText('A manufacturer named "Corp A" already exists.'),
    ).toBeDefined();
  });

  it('adds a new action die with the default colour and faces', () => {
    const setActionDice = vi.fn();
    render(
      <ManagePage
        manufacturers={[]}
        setManufacturers={() => {}}
        units={[]}
        setUnits={() => {}}
        equipment={[]}
        setEquipment={() => {}}
        actionDice={[]}
        setActionDice={setActionDice}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add action die' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add action die' }).at(-1),
    );

    expect(setActionDice).toHaveBeenCalled();
    const nextActionDice = setActionDice.mock.calls[0][0]([]);
    expect(nextActionDice).toEqual([
      expect.objectContaining({
        color: 'blue',
        side1: 'Action',
        side2: 'Action',
        side3: 'Action',
        side4: 'Action',
        side5: 'Action',
        side6: 'Action',
      }),
    ]);
  });

  it('removes an action die from the list', () => {
    const setActionDice = vi.fn();
    render(
      <ManagePage
        manufacturers={[]}
        setManufacturers={() => {}}
        units={[]}
        setUnits={() => {}}
        equipment={[]}
        setEquipment={() => {}}
        actionDice={[
          {
            id: 1,
            color: 'blue',
            side1: 'Action',
            side2: 'Action',
            side3: 'Attack',
            side4: 'Attack',
            side5: 'Move',
            side6: 'Move',
          },
        ]}
        setActionDice={setActionDice}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(setActionDice).toHaveBeenCalled();
    expect(setActionDice.mock.calls[0][0]([{ id: 1 }])).toEqual([]);
  });
});
