import { computeRosterStats } from './rosterEntry.js';

export function buildShareText({
  listName,
  manufacturer,
  totalWeight,
  weightLimit,
  rosterUnits,
  units,
  equipment,
  entryWeight,
}) {
  const lines = [
    `${listName} (${manufacturer})`,
    `Weight: ${totalWeight}t / ${weightLimit}t`,
    '',
  ];

  rosterUnits.forEach((entry) => {
    const weight = entryWeight(entry);
    const stats = computeRosterStats(entry, units, equipment, weight);
    lines.push(`${entry.unit.name} - ${weight}t`);

    if (stats.isDropPod) {
      if (stats.dropPodSelected) {
        lines.push(`  Equipment: ${stats.dropPodSelected.name}`);
      }
    } else {
      stats
        .resolveEquippedItems('Head')
        .forEach((item) => lines.push(`  Head: ${item.name}`));
      stats
        .resolveEquippedItems('Left')
        .forEach((item) => lines.push(`  Left: ${item.name}`));
      stats
        .resolveEquippedItems('Right')
        .forEach((item) => lines.push(`  Right: ${item.name}`));
      const movementItem = stats.resolveEquippedItems('Movement')[0];
      if (movementItem) lines.push(`  Movement: ${movementItem.name}`);
    }
    lines.push('');
  });

  lines.push('Built with DropshipBuilder');
  return lines.join('\n');
}
