import { useEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import ListBuilderPage from './pages/ListBuilderPage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import { useLocalStorageState } from './lib/storage.js';
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
