import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: any;
  }
}
import { cn } from "@/lib/utils";

interface AddressResult {
  full: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onSelect: (result: AddressResult) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleScriptLoaded = false;
let googleScriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(): Promise<void> {
  if (googleScriptLoaded && window.google?.maps?.places) return Promise.resolve();
  return new Promise((resolve) => {
    if (googleScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    googleScriptLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      googleScriptLoaded = true;
      googleScriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      googleScriptLoading = false;
      resolve(); // degrade gracefully
    };
    document.head.appendChild(script);
  });
}

function parsePlace(place: any): AddressResult {
  const comps = place.address_components || [];
  const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name || "";
  const getShort = (type: string) => comps.find((c) => c.types.includes(type))?.short_name || "";

  const streetNumber = get("street_number");
  const route = getShort("route");
  const street = [streetNumber, route].filter(Boolean).join(" ");
  const city = get("locality") || get("sublocality_level_1") || get("administrative_area_level_3") || "";
  const state = getShort("administrative_area_level_1");
  const zip = get("postal_code");

  return {
    full: place.formatted_address || [street, city, state, zip].filter(Boolean).join(", "),
    street,
    city,
    state,
    zip,
  };
}

export function AddressAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Start typing an address…",
  className,
  disabled,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["address_components", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.address_components) {
        const result = parsePlace(place);
        onSelect(result);
      }
    });

    autocompleteRef.current = ac;
    setReady(true);
  }, [onSelect]);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setReady(true); // fallback to plain input
      return;
    }
    setLoading(true);
    loadGoogleMapsScript().then(() => {
      initAutocomplete();
      setLoading(false);
    });
  }, [initAutocomplete]);

  // If no API key, render a simple input
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={cn("relative", className)}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        disabled={disabled}
      />
    </div>
  );
}
