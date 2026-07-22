<?php
session_start();
require __DIR__ . '/includes/functions.php';

$units = load_units();
$manufacturers = load_manufacturers();
$equipment = load_equipment();

if (!isset($_SESSION['list_name'])) {
    $_SESSION['list_name'] = 'Kestrel Vanguard';
}
if (!isset($_SESSION['manufacturer']) || !in_array($_SESSION['manufacturer'], $manufacturers, true)) {
    $_SESSION['manufacturer'] = $manufacturers[0] ?? '';
}
if (!isset($_SESSION['weight_limit'])) {
    $_SESSION['weight_limit'] = 100;
}
if (!isset($_SESSION['roster'])) {
    $_SESSION['roster'] = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'update_settings') {
        $_SESSION['list_name'] = trim($_POST['list_name'] ?? '') ?: 'Untitled list';
        if (in_array($_POST['manufacturer'] ?? '', $manufacturers, true)) {
            $_SESSION['manufacturer'] = $_POST['manufacturer'];
        }
        $_SESSION['weight_limit'] = max(1, (int) ($_POST['weight_limit'] ?? 100));
    }

    if ($action === 'add_to_list') {
        $unitId = (int) ($_POST['unit_id'] ?? 0);
        $unit = find_unit($units, $unitId);
        if ($unit !== null) {
            $_SESSION['roster'][] = [
                'key' => uniqid('r', true),
                'unit_id' => $unitId,
                'equipment' => array_fill_keys(SLOTS, null),
            ];
        }
    }

    if ($action === 'remove_from_list') {
        $key = $_POST['key'] ?? '';
        $_SESSION['roster'] = array_values(array_filter(
            $_SESSION['roster'],
            fn ($entry) => $entry['key'] !== $key
        ));
    }

    if ($action === 'assign_equipment') {
        $key = $_POST['key'] ?? '';
        $slot = $_POST['slot'] ?? '';
        $equipmentId = (int) ($_POST['equipment_id'] ?? 0);

        if (in_array($slot, SLOTS, true)) {
            foreach ($_SESSION['roster'] as &$entry) {
                if ($entry['key'] === $key) {
                    if (!isset($entry['equipment'])) {
                        $entry['equipment'] = array_fill_keys(SLOTS, null);
                    }
                    $entry['equipment'][$slot] = $equipmentId > 0 ? $equipmentId : null;
                    break;
                }
            }
            unset($entry);
        }
    }

    if ($action === 'clear_list') {
        $_SESSION['roster'] = [];
    }

    header('Location: index.php');
    exit;
}

$catalog = array_values(array_filter($units, fn ($u) => $u['manufacturer'] === $_SESSION['manufacturer']));

$rosterUnits = [];
$totalWeight = 0;
foreach ($_SESSION['roster'] as $entry) {
    $unit = find_unit($units, $entry['unit_id']);
    if ($unit !== null) {
        $rosterUnits[] = [
            'key' => $entry['key'],
            'unit' => $unit,
            'equipment' => $entry['equipment'] ?? array_fill_keys(SLOTS, null),
        ];
        $totalWeight += (int) $unit['weight'];
    }
}

$weightLimit = (int) $_SESSION['weight_limit'];
$pct = $weightLimit > 0 ? min(100, (int) round(($totalWeight / $weightLimit) * 100)) : 0;
$over = $totalWeight > $weightLimit;

$activePage = 'index';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DropshipBuilder — List builder</title>
  <?php include __DIR__ . '/includes/theme-init.php'; ?>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
<?php include __DIR__ . '/includes/nav.php'; ?>

