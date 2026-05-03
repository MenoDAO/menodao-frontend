# Design Document: Clinic Geo-Map

## Overview

This feature adds geographic coordinates and branch relationships to the `Clinic` model, exposes two new public API endpoints for map and proximity queries, and builds a member-facing clinic map page that mirrors the existing camps map pattern. It also adds full admin CRUD for clinics — edit, admin-create, and branch management — filling the gap left by the current approve/suspend/reject-only admin interface.

The work spans two workspaces:

- **menodao-backend** — Prisma migration, new service methods, new controller endpoints
- **menodao-frontend** — new member dashboard page, admin forms, API client additions

### Key Design Decisions

1. **Haversine utility is extracted into a shared module** (`src/lib/geo.ts` in the frontend, `src/common/utils/haversine.ts` in the backend) so both the camps page and the new clinics page use the same implementation without duplication.
2. **`GET /clinics/map` returns all approved clinics including those without coordinates** — the frontend filters for map pins client-side. This avoids a second round-trip and keeps the list view complete.
3. **`GET /clinics/nearby` does the radius filter server-side** using the Haversine formula, returning only geo-located clinics within the radius. This keeps the payload small when the member has shared their location.
4. **Branch clinics are independent `Clinic` records** linked via `parentClinicId`. They have their own status, coordinates, and staff accounts. The parent/branch relationship is purely informational — no status inheritance.
5. **Admin-create endpoint reuses `RegisterClinicDto` fields** plus the new geo/branch fields, defaulting to `PENDING` status unless `APPROVED` is explicitly requested (which also triggers staff credential generation).

---

## Architecture

```mermaid
graph TD
  subgraph menodao-frontend
    A[/dashboard/clinics/page.tsx] -->|useQuery| B[api.getClinicMapData]
    A -->|useQuery| C[api.getNearbyClinics]
    B -->|GET /clinics/map| D
    C -->|GET /clinics/nearby| E
    F[/admin/clinics/page.tsx] -->|useMutation| G[adminApi.updateClinic]
    F -->|useMutation| H[adminApi.createClinic]
    F -->|useQuery| I[adminApi.getClinicBranches]
    G -->|PATCH /admin/clinics/:id| J
    H -->|POST /admin/clinics| K
    I -->|GET /admin/clinics/:id/branches| L
  end

  subgraph menodao-backend
    D[ClinicsController GET /clinics/map] --> M[ClinicsService.getMapClinics]
    E[ClinicsController GET /clinics/nearby] --> N[ClinicsService.getNearbyClinics]
    J[AdminClinicsController PATCH /:id] --> O[ClinicsService.updateClinic]
    K[AdminClinicsController POST /] --> P[ClinicsService.adminCreateClinic]
    L[AdminClinicsController GET /:id/branches] --> Q[ClinicsService.getClinicBranches]
    M --> R[(Prisma / PostgreSQL)]
    N --> R
    O --> R
    P --> R
    Q --> R
  end

  subgraph Shared Utilities
    S[haversine.ts - backend] -.->|same formula| T[geo.ts - frontend]
  end

  N -.->|uses| S
  C -.->|uses| T
```

### What is New vs Reused

| Component                            | Status    | Notes                                                   |
| ------------------------------------ | --------- | ------------------------------------------------------- |
| `Clinic` Prisma model                | Modified  | Add 4 nullable fields                                   |
| `ClinicsService.listClinics()`       | Unchanged | Signature preserved                                     |
| `ClinicsService.getMapClinics()`     | New       |                                                         |
| `ClinicsService.getNearbyClinics()`  | New       |                                                         |
| `ClinicsService.updateClinic()`      | New       |                                                         |
| `ClinicsService.adminCreateClinic()` | New       |                                                         |
| `ClinicsService.getClinicBranches()` | New       |                                                         |
| `ClinicsController`                  | Extended  | Add `map` and `nearby` routes                           |
| `AdminClinicsController`             | Extended  | Add `PATCH`, `POST`, `branches` routes                  |
| `haversine.ts` (backend)             | New       | Extracted utility                                       |
| `geo.ts` (frontend)                  | New       | Extracted utility, replaces inline camps logic          |
| `/dashboard/clinics/page.tsx`        | New       | Port of camps map pattern                               |
| `/admin/clinics/page.tsx`            | Modified  | Add Edit/Create forms, Branches section                 |
| `src/lib/api.ts`                     | Extended  | Add `getClinicMapData`, `getNearbyClinics`              |
| `src/lib/admin-api.ts`               | Extended  | Add `updateClinic`, `createClinic`, `getClinicBranches` |

