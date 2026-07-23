import { useEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import ListBuilderPage from './pages/ListBuilderPage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import { useLocalStorageState, purgeCatalogCache } from './lib/storage.js';
import { DATA_VERSION } from './lib/constants.js';
import manufacturersSeed from './data/manufacturers.json';
import unitsSeed from './data/units.json';
import equipmentSeed from './data/equipment.json';

function currentPage() {
  return window.location.hash === '#manage' ? 'manage' : 'list';
}

function App() {
  const [page, setPage] = useState(currentPage);
  const [manufacturers, setManufacturers] = useLocalStorageState(
    'dropshipbuilder:manufacturers',
    manufacturersSeed,
  );
  const [units, setUnits] = useLocalStorageState(
    'dropshipbuilder:units',
    unitsSeed,
  );
  const [equipment, setEquipment] = useLocalStorageState(
    'dropshipbuilder:equipment',
    equipmentSeed,
  );
  const [dataVersion] = useLocalStorageState(
    'dropshipbuilder:dataVersion',
    DATA_VERSION,
  );
  const dataOutOfDate = dataVersion !== DATA_VERSION;

  useEffect(() => {
    function onHashChange() {
      setPage(currentPage());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <>
      <Nav page={page} />
      {dataOutOfDate && (
        <div className="stale-data-banner">
          <span>
            Local data is out of date — the unit and equipment catalogue has
            been updated.
          </span>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              if (
                window.confirm(
                  'This clears your saved manufacturers, units, and equipment and reloads the latest defaults. Your list and roster are not affected. Continue?',
                )
              ) {
                purgeCatalogCache();
              }
            }}
          >
            Purge cache
          </button>
        </div>
      )}
      {page === 'manage' ? (
        <ManagePage
          manufacturers={manufacturers}
          setManufacturers={setManufacturers}
          units={units}
          setUnits={setUnits}
          equipment={equipment}
          setEquipment={setEquipment}
        />
      ) : (
        <ListBuilderPage
          manufacturers={manufacturers}
          units={units}
          equipment={equipment}
        />
      )}
      <footer>
        <p>
          Generated with{' '}
          <a
            href="https://claude.com/claude-code"
            target="_blank"
            rel="noreferrer"
          >
            Claude Code
          </a>
        </p>
        <p>
          v{__APP_VERSION__} · Last updated{' '}
          {new Date(__BUILD_TIME__).toLocaleString()}
        </p>
      </footer>
    </>
  );
}

export default App;
