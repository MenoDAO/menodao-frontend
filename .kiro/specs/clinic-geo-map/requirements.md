# Requirements Document

## Introduction

MenoDAO partner clinics are stored in the database with a `googleMapsLink`, `physicalLocation`, and `subCounty`, but **no geographic coordinates** — `latitude` and `longitude` fields do not exist on the `Clinic` model (they exist only on the `Camp` model). Members currently have no way to discover clinics on a map or find the ones nearest to them.

Additionally, the admin clinic management is limited to approve/suspend/reject actions. There is no way to edit a clinic's details after registration, no way for admins to create a clinic directly (only self-registration exists), and no support for clinic branches (e.g., when a clinic opens a new location or moves).

This feature adds:

1. **Geo-data** — `latitude`/`longitude` fields on the `Clinic` model, two new public endpoints for map and proximity queries, and a member-facing clinic map page.
2. **Full admin clinic CRUD** — edit any clinic field, admin-create clinics, and manage branches (child clinics linked to a parent).

The feature spans two workspaces:

- **menodao-backend** — Prisma migration, new service methods, new controller endpoints (`PATCH`, `POST` admin-create, branch endpoints)
- **menodao-frontend** — new member dashboard clinic map page, admin clinic edit form, admin clinic create form, branch management UI, API client additions

---

## Glossary

- **Clinic**: A MenoDAO partner dental clinic stored in the `Clinic` Prisma model.
- **Approved Clinic**: A `Clinic` record whose `status` field equals `APPROVED`.
- **Parent Clinic**: A `Clinic` record with no `parentClinicId` — the primary/original location.
- **Branch Clinic**: A `Clinic` record with a non-null `parentClinicId` linking it to a Parent Clinic.
- **ClinicsService**: The NestJS service class at `src/clinics/clinics.service.ts` that manages clinic business logic.
- **ClinicsController**: The NestJS controller at `src/clinics/clinics.controller.ts` that exposes public clinic endpoints under `/clinics`.
- **AdminClinicsController**: The NestJS controller class in the same file that exposes admin endpoints under `/admin/clinics`, protected by `AdminAuthGuard`.
- **Clinic_Map_Page**: The Next.js page at `src/app/(dashboard)/dashboard/clinics/page.tsx` in the frontend workspace.
- **Admin_Clinic_Edit_Form**: The admin UI component used to edit an existing clinic's details, including coordinates.
- **Admin_Clinic_Create_Form**: The admin UI component used to create a new clinic directly from the admin dashboard.
- **Haversine_Calculator**: The utility function that computes the great-circle distance in kilometres between two latitude/longitude pairs.
- **Member**: An authenticated user accessing the member dashboard.
- **Coordinate**: A pair of nullable `Float` values — `latitude` and `longitude` — stored on a `Clinic` record.
- **Geo-located Clinic**: A `Clinic` record that has non-null `latitude` and `longitude` values.
- **Radius**: The search distance in kilometres used to filter nearby clinics; defaults to 50 km when not supplied.

---

## Requirements

### Requirement 1: Clinic Coordinate and Branch Storage

**User Story:** As a system administrator, I want clinics to store geographic coordinates and support branch relationships, so that the platform can display them on a map, calculate distances, and group branches under a parent clinic.

#### Acceptance Criteria

1. THE `Clinic` Prisma model SHALL include a nullable `Float` field named `latitude`.
2. THE `Clinic` Prisma model SHALL include a nullable `Float` field named `longitude`.
3. THE `Clinic` Prisma model SHALL include a nullable `String` field named `parentClinicId` that references another `Clinic` record's `id`.
4. THE `Clinic` Prisma model SHALL include a nullable `String` field named `branchName` to distinguish branches (e.g., "Westlands Branch", "CBD Branch").
5. THE Prisma migration SHALL be additive and non-destructive, leaving all existing `Clinic` records intact with `null` values for all new fields.
6. WHEN the `Clinic` model is updated, THE `ClinicsService` SHALL continue to expose the existing `listClinics()` method without modification to its signature or return shape.

---

### Requirement 2: Map Endpoint — Approved Clinics with Coordinates

**User Story:** As a member, I want the frontend to fetch all approved clinics with their coordinates in a single call, so that the map can render pins without additional requests.

#### Acceptance Criteria