<div class="container">
  <h1>List builder</h1>

  <div class="card">
    <form method="post" class="settings-row">
      <input type="hidden" name="action" value="update_settings" />
      <div class="field">
        <label for="list_name">List name</label>
        <input type="text" id="list_name" name="list_name" value="<?= h($_SESSION['list_name']) ?>" />
      </div>
      <div class="field">
        <label for="manufacturer">Manufacturer</label>
        <select id="manufacturer" name="manufacturer" onchange="this.form.submit()">
          <?php foreach ($manufacturers as $manufacturer): ?>
            <option value="<?= h($manufacturer) ?>" <?= $manufacturer === $_SESSION['manufacturer'] ? 'selected' : '' ?>><?= h($manufacturer) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="field">
        <label for="weight_limit">Weight limit (tonnes)</label>
        <input type="number" id="weight_limit" name="weight_limit" value="<?= (int) $_SESSION['weight_limit'] ?>" min="0" step="1" />
      </div>
      <button type="submit">Update</button>
    </form>

    <div class="weight-label" style="margin-top:14px;">
      <span>Weight used</span>
      <span><?= number_format($totalWeight) ?> t / <?= number_format($weightLimit) ?> t</span>
    </div>
    <div class="weight-bar-track">
      <div class="weight-bar-fill <?= $over ? 'over' : '' ?>" style="width: <?= $pct ?>%;"></div>
    </div>
  </div>

  <div class="columns">
    <div>
      <h2 style="font-size:15px;">Unit catalog — <?= h($_SESSION['manufacturer']) ?></h2>
      <?php if (empty($catalog)): ?>
        <p class="empty">No units available for this manufacturer yet. Add some on the manage page.</p>
      <?php else: ?>
        <?php foreach ($catalog as $unit): ?>
          <div class="unit-row">
            <div class="unit-info">
              <p class="unit-name"><?= h($unit['name']) ?></p>
              <p class="unit-meta"><?= (int) $unit['weight'] ?> t</p>
            </div>
            <span class="badge"><?= h(size_label($unit['size'])) ?></span>
            <form method="post" class="inline">
              <input type="hidden" name="action" value="add_to_list" />
              <input type="hidden" name="unit_id" value="<?= (int) $unit['id'] ?>" />
              <button type="submit">Add</button>
            </form>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>

    <div>
      <h2 style="font-size:15px;">Your roster</h2>
      <div class="card" style="padding:0.75rem;">
        <?php if (empty($rosterUnits)): ?>
          <p class="empty">No units added yet.</p>
        <?php else: ?>
          <?php foreach ($rosterUnits as $entry): ?>
            <?php $unitEquipment = array_values(array_filter($equipment, fn ($e) => $e['manufacturer'] === $entry['unit']['manufacturer'])); ?>
            <div class="unit-row" style="align-items:flex-start; flex-wrap:wrap;">
              <div class="unit-info">
                <p class="unit-name"><?= h($entry['unit']['name']) ?></p>
                <p class="unit-meta"><?= (int) $entry['unit']['weight'] ?> t</p>
                <div class="equipment-slots">
                  <?php foreach (SLOTS as $slot): ?>
                    <?php $slotOptions = array_values(array_filter($unitEquipment, fn ($e) => $e['slot'] === $slot)); ?>
                    <form method="post" class="inline">
                      <input type="hidden" name="action" value="assign_equipment" />
                      <input type="hidden" name="key" value="<?= h($entry['key']) ?>" />
                      <input type="hidden" name="slot" value="<?= h($slot) ?>" />
                      <label class="slot-label">
                        <?= h($slot) ?>
                        <select name="equipment_id" onchange="this.form.submit()" <?= empty($slotOptions) ? 'disabled' : '' ?>>
                          <option value="0">None</option>
                          <?php foreach ($slotOptions as $item): ?>
                            <option value="<?= (int) $item['id'] ?>" <?= (int) ($entry['equipment'][$slot] ?? 0) === (int) $item['id'] ? 'selected' : '' ?>><?= h($item['name']) ?></option>
                          <?php endforeach; ?>
                        </select>
                      </label>
                    </form>
                  <?php endforeach; ?>
                </div>
              </div>
              <form method="post" class="inline">
                <input type="hidden" name="action" value="remove_from_list" />
                <input type="hidden" name="key" value="<?= h($entry['key']) ?>" />
                <button type="submit" class="danger">Remove</button>
              </form>
            </div>
          <?php endforeach; ?>
          <form method="post" class="inline" style="display:block; margin-top:10px;">
            <input type="hidden" name="action" value="clear_list" />
            <button type="submit" class="ghost">Clear list</button>
          </form>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>
</body>
</html>
