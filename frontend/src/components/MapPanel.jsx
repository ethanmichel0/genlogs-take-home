import { useEffect, useRef, useState } from 'react';

const ROUTE_COLORS = ['#16a36a', '#2563eb', '#e88d14'];

export default function MapPanel({ googleMaps, routes }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!googleMaps || !hostRef.current || mapRef.current) return undefined;

    let active = true;
    googleMaps.maps
      .importLibrary('maps')
      .then(({ Map }) => {
        if (!active || !hostRef.current) return;
        mapRef.current = new Map(hostRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 4,
          mapId: 'DEMO_MAP_ID',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });
        setMapReady(true);
      });

    return () => {
      active = false;
    };
  }, [googleMaps]);

  useEffect(() => {
    if (!googleMaps || !mapRef.current || !mapReady) return undefined;

    let active = true;

    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    async function drawRoutes() {
      if (!routes.length) return;

      const nextPolylines = routes.flatMap((route, index) =>
        route.createPolylines({
          polylineOptions: {
            strokeColor: ROUTE_COLORS[index],
            strokeOpacity: index === 0 ? 0.95 : 0.72,
            strokeWeight: index === 0 ? 7 : 5,
            zIndex: routes.length - index,
          },
        }),
      );

      if (!active) return;
      nextPolylines.forEach((polyline) => polyline.setMap(mapRef.current));
      polylinesRef.current = nextPolylines;

      const { LatLngBounds } = await googleMaps.maps.importLibrary('core');
      if (!active) return;

      const bounds = new LatLngBounds();
      routes.forEach((route) => route.path.forEach((point) => bounds.extend(point)));
      mapRef.current.fitBounds(bounds, 48);
    }

    void drawRoutes();

    return () => {
      active = false;
    };
  }, [googleMaps, mapReady, routes]);

  useEffect(
    () => () => {
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    },
    [],
  );

  return (
    <div className="map-shell" aria-label="Driving routes map">
      <div className="map-canvas" ref={hostRef} />
      {!routes.length && (
        <div className="map-empty">
          <span className="map-pin" aria-hidden="true">⌖</span>
          <strong>Your routes will appear here</strong>
          <span>Select two cities to compare available driving routes.</span>
        </div>
      )}
    </div>
  );
}

