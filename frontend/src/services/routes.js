export async function computeFastestRoutes(googleMaps, originPlace, destinationPlace) {
  const { Route } = await googleMaps.maps.importLibrary('routes');
  const { routes = [] } = await Route.computeRoutes({
    origin: originPlace.location,
    destination: destinationPlace.location,
    travelMode: 'DRIVING',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: true,
    fields: ['path', 'durationMillis', 'distanceMeters', 'routeLabels'],
  });

  return [...routes]
    .filter((route) => Number.isFinite(route.durationMillis))
    .sort((first, second) => first.durationMillis - second.durationMillis)
    .slice(0, 3);
}

export function formatDuration(durationMillis) {
  const totalMinutes = Math.round(durationMillis / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function formatDistance(distanceMeters) {
  return `${Math.round(distanceMeters / 1609.344)} mi`;
}