---

## Components and Interfaces

### Backend: New Service Methods

```typescript
// ClinicsService additions

// Returns all APPROVED clinics (with or without coordinates)
async getMapClinics(): Promise<ClinicMapRecord[]>

// Returns APPROVED geo-located clinics within radius, sorted by distance
async getNearbyClinics(
  lat: number,
  lng: number,
  radius: number  // km, default 50
): Promise<ClinicWithDistance[]>

// Partial update — only touches fields present in dto
async updateClinic(id: string, dto: UpdateClinicDto): Promise<Clinic>

// Admin-create — defaults to PENDING, optionally APPROVED (triggers credentials)
async adminCreateClinic(dto: AdminCreateClinicDto, adminId: string): Promise<Clinic>

// Returns all clinics whose parentClinicId === id
async getClinicBranches(id: string): Promise<Clinic[]>
```

### Backend: New Controller Endpoints

```typescript
// ClinicsController (public, no auth)
@Get('map')
async getMapClinics(): Promise<ClinicMapRecord[]>

@Get('nearby')
@ApiQuery({ name: 'lat', type: Number, required: true })
@ApiQuery({ name: 'lng', type: Number, required: true })
@ApiQuery({ name: 'radius', type: Number, required: false })
async getNearbyClinics(
  @Query('lat') lat: string,
  @Query('lng') lng: string,
  @Query('radius') radius?: string,
): Promise<ClinicWithDistance[]>

// AdminClinicsController (AdminAuthGuard)
@Patch(':id')
async updateClinic(
  @Param('id') id: string,
  @Body() dto: UpdateClinicDto,
): Promise<Clinic>

@Post()
async adminCreateClinic(
  @Body() dto: AdminCreateClinicDto,
  @Request() req: { admin: { id: string } },
): Promise<Clinic>

@Get(':id/branches')
async getClinicBranches(@Param('id') id: string): Promise<Clinic[]>
```

### Backend: New DTOs

```typescript
// UpdateClinicDto — all fields optional
export class UpdateClinicDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() subCounty?: string;
  @IsOptional() @IsString() physicalLocation?: string;
  @IsOptional() @IsString() googleMapsLink?: string;
  @IsOptional() @IsString() operatingHours?: string;
  @IsOptional() @IsBoolean() operatesOnWeekends?: boolean;
  @IsOptional() @IsString() leadDentistName?: string;
  @IsOptional() @IsString() ownerPhone?: string;
  @IsOptional() @IsString() managerName?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number | null;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number | null;
  @IsOptional() @IsString() branchName?: string;
}

// AdminCreateClinicDto — extends RegisterClinicDto with geo/branch/status fields
export class AdminCreateClinicDto extends RegisterClinicDto {
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsString() parentClinicId?: string;
  @IsOptional() @IsString() branchName?: string;
  @IsOptional() @IsEnum(ClinicStatus) status?: ClinicStatus;
}
```

### Backend: Haversine Utility

```typescript
// src/common/utils/haversine.ts
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
```

### Frontend: API Client Additions

```typescript
// src/lib/api.ts additions

// New types
export interface ClinicMapItem {
  id: string;
  name: string;
  subCounty: string;
  physicalLocation: string;
  operatingHours: string;
  whatsappNumber: string;
  googleMapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ClinicWithDistance extends ClinicMapItem {
  distanceKm: number;
}

// New methods on ApiClient
async getClinicMapData(): Promise<ClinicMapItem[]>
async getNearbyClinics(lat: number, lng: number, radius?: number): Promise<ClinicWithDistance[]>
```

```typescript
// src/lib/admin-api.ts additions

// Extended AdminClinic type
export interface AdminClinic {
  // ... existing fields ...
  latitude: number | null;
  longitude: number | null;
  parentClinicId: string | null;
  branchName: string | null;
}

// New methods on AdminApiClient
async updateClinic(id: string, data: Partial<UpdateClinicPayload>): Promise<AdminClinic>
async createClinic(data: CreateClinicPayload): Promise<AdminClinic>
async getClinicBranches(id: string): Promise<AdminClinic[]>
```

