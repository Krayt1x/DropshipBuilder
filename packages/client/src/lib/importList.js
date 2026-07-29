import { DROP_POD_SIZE } from './constants.js';
import { requiredTypeForSlot } from './rosterEntry.js';
import { makeKey } from './storage.js';

const SLOT_LABEL_TO_SLOT = {
  Head: 'Head',
  Left: 'Left',
  Right: 'Right',
  Movement: 'Movement',
  Equipment: 'Movement', // drop pod's single equipment line
};

function stripDuplicateSuffix(name) {
  return name.replace(/ \(\d+\)$/, '');
}

// Parses the plain text produced by buildShareText (lib/shareList.js) back
// into a structured shape. Tolerant of leading/trailing blank lines; slot
// lines are matched by their "  Label: Name" prefix, not by position, so
// slot ordering doesn't matter.
export function parseShareText(text) {
  const rawLines = (text ?? '').split('\n');

  let i = 0;
  while (i < rawLines.length && rawLines[i].trim() === '') i++;

  const headerMatch = (rawLines[i] ?? '').match(/^(.*) \(([^)]+)\)$/);
  const listName = headerMatch ? headerMatch[1].trim() : '';
  const manufacturer = headerMatch ? headerMatch[2].trim() : '';

  const weightMatch = (rawLines[i + 1] ?? '').match(
    /Weight:\s*[\d.]+\s*t\s*\/\s*([\d.]+)\s*t/i,
  );
  const weightLimit = weightMatch ? Number(weightMatch[1]) : null;

  const units = [];
  let current = null;
  for (let j = i + 2; j < rawLines.length; j++) {
    const line = rawLines[j];
    if (line.trim() === '') {
      if (current) units.push(current);
      current = null;
      continue;
    }
    const unitMatch = !line.startsWith(' ') && line.match(/^(.+) - ([\d.]+)t$/);
    if (unitMatch) {
      if (current) units.push(current);
      current = {
        name: stripDuplicateSuffix(unitMatch[1].trim()),
        weight: Number(unitMatch[2]),
        slots: [],
      };
      continue;
    }
    const slotMatch = line.match(/^ {2}(\w+):\s*(.+)$/);
    if (slotMatch && current) {
      current.slots.push({
        slotLabel: slotMatch[1],
        itemName: slotMatch[2].trim(),
      });
    }
  }
  if (current) units.push(current);

  return { listName, manufacturer, weightLimit, units };
}

// Matches a parsed list against the current catalogue, resolving unit and
// equipment names to ids. Units or equipment that can't be found are
// skipped (recorded as warnings) rather than blocking the whole import.
export function matchImportedList({ parsed, manufacturers, units, equipment }) {
  const manufacturerMatch = manufacturers.find(
    (m) => m.toLowerCase() === (parsed.manufacturer ?? '').toLowerCase(),
  );

  const result = {
    listName: parsed.listName || 'Imported list',
    manufacturer: manufacturerMatch ?? null,
    weightLimit: parsed.weightLimit,
    matchedUnits: [],
    warnings: [],
  };

  if (!manufacturerMatch) {
    result.warnings.push(
      `Manufacturer "${parsed.manufacturer || '—'}" not found.`,
    );
    return result;
  }

  parsed.units.forEach((unitBlock) => {
    const unit = units.find(
      (u) =>
        u.manufacturer === manufacturerMatch &&
        u.name.toLowerCase() === unitBlock.name.toLowerCase(),
    );
    if (!unit) {
      result.warnings.push(`Unit "${unitBlock.name}" not found — skipped.`);
      return;
    }

    const isDropPod = unit.size === DROP_POD_SIZE;
    const entryEquipment = { Movement: [], Left: [], Right: [], Head: [] };
    const unitWarnings = [];

    unitBlock.slots.forEach(({ slotLabel, itemName }) => {
      const slot = SLOT_LABEL_TO_SLOT[slotLabel];
      if (!slot) return;

      const item = equipment.find((e) => {
        if (e.manufacturer !== manufacturerMatch) return false;
        if (e.name.toLowerCase() !== itemName.toLowerCase()) return false;
        return isDropPod
          ? !e.no_drop_pod
          : (e.type ?? 'Movement') === requiredTypeForSlot(slot);
      });

      if (!item) {
        unitWarnings.push(`"${itemName}" not found`);
        return;
      }
      entryEquipment[slot].push(Number(item.id));
    });

    result.matchedUnits.push({
      key: makeKey('import'),
      name: unit.name,
      unit_id: unit.id,
      equipment: entryEquipment,
      warnings: unitWarnings,
    });
  });

  return result;
}
