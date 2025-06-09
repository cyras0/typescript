'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Flight, FlightData } from '@/types/flight';

export default function FlightMap() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [markers, setMarkers] = useState<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [3, 37],
      zoom: 5
    });

    newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
    setMap(newMap);

    newMap.on('load', () => {
      setMap(newMap);
    });

    return () => {
      newMap.remove();
    };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
          console.log('WebSocket Connected');
          setConnectionStatus('Connected');
          setRetryCount(0);
        };

        ws.onmessage = (event) => {
          try {
            const data: FlightData = JSON.parse(event.data);
            if (data.states) {
              const validFlights = data.states
                .filter(state => state && state.length >= 17)
                .map(state => ({
                  icao24: state[0],
                  callsign: state[1]?.trim() || 'Unknown',
                  origin_country: state[2],
                  time_position: state[3],
                  last_contact: state[4],
                  longitude: state[5],
                  latitude: state[6],
                  baro_altitude: state[7],
                  on_ground: state[8],
                  velocity: state[9],
                  heading: state[10],
                  vertical_rate: state[11],
                  sensors: state[12] || [],
                  geo_altitude: state[13],
                  squawk: state[14],
                  spi: state[15],
                  position_source: state[16]
                }))
                .filter(flight => 
                  flight.latitude != null && 
                  flight.longitude != null && 
                  !isNaN(flight.latitude) && 
                  !isNaN(flight.longitude) &&
                  flight.latitude >= -90 && 
                  flight.latitude <= 90 &&
                  flight.longitude >= -180 && 
                  flight.longitude <= 180 &&
                  !flight.on_ground
                );
              setFlights(validFlights);
            }
          } catch (error) {
            console.error('Error parsing flight data:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket Disconnected');
          setConnectionStatus('Disconnected');
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setRetryCount(prev => prev + 1);
          reconnectTimeout = setTimeout(connect, timeout);
        };

        ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setRetryCount(prev => prev + 1);
        reconnectTimeout = setTimeout(connect, timeout);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const createCustomMarker = (color: string, rotation: number, flight: Flight) => {
    const customMarkerContainer = document.createElement('div');
    customMarkerContainer.className = 'custom-marker-container';

    const customMarker = document.createElement('div');
    customMarker.className = 'custom-marker';
    customMarker.style.fontSize = '40px';
    customMarker.style.color = color;
    customMarker.textContent = '✈';
    customMarker.style.transform = `rotate(${rotation}deg)`;

    customMarkerContainer.appendChild(customMarker);
    return customMarkerContainer;
  };

  const getMarkerColor = (altitude: number) => {
    if (altitude < 1000) return 'white';
    if (altitude < 2000) return '#ff1300';
    if (altitude < 3000) return 'orange';
    if (altitude < 5000) return '#ffcf01';
    return '#4aff00';
  };

  useEffect(() => {
    if (!map) return;

    markers.forEach(marker => marker.remove());
    const newMarkers: maplibregl.Marker[] = [];

    flights.forEach(flight => {
      const color = getMarkerColor(flight.baro_altitude || 0);
      const el = createCustomMarker(color, flight.heading + 270, flight);
      
      const marker = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map'
      })
        .setLngLat([flight.longitude, flight.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <p><b>ICAO24:</b> ${flight.icao24}</p>
            <p><b>Callsign:</b> ${flight.callsign}</p>
            <p><b>Country:</b> ${flight.origin_country}</p>
            <p><b>Altitude:</b> ${flight.baro_altitude?.toFixed(0) || 'N/A'} ft</p>
            <p><b>Speed:</b> ${flight.velocity?.toFixed(0) || 'N/A'} m/s</p>
          `))
        .addTo(map);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [flights, map]);

  return (
    <div className="relative w-full h-screen">
      <a href="https://www.maptiler.com" className="absolute bottom-4 right-4 z-10">
        <img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler logo" className="h-8" />
      </a>
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded">
        Status: {connectionStatus} | Flights: {flights.length}
      </div>
    </div>
  );
}