### Frontend: Shared Geo Utility

```typescript
// src/lib/geo.ts
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  /* same formula */
}
```

The camps page (`/dashboard/camps/page.tsx`) will be updated to import from `geo.ts` instead of using its inline calculation, ensuring a single source of truth.

### Frontend: Clinic Map Page Structure

```
/dashboard/clinics/page.tsx
  ├── Header + List/Map toggle (same pattern as camps)
  ├── LocationBanner (gradient card with "Use my location" button)
  ├── MapView (conditional on viewMode === 'map')
  │   ├── GoogleMap (@react-google-maps/api)
  │   ├── MarkerF (one per geo-located clinic)
  │   ├── MarkerF (blue circle for user position)
  │   └── InfoWindowF (clinic details on pin click)
  └── ListView (conditional on viewMode === 'list')
      └── ClinicCard (one per clinic, shows distanceKm if available)
```

### Frontend: Admin Clinic Page Additions

The existing `/admin/clinics/page.tsx` is extended with:

- "Add Clinic" button in the header → opens `AdminClinicCreateForm` modal
- "Edit" button in the detail drawer → opens `AdminClinicEditForm` modal
- "Branches" section in the detail drawer → lists branch clinics, "Add Branch" button

```
AdminClinicEditForm (modal/drawer)
  ├── All existing fields pre-populated
  ├── latitude / longitude numeric inputs with helper note
  ├── branchName input
  └── Parent Clinic selector (searchable dropdown of all clinics)

AdminClinicCreateForm (modal)
  ├── All RegisterClinicDto fields
  ├── latitude / longitude (optional)
  ├── branchName (optional)
  ├── Parent Clinic selector (optional)
  └── Status selector (PENDING default, APPROVED option)

BranchesSection (inside detail drawer)
  ├── List of branch clinics (name, status, coordinates indicator)
  └── "Add Branch" button → opens AdminClinicCreateForm with parentClinicId pre-set
```

---

## Data Models

### Prisma Schema Diff

```prisma
model Clinic {
  // ... all existing fields unchanged ...

  // NEW: Geographic coordinates (nullable — existing records get null)
  latitude           Float?
  longitude          Float?

  // NEW: Branch relationship (self-referential)
  parentClinicId     String?
  branchName         String?

  // NEW: Self-referential relations
  parentClinic       Clinic?  @relation("ClinicBranches", fields: [parentClinicId], references: [id])
  branches           Clinic[] @relation("ClinicBranches")

  // ... existing relations unchanged ...
}
```

Migration SQL (additive, non-destructive):

```sql
ALTER TABLE "Clinic"
  ADD COLUMN "latitude"       DOUBLE PRECISION,
  ADD COLUMN "longitude"      DOUBLE PRECISION,
  ADD COLUMN "parentClinicId" TEXT,
  ADD COLUMN "branchName"     TEXT;

ALTER TABLE "Clinic"
  ADD CONSTRAINT "Clinic_parentClinicId_fkey"
  FOREIGN KEY ("parentClinicId") REFERENCES "Clinic"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Clinic_parentClinicId_idx" ON "Clinic"("parentClinicId");
```

All existing `Clinic` records will have `NULL` for all four new columns. No data loss.

### Response Shapes

