import { useEffect, useState } from 'react';
import Nav from './components/Nav.jsx';
import ListBuilderPage from './pages/ListBuilderPage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import MathReferencePage from './pages/MathReferencePage.jsx';
import RuleBookPage from './pages/RuleBookPage.jsx';
import {
  useLocalStorageState,
  mergeSeedRecords,
  mergeManufacturers,
} from './lib/storage.js';
import { DATA_VERSION } from './lib/constants.js';
import manufacturersSeed from './data/manufacturers.json';
import unitsSeed from './data/units.json';
import equipmentSeed from './data/equipment.json';

function currentPage() {
  if (window.location.hash === '#manage') return 'manage';
  if (window.location.hash === '#math') return 'math';
  if (window.location.hash === '#rulebook') return 'rulebook';
  return 'list';
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
  const [dataVersion, setDataVersion] = useLocalStorageState(
    'dropshipbuilder:dataVersion',
    DATA_VERSION,
  );

  useEffect(() => {
    function onHashChange() {
      setPage(currentPage());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (dataVersion === DATA_VERSION) return;

    let snapshot = { units: [], equipment: [] };
    try {
      const raw = window.localStorage.getItem('dropshipbuilder:seedSnapshot');
      if (raw) snapshot = JSON.parse(raw);
    } catch {
      // no usable snapshot — merge falls back to "only add new records"
    }

    setManufacturers((current) =>
      mergeManufacturers(current, manufacturersSeed),
    );
    setUnits((current) =>
      mergeSeedRecords(current, snapshot.units ?? [], unitsSeed),
    );
    setEquipment((current) =>
      mergeSeedRecords(current, snapshot.equipment ?? [], equipmentSeed),
    );
    setDataVersion(DATA_VERSION);

    try {
      window.localStorage.setItem(
        'dropshipbuilder:seedSnapshot',
        JSON.stringify({ units: unitsSeed, equipment: equipmentSeed }),
      );
    } catch {
      // localStorage unavailable — merge still applied for this session
    }
  }, [dataVersion, setManufacturers, setUnits, setEquipment, setDataVersion]);

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
      ) : page === 'math' ? (
        <MathReferencePage />
      ) : page === 'rulebook' ? (
        <RuleBookPage />
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
