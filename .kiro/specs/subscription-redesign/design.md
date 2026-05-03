# Design Document: Subscription Page Redesign

## Overview

This document describes the technical design for the complete visual and functional overhaul of the `/dashboard/subscription` page. The redesign introduces glass morphism package cards with tier-specific colour palettes, staggered CSS entrance animations, a Dependant Manager component for Silver/Gold subscribers, and a MenoAI teaser section. The backend gains a new `Dependant` Prisma model and two REST endpoints.

**Stack:** Next.js 16, TypeScript, Tailwind CSS, react-i18next, NestJS, Prisma (PostgreSQL)

**Key constraints:**

- No Framer Motion — all animations via Tailwind CSS utility classes and CSS transitions only
- All user-facing strings via `useTranslation` (en/sw)
- Coverage limits enforced server-side; frontend shows errors returned by the API

---

## Architecture

The feature spans two repositories:

```
menodao-frontend/
  src/app/(dashboard)/dashboard/subscription/
    page.tsx                    ← redesigned main page
    PaymentDialog.tsx           ← unchanged
    DependantManager.tsx        ← new component
    MenoAITeaser.tsx            ← new component
  src/locales/
    en.json                     ← new keys added
    sw.json                     ← new Swahili translations added
  src/lib/
    api.ts                      ← addDependant / getDependants methods added

menodao-backend/
  src/members/
    members.controller.ts       ← POST /members/dependants, GET /members/dependants
    members.service.ts          ← addDependant / getDependants methods
    dto/
      create-dependant.dto.ts   ← new DTO
  prisma/
    schema.prisma               ← Dependant model + Member relation
    migrations/                 ← new migration
```

Data flow for adding a dependant:

```
DependantManager (form submit)
  → api.addDependant({ fullName, relationship })
  → POST /members/dependants (JWT-authenticated)
  → MembersService.addDependant(memberId, dto)
    → check active SILVER/GOLD subscription
    → check current dependant count vs tier limit
    → prisma.dependant.create(...)
  → 201 Created { id, memberId, fullName, relationship, createdAt }
  → React Query invalidates ["dependants"] → list re-fetches
```

---

## Components and Interfaces

### `page.tsx` — Subscription Page (redesigned)

The page orchestrates three visual sections:

1. **Package Cards grid** — three `PackageCard` inline components, staggered entrance animation
2. **Dependant Manager** — rendered only when `subscription?.isActive && subscription.tier !== 'BRONZE'`
3. **MenoAI Teaser** — always rendered below the above sections

**Tier colour palettes** (Tailwind classes):

| Tier   | Background         | Border                 | Text              | Ring              |
| ------ | ------------------ | ---------------------- | ----------------- | ----------------- |
| BRONZE | `bg-amber-500/10`  | `border-amber-500/40`  | `text-amber-600`  | `ring-amber-500`  |
| SILVER | `bg-slate-400/10`  | `border-slate-400/40`  | `text-slate-500`  | `ring-slate-400`  |
| GOLD   | `bg-yellow-400/10` | `border-yellow-400/40` | `text-yellow-500` | `ring-yellow-400` |

**Glass morphism base classes** (applied to every Package Card):

```
backdrop-blur-md bg-white/10 dark:bg-gray-900/40 border rounded-2xl
```

**Staggered entrance animation** — each card gets an `animation-delay` via inline style:

```tsx
style={{ animationDelay: `${index * 100}ms` }}
className="animate-fade-slide-up opacity-0"
```

The `animate-fade-slide-up` keyframe is defined in `globals.css` (or Tailwind config):

```css
@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-slide-up {
  animation: fade-slide-up 0.4s ease-out forwards;
}
```

**Hover / selected state** (non-current-plan cards only):

```
hover:scale-105 hover:shadow-xl transition-all duration-200
```

Selected state (after clicking action button, before dialog opens):

```
ring-2 ring-offset-2 ring-{tier-colour}
```

**Coverage labels** (i18n keys):

- `subscription.coverage.bronze` → "Individual only — covers 1 person (you)"
- `subscription.coverage.silver` → "Individual + 1 dependant — you and 1 child"
- `subscription.coverage.gold` → "Family — you and up to 2 children"

### `DependantManager.tsx` — New Component

Props:

```ts
interface DependantManagerProps {
  tier: "SILVER" | "GOLD";
}
```

Internal state:

- `fullName: string` — controlled input
- `nameError: string | null` — inline validation
- `apiError: string | null` — server-returned error

React Query usage:

- `useQuery(['dependants'], api.getDependants)` — fetches list on mount
- `useMutation(api.addDependant, { onSuccess: () => queryClient.invalidateQueries(['dependants']) })`

