import { useCallback, useEffect, useRef, useState } from 'react';

import CarrierList from './components/CarrierList';
import CityAutocomplete from './components/CityAutocomplete';
import MapPanel from './components/MapPanel';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from './config';
import { fetchCarriers } from './services/carriers';
import { loadGoogleMaps } from './services/googleMaps';
import { computeFastestRoutes, formatDistance, formatDuration } from './services/routes';
import './styles.css';

const EMPTY_RESULT = { status: 'idle', data: [], error: '' };

export default function App({
  googleMapsApiKey = GOOGLE_MAPS_API_KEY,
  apiBaseUrl = API_BASE_URL,
  mapsLoader = loadGoogleMaps,
  routeService = computeFastestRoutes,
  carrierService = fetchCarriers,
}) {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [fromSelection, setFromSelection] = useState(null);
  const [toSelection, setToSelection] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [routeResult, setRouteResult] = useState(EMPTY_RESULT);
  const [carrierResult, setCarrierResult] = useState(EMPTY_RESULT);
  const activeSearchRef = useRef(0);

  useEffect(() => {
    let active = true;

    if (!googleMapsApiKey) {
      setGoogleError(
        'Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to the frontend environment.',
      );
      return undefined;
    }

    mapsLoader(googleMapsApiKey)
      .then((loadedGoogleMaps) => {
        if (active) setGoogleMaps(loadedGoogleMaps);
      })
      .catch((error) => {
        if (active) {
          setGoogleError(
            error instanceof Error ? error.message : 'Google Maps could not be initialized.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [googleMapsApiKey, mapsLoader]);

  const updateSelection = useCallback((setter, selection) => {
    activeSearchRef.current += 1;
    setter(selection);
    setValidationError('');
    setRouteResult(EMPTY_RESULT);
    setCarrierResult(EMPTY_RESULT);
  }, []);

  const handleFromChange = useCallback(
    (selection) => updateSelection(setFromSelection, selection),
    [updateSelection],
  );
  const handleToChange = useCallback(
    (selection) => updateSelection(setToSelection, selection),
    [updateSelection],
  );

  const isSearching =
    routeResult.status === 'loading' || carrierResult.status === 'loading';
  const canSearch = Boolean(fromSelection && toSelection && googleMaps && !isSearching);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!fromSelection || !toSelection) {
      setValidationError('Select both cities from the Google suggestions before searching.');
      return;
    }
    if (!googleMaps || isSearching) return;

    const searchId = activeSearchRef.current + 1;
    activeSearchRef.current = searchId;
    setValidationError('');
    setRouteResult({ status: 'loading', data: [], error: '' });
    setCarrierResult({ status: 'loading', data: [], error: '' });

    const routePromise = routeService(
      googleMaps,
      fromSelection.place,
      toSelection.place,
    )
      .then((routes) => {
        if (activeSearchRef.current !== searchId) return;
        setRouteResult({ status: 'success', data: routes, error: '' });
      })
      .catch((error) => {
        if (activeSearchRef.current !== searchId) return;
        setRouteResult({
          status: 'error',
          data: [],
          error: error instanceof Error ? error.message : 'Unable to calculate routes.',
        });
      });

    const carrierPromise = carrierService(
      apiBaseUrl,
      fromSelection.city,
      toSelection.city,
    )
      .then((carriers) => {
        if (activeSearchRef.current !== searchId) return;
        setCarrierResult({ status: 'success', data: carriers, error: '' });
      })
      .catch((error) => {
        if (activeSearchRef.current !== searchId) return;
        setCarrierResult({
          status: 'error',
          data: [],
          error: error instanceof Error ? error.message : 'Unable to load carriers.',
        });
      });

    await Promise.allSettled([routePromise, carrierPromise]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Genlogs route explorer home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>GENLOGS</span>
        </a>
        <span className="prototype-label">TAKE-HOME SIMULATION</span>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">ROUTE INTELLIGENCE</p>
          <h1>Find the fastest way forward.</h1>
          <p className="hero-copy">
            Compare available driving routes and simulated daily carrier capacity between cities.
          </p>

          {googleError && <p className="config-error" role="alert">{googleError}</p>}

          <form className="search-card" onSubmit={handleSubmit} noValidate>
            <CityAutocomplete
              googleMaps={googleMaps}
              label="From city"
              selectedCity={fromSelection?.city}
              onSelectionChange={handleFromChange}
              onError={setValidationError}
            />
            <span className="route-arrow" aria-hidden="true">→</span>
            <CityAutocomplete
              googleMaps={googleMaps}
              label="To city"
              selectedCity={toSelection?.city}
              onSelectionChange={handleToChange}
              onError={setValidationError}
            />
            <button className="search-button" type="submit" disabled={!canSearch}>
              {isSearching ? 'Searching…' : 'Search routes'}
            </button>
          </form>

          {validationError && <p className="validation-message" role="alert">{validationError}</p>}
        </section>

        <section className="workspace" aria-label="Route search results">
          <div className="map-column">
            <div className="section-heading route-heading">
              <div>
                <p className="eyebrow">FASTEST AVAILABLE</p>
                <h2>Driving routes</h2>
              </div>
              {routeResult.status === 'success' && (
                <span className="result-count">
                  {routeResult.data.length || 'No'} route{routeResult.data.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {routeResult.status === 'loading' && (
              <p className="status-message">Calculating available driving routes…</p>
            )}
            {routeResult.status === 'error' && (
              <p className="error-message" role="alert">{routeResult.error}</p>
            )}
            {routeResult.status === 'success' && routeResult.data.length === 0 && (
              <p className="error-message" role="status">
                Google did not return a driving route for these cities.
              </p>
            )}

            <MapPanel googleMaps={googleMaps} routes={routeResult.data} />

            {routeResult.data.length > 0 && (
              <ol className="route-list" aria-label="Route summaries">
                {routeResult.data.map((route, index) => (
                  <li key={`${route.durationMillis}-${index}`}>
                    <span className={`route-swatch route-${index + 1}`} aria-hidden="true" />
                    <span>Route {index + 1}</span>
                    <strong>{formatDuration(route.durationMillis)}</strong>
                    <small>{formatDistance(route.distanceMeters)}</small>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <CarrierList
            carriers={carrierResult.data}
            status={carrierResult.status}
            error={carrierResult.error}
          />
        </section>
      </main>

      <footer>
        Carrier capacity is static demonstration data. Route results are supplied by Google Maps.
      </footer>
    </div>
  );
}

