"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, Navigation, Loader2, AlertCircle, Check } from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

interface ClinicLocationPickerProps {
  latitude: string;
  longitude: string;
  onLatChange: (val: string) => void;
  onLngChange: (val: string) => void;
  /** Optional: dark theme for admin forms, light for public registration */
  theme?: "dark" | "light";
}

const mapContainerStyle = { width: "100%", height: "260px" };
const defaultCenter = { lat: -1.2921, lng: 36.8219 }; // Nairobi

function parseCoord(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function validateLat(val: string): string | null {
  if (val === "" || val === "-") return null;
  const n = parseFloat(val);
  if (isNaN(n)) return "Must be a number";
  if (n < -90 || n > 90) return "Must be between -90 and 90";
  return null;
}

function validateLng(val: string): string | null {
  if (val === "" || val === "-") return null;
  const n = parseFloat(val);
  if (isNaN(n)) return "Must be a number";
  if (n < -180 || n > 180) return "Must be between -180 and 180";
  return null;
}

export function ClinicLocationPicker({
  latitude,
  longitude,
  onLatChange,
  onLngChange,
  theme = "dark",
}: ClinicLocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const hasValidCoords =
    lat !== null &&
    lng !== null &&
    !validateLat(latitude) &&
    !validateLng(longitude);

  const mapCenter = hasValidCoords ? { lat: lat!, lng: lng! } : defaultCenter;

  // Show map automatically when valid coords are present
  useEffect(() => {
    if (hasValidCoords) setShowMap(true);
  }, [hasValidCoords]);

  const handleUseMyLocation = () => {
    setLocating(true);
    setLocError(null);
    setLocSuccess(false);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        onLatChange(lat);
        onLngChange(lng);
        setLocating(false);
        setLocSuccess(true);
        setShowMap(true);
        setTimeout(() => setLocSuccess(false), 3000);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Location access denied. Please allow location in your browser settings.",
          2: "Location unavailable. Try entering coordinates manually.",
          3: "Location request timed out. Try again.",
        };
        setLocError(msgs[err.code] || "Could not get location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  // When user drags the map pin, update the coordinates
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onLatChange(e.latLng.lat().toFixed(6));
        onLngChange(e.latLng.lng().toFixed(6));
      }
    },
    [onLatChange, onLngChange],
  );

  const isDark = theme === "dark";

  const inputCls = isDark
    ? "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    : "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all";

  const latError = validateLat(latitude);
  const lngError = validateLng(longitude);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin
            className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-emerald-400"}`}
          />
          <span
            className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-emerald-200/80"}`}
          >
            Clinic Location (GPS Coordinates)
          </span>
        </div>
        {hasValidCoords && (
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className={`text-xs font-medium transition-colors ${
              isDark
                ? "text-blue-400 hover:text-blue-300"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            {showMap ? "Hide map" : "Preview on map"}
          </button>
        )}
      </div>

      {/* Use My Location button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
          isDark
            ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30"
            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
        }`}
      >
        {locating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : locSuccess ? (
          <Check className="w-4 h-4" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {locating
          ? "Getting location..."
          : locSuccess
            ? "Location captured!"
            : "Use my current location"}
      </button>

      {locError && (
        <div className="flex items-start gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {locError}
        </div>
      )}

      {/* Manual coordinate inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={`block text-xs mb-1 ${isDark ? "text-gray-400" : "text-emerald-200/60"}`}
          >
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => onLatChange(e.target.value)}
            className={inputCls}
            placeholder="-1.292100"
          />
          {latError && <p className="text-xs text-red-400 mt-1">{latError}</p>}
        </div>
        <div>
          <label
            className={`block text-xs mb-1 ${isDark ? "text-gray-400" : "text-emerald-200/60"}`}
          >
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => onLngChange(e.target.value)}
            className={inputCls}
            placeholder="36.821900"
          />
          {lngError && <p className="text-xs text-red-400 mt-1">{lngError}</p>}
        </div>
      </div>

      <p className={`text-xs ${isDark ? "text-gray-500" : "text-white/30"}`}>
        Tip: use "Use my current location" if you&apos;re at the clinic, or
        paste coordinates from{" "}
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className={
            isDark
              ? "text-blue-400 hover:underline"
              : "text-emerald-400 hover:underline"
          }
        >
          Google Maps
        </a>
        . Drag the pin to fine-tune.
      </p>

      {/* Map preview */}
      {showMap && hasValidCoords && (
        <div className="rounded-xl overflow-hidden border border-gray-600/40">
          {loadError ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-800 text-gray-400 text-sm">
              <AlertCircle className="w-5 h-5 mr-2" />
              Map unavailable
            </div>
          ) : !isLoaded ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-800">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={16}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              <MarkerF
                position={mapCenter}
                draggable
                onDragEnd={handleMarkerDragEnd}
                title="Drag to adjust clinic location"
              />
            </GoogleMap>
          )}
          <p
            className={`text-xs text-center py-1.5 ${isDark ? "bg-gray-900 text-gray-500" : "bg-black/20 text-white/40"}`}
          >
            Drag the pin to fine-tune the exact location
          </p>
        </div>
      )}
    </div>
  );
}
