# PHP prototype

A throwaway PHP version of the list builder, separate from the real app in `packages/`. Good for quickly playing with the UI/UX without the Node/React/Postgres stack.

- No database — the catalog lives in `data/units.json`, edited directly by `manage.php`.
- No user accounts — your in-progress list is stored in the PHP session (cookie-based), so it resets if you clear cookies or switch browsers.

## Run it

```bash
php -S localhost:8090 -t prototype-php
```

Then open http://localhost:8090.

- `index.php` — the list builder: pick a faction, add units from the catalog, watch the points total.
- `manage.php` — add or remove units from the catalog (`data/units.json`).