```typescript
// GET /clinics/map response item
interface ClinicMapRecord {
  id: string;
  name: string;
  subCounty: string;
  physicalLocation: string;
  operatingHours: string;
  whatsappNumber: string;
  googleMapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
}

// GET /clinics/nearby response item
interface ClinicWithDistance extends ClinicMapRecord {
  distanceKm: number; // rounded to 2 decimal places
}
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Map endpoint returns only approved clinics

_For any_ set of clinics with varying statuses (PENDING, APPROVED, SUSPENDED, REJECTED), calling `getMapClinics()` should return only records whose `status` is `APPROVED`, regardless of whether their coordinates are null.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 2: Nearby endpoint returns only approved geo-located clinics within radius

_For any_ reference point `(lat, lng)` and radius `r`, calling `getNearbyClinics(lat, lng, r)` should return only clinics that are (a) `APPROVED`, (b) have non-null `latitude` and `longitude`, and (c) are within `r` kilometres of the reference point as computed by the Haversine formula.

**Validates: Requirements 3.2, 3.3**

### Property 3: Nearby results carry correct Haversine distance

_For any_ reference point and any clinic returned by `getNearbyClinics()`, the `distanceKm` field on that record should equal the Haversine distance between the reference point and the clinic's coordinates, rounded to two decimal places.

**Validates: Requirements 3.5**

### Property 4: Nearby results are sorted ascending by distance

_For any_ call to `getNearbyClinics()` that returns two or more results, the `distanceKm` values in the returned array should be non-decreasing (i.e., each element's `distanceKm` is ≥ the previous element's `distanceKm`).

**Validates: Requirements 3.6**

### Property 5: Partial clinic update only modifies specified fields

_For any_ existing clinic and any non-empty subset of editable fields, calling `updateClinic(id, subset)` should change exactly those fields to their new values and leave all other fields with their original values.

**Validates: Requirements 7.2, 7.3**

### Property 6: Invalid parentClinicId is rejected

_For any_ clinic ID that does not exist in the database, attempting to create or update a clinic with `parentClinicId` set to that non-existent ID should return HTTP 400.

**Validates: Requirements 11.2**

### Property 7: Branches endpoint returns exactly the linked clinics

_For any_ parent clinic with N branch clinics linked via `parentClinicId`, calling `getClinicBranches(parentId)` should return exactly those N clinics — no more, no fewer — and every returned record should have `parentClinicId === parentId`.

**Validates: Requirements 11.3**

---

## Error Handling

### Backend

| Scenario                                                   | Response                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `GET /clinics/nearby` missing `lat` or `lng`               | HTTP 400 — "lat and lng query parameters are required"       |
| `GET /clinics/nearby` non-numeric `lat`/`lng`              | HTTP 400 — "lat and lng must be valid numbers"               |
| `PATCH /admin/clinics/:id` — clinic not found              | HTTP 404 — "Clinic not found"                                |
| `PATCH /admin/clinics/:id` — `latitude` out of range       | HTTP 400 — "latitude must be between -90 and 90"             |
| `PATCH /admin/clinics/:id` — `longitude` out of range      | HTTP 400 — "longitude must be between -180 and 180"          |
| `POST /admin/clinics` — `parentClinicId` not found         | HTTP 400 — "Parent clinic not found"                         |
| `GET /admin/clinics/:id/branches` — clinic not found       | HTTP 404 — "Clinic not found"                                |
| `POST /admin/clinics` with `status=APPROVED` — SMS failure | Log error, continue — credentials still returned in response |

### Frontend

| Scenario                                    | Handling                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Google Maps script load error               | Show error message in map container, list view still functional                 |
| `getClinicMapData()` fetch error            | Show error state with retry button                                              |
| Geolocation permission denied               | Inline error: "Location access was denied. Enable it in your browser settings." |
| Geolocation timeout                         | Inline error: "Location request timed out. Try again."                          |
| `updateClinic()` / `createClinic()` error   | Display error message inline in form, do not close form                         |
| `updateClinic()` / `createClinic()` success | Show success toast, close form, invalidate query cache                          |

---

## Testing Strategy

### Unit Tests

- `haversineKm()` utility: verify known distances (e.g., Nairobi to Mombasa ≈ 440 km)
- `ClinicsService.getNearbyClinics()`: mock Prisma, verify filtering and sorting logic
- `ClinicsService.updateClinic()`: mock Prisma, verify partial update behavior
- `ClinicsService.adminCreateClinic()`: mock Prisma and SmsService, verify credential generation when `status=APPROVED`
- `UpdateClinicDto` validation: verify latitude/longitude range validators reject out-of-range values
- Frontend `ClinicCard` component: verify "Location not available" renders when coordinates are null

### Property-Based Tests

PBT applies to this feature because the core service methods are pure-logic functions (filtering, sorting, distance calculation, partial updates) with large input spaces where varied inputs reveal edge cases.

**Library**: `fast-check` (already available in the TypeScript ecosystem; install with `npm install --save-dev fast-check`)

**Configuration**: minimum 100 iterations per property test.

**Tag format**: `// Feature: clinic-geo-map, Property N: <property_text>`

Property tests to implement:

