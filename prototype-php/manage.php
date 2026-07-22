<?php
session_start();
require __DIR__ . '/includes/functions.php';

$units = load_units();
$manufacturers = load_manufacturers();
$equipment = load_equipment();
$flash = null;
$flashError = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_unit' || $action === 'update_unit') {
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        $manufacturer = $_POST['manufacturer'] ?? '';
        $size = $_POST['size'] ?? '';
        $weight = (int) ($_POST['weight'] ?? 0);
        $stats = [
            'armor' => (int) ($_POST['armor'] ?? 0),
            'max_weight' => (int) ($_POST['max_weight'] ?? 0),
            'max_drop_weight' => (int) ($_POST['max_drop_weight'] ?? 0),
            'hp' => (int) ($_POST['hp'] ?? 0),
            'base_movement' => (int) ($_POST['base_movement'] ?? 0),
            'dice_blue' => max(0, (int) ($_POST['dice_blue'] ?? 0)),
            'dice_red' => max(0, (int) ($_POST['dice_red'] ?? 0)),
            'dice_green' => max(0, (int) ($_POST['dice_green'] ?? 0)),
        ];

        if ($name === '' || !in_array($manufacturer, $manufacturers, true) || !array_key_exists($size, UNIT_SIZES) || $weight < 1) {
            $flash = 'Fill in every field with a valid value (weight must be at least 1 tonne).';
            $flashError = true;
        } elseif ($action === 'add_unit') {
            $units[] = array_merge([
                'id' => next_unit_id($units),
                'name' => $name,
                'manufacturer' => $manufacturer,
                'size' => $size,
                'weight' => $weight,
            ], $stats);
            save_units($units);
            $flash = "Added \"{$name}\" to the catalog.";
        } else {
            $found = false;
            foreach ($units as &$unit) {
                if ((int) $unit['id'] === $id) {
                    $unit = array_merge([
                        'id' => $id,
                        'name' => $name,
                        'manufacturer' => $manufacturer,
                        'size' => $size,
                        'weight' => $weight,
                    ], $stats);
                    $found = true;
                    break;
                }
            }
            unset($unit);
            if ($found) {
                save_units($units);
                $flash = "Saved changes to \"{$name}\".";
            } else {
                $flash = 'Could not find that unit to update.';
                $flashError = true;
            }
        }
    }

    if ($action === 'delete_unit') {
        $id = (int) ($_POST['id'] ?? 0);
        $unit = find_unit($units, $id);
        $units = array_values(array_filter($units, fn ($u) => (int) $u['id'] !== $id));
        save_units($units);
        $flash = $unit ? "Removed \"{$unit['name']}\" from the catalog." : 'Unit removed.';
    }

    if ($action === 'rename_manufacturer') {
        $oldName = $_POST['old_name'] ?? '';
        $newName = trim($_POST['new_name'] ?? '');
        $idx = array_search($oldName, $manufacturers, true);

        if ($idx === false) {
            $flash = 'Could not find that manufacturer.';
            $flashError = true;
        } elseif ($newName === '') {
            $flash = 'Manufacturer name cannot be empty.';
            $flashError = true;
        } elseif ($newName !== $oldName && in_array($newName, $manufacturers, true)) {
            $flash = "A manufacturer named \"{$newName}\" already exists.";
            $flashError = true;
        } else {
            $manufacturers[$idx] = $newName;
            save_manufacturers($manufacturers);
            foreach ($units as &$unit) {
                if ($unit['manufacturer'] === $oldName) {
                    $unit['manufacturer'] = $newName;
                }
            }
            unset($unit);
            save_units($units);
            foreach ($equipment as &$item) {
                if ($item['manufacturer'] === $oldName) {
                    $item['manufacturer'] = $newName;
                }
            }
            unset($item);
            save_equipment($equipment);
            $flash = "Renamed \"{$oldName}\" to \"{$newName}\".";
        }
    }

    if ($action === 'add_manufacturer') {
        $name = trim($_POST['name'] ?? '');

        if ($name === '') {
            $flash = 'Manufacturer name cannot be empty.';
            $flashError = true;
        } elseif (in_array($name, $manufacturers, true)) {
            $flash = "A manufacturer named \"{$name}\" already exists.";
            $flashError = true;
        } else {
            $manufacturers[] = $name;
            save_manufacturers($manufacturers);
            $flash = "Added manufacturer \"{$name}\".";
        }
    }

    if ($action === 'add_equipment' || $action === 'update_equipment') {
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        $manufacturer = $_POST['manufacturer'] ?? '';
        $slot = $_POST['slot'] ?? '';

        if ($name === '' || !in_array($manufacturer, $manufacturers, true) || !in_array($slot, SLOTS, true)) {
            $flash = 'Fill in every equipment field with a valid value.';
            $flashError = true;
        } elseif ($action === 'add_equipment') {
            $equipment[] = [
                'id' => next_equipment_id($equipment),
                'name' => $name,
                'manufacturer' => $manufacturer,
                'slot' => $slot,
            ];
            save_equipment($equipment);
            $flash = "Added \"{$name}\" to the equipment catalog.";
        } else {
            $found = false;
            foreach ($equipment as &$item) {
                if ((int) $item['id'] === $id) {
                    $item = ['id' => $id, 'name' => $name, 'manufacturer' => $manufacturer, 'slot' => $slot];
                    $found = true;
                    break;
                }
            }
            unset($item);
            if ($found) {
                save_equipment($equipment);
                $flash = "Saved changes to \"{$name}\".";
            } else {
                $flash = 'Could not find that equipment to update.';
                $flashError = true;
            }
        }
    }

    if ($action === 'delete_equipment') {
        $id = (int) ($_POST['id'] ?? 0);
        $item = find_equipment_item($equipment, $id);
        $equipment = array_values(array_filter($equipment, fn ($e) => (int) $e['id'] !== $id));
        save_equipment($equipment);
        $flash = $item ? "Removed \"{$item['name']}\" from the equipment catalog." : 'Equipment removed.';
    }

    $_SESSION['flash'] = $flash;
    $_SESSION['flash_error'] = $flashError;
    header('Location: manage.php');
    exit;
}

