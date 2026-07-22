<?php

define('UNITS_FILE', __DIR__ . '/../data/units.json');
define('MANUFACTURERS_FILE', __DIR__ . '/../data/manufacturers.json');
define('UNIT_TYPES', ['Infantry', 'Vehicle', 'Dropship', 'Character']);

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

function next_unit_id(array $units): int
{
    $max = 0;
    foreach ($units as $unit) {
        $max = max($max, (int) $unit['id']);
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

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
