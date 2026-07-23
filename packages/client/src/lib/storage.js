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
