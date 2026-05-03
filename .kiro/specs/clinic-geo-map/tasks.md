# Implementation Plan: Clinic Geo-Map

## Overview

Add geographic coordinates and branch relationships to the `Clinic` model, expose new public and admin API endpoints, and build a member-facing clinic map page plus full admin CRUD forms. Work spans `menodao-backend` and `menodao-frontend`.

## Tasks

- [x] 1. Prisma migration — add geo and branch fields to Clinic
  - In `menodao-backend`, add `latitude Float?`, `longitude Float?`, `parentClinicId String?`, `branchName String?` to the `Clinic` model in `prisma/schema.prisma`
  - Add the self-referential `parentClinic` / `branches` relation with `@relation("ClinicBranches")`
  - Add `@@index([parentClinicId])` to the model
  - Create and run the migration: `npx prisma migrate dev --name add_clinic_geo_branch`
  - Verify all existing `Clinic` records remain intact with `null` for new fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Haversine utility — backend
  - Create `menodao-backend/src/common/utils/haversine.ts` with `haversineKm(lat1, lng1, lat2, lng2): number`
  - Export `toRad` as a named export so tests can import it independently
  - _Requirements: 3.5_

- [x] 3. New DTOs — UpdateClinicDto and AdminCreateClinicDto
  - Create `menodao-backend/src/clinics/dto/update-clinic.dto.ts` with all optional fields including `latitude`, `longitude` (with `@Min`/`@Max` validators), and `branchName`
  - Create `menodao-backend/src/clinics/dto/admin-create-clinic.dto.ts` extending `RegisterClinicDto` with the optional geo, branch, and `status` fields
  - _Requirements: 7.2, 7.4, 7.5, 10.2_

- [x] 4. ClinicsService new methods
  - Add `getMapClinics()` — queries all `APPROVED` clinics, selects the 9 fields defined in `ClinicMapRecord`
  - Add `getNearbyClinics(lat, lng, radius)` — filters `APPROVED` geo-located clinics, computes `distanceKm` via `haversineKm`, filters by radius, sorts ascending; rounds `distanceKm` to 2 decimal places
  - Add `updateClinic(id, dto)` — partial update using `prisma.clinic.update`; throws `NotFoundException` if clinic not found; validates `parentClinicId` existence if provided
  - Add `adminCreateClinic(dto, adminId)` — creates clinic; if `status === APPROVED` calls existing `approveClinic` credential-generation logic; validates `parentClinicId` if provided
  - Add `getClinicBranches(id)` — throws `NotFoundException` if parent not found; returns all clinics where `parentClinicId === id`
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3, 7.6, 10.3, 10.4, 11.2, 11.3_

- [x] 5. ClinicsController — new public endpoints
  - Add `GET /clinics/map` handler calling `getMapClinics()`; no auth required
  - Add `GET /clinics/nearby` handler with `@Query` params `lat`, `lng`, `radius`; parse to `parseFloat`; return HTTP 400 if missing or `NaN`; default radius to 50
  - _Requirements: 2.1, 2.5, 3.1, 3.7, 3.8_

- [x] 6. AdminClinicsController — new admin endpoints
  - Add `PATCH /admin/clinics/:id` calling `updateClinic()`; protected by existing `AdminAuthGuard`
  - Add `POST /admin/clinics` calling `adminCreateClinic()`; protected by `AdminAuthGuard`
  - Add `GET /admin/clinics/:id/branches` calling `getClinicBranches()`; protected by `AdminAuthGuard`
  - _Requirements: 7.1, 10.1, 11.3_

- [x] 7. Checkpoint — backend tests pass
  - Ensure all existing backend tests still pass after the migration and new code
  - Ask the user if questions arise before proceeding to frontend work

- [x] 8. Frontend geo utility and camps page refactor
  - Create `menodao-frontend/src/lib/geo.ts` exporting `haversineKm` with the same formula as the backend utility
  - Update `src/app/(dashboard)/dashboard/camps/page.tsx` to import `haversineKm` from `@/lib/geo` instead of any inline calculation (if one exists)
  - _Requirements: (shared utility, no direct requirement number — supports 4.x and 6.x)_

