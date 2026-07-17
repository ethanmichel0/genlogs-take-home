import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';


vi.mock('./components/CityAutocomplete', () => ({
  default: ({ label, onSelectionChange, selectedCity }) => {
    const isFrom = label === 'From city';
    const primaryCity = isFrom ? 'New York City' : 'Washington DC';
    const alternateCity = isFrom ? 'Denver' : 'Seattle';
    return (
      <div aria-label={`${label} mock`}>
        <span>{selectedCity || `No ${label.toLowerCase()} selected`}</span>
        <button
          type="button"
          onClick={() =>
            onSelectionChange({
              city: primaryCity,
              place: { location: { city: primaryCity } },
            })
          }
        >
          Select {label}
        </button>
        <button
          type="button"
          onClick={() =>
            onSelectionChange({
              city: alternateCity,
              place: { location: { city: alternateCity } },
            })
          }
        >
          Change {label}
        </button>
        <button type="button" onClick={() => onSelectionChange(null)}>
          Edit {label}
        </button>
      </div>
    );
  },
}));

vi.mock('./components/MapPanel', () => ({
  default: ({ routes }) => <div aria-label="mock map">{routes.length} route overlays</div>,
}));


function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}


function setup(overrides = {}) {
  const googleMaps = { maps: {} };
  const mapsLoader = vi.fn().mockResolvedValue(googleMaps);
  const routeService = vi.fn().mockResolvedValue([]);
  const carrierService = vi.fn().mockResolvedValue([]);

  render(
    <App
      googleMapsApiKey="test-key"
      apiBaseUrl="https://api.example"
      mapsLoader={mapsLoader}
      routeService={routeService}
      carrierService={carrierService}
      {...overrides}
    />,
  );

  return { googleMaps, mapsLoader, routeService, carrierService };
}


async function selectPrimaryCities(user) {
  await user.click(screen.getByRole('button', { name: 'Select From city' }));
  await user.click(screen.getByRole('button', { name: 'Select To city' }));
}


describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires two Google-selected cities before enabling Search', async () => {
    const user = userEvent.setup();
    setup();
    const searchButton = screen.getByRole('button', { name: 'Search routes' });

    expect(searchButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Select From city' }));
    expect(searchButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Select To city' }));

    await waitFor(() => expect(searchButton).toBeEnabled());
  });

  it('sends selected city names and renders carrier and route results', async () => {
    const user = userEvent.setup();
    const route = {
      durationMillis: 60 * 60_000,
      distanceMeters: 100 * 1609.344,
    };
    const routeService = vi.fn().mockResolvedValue([route]);
    const carrierService = vi.fn().mockResolvedValue([
      { name: 'Knight-Swift Transport Services', trucks_per_day: 10 },
    ]);
    const { googleMaps } = setup({ routeService, carrierService });
    await selectPrimaryCities(user);

    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    expect(await screen.findByText('Knight-Swift Transport Services')).toBeVisible();
    expect(screen.getByText('10')).toBeVisible();
    expect(screen.getByText('1 hr')).toBeVisible();
    expect(screen.getByLabelText('mock map')).toHaveTextContent('1 route overlays');
    expect(carrierService).toHaveBeenCalledWith(
      'https://api.example',
      'New York City',
      'Washington DC',
    );
    expect(routeService).toHaveBeenCalledWith(
      googleMaps,
      { location: { city: 'New York City' } },
      { location: { city: 'Washington DC' } },
    );
  });

  it('invalidates an edited selection and clears obsolete results', async () => {
    const user = userEvent.setup();
    const carrierService = vi.fn().mockResolvedValue([
      { name: 'UPS Inc.', trucks_per_day: 11 },
    ]);
    setup({ carrierService });
    await selectPrimaryCities(user);
    await user.click(screen.getByRole('button', { name: 'Search routes' }));
    expect(await screen.findByText('UPS Inc.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Edit From city' }));

    expect(screen.getByRole('button', { name: 'Search routes' })).toBeDisabled();
    expect(screen.queryByText('UPS Inc.')).not.toBeInTheDocument();
    expect(screen.getByText('Run a search to see static carrier availability.')).toBeVisible();
  });

  it('keeps successful routes visible when carrier lookup fails', async () => {
    const user = userEvent.setup();
    const routeService = vi.fn().mockResolvedValue([
      { durationMillis: 30 * 60_000, distanceMeters: 50 * 1609.344 },
    ]);
    const carrierService = vi.fn().mockRejectedValue(new Error('Carrier API unavailable'));
    setup({ routeService, carrierService });
    await selectPrimaryCities(user);

    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    expect(await screen.findByText('Carrier API unavailable')).toBeVisible();
    expect(screen.getByLabelText('mock map')).toHaveTextContent('1 route overlays');
    expect(screen.getByText('30 min')).toBeVisible();
  });

  it('shows loading feedback and prevents duplicate submission while pending', async () => {
    const user = userEvent.setup();
    const routes = deferred();
    const carriers = deferred();
    const routeService = vi.fn().mockReturnValue(routes.promise);
    const carrierService = vi.fn().mockReturnValue(carriers.promise);
    setup({ routeService, carrierService });
    await selectPrimaryCities(user);

    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    const pendingButton = screen.getByRole('button', { name: 'Searching…' });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByText('Calculating available driving routes…')).toBeVisible();
    expect(screen.getByText('Loading carrier capacity…')).toBeVisible();
    await user.click(pendingButton);
    expect(routeService).toHaveBeenCalledTimes(1);
    expect(carrierService).toHaveBeenCalledTimes(1);

    await act(async () => {
      routes.resolve([]);
      carriers.resolve([]);
    });
  });

  it('shows a no-route state without hiding successful carriers', async () => {
    const user = userEvent.setup();
    const carrierService = vi.fn().mockResolvedValue([
      { name: 'FedEx Corp', trucks_per_day: 9 },
    ]);
    setup({ carrierService });
    await selectPrimaryCities(user);

    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    expect(
      await screen.findByText('Google did not return a driving route for these cities.'),
    ).toBeVisible();
    expect(screen.getByText('FedEx Corp')).toBeVisible();
  });

  it('keeps successful carriers visible when route calculation fails', async () => {
    const user = userEvent.setup();
    const routeService = vi.fn().mockRejectedValue(new Error('Google routes unavailable'));
    const carrierService = vi.fn().mockResolvedValue([
      { name: 'UPS Inc.', trucks_per_day: 11 },
    ]);
    setup({ routeService, carrierService });
    await selectPrimaryCities(user);

    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    expect(await screen.findByText('Google routes unavailable')).toBeVisible();
    expect(screen.getByText('UPS Inc.')).toBeVisible();
  });

  it('ignores a stale carrier response after a newer search', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const carrierService = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    setup({ carrierService });
    await selectPrimaryCities(user);
    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    await user.click(screen.getByRole('button', { name: 'Change From city' }));
    await user.click(screen.getByRole('button', { name: 'Change To city' }));
    await user.click(screen.getByRole('button', { name: 'Search routes' }));

    await act(async () => {
      second.resolve([{ name: 'FedEx Corp', trucks_per_day: 9 }]);
    });
    expect(await screen.findByText('FedEx Corp')).toBeVisible();

    await act(async () => {
      first.resolve([{ name: 'Stale Carrier', trucks_per_day: 99 }]);
    });
    expect(screen.queryByText('Stale Carrier')).not.toBeInTheDocument();
    expect(screen.getByText('FedEx Corp')).toBeVisible();
  });

  it('shows a clear configuration error when the Google key is missing', () => {
    const mapsLoader = vi.fn();
    render(<App googleMapsApiKey="" mapsLoader={mapsLoader} />);

    expect(screen.getByRole('alert')).toHaveTextContent('VITE_GOOGLE_MAPS_API_KEY');
    expect(screen.getByRole('button', { name: 'Search routes' })).toBeDisabled();
    expect(mapsLoader).not.toHaveBeenCalled();
  });
});
