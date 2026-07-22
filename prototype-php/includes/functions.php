<?php

define('UNITS_FILE', __DIR__ . '/../data/units.json');
define('MANUFACTURERS_FILE', __DIR__ . '/../data/manufacturers.json');
define('EQUIPMENT_FILE', __DIR__ . '/../data/equipment.json');
define('UNIT_SIZES', [
    'Small' => 'Small - 1',
    'Medium' => 'Medium - 2',
    'Large' => 'Large - 3',
    'Huge' => 'Huge - 4',
    'Drop Pod' => 'Drop Pod (special)',
]);
define('DICE_COLORS', ['blue', 'red', 'green']);
define('SLOTS', ['Movement', 'Left', 'Right']);
define('DROP_POD_SIZE', 'Drop Pod');
define('EQUIPMENT_TYPES', ['Movement', 'Weapon']);

function load_units(): array
{
    if (!file_exists(UNITS_FILE)) {
        return [];
    }
    $data = json_decode(file_get_contents(UNITS_FILE), true);
    return is_array($data) ? $data : [];
}

function save_units(array $units): void
{
    file_put_contents(UNITS_FILE, json_encode(array_values($units), JSON_PRETTY_PRINT));
}

function load_manufacturers(): array
{
    if (!file_exists(MANUFACTURERS_FILE)) {
        return [];
    }
    $data = json_decode(file_get_contents(MANUFACTURERS_FILE), true);
    return is_array($data) ? $data : [];
}

function save_manufacturers(array $manufacturers): void
{
    file_put_contents(MANUFACTURERS_FILE, json_encode(array_values($manufacturers), JSON_PRETTY_PRINT));
}

function load_equipment(): array
{
    if (!file_exists(EQUIPMENT_FILE)) {
        return [];
    }
    $data = json_decode(file_get_contents(EQUIPMENT_FILE), true);
    return is_array($data) ? $data : [];
}

function save_equipment(array $equipment): void
{
    file_put_contents(EQUIPMENT_FILE, json_encode(array_values($equipment), JSON_PRETTY_PRINT));
}

function next_unit_id(array $units): int
{
    $max = 0;
    foreach ($units as $unit) {
        $max = max($max, (int) $unit['id']);
    }
    return $max + 1;
}

function next_equipment_id(array $equipment): int
{
    $max = 0;
    foreach ($equipment as $item) {
        $max = max($max, (int) $item['id']);
    }
    return $max + 1;
}

function find_unit(array $units, int $id): ?array
{
    foreach ($units as $unit) {
        if ((int) $unit['id'] === $id) {
            return $unit;
        }
    }
    return null;
}

function find_equipment_item(array $equipment, int $id): ?array
{
    foreach ($equipment as $item) {
        if ((int) $item['id'] === $id) {
            return $item;
        }
    }
    return null;
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function size_label(string $size): string
{
    return UNIT_SIZES[$size] ?? $size;
}

function dice_summary(array $unit): string
{
    $parts = [];
    foreach (DICE_COLORS as $color) {
        $count = (int) ($unit['dice_' . $color] ?? 0);
        if ($count > 0) {
            $parts[] = $count . ' ' . ucfirst($color);
        }
    }
    return $parts ? implode(', ', $parts) : 'None';
}
