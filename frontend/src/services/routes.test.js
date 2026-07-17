import { describe, expect, it, vi } from 'vitest';

import { computeFastestRoutes, formatDistance, formatDuration } from './routes';


function createGoogleMaps(routes, rejection) {
  class Route {
    static computeRoutes = rejection
      ? vi.fn().mockRejectedValue(rejection)
      : vi.fn().mockResolvedValue({ routes });
  }

  return {
    googleMaps: {
      maps: {
        importLibrary: vi.fn().mockResolvedValue({ Route }),
      },
    },
    Route,
  };
}


describe('computeFastestRoutes', () => {
  it('sorts by duration, removes unusable durations, and caps results at three', async () => {
    const routes = [
      { id: 'slow', durationMillis: 4000 },
      { id: 'fastest', durationMillis: 1000 },
      { id: 'invalid' },
      { id: 'second', durationMillis: 2000 },
      { id: 'third', durationMillis: 3000 },
    ];
    const { googleMaps, Route } = createGoogleMaps(routes);
    const origin = { location: { lat: 1, lng: 2 } };
    const destination = { location: { lat: 3, lng: 4 } };

    const result = await computeFastestRoutes(googleMaps, origin, destination);

    expect(result.map((route) => route.id)).toEqual(['fastest', 'second', 'third']);
    expect(Route.computeRoutes).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: origin.location,
        destination: destination.location,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: true,
      }),
    );
  });

  it.each([
    [[], 0],
    [[{ durationMillis: 1000 }], 1],
    [[{ durationMillis: 2000 }, { durationMillis: 1000 }], 2],
  ])('returns every usable route when Google returns fewer than three', async (routes, count) => {
    const { googleMaps } = createGoogleMaps(routes);

    const result = await computeFastestRoutes(
      googleMaps,
      { location: {} },
      { location: {} },
    );

    expect(result).toHaveLength(count);
  });

  it('propagates a Google route failure', async () => {
    const { googleMaps } = createGoogleMaps([], new Error('Routes unavailable'));

    await expect(
      computeFastestRoutes(googleMaps, { location: {} }, { location: {} }),
    ).rejects.toThrow('Routes unavailable');
  });
});


describe('route formatting', () => {
  it('formats duration and distance for the route summary', () => {
    expect(formatDuration(45 * 60_000)).toBe('45 min');
    expect(formatDuration(90 * 60_000)).toBe('1 hr 30 min');
    expect(formatDistance(160_934.4)).toBe('100 mi');
  });
});

