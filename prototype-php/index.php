<?php
session_start();
require __DIR__ . '/includes/functions.php';

$units = load_units();
$manufacturers = load_manufacturers();

if (!isset($_SESSION['list_name'])) {
    $_SESSION['list_name'] = 'Kestrel Vanguard';
}
if (!isset($_SESSION['manufacturer']) || !in_array($_SESSION['manufacturer'], $manufacturers, true)) {
    $_SESSION['manufacturer'] = $manufacturers[0] ?? '';
}
if (!isset($_SESSION['limit'])) {
    $_SESSION['limit'] = 1000;
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
        $_SESSION['limit'] = max(1, (int) ($_POST['limit'] ?? 1000));
    }

    if ($action === 'add_to_list') {
        $unitId = (int) ($_POST['unit_id'] ?? 0);
        $unit = find_unit($units, $unitId);
        if ($unit !== null) {
            $_SESSION['roster'][] = [
                'key' => uniqid('r', true),
                'unit_id' => $unitId,
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

    if ($action === 'clear_list') {
        $_SESSION['roster'] = [];
    }

    header('Location: index.php');
    exit;
}

$catalog = array_values(array_filter($units, fn ($u) => $u['manufacturer'] === $_SESSION['manufacturer']));

$rosterUnits = [];
$total = 0;
foreach ($_SESSION['roster'] as $entry) {
    $unit = find_unit($units, $entry['unit_id']);
    if ($unit !== null) {
        $rosterUnits[] = ['key' => $entry['key'], 'unit' => $unit];
        $total += (int) $unit['points'];
    }
}

$limit = (int) $_SESSION['limit'];
$pct = $limit > 0 ? min(100, (int) round(($total / $limit) * 100)) : 0;
$over = $total > $limit;

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
        <label for="limit">Points limit</label>
        <input type="number" id="limit" name="limit" value="<?= (int) $_SESSION['limit'] ?>" min="0" step="25" />
      </div>
      <button type="submit">Update</button>
    </form>

    <div class="points-label" style="margin-top:14px;">
      <span>Points used</span>
      <span><?= number_format($total) ?> / <?= number_format($limit) ?></span>
    </div>
    <div class="points-bar-track">
      <div class="points-bar-fill <?= $over ? 'over' : '' ?>" style="width: <?= $pct ?>%;"></div>
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
              <p class="unit-meta"><?= (int) $unit['points'] ?> pts</p>
            </div>
            <span class="badge <?= h($unit['type']) ?>"><?= h($unit['type']) ?></span>
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
            <div class="unit-row">
              <div class="unit-info">
                <p class="unit-name"><?= h($entry['unit']['name']) ?></p>
                <p class="unit-meta"><?= (int) $entry['unit']['points'] ?> pts</p>
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