1. THE `ClinicsController` SHALL expose a `GET /clinics/map` endpoint accessible without authentication.
2. WHEN `GET /clinics/map` is called, THE `ClinicsController` SHALL return only `Clinic` records whose `status` is `APPROVED`.
3. WHEN `GET /clinics/map` is called, THE `ClinicsController` SHALL include the following fields in each record: `id`, `name`, `subCounty`, `physicalLocation`, `operatingHours`, `whatsappNumber`, `googleMapsLink`, `latitude`, `longitude`.
4. WHEN `GET /clinics/map` is called, THE `ClinicsController` SHALL include clinics regardless of whether their `latitude` and `longitude` fields are null.
5. IF no `APPROVED` clinics exist, THEN THE `ClinicsController` SHALL return an empty array with HTTP 200.

---

### Requirement 3: Nearby Clinics Endpoint

**User Story:** As a member who has shared their location, I want to retrieve clinics sorted by distance, so that I can quickly identify the most convenient option.

#### Acceptance Criteria

1. THE `ClinicsController` SHALL expose a `GET /clinics/nearby` endpoint accessible without authentication.
2. WHEN `GET /clinics/nearby` is called with query parameters `lat` (Float) and `lng` (Float), THE `ClinicsController` SHALL return only `APPROVED` clinics that have non-null `latitude` and `longitude` values.
3. WHEN `GET /clinics/nearby` is called with a `radius` query parameter (Float, kilometres), THE `ClinicsController` SHALL return only clinics within that radius.
4. WHEN `GET /clinics/nearby` is called without a `radius` parameter, THE `ClinicsController` SHALL apply a default radius of 50 km.
5. WHEN `GET /clinics/nearby` returns results, THE `ClinicsController` SHALL include a `distanceKm` field on each record, rounded to two decimal places, calculated using the Haversine formula.
6. WHEN `GET /clinics/nearby` returns results, THE `ClinicsController` SHALL sort records by `distanceKm` ascending.
7. IF `lat` or `lng` query parameters are missing or non-numeric, THEN THE `ClinicsController` SHALL return HTTP 400 with a descriptive error message.
8. IF no clinics fall within the specified radius, THEN THE `ClinicsController` SHALL return an empty array with HTTP 200.

---

### Requirement 4: Member Dashboard Clinic Map Page

**User Story:** As a member, I want a dedicated clinic finder page in my dashboard, so that I can see all approved partner clinics on a map and in a list.

#### Acceptance Criteria

1. THE `Clinic_Map_Page` SHALL be accessible at the route `/dashboard/clinics` within the member dashboard layout.
2. THE `Clinic_Map_Page` SHALL fetch data from `GET /clinics/map` on initial load.
3. THE `Clinic_Map_Page` SHALL render a Google Map using `@react-google-maps/api` with the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable.
4. WHEN the map loads, THE `Clinic_Map_Page` SHALL center the map on Nairobi, Kenya (lat: -1.2921, lng: 36.8219) by default.
5. WHEN the map loads, THE `Clinic_Map_Page` SHALL render a map pin marker for each Geo-located Clinic.
6. WHILE the Google Maps script is loading, THE `Clinic_Map_Page` SHALL display a loading spinner in place of the map.
7. IF the Google Maps script fails to load, THEN THE `Clinic_Map_Page` SHALL display an error message in place of the map.
8. THE `Clinic_Map_Page` SHALL provide a list view alongside the map view, toggled by a "List" / "Map" control, following the same pattern as the camps page.
9. THE `Clinic_Map_Page` SHALL display all approved clinics in the list view, including those without coordinates.

---

### Requirement 5: Clinic Map Pin Info Window

**User Story:** As a member, I want to tap a clinic pin on the map and see its key details, so that I can decide whether to visit without leaving the page.

#### Acceptance Criteria

1. WHEN a Member clicks a clinic map pin, THE `Clinic_Map_Page` SHALL display a Google Maps `InfoWindow` anchored to that pin.
2. WHEN the `InfoWindow` is displayed, THE `Clinic_Map_Page` SHALL show the clinic's `name`, `physicalLocation`, `operatingHours`, and `subCounty`.
3. WHEN the `InfoWindow` is displayed and the clinic has a `whatsappNumber`, THE `Clinic_Map_Page` SHALL render a WhatsApp link in the format `https://wa.me/<whatsappNumber>`.
4. WHEN the `InfoWindow` is displayed and the clinic has a `googleMapsLink`, THE `Clinic_Map_Page` SHALL render a "Get Directions" anchor that opens `googleMapsLink` in a new tab.
5. WHEN a Member clicks outside the `InfoWindow` or its close button, THE `Clinic_Map_Page` SHALL dismiss the `InfoWindow`.

---

### Requirement 6: Member Location and Nearby Sorting

