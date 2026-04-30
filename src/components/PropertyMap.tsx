import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet marker icons not loading correctly in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  location: string;
}

export function PropertyMap({ location }: PropertyMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoordinates() {
      setLoading(true);
      setError(null);
      try {
        // First try to search with just the location
        let query = encodeURIComponent(location);
        // Include default context if the location doesn't have it to improve results
        if (!query.toLowerCase().includes('india') && !query.toLowerCase().includes('odisha') && !query.toLowerCase().includes('bhubaneswar')) {
          query = encodeURIComponent(`${location}, Bhubaneswar, Odisha, India`);
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch coordinates');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          // Default to Bhubaneswar if not identified
          setCoordinates([20.2961, 85.8245]);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError("Map location could not be loaded accurately.");
        setCoordinates([20.2961, 85.8245]); // default fallback
      } finally {
        setLoading(false);
      }
    }

    if (location) {
      fetchCoordinates();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-100 dark:bg-green-900/20 border border-gray-200 dark:border-green-900 rounded-sm flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <MapPin size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!coordinates) return null;

  return (
    <div className="w-full h-80 bg-gray-200 dark:bg-green-900/20 border border-gray-200 dark:border-green-900 rounded-sm overflow-hidden z-0">
      <MapContainer 
        center={coordinates} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>
            {location}
          </Popup>
        </Marker>
      </MapContainer>
      {error && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 text-xs px-2 py-1 rounded shadow-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
