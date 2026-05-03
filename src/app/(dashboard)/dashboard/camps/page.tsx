"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Camp, CampWithDistance, ClinicMapItem, ClinicWithDistance } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
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
  Building2,
  MessageCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: -1.2921, lng: 36.8219 };
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

// SVG data URIs for map markers
const CLINIC_MARKER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981' width='36' height='36'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E";
const CAMP_MARKER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237C3AED' width='36' height='36'%3E%3Cpath d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/%3E%3C/svg%3E";
const CAMP_REGISTERED_MARKER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233B82F6' width='36' height='36'%3E%3Cpath d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/%3E%3C/svg%3E";

type UnifiedItem =
  | ({ itemType: "camp" } & (Camp | CampWithDistance))
  | ({ itemType: "clinic" } & (ClinicMapItem | ClinicWithDistance));

type FilterTab = "all" | "clinics" | "camps";

export default function CampsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<UnifiedItem | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: allCamps, isLoading: campsLoading } = useQuery({
    queryKey: ["camps"],
    queryFn: () => api.getUpcomingCamps(),
  });

  const { data: allClinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => api.getClinicMapData(),
  });

  const { data: nearbyCamps, isLoading: nearbyCampsLoading } = useQuery({
    queryKey: ["nearby-camps", userLocation],
    queryFn: () => userLocation ? api.getNearby(userLocation.lat, userLocation.lng, 100) : null,
    enabled: !!userLocation,
  });

  const { data: nearbyClinics, isLoading: nearbyClinicsLoading } = useQuery({
    queryKey: ["nearby-clinics", userLocation],
    queryFn: () => userLocation ? api.getNearbyClinics(userLocation.lat, userLocation.lng, 100) : null,
    enabled: !!userLocation,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => api.getMyRegistrations(),
  });

  const registerMutation = useMutation({
    mutationFn: (campId: string) => api.registerForCamp(campId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-registrations"] }); },
  });

  const cancelMutation = useMutation({
    mutationFn: (campId: string) => api.cancelRegistration(campId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-registrations"] }); },
  });

  useEffect(() => {
    if (userLocation) setMapCenter(userLocation);
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
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const isRegistered = (campId: string) =>
    myRegistrations?.some((reg) => reg.camp.id === campId && reg.status === "REGISTERED");

  // Build combined list
  const campsSource: (Camp | CampWithDistance)[] = nearbyCamps || allCamps || [];
  const clinicsSource: (ClinicMapItem | ClinicWithDistance)[] = nearbyClinics || allClinics || [];

  const allItems: UnifiedItem[] = [
    ...campsSource.map((c) => ({ itemType: "camp" as const, ...c })),
    ...clinicsSource.map((c) => ({ itemType: "clinic" as const, ...c })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (filterTab === "camps") return item.itemType === "camp";
    if (filterTab === "clinics") return item.itemType === "clinic";
    return true;
  });

  // Map: only items with valid coordinates
  const mappableCamps = campsSource;
  const mappableClinics = clinicsSource.filter((c) => c.latitude !== null && c.longitude !== null);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      mappableCamps.forEach((c) => { bounds.extend({ lat: c.latitude, lng: c.longitude }); hasPoints = true; });
      mappableClinics.forEach((c) => { bounds.extend({ lat: c.latitude as number, lng: c.longitude as number }); hasPoints = true; });
      if (userLocation) { bounds.extend(userLocation); hasPoints = true; }
      if (hasPoints) map.fitBounds(bounds, 50);
    },
    [mappableCamps, mappableClinics, userLocation],
  );

  const isLoading = campsLoading || clinicsLoading || nearbyCampsLoading || nearbyClinicsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
            Find a Clinic
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover MenoDAO partner clinics and upcoming dental camps near you
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <List className="w-4 h-4" />
            {t("clinic.listView")}
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "map" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <Map className="w-4 h-4" />
            {t("clinic.mapView")}
          </button>
        </div>
      </div>

      {/* Location Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
              {t("clinic.findNearYou")}
            </h2>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">
              {userLocation ? t("clinic.showingByDistance") : t("clinic.enableLocation")}
            </p>
          </div>
          <button
            onClick={requestLocation}
            disabled={isLocating}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {isLocating ? (
              <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />{t("clinic.locating")}</>
            ) : userLocation ? (
              <><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />{t("clinic.locationFound")}</>
            ) : (
              <><MapPin className="w-4 h-4 sm:w-5 sm:h-5" />{t("clinic.useMyLocation")}</>
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

      {/* My Registrations (camps only) */}
      {myRegistrations && myRegistrations.filter((r) => r.status === "REGISTERED").length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("clinic.myRegistrations")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRegistrations
              .filter((reg) => reg.status === "REGISTERED")
              .map((reg) => (
                <div
                  key={reg.id}
                  className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{reg.camp.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reg.camp.venue}</p>
                      <p className="text-sm text-emerald-600 mt-2">
                        {new Date(reg.camp.startDate).toLocaleDateString("en-KE", {
                          weekday: "long", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelMutation.mutate(reg.camp.id)}
                      disabled={cancelMutation.isPending}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] relative">
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Error loading maps</p>
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
                  {/* User location — blue circle */}
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

                  {/* Clinic markers — green pin */}
                  {mappableClinics.map((clinic) => (
                    <MarkerF
                      key={`clinic-${clinic.id}`}
                      position={{ lat: clinic.latitude as number, lng: clinic.longitude as number }}
                      onClick={() => setSelectedMapItem({ itemType: "clinic", ...clinic })}
                      icon={{
                        url: CLINIC_MARKER,
                        scaledSize: new google.maps.Size(36, 36),
                        anchor: new google.maps.Point(18, 36),
                      }}
                    />
                  ))}

                  {/* Camp markers — purple calendar pin */}
                  {mappableCamps.map((camp) => (
                    <MarkerF
                      key={`camp-${camp.id}`}
                      position={{ lat: camp.latitude, lng: camp.longitude }}
                      onClick={() => setSelectedMapItem({ itemType: "camp", ...camp })}
                      icon={{
                        url: isRegistered(camp.id) ? CAMP_REGISTERED_MARKER : CAMP_MARKER,
                        scaledSize: new google.maps.Size(36, 36),
                        anchor: new google.maps.Point(18, 36),
                      }}
                    />
                  ))}

                  {/* InfoWindow */}
                  {selectedMapItem && (
                    <InfoWindowF
                      position={
                        selectedMapItem.itemType === "camp"
                          ? { lat: (selectedMapItem as Camp).latitude, lng: (selectedMapItem as Camp).longitude }
                          : { lat: (selectedMapItem as ClinicMapItem).latitude as number, lng: (selectedMapItem as ClinicMapItem).longitude as number }
                      }
                      onCloseClick={() => setSelectedMapItem(null)}
                    >
                      <div className="p-2 max-w-[260px]">
                        {selectedMapItem.itemType === "clinic" ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Partner Clinic</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">{(selectedMapItem as ClinicMapItem).name}</h3>
                            <p className="text-gray-600 text-xs mt-1">{(selectedMapItem as ClinicMapItem).physicalLocation}</p>
                            {(selectedMapItem as ClinicMapItem).subCounty && (
                              <p className="text-gray-500 text-xs">{(selectedMapItem as ClinicMapItem).subCounty}</p>
                            )}
                            {(selectedMapItem as ClinicMapItem).operatingHours && (
                              <div className="mt-2 flex items-start gap-1 text-xs text-gray-600">
                                <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{(selectedMapItem as ClinicMapItem).operatingHours}</span>
                              </div>
                            )}
                            <div className="mt-3 flex flex-col gap-1.5">
                              {(selectedMapItem as ClinicMapItem).whatsappNumber && (
                                <a
                                  href={`https://wa.me/${(selectedMapItem as ClinicMapItem).whatsappNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:text-emerald-800"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                                </a>
                              )}
                              {(selectedMapItem as ClinicMapItem).googleMapsLink && (
                                <a
                                  href={(selectedMapItem as ClinicMapItem).googleMapsLink!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />Get Directions
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Dental Camp</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">{(selectedMapItem as Camp).name}</h3>
                            <p className="text-gray-600 text-xs mt-1">{(selectedMapItem as Camp).venue}</p>
                            <p className="text-gray-500 text-xs">{(selectedMapItem as Camp).address}</p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date((selectedMapItem as Camp).startDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                              <Users className="w-3 h-3" />
                              Capacity: {(selectedMapItem as Camp).capacity}
                            </div>
                            <button
                              onClick={() => {
                                const campId = (selectedMapItem as Camp).id;
                                if (!isRegistered(campId)) registerMutation.mutate(campId);
                              }}
                              disabled={isRegistered((selectedMapItem as Camp).id) || registerMutation.isPending}
                              className={`mt-2 w-full py-1.5 rounded text-xs font-medium ${
                                isRegistered((selectedMapItem as Camp).id)
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                            >
                              {isRegistered((selectedMapItem as Camp).id) ? "✓ Registered" : "Register"}
                            </button>
                          </>
                        )}
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
              <span className="text-gray-600 dark:text-gray-400">You</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">Partner Clinic</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">Dental Camp</span>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            {(["all", "clinics", "camps"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  filterTab === tab
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab === "all" ? "All" : tab === "clinics" ? "Clinics" : "Camps"}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nothing found</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Check back later for listings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isExpanded = expandedId === item.id;
                const toggleExpand = () => setExpandedId(isExpanded ? null : item.id);

                if (item.itemType === "clinic") {
                  const clinic = item as ClinicMapItem | ClinicWithDistance;
                  const hasCoords = clinic.latitude !== null && clinic.longitude !== null;
                  const distKm = (clinic as ClinicWithDistance).distanceKm;
                  return (
                    <div
                      key={`clinic-${clinic.id}`}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={toggleExpand}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              Partner Clinic
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {distKm !== undefined && (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                                {distKm.toFixed(1)} km
                              </span>
                            )}
                            {!hasCoords && (
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                Location not available
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{clinic.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-1">{clinic.physicalLocation}</p>
                        {clinic.subCounty && (
                          <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm line-clamp-1">{clinic.subCounty}</p>
                        )}
                        {clinic.operatingHours && (
                          <div className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
                            <span className={isExpanded ? "" : "line-clamp-1"}>{clinic.operatingHours}</span>
                          </div>
                        )}
                      </div>
                      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        {clinic.whatsappNumber && (
                          <a
                            href={`https://wa.me/${clinic.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />WhatsApp
                          </a>
                        )}
                        {clinic.googleMapsLink && (
                          <a
                            href={clinic.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />Get Directions
                          </a>
                        )}
                        {!clinic.whatsappNumber && !clinic.googleMapsLink && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No contact info available</span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Camp card
                const camp = item as Camp | CampWithDistance;
                const distKm = (camp as CampWithDistance).distanceKm;
                const registered = isRegistered(camp.id);
                return (
                  <div
                    key={`camp-${camp.id}`}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={toggleExpand}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                            Dental Camp
                          </span>
                        </div>
                        {distKm !== undefined && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                            {distKm.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{camp.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-1">{camp.venue}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm line-clamp-1">{camp.address}</p>
                      <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">
                            {new Date(camp.startDate).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          {new Date(camp.startDate).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          {t("clinic.capacity", { count: camp.capacity })}
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {registered ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          {t("common.registered")}
                        </div>
                      ) : (
                        <button
                          onClick={() => registerMutation.mutate(camp.id)}
                          disabled={registerMutation.isPending}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            t("clinic.registerForClinic")
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