if (isset($_SESSION['flash'])) {
    $flash = $_SESSION['flash'];
    $flashError = $_SESSION['flash_error'] ?? false;
    unset($_SESSION['flash'], $_SESSION['flash_error']);
}

$editing = null;
if (isset($_GET['edit'])) {
    $editing = find_unit($units, (int) $_GET['edit']);
}

$editingEquipment = null;
if (isset($_GET['edit_equipment'])) {
    $editingEquipment = find_equipment_item($equipment, (int) $_GET['edit_equipment']);
}

$activePage = 'manage';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DropshipBuilder — Manage available models</title>
  <?php include __DIR__ . '/includes/theme-init.php'; ?>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
<?php include __DIR__ . '/includes/nav.php'; ?>

<div class="container">
  <h1>Manage available models</h1>

  <?php if ($flash): ?>
    <div class="flash <?= $flashError ? 'error' : '' ?>"><?= h($flash) ?></div>
  <?php endif; ?>

  <div class="card">
    <h2 style="font-size:15px; margin-top:0;">Add a manufacturer</h2>
    <form method="post" style="display:flex; gap:10px; align-items:flex-end;">
      <input type="hidden" name="action" value="add_manufacturer" />
      <div class="field" style="flex:1;">
        <label for="manufacturer_name">Name</label>
        <input type="text" id="manufacturer_name" name="name" placeholder="Voidforge Syndicate" required />
      </div>
      <button type="submit">Add manufacturer</button>
    </form>
  </div>

  <div class="card">
    <h2 style="font-size:15px; margin-top:0;"><?= $editing ? 'Edit unit' : 'Add a new unit' ?></h2>
    <?php if (empty($manufacturers)): ?>
      <p class="empty">Add a manufacturer above before adding units.</p>
    <?php else: ?>
      <form method="post">
        <input type="hidden" name="action" value="<?= $editing ? 'update_unit' : 'add_unit' ?>" />
        <?php if ($editing): ?>
          <input type="hidden" name="id" value="<?= (int) $editing['id'] ?>" />
        <?php endif; ?>
        <div class="stat-grid">
          <div class="field">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Shock trooper squad" value="<?= h($editing['name'] ?? '') ?>" required />
          </div>
          <div class="field">
            <label for="manufacturer">Manufacturer</label>
            <select id="manufacturer" name="manufacturer">
              <?php foreach ($manufacturers as $manufacturer): ?>
                <option value="<?= h($manufacturer) ?>" <?= ($editing['manufacturer'] ?? '') === $manufacturer ? 'selected' : '' ?>><?= h($manufacturer) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="field">
            <label for="size">Size</label>
            <select id="size" name="size">
              <?php foreach (UNIT_SIZES as $value => $label): ?>
                <option value="<?= h($value) ?>" <?= ($editing['size'] ?? '') === $value ? 'selected' : '' ?>><?= h($label) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="field">
            <label for="weight">Weight (tonnes)</label>
            <input type="number" id="weight" name="weight" min="0" step="1" value="<?= (int) ($editing['weight'] ?? 50) ?>" required />
          </div>
          <div class="field">
            <label for="armor">Armor</label>
            <input type="number" id="armor" name="armor" min="0" step="1" value="<?= (int) ($editing['armor'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="max_weight">Max weight</label>
            <input type="number" id="max_weight" name="max_weight" min="0" step="1" value="<?= (int) ($editing['max_weight'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="max_drop_weight">Max drop weight</label>
            <input type="number" id="max_drop_weight" name="max_drop_weight" min="0" step="1" value="<?= (int) ($editing['max_drop_weight'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="hp">HP</label>
            <input type="number" id="hp" name="hp" min="0" step="1" value="<?= (int) ($editing['hp'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="base_movement">Base movement</label>
            <input type="number" id="base_movement" name="base_movement" min="0" step="1" value="<?= (int) ($editing['base_movement'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="dice_blue">Blue dice</label>
            <input type="number" id="dice_blue" name="dice_blue" min="0" step="1" value="<?= (int) ($editing['dice_blue'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="dice_red">Red dice</label>
            <input type="number" id="dice_red" name="dice_red" min="0" step="1" value="<?= (int) ($editing['dice_red'] ?? 0) ?>" />
          </div>
          <div class="field">
            <label for="dice_green">Green dice</label>
            <input type="number" id="dice_green" name="dice_green" min="0" step="1" value="<?= (int) ($editing['dice_green'] ?? 0) ?>" />
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button type="submit"><?= $editing ? 'Save changes' : 'Add unit' ?></button>
          <?php if ($editing): ?>
            <a href="manage.php"><button type="button" class="ghost">Cancel</button></a>
          <?php endif; ?>
        </div>
      </form>
    <?php endif; ?>
  </div>

  <div class="card">
    <h2 style="font-size:15px; margin-top:0;"><?= $editingEquipment ? 'Edit equipment' : 'Add equipment' ?></h2>
    <?php if (empty($manufacturers)): ?>
      <p class="empty">Add a manufacturer above before adding equipment.</p>
    <?php else: ?>
      <form method="post" class="add-form">
        <input type="hidden" name="action" value="<?= $editingEquipment ? 'update_equipment' : 'add_equipment' ?>" />
        <?php if ($editingEquipment): ?>
          <input type="hidden" name="id" value="<?= (int) $editingEquipment['id'] ?>" />
        <?php endif; ?>
        <div class="field">
          <label for="equipment_name">Name</label>
          <input type="text" id="equipment_name" name="name" placeholder="Auto-cannon" value="<?= h($editingEquipment['name'] ?? '') ?>" required />
        </div>
        <div class="field">
          <label for="equipment_manufacturer">Manufacturer</label>
          <select id="equipment_manufacturer" name="manufacturer">
            <?php foreach ($manufacturers as $manufacturer): ?>
              <option value="<?= h($manufacturer) ?>" <?= ($editingEquipment['manufacturer'] ?? '') === $manufacturer ? 'selected' : '' ?>><?= h($manufacturer) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label for="equipment_slot">Slot</label>
          <select id="equipment_slot" name="slot">
            <?php foreach (SLOTS as $slot): ?>
              <option value="<?= h($slot) ?>" <?= ($editingEquipment['slot'] ?? '') === $slot ? 'selected' : '' ?>><?= h($slot) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="submit"><?= $editingEquipment ? 'Save changes' : 'Add equipment' ?></button>
          <?php if ($editingEquipment): ?>
            <a href="manage.php"><button type="button" class="ghost">Cancel</button></a>
          <?php endif; ?>
        </div>
      </form>
    <?php endif; ?>
  </div>

  <?php foreach ($manufacturers as $manufacturer): ?>
    <?php
    $manufacturerUnits = array_values(array_filter($units, fn ($u) => $u['manufacturer'] === $manufacturer));
    $manufacturerEquipment = array_values(array_filter($equipment, fn ($e) => $e['manufacturer'] === $manufacturer));
    ?>
    <div class="card">
      <div class="manufacturer-header">
        <h2 style="font-size:15px; margin:0;"><?= h($manufacturer) ?> (<?= count($manufacturerUnits) ?>)</h2>
        <form method="post" class="inline manufacturer-rename">
          <input type="hidden" name="action" value="rename_manufacturer" />
          <input type="hidden" name="old_name" value="<?= h($manufacturer) ?>" />
          <input type="text" name="new_name" value="<?= h($manufacturer) ?>" aria-label="Rename <?= h($manufacturer) ?>" />
          <button type="submit" class="ghost">Rename</button>
        </form>
      </div>
      <?php if (empty($manufacturerUnits)): ?>
        <p class="empty">No units for this manufacturer yet. Add one above.</p>
      <?php else: ?>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Weight (t)</th>
                <th>Armor</th>
                <th>Max wt</th>
                <th>Max drop wt</th>
                <th>HP</th>
                <th>Move</th>
                <th>Dice</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($manufacturerUnits as $unit): ?>
                <tr>
                  <td><?= h($unit['name']) ?></td>
                  <td><span class="badge"><?= h(size_label($unit['size'])) ?></span></td>
                  <td><?= (int) $unit['weight'] ?> t</td>
                  <td><?= (int) ($unit['armor'] ?? 0) ?></td>
                  <td><?= (int) ($unit['max_weight'] ?? 0) ?></td>
                  <td><?= (int) ($unit['max_drop_weight'] ?? 0) ?></td>
                  <td><?= (int) ($unit['hp'] ?? 0) ?></td>
                  <td><?= (int) ($unit['base_movement'] ?? 0) ?></td>
                  <td><?= h(dice_summary($unit)) ?></td>
                  <td>
                    <div style="display:flex; gap:8px;">
                      <a href="manage.php?edit=<?= (int) $unit['id'] ?>"><button type="button" class="ghost">Edit</button></a>
                      <form method="post" class="inline">
                        <input type="hidden" name="action" value="delete_unit" />
                        <input type="hidden" name="id" value="<?= (int) $unit['id'] ?>" />
                        <button type="submit" class="danger">Remove</button>
                      </form>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

      <h3 style="font-size:13px; color:var(--text-secondary); margin:16px 0 8px;">Equipment</h3>
      <?php if (empty($manufacturerEquipment)): ?>
        <p class="empty">No equipment for this manufacturer yet. Add some above.</p>
      <?php else: ?>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slot</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($manufacturerEquipment as $item): ?>
              <tr>
                <td><?= h($item['name']) ?></td>
                <td><span class="badge"><?= h($item['slot']) ?></span></td>
                <td>
                  <div style="display:flex; gap:8px;">
                    <a href="manage.php?edit_equipment=<?= (int) $item['id'] ?>"><button type="button" class="ghost">Edit</button></a>
                    <form method="post" class="inline">
                      <input type="hidden" name="action" value="delete_equipment" />
                      <input type="hidden" name="id" value="<?= (int) $item['id'] ?>" />
                      <button type="submit" class="danger">Remove</button>
                    </form>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>
</body>
</html>
