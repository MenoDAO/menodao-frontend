"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ClinicMapItem, ClinicWithDistance } from "@/lib/api";
import {
  MapPin,
  Navigation,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Map,
  List,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";

// Map configuration
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: -1.2921, // Nairobi, Kenya
  lng: 36.8219,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function ClinicsPage() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedClinic, setSelectedClinic] = useState<
    ClinicMapItem | ClinicWithDistance | null
  >(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Load Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: allClinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => api.getClinicMapData(),
  });

  const { data: nearbyClinics, isLoading: nearbyLoading } = useQuery({
    queryKey: ["nearby-clinics", userLocation],
    queryFn: () =>
      userLocation
        ? api.getNearbyClinics(userLocation.lat, userLocation.lng, 100)
        : null,
    enabled: !!userLocation,
  });

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setMapCenter(loc);
        setIsLocating(false);
      },
      () => {
        setLocationError(
          "Unable to get your location. Please enable location services.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Clinics to display: nearby (sorted by distance) when available, otherwise all
  const clinicsToShow: (ClinicMapItem | ClinicWithDistance)[] =
    nearbyClinics || allClinics || [];

  // Only clinics with valid coordinates can be shown on the map
  const mappableClinics = clinicsToShow.filter(
    (c) => c.latitude !== null && c.longitude !== null,
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (mappableClinics.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        mappableClinics.forEach((clinic) => {
          bounds.extend({
            lat: clinic.latitude as number,
            lng: clinic.longitude as number,
          });
        });
        if (userLocation) {
          bounds.extend(userLocation);
        }
        map.fitBounds(bounds, 50);
      }
    },
    [mappableClinics, userLocation],
  );

  const hasDistance = (
    clinic: ClinicMapItem | ClinicWithDistance,
  ): clinic is ClinicWithDistance => {
    return (clinic as ClinicWithDistance).distanceKm !== undefined;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
            Find Partner Clinics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover MenoDAO partner dental clinics near you
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {/* Location Finder Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
              Find Clinics Near You
            </h2>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">
              {userLocation
                ? "Showing clinics sorted by distance from your location"
                : "Enable location to find the nearest partner clinics"}
            </p>
          </div>
          <button
            onClick={requestLocation}
            disabled={isLocating}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Locating...
              </>
            ) : userLocation ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Location Found
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                Use My Location
              </>
            )}
          </button>
        </div>
        {locationError && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] relative">
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Error loading maps. Please check your connection and try
                    again.
                  </p>
                </div>
              </div>
            )}
            {!loadError && !isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              isLoaded && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={userLocation ? 12 : 10}
                  options={mapOptions}
                  onLoad={onMapLoad}
                >
                  {/* User location marker */}
                  {userLocation && (
                    <MarkerF
                      position={userLocation}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#3B82F6",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 3,
                      }}
                      title="Your Location"
                    />
                  )}

                  {/* Clinic markers — only for clinics with valid coordinates */}
                  {mappableClinics.map((clinic) => (
                    <MarkerF
                      key={clinic.id}
                      position={{
                        lat: clinic.latitude as number,
                        lng: clinic.longitude as number,
                      }}
                      onClick={() => setSelectedClinic(clinic)}
                      icon={{
                        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981' width='36' height='36'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
                        scaledSize: new google.maps.Size(36, 36),
                        anchor: new google.maps.Point(18, 36),
                      }}
                    />
                  ))}

                  {/* Info window for selected clinic */}
                  {selectedClinic &&
                    selectedClinic.latitude !== null &&
                    selectedClinic.longitude !== null && (
                      <InfoWindowF
                        position={{
                          lat: selectedClinic.latitude as number,
                          lng: selectedClinic.longitude as number,
                        }}
                        onCloseClick={() => setSelectedClinic(null)}
                      >
                        <div className="p-2 max-w-[260px]">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {selectedClinic.name}
                          </h3>
                          <p className="text-gray-600 text-xs mt-1">
                            {selectedClinic.physicalLocation}
                          </p>
                          {selectedClinic.subCounty && (
                            <p className="text-gray-500 text-xs">
                              {selectedClinic.subCounty}
                            </p>
                          )}
                          {selectedClinic.operatingHours && (
                            <div className="mt-2 flex items-start gap-1 text-xs text-gray-600">
                              <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{selectedClinic.operatingHours}</span>
                            </div>
                          )}
                          <div className="mt-3 flex flex-col gap-1.5">
                            {selectedClinic.whatsappNumber && (
                              <a
                                href={`https://wa.me/${selectedClinic.whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:text-emerald-800"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp
                              </a>
                            )}
                            {selectedClinic.googleMapsLink && (
                              <a
                                href={selectedClinic.googleMapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Get Directions
                              </a>
                            )}
                          </div>
                        </div>
                      </InfoWindowF>
                    )}
                </GoogleMap>
              )
            )}
          </div>

          {/* Map Legend */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
              <span className="text-gray-600 dark:text-gray-400">
                Your Location
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Partner Clinic
              </span>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {userLocation ? "Clinics Near You" : "All Partner Clinics"}
          </h2>

          {clinicsLoading || nearbyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : clinicsToShow.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No Clinics Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Check back later for partner clinic listings
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinicsToShow.map((clinic) => {
                const hasCoords =
                  clinic.latitude !== null && clinic.longitude !== null;
                return (
                  <div
                    key={clinic.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Icon row + badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {hasDistance(clinic) && (
                            <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                              {clinic.distanceKm.toFixed(1)} km
                            </span>
                          )}
                          {!hasCoords && (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              Location not available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clinic name */}
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                        {clinic.name}
                      </h3>

                      {/* Physical location */}
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-1">
                        {clinic.physicalLocation}
                      </p>

                      {/* Sub-county */}
                      {clinic.subCounty && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm line-clamp-1">
                          {clinic.subCounty}
                        </p>
                      )}

                      {/* Operating hours */}
                      {clinic.operatingHours && (
                        <div className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {clinic.operatingHours}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card footer — action links */}
                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                      {clinic.whatsappNumber && (
                        <a
                          href={`https://wa.me/${clinic.whatsappNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                      {clinic.googleMapsLink && (
                        <a
                          href={clinic.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Get Directions
                        </a>
                      )}
                      {!clinic.whatsappNumber && !clinic.googleMapsLink && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          No contact info available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