**User Story:** As a member, I want to share my location so that clinics are sorted by distance and the map re-centers on me, so that I can find the nearest clinic quickly.

#### Acceptance Criteria

1. THE `Clinic_Map_Page` SHALL display a "Use my location" button.
2. WHEN a Member clicks "Use my location", THE `Clinic_Map_Page` SHALL request the browser's Geolocation API permission.
3. WHEN the browser returns a position, THE `Clinic_Map_Page` SHALL fetch `GET /clinics/nearby` with the member's `lat`, `lng`, and a default radius of 50 km.
4. WHEN nearby results are returned, THE `Clinic_Map_Page` SHALL re-center the Google Map on the member's coordinates.
5. WHEN nearby results are returned, THE `Clinic_Map_Page` SHALL display a blue circle marker at the member's position on the map.
6. WHEN nearby results are returned, THE `Clinic_Map_Page` SHALL sort the list view by `distanceKm` ascending and display the `distanceKm` value on each list card.
7. WHEN nearby results are returned, THE `Clinic_Map_Page` SHALL display only clinics within the radius on the map; clinics outside the radius SHALL remain visible in the list view.
8. IF the browser denies geolocation permission, THEN THE `Clinic_Map_Page` SHALL display an inline error message explaining that location access was denied.
9. IF the geolocation request times out, THEN THE `Clinic_Map_Page` SHALL display an inline error message and leave the map in its default state.

---

### Requirement 7: Admin Clinic Edit

**User Story:** As an admin, I want to edit any field of an existing clinic — including coordinates, contact details, operating hours, and location — so that the clinic record stays accurate when details change.

#### Acceptance Criteria

1. THE `AdminClinicsController` SHALL expose a `PATCH /admin/clinics/:id` endpoint protected by `AdminAuthGuard`.
2. WHEN `PATCH /admin/clinics/:id` is called, THE `AdminClinicsController` SHALL accept a partial body containing any subset of editable clinic fields: `name`, `subCounty`, `physicalLocation`, `googleMapsLink`, `operatingHours`, `operatesOnWeekends`, `leadDentistName`, `ownerPhone`, `managerName`, `whatsappNumber`, `email`, `latitude`, `longitude`, `branchName`.
3. WHEN `PATCH /admin/clinics/:id` is called, THE `AdminClinicsController` SHALL update only the fields present in the request body, leaving all other fields unchanged.
4. IF `latitude` is provided and outside the range −90 to 90, THEN THE `AdminClinicsController` SHALL return HTTP 400 with a descriptive validation error.
5. IF `longitude` is provided and outside the range −180 to 180, THEN THE `AdminClinicsController` SHALL return HTTP 400 with a descriptive validation error.
6. WHEN `latitude` or `longitude` is explicitly set to `null` in the request body, THE `AdminClinicsController` SHALL store `null` for that field (removing the coordinate).
7. THE `Admin_Clinic_Edit_Form` SHALL be accessible by clicking an "Edit" button on any clinic row or detail view in the admin clinics page.
8. THE `Admin_Clinic_Edit_Form` SHALL pre-populate all fields with the clinic's current values.
9. THE `Admin_Clinic_Edit_Form` SHALL include numeric inputs for `latitude` and `longitude` with a helper note: "Tip: extract coordinates from the Google Maps link or use maps.google.com to find the exact pin."
10. WHEN the admin saves the edit form, THE `Admin_Clinic_Edit_Form` SHALL call `PATCH /admin/clinics/:id` and display a success toast on completion.
11. IF the `PATCH` call returns an error, THE `Admin_Clinic_Edit_Form` SHALL display the error message inline without closing the form.

---

### Requirement 8: Clinics Without Coordinates

**User Story:** As a member, I want clinics that have no coordinates to still appear in the list view, so that I am aware of all partner clinics even if their map position is unknown.

#### Acceptance Criteria

1. WHEN the list view is rendered, THE `Clinic_Map_Page` SHALL display all approved clinics returned by `GET /clinics/map`, including those with null `latitude` or `longitude`.
2. WHEN a clinic has null `latitude` or `longitude`, THE `Clinic_Map_Page` SHALL omit that clinic from the map pin layer.
3. WHEN a clinic has null `latitude` or `longitude` and the member has shared their location, THE `Clinic_Map_Page` SHALL display that clinic in the list without a `distanceKm` value.
4. WHEN a clinic has null `latitude` or `longitude`, THE `Clinic_Map_Page` SHALL display a "Location not available" indicator on its list card.

---

### Requirement 9: API Client Integration

