# Requirements Document

## Introduction

This feature is a complete visual and functional overhaul of the `/dashboard/subscription` page in the MenoDAO frontend. The redesign introduces glass morphism card UI with rich animations, a dependant management system (add/view dependants after purchasing a package), and a MenoAI chatbot teaser section. The backend (NestJS + Prisma) requires a new `Dependant` model and corresponding API endpoints. The frontend uses Next.js 16, TypeScript, Tailwind CSS, and react-i18next (en/sw).

---

## Glossary

- **Subscription_Page**: The `/dashboard/subscription` route rendered by `menodao-frontend/src/app/(dashboard)/dashboard/subscription/page.tsx`.
- **Package_Card**: A glass morphism UI card representing one of the three subscription tiers (Bronze, Silver, Gold).
- **PackageTier**: The enum `BRONZE | SILVER | GOLD` as defined in the Prisma schema.
- **Dependant**: A person (child) covered under a member's Silver or Gold subscription, stored in the new `Dependant` Prisma model.
- **Dependant_Manager**: The UI section on the Subscription_Page that allows a member to add and view their dependants after purchasing a package.
- **MenoAI_Teaser**: A UI section on the Subscription_Page that promotes the upcoming MenoAI WhatsApp chatbot feature.
- **Glass_Card**: A UI component styled with `backdrop-filter: blur`, semi-transparent background, and a subtle border — the visual pattern used for Package_Cards.
- **Coverage_Rule**: The business rule defining how many people each tier covers: Bronze = 1 (member only), Silver = member + 1 dependant, Gold = member + up to 2 dependants.
- **Relationship_Type**: The relationship between a member and a dependant; only `Parent/Child` is eligible for coverage.
- **i18n**: The react-i18next internationalisation system supporting `en` and `sw` locales.
- **API**: The NestJS backend accessible via the `api` client in `menodao-frontend/src/lib/api.ts`.

---

## Requirements

### Requirement 1: Glass Morphism Package Cards

**User Story:** As a member, I want to see the three subscription packages displayed as visually distinct glass morphism cards, so that I can easily compare and select the right package for my needs.

#### Acceptance Criteria

1. THE Subscription_Page SHALL render exactly three Package_Cards — one for each PackageTier (BRONZE, SILVER, GOLD) — in a responsive grid layout (1 column on mobile, 3 columns on desktop).
2. WHEN the Subscription_Page renders, EACH Package_Card SHALL apply a glass morphism style: semi-transparent background (`bg-white/10` or equivalent), `backdrop-blur`, and a subtle coloured border matching the tier's colour palette.
3. WHEN a user hovers over a Package_Card that is not their current plan, THE Package_Card SHALL animate with a scale-up transform (`scale-105`) and an elevated box shadow transition within 200ms.
4. WHEN a user selects a Package_Card (clicks the action button), THE Package_Card SHALL display a visible selected/active ring animation before opening the payment dialog.
5. THE Package_Card for the GOLD tier SHALL display a "Recommended" badge by default when the member has no active subscription.
6. THE Package_Card for the member's current active tier SHALL display a "Current Plan" badge and SHALL NOT apply hover scale animation.
7. WHEN the Subscription_Page is in dark mode, EACH Package_Card SHALL use a dark-tinted glass background (`bg-gray-900/40` or equivalent) while preserving the blur and border effects.
8. THE Subscription_Page SHALL display each Package_Card with a tier-specific gradient icon area: amber/bronze for BRONZE, slate/silver for SILVER, and yellow/gold for GOLD.

### Requirement 2: Package Coverage Details

**User Story:** As a member, I want to clearly see how many people each package covers, so that I can choose the right tier for my family situation.

#### Acceptance Criteria

1. THE Package_Card for BRONZE SHALL display the coverage label "Individual only — covers 1 person (you)".
2. THE Package_Card for SILVER SHALL display the coverage label "Individual + 1 dependant — you and 1 child".
3. THE Package_Card for GOLD SHALL display the coverage label "Family — you and up to 2 children".
4. THE Subscription_Page SHALL display coverage information using i18n translation keys so that the labels render in both English and Swahili.
5. WHEN a member has an active BRONZE subscription and views the Subscription_Page, THE Subscription_Page SHALL display a note explaining that upgrading to SILVER or GOLD unlocks dependant coverage.

### Requirement 3: Dependant Management — Add Dependant

**User Story:** As a member with an active Silver or Gold subscription, I want to add dependants by entering their name and selecting their relationship, so that they are covered under my plan.

#### Acceptance Criteria

1. WHEN a member has an active SILVER or GOLD subscription, THE Dependant_Manager SHALL be visible on the Subscription_Page below the Package_Cards section.
2. THE Dependant_Manager SHALL display an "Add Dependant" form with two fields: a text input for the dependant's full name and a dropdown/select for relationship type.
3. THE Dependant_Manager relationship dropdown SHALL contain only the option "Parent/Child" as the eligible relationship type.
4. WHEN a member submits the "Add Dependant" form with a valid name and the "Parent/Child" relationship, THE API SHALL create a new Dependant record linked to the member's subscription and return the created record.
5. IF a member submits the "Add Dependant" form with an empty name field, THEN THE Dependant_Manager SHALL display an inline validation error "Name is required" without submitting to the API.
6. WHEN a SILVER subscriber already has 1 dependant and attempts to add another, THE API SHALL return an error and THE Dependant_Manager SHALL display the message "Silver plan allows a maximum of 1 dependant".
7. WHEN a GOLD subscriber already has 2 dependants and attempts to add another, THE API SHALL return an error and THE Dependant_Manager SHALL display the message "Gold plan allows a maximum of 2 dependants".
8. WHEN a member has an active BRONZE subscription, THE Dependant_Manager SHALL NOT be rendered on the Subscription_Page.
9. THE Dependant_Manager form labels and error messages SHALL use i18n translation keys for both English and Swahili.

