import { useEffect, useState } from 'react'
import './App.css'

interface Flight {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  heading: number;
  vertical_rate: number;
  sensors: number[];
  geo_altitude: number;
  squawk: string;
  spi: boolean;
  position_source: number;
}

interface FlightData {
  time: number;
  states: any[][];
}

function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
          console.log('WebSocket Connected');
          setConnectionStatus('Connected');
          setRetryCount(0); // Reset retry count on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data: FlightData = JSON.parse(event.data);
            console.log('Received flight data:', data);
            if (data.states) {
              // Convert array format to object format
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
                  !isNaN(flight.longitude)
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
          // Exponential backoff for reconnection
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setRetryCount(prev => prev + 1);
          reconnectTimeout = setTimeout(connect, timeout);
        };

        ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        // Retry on error
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

  return (
    <div className="app-container">
      <div className="map-container">
        {/* Map will be implemented here */}
        <div className="flights-overlay">
          {flights.map((flight) => (
            <div
              key={`${flight.icao24}-${flight.time_position}`}
              className="airplane"
              style={{
                left: `${(flight.longitude + 180) * (100 / 360)}%`,
                top: `${(90 - flight.latitude) * (100 / 180)}%`,
                transform: `rotate(${flight.heading}deg)`
              }}
            >
              ✈️
            </div>
          ))}
        </div>
      </div>
      <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px 10px',
        borderRadius: '4px'
      }}>
        Status: {connectionStatus} | Flights: {flights.length}
      </div>
    </div>
  )
}

export default App
