import React, { useEffect, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { X, Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  origin: Location;
  destination: Location;
  onClose?: () => void;
}

type Location = { lat: number; lng: number };

const Directions: React.FC<Props> = ({ origin, destination, onClose }) => {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");

  const [svc, setSvc] = useState<google.maps.DirectionsService | null>(null);
  const [renderer, setRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const selected = routes[routeIndex];
  const leg = selected?.legs?.[0];

  useEffect(() => {
    if (!routesLib || !map) return;
    setSvc(new routesLib.DirectionsService());
    setRenderer(new routesLib.DirectionsRenderer({ map }));
  }, [routesLib, map]);

  useEffect(() => {
    if (!svc || !renderer) return;

    svc
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((res) => {
        renderer.setDirections(res);
        setRoutes(res.routes);
        setRouteIndex(0);
      })
      .catch((err) => console.error("Directions error:", err));
  }, [svc, renderer, origin, destination]);

  useEffect(() => {
    if (!renderer) return;
    renderer.setRouteIndex(routeIndex);
  }, [routeIndex, renderer]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleOpen = () => {
    setIsVisible(true);
  };

  const handleStartNavigation = () => {
    // Open Google Maps with directions from user's current location to the destination
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (!leg) return null;

  // Show floating button when card is closed
  if (!isVisible) {
    return (
      <div className="relative">
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-6 z-10 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          aria-label="Show directions"
        >
          <MapPin className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-48 right-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm border border-gray-200 dark:border-gray-700">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 pr-8">{selected.summary}</h3>
        <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
          {leg.start_address.split(",")[0]} to {leg.end_address.split(",")[0]}
        </p>
        <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">Distance: {leg.distance?.text}</p>
        <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">Duration: {leg.duration?.text}</p>

        {/* Start Navigation Button */}
        <Button
          onClick={handleStartNavigation}
          className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Start Navigation
        </Button>

        <h4 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">Available routes:</h4>
        <div className="space-y-2">
          {routes.map((r, i) => (
            <button
              key={`${r.summary}-${i}`}
              onClick={() => setRouteIndex(i)}
              className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                i === routeIndex
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
              }`}
            >
              {r.summary || `Route ${i + 1}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Directions;
