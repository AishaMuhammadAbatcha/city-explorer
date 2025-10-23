import React, { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type Location = { lat: number; lng: number };

interface Props {
  label: string;
  onSelect: (loc: Location) => void;
}

const PlacesAutocomplete: React.FC<Props> = ({ label, onSelect }) => {
  // loads "places" library via importLibrary under the hood
  const placesLib = useMapsLibrary("places");

  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);

  // one session token per “typing → select” flow
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
  }, [placesLib]);

  // fetch autocomplete suggestions (debounced)
  useEffect(() => {
    if (!placesLib || !input) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const req: google.maps.places.AutocompleteRequest = {
          input,
          sessionToken: sessionTokenRef.current ?? undefined,
          // optional: bias or restrict results
          // locationBias: { west: ..., south: ..., east: ..., north: ... },
        };
        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            req
          );
        setSuggestions(suggestions ?? []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [placesLib, input]);

  const handleSelect = async (s: google.maps.places.AutocompleteSuggestion) => {
    try {
      const place = s.placePrediction?.toPlace();
      if (!place) return;

      // request only what we need
      await place.fetchFields({
        fields: ["location", "displayName", "formattedAddress"],
      });

      const loc = place.location as google.maps.LatLng | undefined;
      if (loc) onSelect({ lat: loc.lat(), lng: loc.lng() });

      // show nice label, close list, rotate token for next search
      setInput(place.formattedAddress ?? place.displayName ?? "");
      setOpen(false);
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    } catch (err) {
      console.error("fetchFields error:", err);
    }
  };

  return (
    <div className="relative w-72">
      <input
        type="text"
        placeholder={label}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((s, i) => {
            const p = s.placePrediction!;
            return (
              <div
                key={`${p.placeId}-${i}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <p className="text-sm text-gray-900 dark:text-gray-100">{p.text?.text ?? "Suggestion"}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