### Requirement 4: Dependant Management — View Dependants

**User Story:** As a member with an active Silver or Gold subscription, I want to see a list of my registered dependants, so that I can confirm who is covered under my plan.

#### Acceptance Criteria

1. WHEN a member has an active SILVER or GOLD subscription, THE Dependant_Manager SHALL fetch and display the list of dependants linked to the member's subscription from the API.
2. FOR EACH dependant in the list, THE Dependant_Manager SHALL display the dependant's full name and relationship type.
3. WHEN the dependant list is loading, THE Dependant_Manager SHALL display a loading skeleton or spinner.
4. WHEN the member has no dependants yet, THE Dependant_Manager SHALL display the empty state message "No dependants added yet".
5. THE Dependant_Manager SHALL display the current dependant count and the maximum allowed for the member's tier (e.g., "1 / 2 dependants").

### Requirement 5: Dependant Data Model — Backend

**User Story:** As a developer, I want a Dependant model in the Prisma schema and corresponding API endpoints, so that the frontend can create and retrieve dependants.

#### Acceptance Criteria

1. THE Prisma schema SHALL include a `Dependant` model with fields: `id` (UUID), `memberId` (foreign key to `Member`), `fullName` (String), `relationship` (String, value "Parent/Child"), `createdAt` (DateTime), `updatedAt` (DateTime).
2. THE `Member` model in the Prisma schema SHALL have a one-to-many relation to `Dependant` via a `dependants` field.
3. THE API SHALL expose a `POST /members/dependants` endpoint that accepts `{ fullName: string, relationship: string }`, validates the Coverage_Rule for the member's active tier, and creates the Dependant record.
4. THE API SHALL expose a `GET /members/dependants` endpoint that returns the list of Dependant records for the authenticated member.
5. IF the `POST /members/dependants` endpoint is called by a member without an active SILVER or GOLD subscription, THEN THE API SHALL return HTTP 400 with the message "Dependant coverage requires a Silver or Gold subscription".
6. THE API client in `menodao-frontend/src/lib/api.ts` SHALL include `addDependant` and `getDependants` methods that call the respective endpoints.

### Requirement 6: MenoAI Teaser Section

**User Story:** As a member, I want to see a teaser for the upcoming MenoAI chatbot feature, so that I know about the world-class dental care available directly in WhatsApp.

#### Acceptance Criteria

1. THE Subscription_Page SHALL render a MenoAI_Teaser section below the Dependant_Manager (or below the Package_Cards if no Dependant_Manager is shown).
2. THE MenoAI_Teaser SHALL display a "Coming Soon" badge, a headline, and a description that reads "World-class dental care directly in your WhatsApp — powered by AI".
3. THE MenoAI_Teaser SHALL display a WhatsApp icon or logo alongside the description.
4. THE MenoAI_Teaser SHALL be styled as a glass morphism card with a green/emerald gradient accent to match the WhatsApp brand colour.
5. THE MenoAI_Teaser SHALL state that all subscribers (Bronze, Silver, and Gold) get access to MenoAI when it launches.
6. THE MenoAI_Teaser headline and description SHALL use i18n translation keys for both English and Swahili.
7. WHILE the MenoAI feature is not yet launched, THE MenoAI_Teaser action button SHALL be disabled and labelled "Coming Soon".

### Requirement 7: Animations and Transitions

**User Story:** As a member, I want smooth animations throughout the subscription page, so that the experience feels polished and modern.

#### Acceptance Criteria

1. WHEN the Subscription_Page first renders, THE Package_Cards SHALL animate in with a staggered fade-and-slide-up entrance (each card delayed by 100ms from the previous).
2. WHEN a Package_Card hover state is entered or exited, THE transition SHALL complete within 200ms using a CSS ease-out curve.
3. WHEN the Dependant_Manager "Add Dependant" form is submitted successfully, THE new dependant SHALL appear in the list with a fade-in animation.
4. WHEN the MenoAI_Teaser section enters the viewport, THE section SHALL animate in with a fade-up transition (using Intersection Observer or CSS animation).
5. THE Subscription_Page SHALL NOT use JavaScript-based animation libraries (e.g., Framer Motion) that are not already present in the project; animations SHALL be implemented using Tailwind CSS utility classes and CSS transitions only.

### Requirement 8: Internationalisation

**User Story:** As a Swahili-speaking member, I want all new text on the subscription page to be available in Swahili, so that I can understand the page in my preferred language.

#### Acceptance Criteria

1. THE `menodao-frontend/src/locales/en.json` file SHALL include translation keys for all new UI strings introduced by this feature (Package_Card coverage labels, Dependant_Manager labels/errors, MenoAI_Teaser copy).
2. THE `menodao-frontend/src/locales/sw.json` file SHALL include Swahili translations for all new keys added to `en.json`.
3. WHEN a member's preferred language is set to `sw`, THE Subscription_Page SHALL render all new strings in Swahili.
4. THE Subscription_Page SHALL use the `useTranslation` hook from react-i18next for all user-facing strings; no hardcoded English strings SHALL appear in the JSX outside of translation function calls.
