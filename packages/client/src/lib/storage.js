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
  window.location.reload();
}