- [x] 9. Frontend API client additions
  - Add `ClinicMapItem` and `ClinicWithDistance` types to `src/lib/api.ts`
  - Add `getClinicMapData()` method to `ApiClient` calling `GET /clinics/map`
  - Add `getNearbyClinics(lat, lng, radius?)` method calling `GET /clinics/nearby`
  - Extend `AdminClinic` interface in `src/lib/admin-api.ts` with `latitude`, `longitude`, `parentClinicId`, `branchName` (all nullable)
  - Add `updateClinic(id, data)`, `createClinic(data)`, `getClinicBranches(id)` methods to `AdminApiClient`
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Member dashboard clinic map page
  - Create `src/app/(dashboard)/dashboard/clinics/page.tsx` following the camps page pattern
  - Fetch from `api.getClinicMapData()` on load; show loading spinner while fetching
  - Render List / Map toggle (same UI pattern as camps page)
  - List view: show all approved clinics including those with null coordinates; show "Location not available" badge when `latitude` or `longitude` is null; show `distanceKm` badge when available
  - Map view: use `@react-google-maps/api` with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; center on Nairobi (-1.2921, 36.8219) by default; render `MarkerF` for each geo-located clinic; show error message if Maps script fails to load
  - "Use my location" button: call `navigator.geolocation.getCurrentPosition`, then `api.getNearbyClinics()`; re-center map on user; render blue circle `MarkerF` at user position; sort list by `distanceKm`; show inline error on permission denied or timeout
  - `InfoWindowF` on pin click: show `name`, `physicalLocation`, `operatingHours`, `subCounty`; WhatsApp link (`https://wa.me/<number>`); "Get Directions" link opening `googleMapsLink` in new tab; dismiss on outside click or close button
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 8.1, 8.2, 8.3, 8.4_

- [x] 11. Admin clinic edit form
  - Add an "Edit" button to each clinic row and to the detail drawer in `src/app/admin/clinics/page.tsx`
  - Create `AdminClinicEditForm` modal/drawer component (can be in the same file or a sibling file)
  - Pre-populate all fields from the selected `AdminClinic` record
  - Include numeric inputs for `latitude` and `longitude` with helper note: "Tip: extract coordinates from the Google Maps link or use maps.google.com to find the exact pin."
  - Include `branchName` text input
  - On save: call `adminApi.updateClinic(id, data)`; show success toast and close form; on error display inline without closing
  - _Requirements: 7.7, 7.8, 7.9, 7.10, 7.11_

- [x] 12. Admin clinic create form
  - Add "Add Clinic" button to the header of the admin clinics page
  - Create `AdminClinicCreateForm` modal component
  - Include all required fields (name, sub-county, physical location, operating hours, lead dentist name, owner phone, WhatsApp number, M-Pesa till/paybill, till/paybill name) plus optional fields (email, manager name, latitude, longitude, Google Maps link, branch name)
  - Include "Parent Clinic" searchable selector populated from `adminApi.listClinics()`
  - Include Status selector defaulting to PENDING
  - On submit: call `adminApi.createClinic(data)`; show success toast with new clinic name; on validation error display field-level errors inline without closing
  - _Requirements: 10.5, 10.6, 10.7, 10.8_

- [x] 13. Admin clinic branches section
  - In the detail drawer of `src/app/admin/clinics/page.tsx`, add a "Branches" section below the existing info sections
  - Fetch branches via `adminApi.getClinicBranches(selectedClinic.id)` when a clinic is selected
  - List each branch with its name, status badge, and a coordinates indicator (e.g., a pin icon if lat/lng are set)
  - Add "Add Branch" button that opens `AdminClinicCreateForm` with `parentClinicId` pre-set to the current clinic's id
  - _Requirements: 11.1, 11.4, 11.5, 11.6_

- [x] 14. Checkpoint — frontend integration
  - Ensure the clinic map page loads, the map renders, and the admin forms open and submit correctly
  - Ask the user if questions arise before proceeding to tests