Tier limits (frontend display only; enforcement is server-side):

```ts
const TIER_MAX: Record<"SILVER" | "GOLD", number> = { SILVER: 1, GOLD: 2 };
```

New dependant list items animate in with:

```
animate-fade-in  (opacity: 0 → 1, 300ms ease-out)
```

### `MenoAITeaser.tsx` — New Component

No props. Stateless. Uses `useTranslation`.

Styled as a glass card with emerald gradient accent:

```
backdrop-blur-md bg-emerald-500/10 dark:bg-emerald-900/20
border border-emerald-400/30 rounded-2xl
```

The "Coming Soon" button is always `disabled`:

```tsx
<button disabled className="... opacity-50 cursor-not-allowed">
  {t("menoai.comingSoon")}
</button>
```

Viewport entrance animation via CSS `@keyframes fade-slide-up` with a single `animation-delay: 300ms` (fires after the three cards).

### Backend: `CreateDependantDto`

```ts
export class CreateDependantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsIn(["Parent/Child"])
  relationship: string;
}
```

### Backend: `MembersService` additions

```ts
async addDependant(memberId: string, dto: CreateDependantDto): Promise<Dependant>
async getDependants(memberId: string): Promise<Dependant[]>
```

`addDependant` logic:

1. Find active subscription for `memberId`
2. If none, or tier is BRONZE, throw `BadRequestException('Dependant coverage requires a Silver or Gold subscription')`
3. Count existing dependants for `memberId`
4. If count >= limit (SILVER=1, GOLD=2), throw `BadRequestException('Silver plan allows a maximum of 1 dependant')` / `'Gold plan allows a maximum of 2 dependants'`
5. `prisma.dependant.create({ data: { memberId, ...dto } })`

### Backend: `MembersController` additions

```ts
@Post('dependants')
async addDependant(@Request() req, @Body() dto: CreateDependantDto)

@Get('dependants')
async getDependants(@Request() req)
```

Both routes are under the existing `@UseGuards(JwtAuthGuard)` controller guard.

### Frontend: `api.ts` additions

```ts
async addDependant(data: { fullName: string; relationship: string }) {
  return this.request<Dependant>('/members/dependants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async getDependants() {
  return this.request<Dependant[]>('/members/dependants');
}
```

New type:

```ts
export interface Dependant {
  id: string;
  memberId: string;
  fullName: string;
  relationship: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Data Models

### New Prisma model: `Dependant`

```prisma
model Dependant {
  id           String   @id @default(uuid())
  memberId     String
  fullName     String
  relationship String   // "Parent/Child"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([memberId])
}
```

### Updated `Member` model

Add the relation field:

```prisma
dependants Dependant[]
```

No other schema changes are required. The coverage limit logic lives in the service layer, not the schema.

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: DependantManager visibility is determined by subscription tier

_For any_ member, the DependantManager component SHALL be rendered if and only if the member has an active SILVER or GOLD subscription. For any member with BRONZE, no subscription, or an inactive subscription, the DependantManager SHALL NOT be rendered.

**Validates: Requirements 3.1, 3.8**

### Property 2: Valid dependant submission creates a matching record

_For any_ non-empty `fullName` string and the relationship value `"Parent/Child"`, submitting the Add Dependant form SHALL result in the API being called with those exact values and returning a Dependant record whose `fullName` and `relationship` match the submitted values.

**Validates: Requirements 3.4**

### Property 3: Whitespace and empty names are rejected client-side

_For any_ string composed entirely of whitespace characters (including the empty string), submitting the Add Dependant form SHALL display the inline validation error and SHALL NOT call the API.

**Validates: Requirements 3.5**

### Property 4: All dependants in the list are rendered with correct data

_For any_ array of Dependant records returned by the API, the DependantManager SHALL render exactly that many list items, and each item SHALL display the dependant's `fullName` and `relationship`.

**Validates: Requirements 4.1, 4.2**

### Property 5: Dependant count display reflects tier maximum

_For any_ active tier (SILVER or GOLD) and any valid current dependant count, the DependantManager counter SHALL display `{count} / {max}` where `max` is 1 for SILVER and 2 for GOLD.

**Validates: Requirements 4.5**

### Property 6: Coverage rule is enforced server-side for all members

_For any_ member and any call to `POST /members/dependants`:

- If the member has no active SILVER or GOLD subscription → HTTP 400
- If the member has SILVER and already has 1 dependant → HTTP 400
- If the member has GOLD and already has 2 dependants → HTTP 400
- Otherwise → HTTP 201 with the created Dependant record

**Validates: Requirements 5.3, 5.5**

### Property 7: GET /members/dependants returns all stored dependants

_For any_ member with N dependants stored in the database, `GET /members/dependants` SHALL return exactly N records, all belonging to that member.

**Validates: Requirements 5.4**

### Property 8: All i18n keys used in new components exist in both locale files

_For any_ translation key referenced via `useTranslation` in the new or modified components (`page.tsx`, `DependantManager.tsx`, `MenoAITeaser.tsx`), that key SHALL exist in both `src/locales/en.json` and `src/locales/sw.json`.

**Validates: Requirements 8.1, 8.2**

---

## Error Handling

| Scenario                                  | Frontend behaviour                           | Backend response                                  |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Empty/whitespace name submitted           | Inline error "Name is required", no API call | —                                                 |
| BRONZE member tries to add dependant      | Not possible (DependantManager not rendered) | 400 if called directly                            |
| SILVER member at limit (1)                | API error displayed in DependantManager      | 400 "Silver plan allows a maximum of 1 dependant" |
| GOLD member at limit (2)                  | API error displayed in DependantManager      | 400 "Gold plan allows a maximum of 2 dependants"  |
| Network error on GET /members/dependants  | React Query error state, retry button        | 500                                               |
| Network error on POST /members/dependants | `apiError` state shown in form               | 500                                               |
| Member has no active subscription         | DependantManager not rendered                | 400 if called directly                            |

All error messages displayed in the DependantManager use i18n keys so they render in the member's preferred language.

---

## Testing Strategy

### Unit tests (Jest + React Testing Library)

Focus on specific examples and edge cases:

- `page.tsx`: renders three cards; GOLD card has "Recommended" badge when no subscription; current tier card has "Current Plan" badge; BRONZE subscription shows upgrade note; DependantManager absent for BRONZE
- `DependantManager.tsx`: renders form fields; empty name shows validation error; loading state shows spinner; empty list shows empty state message; list renders correct count/max for each tier
- `MenoAITeaser.tsx`: renders "Coming Soon" badge; button is disabled; WhatsApp icon present
- `MembersService.addDependant`: rejects BRONZE member; rejects SILVER at limit; rejects GOLD at limit; creates record for eligible member
- `MembersService.getDependants`: returns only records for the requesting member

### Property-based tests (fast-check, minimum 100 iterations each)

Each property test is tagged with the design property it validates.

**Feature: subscription-redesign, Property 1: DependantManager visibility is determined by subscription tier**

- Generator: random `{ tier: 'BRONZE' | 'SILVER' | 'GOLD', isActive: boolean }`
- Assert: DependantManager rendered iff `isActive && tier !== 'BRONZE'`

**Feature: subscription-redesign, Property 2: Valid dependant submission creates a matching record**

- Generator: random non-empty `fullName` string (alphanumeric, Unicode, spaces)
- Assert: `addDependant({ fullName, relationship: 'Parent/Child' })` returns record with matching `fullName` and `relationship`
- Use mocked Prisma

**Feature: subscription-redesign, Property 3: Whitespace and empty names are rejected client-side**

- Generator: strings composed entirely of `\s` characters (space, tab, newline, etc.) including empty string
- Assert: form validation fires, API is not called

**Feature: subscription-redesign, Property 4: All dependants in the list are rendered with correct data**

- Generator: random array of Dependant objects (0–10 items, random fullName and relationship)
- Assert: rendered list has same length; each item contains the correct fullName and relationship text

**Feature: subscription-redesign, Property 5: Dependant count display reflects tier maximum**

- Generator: random `{ tier: 'SILVER' | 'GOLD', count: number }` where `0 <= count <= max`
- Assert: counter text equals `${count} / ${TIER_MAX[tier]}`

**Feature: subscription-redesign, Property 6: Coverage rule is enforced server-side**

- Generator: random `{ tier: PackageTier | null, isActive: boolean, existingCount: number }`
- Assert: service throws BadRequestException iff `!isActive || tier === 'BRONZE' || existingCount >= TIER_MAX[tier]`
- Use mocked Prisma

**Feature: subscription-redesign, Property 7: GET /members/dependants returns all stored dependants**

- Generator: random array of N Dependant records for a given memberId
- Assert: `getDependants(memberId)` returns exactly N records, all with matching `memberId`
- Use mocked Prisma

**Feature: subscription-redesign, Property 8: All i18n keys exist in both locale files**

- Generator: extract all `t('...')` calls from new/modified component files
- Assert: every extracted key exists as a key in `en.json` and `sw.json`
- This is a static analysis property test (runs once, but validates all keys)

### Integration tests

- `POST /members/dependants` end-to-end with a test database: SILVER member can add 1, second attempt returns 400
- `GET /members/dependants` returns only the authenticated member's dependants
- Prisma migration applies cleanly to a fresh database