**User Story:** As a frontend developer, I want typed API client methods for the new endpoints, so that the clinic map page can fetch data consistently with the rest of the application.

#### Acceptance Criteria

1. THE frontend API client (`src/lib/api.ts`) SHALL expose a `getClinicMapData()` method that calls `GET /clinics/map` and returns a typed array of `ClinicMapItem`.
2. THE frontend API client SHALL expose a `getNearbyClinicss(lat: number, lng: number, radius?: number)` method that calls `GET /clinics/nearby` and returns a typed array of `ClinicWithDistance`.
3. THE `ClinicMapItem` type SHALL include: `id`, `name`, `subCounty`, `physicalLocation`, `operatingHours`, `whatsappNumber`, `googleMapsLink`, `latitude`, `longitude` (all strings or numbers as appropriate, with `latitude` and `longitude` typed as `number | null`).
4. THE `ClinicWithDistance` type SHALL extend `ClinicMapItem` with an additional `distanceKm: number` field.
5. THE existing `ClinicsService.listClinics()` method and its callers SHALL remain unmodified.

---

### Requirement 10: Admin Clinic Create

**User Story:** As an admin, I want to create a new clinic directly from the admin dashboard, so that I can onboard clinics without waiting for them to self-register.

#### Acceptance Criteria

1. THE `AdminClinicsController` SHALL expose a `POST /admin/clinics` endpoint protected by `AdminAuthGuard`.
2. WHEN `POST /admin/clinics` is called, THE `AdminClinicsController` SHALL accept the same fields as the public `POST /clinics/register` endpoint, plus the optional `latitude`, `longitude`, `parentClinicId`, and `branchName` fields.
3. WHEN `POST /admin/clinics` is called, THE `AdminClinicsController` SHALL create the clinic with `status = PENDING` by default, unless the request body includes `status = APPROVED`.
4. WHEN `POST /admin/clinics` is called with `status = APPROVED`, THE `AdminClinicsController` SHALL also generate staff credentials (same logic as `approveClinic()`).
5. THE `Admin_Clinic_Create_Form` SHALL be accessible via an "Add Clinic" button on the admin clinics page.
6. THE `Admin_Clinic_Create_Form` SHALL include all required clinic fields: name, sub-county, physical location, operating hours, lead dentist name, owner phone, WhatsApp number, M-Pesa till/paybill, till/paybill name, and the optional fields: email, manager name, latitude, longitude, Google Maps link, branch name.
7. WHEN the admin submits the create form, THE `Admin_Clinic_Create_Form` SHALL call `POST /admin/clinics` and display a success toast showing the new clinic's name.
8. IF the `POST` call returns a validation error, THE `Admin_Clinic_Create_Form` SHALL display field-level error messages without closing the form.

---

### Requirement 11: Branch Clinic Management

**User Story:** As an admin, I want to add a branch to an existing clinic and manage branches independently, so that when a clinic opens a new location or moves, the platform reflects the correct locations.

#### Acceptance Criteria

1. WHEN creating or editing a clinic, THE `Admin_Clinic_Edit_Form` and `Admin_Clinic_Create_Form` SHALL include a "Parent Clinic" selector that lists all existing clinics by name.
2. WHEN a `parentClinicId` is set on a clinic, THE `AdminClinicsController` SHALL validate that the referenced parent clinic exists; IF it does not, THEN THE `AdminClinicsController` SHALL return HTTP 400.
3. THE `AdminClinicsController` SHALL expose a `GET /admin/clinics/:id/branches` endpoint that returns all clinics whose `parentClinicId` equals `:id`.
4. WHEN the admin views a clinic detail in the admin dashboard, THE admin clinics page SHALL display a "Branches" section listing all branch clinics with their name, status, and coordinates.
5. WHEN the admin clicks "Add Branch" from a clinic detail view, THE `Admin_Clinic_Create_Form` SHALL open pre-populated with `parentClinicId` set to the current clinic's id.
6. WHEN a branch clinic is approved, suspended, or rejected, THE action SHALL apply only to that branch and SHALL NOT affect the parent clinic's status.
7. WHEN `GET /clinics/map` is called, THE `ClinicsController` SHALL return both parent clinics and branch clinics that are `APPROVED`, each as independent map pins.
8. WHEN a branch clinic has its own `latitude` and `longitude`, THE `Clinic_Map_Page` SHALL display it as a separate pin from the parent clinic.
9. WHEN a branch clinic has no coordinates but its parent clinic does, THE `Clinic_Map_Page` SHALL NOT inherit the parent's coordinates — the branch SHALL appear in the list view only with a "Location not available" indicator.
