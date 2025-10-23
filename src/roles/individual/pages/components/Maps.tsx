import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import Directions from "../components/Directions";
import PlacesAutocomplete from "./PlacesAutoComplete";
import { placesService } from "@/services/maps/placesService";
import type { GooglePlace } from "@/services/maps/placesService";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

type Location = { lat: number; lng: number };

const DEFAULT_CENTER: Location = { lat: 9.0563, lng: 7.4985 };

const Maps: React.FC = () => {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [tempOrigin, setTempOrigin] = useState<Location | null>(null);
  const [tempDestination, setTempDestination] = useState<Location | null>(null);
  const [center, setCenter] = useState<Location>(DEFAULT_CENTER);
  const [nearbyPlaces, setNearbyPlaces] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Load nearby restaurants when component mounts or center changes
  useEffect(() => {
    const loadNearbyPlaces = async () => {
      try {
        setLoading(true);
        const results = await placesService.getPlacesByCategory("restaurants", center);
        // Get first 10 places to avoid cluttering the map
        setNearbyPlaces(results.slice(0, 10));
        setHasLoadedInitial(true);
      } catch (error) {
        console.error("Error loading nearby places:", error);
        setHasLoadedInitial(true);
      } finally {
        setLoading(false);
      }
    };

    // Only load on mount, or when center changes significantly (user selected new origin)
    if (!hasLoadedInitial || origin) {
      loadNearbyPlaces();
    }
  }, [center.lat, center.lng, hasLoadedInitial, origin]);

  const handleGetDirections = () => {
    if (tempOrigin) {
      setOrigin(tempOrigin);
      setCenter(tempOrigin);
    }
    if (tempDestination) {
      setDestination(tempDestination);
    }
  };

  const canGetDirections = tempOrigin && tempDestination;

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}>
      <div className="h-screen w-full flex flex-col">
        {/* Header / Legend / Inputs */}
        <div className="shrink-0 bg-white dark:bg-gray-900 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-xl font-semibold mb-3">
              Explore Places & Get Directions
            </h2>
            <div className="flex gap-4 flex-wrap items-end">
              <PlacesAutocomplete
                label="From..."
                onSelect={setTempOrigin}
              />
              <PlacesAutocomplete
                label="To..."
                onSelect={setTempDestination}
              />
              <Button
                onClick={handleGetDirections}
                disabled={!canGetDirections}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Origin
              </p>
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Destination
              </p>
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Nearby Restaurants {!loading && `(${nearbyPlaces.length})`}
              </p>
            </div>
          </div>
        </div>

        {/* Map fills remaining height */}
        <div className="grow min-h-[400px]">
          <Map
            defaultZoom={13}
            defaultCenter={DEFAULT_CENTER}
            center={center}
            mapId={import.meta.env.VITE_MAP_ID}
            fullscreenControl={false}
            className="h-full w-full"
          >
            {/* Origin marker */}
            {origin && (
              <AdvancedMarker position={origin} title="Origin">
                <Pin background="#22c55e" borderColor="#16a34a" glyphColor="#fff" />
              </AdvancedMarker>
            )}

            {/* Destination marker */}
            {destination && (
              <AdvancedMarker position={destination} title="Destination">
                <Pin background="#3b82f6" borderColor="#2563eb" glyphColor="#fff" />
              </AdvancedMarker>
            )}

            {/* Directions between origin and destination */}
            {origin && destination && (
              <Directions origin={origin} destination={destination} />
            )}

            {/* Nearby places markers */}
            {!loading && nearbyPlaces.map((place) => (
              <AdvancedMarker
                key={place.place_id}
                position={place.geometry.location}
                title={place.name}
              >
                <Pin background="#ef4444" borderColor="#dc2626" glyphColor="#fff" scale={0.8} />
              </AdvancedMarker>
            ))}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
};

export default Maps;