- [ ] 15. Property-based tests — backend (fast-check)
  - Create `menodao-backend/src/clinics/clinics.service.pbt.spec.ts`
  - Use `fast-check` (already installed); minimum 100 runs per property

  - [ ]\* 15.1 Write property test for Property 1 — map endpoint returns only approved clinics
    - **Property 1: getMapClinics() returns only APPROVED clinics regardless of coordinate nullability**
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - Tag: `// Feature: clinic-geo-map, Property 1: map endpoint returns only approved clinics`

  - [ ]\* 15.2 Write property test for Property 2 — nearby returns only approved geo-located clinics within radius
    - **Property 2: getNearbyClinics() returns only APPROVED clinics with non-null coords within the given radius**
    - **Validates: Requirements 3.2, 3.3**
    - Tag: `// Feature: clinic-geo-map, Property 2: nearby returns only approved geo-located clinics within radius`

  - [ ]\* 15.3 Write property test for Property 3 — nearby results carry correct Haversine distance
    - **Property 3: distanceKm on each result equals haversineKm(refLat, refLng, clinic.lat, clinic.lng) rounded to 2dp**
    - **Validates: Requirements 3.5**
    - Tag: `// Feature: clinic-geo-map, Property 3: nearby results carry correct Haversine distance`

  - [ ]\* 15.4 Write property test for Property 4 — nearby results sorted ascending by distance
    - **Property 4: distanceKm values in getNearbyClinics() result are non-decreasing**
    - **Validates: Requirements 3.6**
    - Tag: `// Feature: clinic-geo-map, Property 4: nearby results are sorted ascending by distance`

  - [ ]\* 15.5 Write property test for Property 5 — partial update only modifies specified fields
    - **Property 5: updateClinic(id, subset) changes exactly the supplied fields and leaves all others unchanged**
    - **Validates: Requirements 7.2, 7.3**
    - Tag: `// Feature: clinic-geo-map, Property 5: partial clinic update only modifies specified fields`

  - [ ]\* 15.6 Write property test for Property 6 — invalid parentClinicId is rejected
    - **Property 6: adminCreateClinic with a non-existent parentClinicId throws BadRequestException**
    - **Validates: Requirements 11.2**
    - Tag: `// Feature: clinic-geo-map, Property 6: invalid parentClinicId is rejected`

  - [ ]\* 15.7 Write property test for Property 7 — branches endpoint returns exactly the linked clinics
    - **Property 7: getClinicBranches(parentId) returns exactly N clinics all with parentClinicId === parentId**
    - **Validates: Requirements 11.3**
    - Tag: `// Feature: clinic-geo-map, Property 7: branches endpoint returns exactly the linked clinics`

- [ ] 16. Unit tests — backend service methods
  - [ ]\* 16.1 Write unit tests for haversineKm utility
    - Verify known distance: Nairobi (-1.2921, 36.8219) to Mombasa (-4.0435, 39.6682) ≈ 440 km (±5 km)
    - Verify zero distance when both points are identical
    - _Requirements: 3.5_

  - [ ]\* 16.2 Write unit tests for ClinicsService.getNearbyClinics
    - Mock Prisma; verify filtering (non-APPROVED and null-coord clinics excluded), distance calculation, and sort order
    - _Requirements: 3.2, 3.3, 3.5, 3.6_

  - [ ]\* 16.3 Write unit tests for ClinicsService.updateClinic
    - Mock Prisma; verify partial update passes only supplied fields; verify NotFoundException on missing clinic
    - _Requirements: 7.3, 7.6_

  - [ ]\* 16.4 Write unit tests for ClinicsService.adminCreateClinic
    - Mock Prisma and SmsService; verify credential generation is triggered when status=APPROVED; verify BadRequestException on invalid parentClinicId
    - _Requirements: 10.3, 10.4, 11.2_

  - [ ]\* 16.5 Write unit tests for UpdateClinicDto validation
    - Verify latitude outside −90..90 fails; longitude outside −180..180 fails; valid values pass
    - _Requirements: 7.4, 7.5_

- [x] 17. Final checkpoint — ensure all tests pass
  - Run `npx jest --run` (or equivalent) in both `menodao-backend` and `menodao-frontend`
  - Ensure all tests pass; ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The spec lives in `menodao-frontend` but tasks 1–6 and 15–16 target `menodao-backend`
- Branch clinics are independent records — no status inheritance from parent (Requirement 11.6)
- `fast-check` is already installed in `menodao-backend`; no additional install needed for PBT tasks
