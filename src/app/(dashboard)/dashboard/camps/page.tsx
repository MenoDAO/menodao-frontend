"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Camp, CampWithDistance } from "@/lib/api";
import {
  MapPin,
  Calendar,
  Users,
  Navigation,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Map,
  List,
  X,
} from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";

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

export default function CampsPage() {
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCamp, setSelectedCamp] = useState<Camp | CampWithDistance | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Load Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: allCamps, isLoading: campsLoading } = useQuery({
    queryKey: ["camps"],
    queryFn: () => api.getUpcomingCamps(),
  });

  const { data: nearbyCamps, isLoading: nearbyLoading } = useQuery({
    queryKey: ["nearby-camps", userLocation],
    queryFn: () =>
      userLocation ? api.getNearby(userLocation.lat, userLocation.lng, 100) : null,
    enabled: !!userLocation,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => api.getMyRegistrations(),
  });

  const registerMutation = useMutation({
    mutationFn: (campId: string) => api.registerForCamp(campId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (campId: string) => api.cancelRegistration(campId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [userLocation]);

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
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isRegistered = (campId: string) => {
    return myRegistrations?.some(
      (reg) => reg.camp.id === campId && reg.status === "REGISTERED"
    );
  };

  const campsToShow = nearbyCamps || allCamps || [];

  const onMapLoad = useCallback((map: google.maps.Map) => {
    // Fit bounds to show all camps if there are any
    if (campsToShow.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      campsToShow.forEach((camp) => {
        bounds.extend({ lat: camp.latitude, lng: camp.longitude });
      });
      if (userLocation) {
        bounds.extend(userLocation);
      }
      map.fitBounds(bounds, 50);
    }
  }, [campsToShow, userLocation]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Find Dental Camps</h1>
          <p className="text-gray-600 mt-1">
            Discover upcoming dental camps near you
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {/* Location Finder */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
              Find Camps Near You
            </h2>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">
              {userLocation
                ? "Showing camps sorted by distance from your location"
                : "Enable location to find the nearest dental camps"}
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
            <AlertCircle className="w-4 h-4" />
            {locationError}
          </div>
        )}
      </div>

      {/* My Registrations */}
      {myRegistrations && myRegistrations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Registrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRegistrations
              .filter((reg) => reg.status === "REGISTERED")
              .map((reg) => (
                <div
                  key={reg.id}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-gray-900">{reg.camp.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{reg.camp.venue}</p>
                      <p className="text-sm text-emerald-600 mt-2">
                        {new Date(reg.camp.startDate).toLocaleDateString("en-KE", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelMutation.mutate(reg.camp.id)}
                      disabled={cancelMutation.isPending}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] relative">
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600">Error loading maps</p>
                </div>
              </div>
            )}
            {!isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
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

                {/* Camp markers */}
                {campsToShow.map((camp: Camp | CampWithDistance) => (
                  <MarkerF
                    key={camp.id}
                    position={{ lat: camp.latitude, lng: camp.longitude }}
                    onClick={() => setSelectedCamp(camp)}
                    icon={{
                      url: isRegistered(camp.id)
                        ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981' width='36' height='36'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E"
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EF4444' width='36' height='36'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
                      scaledSize: new google.maps.Size(36, 36),
                      anchor: new google.maps.Point(18, 36),
                    }}
                  />
                ))}

                {/* Info window for selected camp */}
                {selectedCamp && (
                  <InfoWindowF
                    position={{ lat: selectedCamp.latitude, lng: selectedCamp.longitude }}
                    onCloseClick={() => setSelectedCamp(null)}
                  >
                    <div className="p-2 max-w-[250px]">
                      <h3 className="font-semibold text-gray-900 text-sm">{selectedCamp.name}</h3>
                      <p className="text-gray-600 text-xs mt-1">{selectedCamp.venue}</p>
                      <p className="text-gray-500 text-xs">{selectedCamp.address}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedCamp.startDate).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <button
                        onClick={() => {
                          if (!isRegistered(selectedCamp.id)) {
                            registerMutation.mutate(selectedCamp.id);
                          }
                        }}
                        disabled={isRegistered(selectedCamp.id) || registerMutation.isPending}
                        className={`mt-2 w-full py-1.5 rounded text-xs font-medium ${
                          isRegistered(selectedCamp.id)
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isRegistered(selectedCamp.id) ? "✓ Registered" : "Register"}
                      </button>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
              <span className="text-gray-600">Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">Available Camp</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600">Registered</span>
            </div>
          </div>
        </div>
      )}

      {/* Camps List */}
      {viewMode === "list" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {userLocation ? "Camps Near You" : "Upcoming Camps"}
          </h2>

          {campsLoading || nearbyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : campsToShow.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Upcoming Camps</h3>
              <p className="text-gray-600 mt-2">
                Check back later for new dental camp announcements
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campsToShow.map((camp: Camp | CampWithDistance) => {
                const campWithDistance = camp as CampWithDistance;
                const registered = isRegistered(camp.id);

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                        {campWithDistance.distanceKm !== undefined && (
                          <span className="text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            {campWithDistance.distanceKm} km
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{camp.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-1">{camp.venue}</p>
                      <p className="text-gray-500 text-xs sm:text-sm line-clamp-1">{camp.address}</p>

                      <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">
                            {new Date(camp.startDate).toLocaleDateString("en-KE", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          {new Date(camp.startDate).toLocaleTimeString("en-KE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          Capacity: {camp.capacity}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                      {registered ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-sm">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          Registered
                        </div>
                      ) : (
                        <button
                          onClick={() => registerMutation.mutate(camp.id)}
                          disabled={registerMutation.isPending}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            "Register for Camp"
                          )}
                        </button>
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