```typescript
// Property 1 — Feature: clinic-geo-map, Property 1: map endpoint returns only approved clinics
fc.assert(
  fc.asyncProperty(
    fc.array(arbitraryClinic()), // clinics with random statuses and nullable coords
    async (clinics) => {
      // seed mock Prisma with clinics
      const result = await service.getMapClinics();
      return result.every((c) => c.status === "APPROVED");
    },
  ),
  { numRuns: 100 },
);

// Property 2 — Feature: clinic-geo-map, Property 2: nearby returns only approved geo-located clinics within radius
fc.assert(
  fc.asyncProperty(
    fc.float({ min: -90, max: 90 }), // reference lat
    fc.float({ min: -180, max: 180 }), // reference lng
    fc.float({ min: 1, max: 200 }), // radius km
    fc.array(arbitraryClinicWithCoords()),
    async (lat, lng, radius, clinics) => {
      const result = await service.getNearbyClinics(lat, lng, radius);
      return result.every(
        (c) =>
          c.status === "APPROVED" &&
          c.latitude != null &&
          c.longitude != null &&
          haversineKm(lat, lng, c.latitude, c.longitude) <= radius,
      );
    },
  ),
  { numRuns: 100 },
);

// Property 3 — Feature: clinic-geo-map, Property 3: nearby results carry correct Haversine distance
// (combined with Property 2 test — verify distanceKm matches computed value)

// Property 4 — Feature: clinic-geo-map, Property 4: nearby results sorted ascending
fc.assert(
  fc.asyncProperty(
    fc.float({ min: -90, max: 90 }),
    fc.float({ min: -180, max: 180 }),
    fc.array(arbitraryClinicWithCoords(), { minLength: 2 }),
    async (lat, lng, clinics) => {
      const result = await service.getNearbyClinics(lat, lng, 500);
      for (let i = 1; i < result.length; i++) {
        if (result[i].distanceKm < result[i - 1].distanceKm) return false;
      }
      return true;
    },
  ),
  { numRuns: 100 },
);

// Property 5 — Feature: clinic-geo-map, Property 5: partial update only modifies specified fields
fc.assert(
  fc.asyncProperty(
    arbitraryClinic(),
    arbitraryUpdateSubset(), // random non-empty subset of editable fields
    async (original, patch) => {
      await service.updateClinic(original.id, patch);
      const updated = await service.getClinic(original.id);
      // patched fields match new values
      const patchedCorrect = Object.keys(patch).every(
        (k) => updated[k] === patch[k],
      );
      // unpatched fields unchanged
      const unpatchedCorrect = Object.keys(original)
        .filter((k) => !(k in patch))
        .every((k) => updated[k] === original[k]);
      return patchedCorrect && unpatchedCorrect;
    },
  ),
  { numRuns: 100 },
);

// Property 6 — Feature: clinic-geo-map, Property 6: invalid parentClinicId is rejected
fc.assert(
  fc.asyncProperty(
    fc.uuid(), // random UUID that won't exist in DB
    async (fakeId) => {
      await expect(
        service.adminCreateClinic(
          { ...validClinicData, parentClinicId: fakeId },
          adminId,
        ),
      ).rejects.toThrow(BadRequestException);
      return true;
    },
  ),
  { numRuns: 100 },
);

// Property 7 — Feature: clinic-geo-map, Property 7: branches endpoint returns exactly linked clinics
fc.assert(
  fc.asyncProperty(
    fc.integer({ min: 0, max: 10 }), // number of branches
    async (branchCount) => {
      const parent = await createParent();
      const branches = await createBranches(parent.id, branchCount);
      const result = await service.getClinicBranches(parent.id);
      return (
        result.length === branchCount &&
        result.every((b) => b.parentClinicId === parent.id)
      );
    },
  ),
  { numRuns: 100 },
);
```

### Integration Tests

- `GET /clinics/map` returns 200 with correct shape against a real (test) database
- `GET /clinics/nearby` with valid and invalid query params
- `PATCH /admin/clinics/:id` requires admin auth (401 without token)
- `POST /admin/clinics` with `status=APPROVED` creates staff accounts

### Frontend Component Tests

- `ClinicMapPage` renders list view with all clinics including those without coordinates
- `ClinicMapPage` shows "Location not available" badge on null-coordinate clinic cards
- `AdminClinicEditForm` pre-populates all fields from the selected clinic
- `AdminClinicCreateForm` shows field-level errors on validation failure
