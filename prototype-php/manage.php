<?php
session_start();
require __DIR__ . '/includes/functions.php';

$units = load_units();
$factions = load_factions();
$flash = null;
$flashError = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_unit' || $action === 'update_unit') {
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        $faction = $_POST['faction'] ?? '';
        $type = $_POST['type'] ?? '';
        $points = (int) ($_POST['points'] ?? 0);

        if ($name === '' || !in_array($faction, $factions, true) || !in_array($type, UNIT_TYPES, true) || $points < 1) {
            $flash = 'Fill in every field with a valid value (points must be at least 1).';
            $flashError = true;
        } elseif ($action === 'add_unit') {
            $units[] = [
                'id' => next_unit_id($units),
                'name' => $name,
                'faction' => $faction,
                'type' => $type,
                'points' => $points,
            ];
            save_units($units);
            $flash = "Added \"{$name}\" to the catalog.";
        } else {
            $found = false;
            foreach ($units as &$unit) {
                if ((int) $unit['id'] === $id) {
                    $unit = ['id' => $id, 'name' => $name, 'faction' => $faction, 'type' => $type, 'points' => $points];
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

    if ($action === 'rename_faction') {
        $oldName = $_POST['old_name'] ?? '';
        $newName = trim($_POST['new_name'] ?? '');
        $idx = array_search($oldName, $factions, true);

        if ($idx === false) {
            $flash = 'Could not find that faction.';
            $flashError = true;
        } elseif ($newName === '') {
            $flash = 'Faction name cannot be empty.';
            $flashError = true;
        } elseif ($newName !== $oldName && in_array($newName, $factions, true)) {
            $flash = "A faction named \"{$newName}\" already exists.";
            $flashError = true;
        } else {
            $factions[$idx] = $newName;
            save_factions($factions);
            foreach ($units as &$unit) {
                if ($unit['faction'] === $oldName) {
                    $unit['faction'] = $newName;
                }
            }
            unset($unit);
            save_units($units);
            $flash = "Renamed \"{$oldName}\" to \"{$newName}\".";
        }
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

$activePage = 'manage';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DropshipBuilder — Manage available models</title>
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
    <h2 style="font-size:15px; margin-top:0;"><?= $editing ? 'Edit unit' : 'Add a new unit' ?></h2>
    <form method="post" class="add-form">
      <input type="hidden" name="action" value="<?= $editing ? 'update_unit' : 'add_unit' ?>" />
      <?php if ($editing): ?>
        <input type="hidden" name="id" value="<?= (int) $editing['id'] ?>" />
      <?php endif; ?>
      <div class="field">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" placeholder="Shock trooper squad" value="<?= h($editing['name'] ?? '') ?>" required />
      </div>
      <div class="field">
        <label for="faction">Faction</label>
        <select id="faction" name="faction">
          <?php foreach ($factions as $faction): ?>
            <option value="<?= h($faction) ?>" <?= ($editing['faction'] ?? '') === $faction ? 'selected' : '' ?>><?= h($faction) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="field">
        <label for="type">Type</label>
        <select id="type" name="type">
          <?php foreach (UNIT_TYPES as $type): ?>
            <option value="<?= h($type) ?>" <?= ($editing['type'] ?? '') === $type ? 'selected' : '' ?>><?= h($type) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="field">
        <label for="points">Points</label>
        <input type="number" id="points" name="points" min="0" step="5" value="<?= (int) ($editing['points'] ?? 50) ?>" required />
      </div>
      <div style="display:flex; gap:8px;">
        <button type="submit"><?= $editing ? 'Save changes' : 'Add unit' ?></button>
        <?php if ($editing): ?>
          <a href="manage.php"><button type="button" class="ghost">Cancel</button></a>
        <?php endif; ?>
      </div>
    </form>
  </div>

  <?php foreach ($factions as $faction): ?>
    <?php $factionUnits = array_values(array_filter($units, fn ($u) => $u['faction'] === $faction)); ?>
    <div class="card">
      <div class="faction-header">
        <h2 style="font-size:15px; margin:0;"><?= h($faction) ?> (<?= count($factionUnits) ?>)</h2>
        <form method="post" class="inline faction-rename">
          <input type="hidden" name="action" value="rename_faction" />
          <input type="hidden" name="old_name" value="<?= h($faction) ?>" />
          <input type="text" name="new_name" value="<?= h($faction) ?>" aria-label="Rename <?= h($faction) ?>" />
          <button type="submit" class="ghost">Rename</button>
        </form>
      </div>
      <?php if (empty($factionUnits)): ?>
        <p class="empty">No units for this faction yet. Add one above.</p>
      <?php else: ?>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Points</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($factionUnits as $unit): ?>
              <tr>
                <td><?= h($unit['name']) ?></td>
                <td><span class="badge <?= h($unit['type']) ?>"><?= h($unit['type']) ?></span></td>
                <td><?= (int) $unit['points'] ?></td>
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
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>
</body>
</html>
