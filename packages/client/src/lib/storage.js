import { useEffect, useState } from 'react';

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private browsing, quota) — state still works in-memory
    }
  }, [key, value]);

  return [value, setValue];
}

export function nextId(items) {
  return (
    items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  );
}

export function makeKey(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function purgeCatalogCache() {
  window.localStorage.removeItem('dropshipbuilder:manufacturers');
  window.localStorage.removeItem('dropshipbuilder:units');
  window.localStorage.removeItem('dropshipbuilder:equipment');
  window.localStorage.removeItem('dropshipbuilder:dataVersion');
  window.localStorage.removeItem('dropshipbuilder:seedSnapshot');
  window.location.reload();
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

// Merges a locally-stored catalogue (units or equipment) with a newer seed.
// New seed records (unknown id) are added. Records the user hasn't edited
// since the last seed sync (identical to prevSeed) are updated to the new
// seed's version. Records the user HAS edited are left untouched. Records
// the user created locally (no id match in either seed) are preserved.
export function mergeSeedRecords(local, prevSeed, nextSeed) {
  const prevById = new Map(prevSeed.map((item) => [Number(item.id), item]));
  const localById = new Map(local.map((item) => [Number(item.id), item]));
  const nextIds = new Set(nextSeed.map((item) => Number(item.id)));

  const merged = nextSeed.map((seedItem) => {
    const localItem = localById.get(Number(seedItem.id));
    if (!localItem) return seedItem;
    const prevItem = prevById.get(Number(seedItem.id));
    const unedited =
      prevItem && stableStringify(localItem) === stableStringify(prevItem);
    return unedited ? seedItem : localItem;
  });

  const userAdded = local.filter(
    (item) => !nextIds.has(Number(item.id)) && !prevById.has(Number(item.id)),
  );

  return [...merged, ...userAdded];
}

// Manufacturers are plain strings with no stable id, so the merge is a
// simple union: add any new seed manufacturer names, never remove or
// rename local ones automatically.
export function mergeManufacturers(local, nextSeed) {
  const merged = [...local];
  nextSeed.forEach((name) => {
    if (!merged.includes(name)) merged.push(name);
  });
  return merged;
}
