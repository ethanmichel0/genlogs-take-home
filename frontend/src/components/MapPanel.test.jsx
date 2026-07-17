import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MapPanel from './MapPanel';


function createMapGoogle() {
  const mapInstance = { fitBounds: vi.fn() };
  const boundsInstance = { extend: vi.fn() };

  class Map {
    constructor() {
      return mapInstance;
    }
  }

  class LatLngBounds {
    constructor() {
      return boundsInstance;
    }
  }

  const importLibrary = vi.fn(async (library) => {
    if (library === 'maps') return { Map };
    if (library === 'core') return { LatLngBounds };
    throw new Error(`Unexpected library: ${library}`);
  });

  return {
    googleMaps: { maps: { importLibrary } },
    mapInstance,
    boundsInstance,
  };
}


function createRoute(point) {
  const polyline = { setMap: vi.fn() };
  return {
    route: {
      path: [point],
      createPolylines: vi.fn().mockReturnValue([polyline]),
    },
    polyline,
  };
}


describe('MapPanel', () => {
  it('draws routes, fits their paths, and clears obsolete overlays', async () => {
    const { googleMaps, mapInstance, boundsInstance } = createMapGoogle();
    const firstPoint = { lat: 1, lng: 2 };
    const secondPoint = { lat: 3, lng: 4 };
    const first = createRoute(firstPoint);
    const second = createRoute(secondPoint);

    const { rerender } = render(
      <MapPanel googleMaps={googleMaps} routes={[first.route]} />,
    );

    await waitFor(() => expect(first.polyline.setMap).toHaveBeenCalledWith(mapInstance));
    expect(boundsInstance.extend).toHaveBeenCalledWith(firstPoint);
    expect(mapInstance.fitBounds).toHaveBeenCalled();

    rerender(<MapPanel googleMaps={googleMaps} routes={[second.route]} />);

    await waitFor(() => expect(first.polyline.setMap).toHaveBeenCalledWith(null));
    await waitFor(() => expect(second.polyline.setMap).toHaveBeenCalledWith(mapInstance));
    expect(boundsInstance.extend).toHaveBeenCalledWith(secondPoint);
  });
});

