# Requirements Document

## Introduction

The admin dashboard currently requires admins to search for members by phone, email, or ID before viewing any member data. There is no way to browse all members, and the existing detail view shows flat data without a chronological story of the member's journey. Treatment history is also absent from the detail view.

This feature adds a paginated member list/table to the admin dashboard, makes each row clickable to open a unified member detail panel, and enriches that panel with a chronological timeline (signup → subscription events → visits → claims → payments). The backend `GET /admin/members/:memberId` endpoint is extended to include visit history with all sensitive clinical fields excluded, and a new `GET /admin/members` paginated list endpoint is added.

## Glossary

- **Admin_Dashboard**: The Next.js admin UI at `/admin`, accessible only to authenticated admin users.
- **Member_List**: The paginated table component that displays all registered members with key columns.
- **Member_Detail_Panel**: The slide-over panel or modal that shows a member's full profile and timeline when a row or search result is clicked.
- **Timeline**: A chronological sequence of events in a member's lifecycle rendered inside the Member_Detail_Panel.
- **Timeline_Event**: A single dated entry in the Timeline (e.g., account created, subscription activated, visit, claim, payment).
- **Visit_Summary**: A non-sensitive representation of a Visit record containing only: visit date, clinic name, dentist name, procedures performed, and total cost.
- **Sensitive_Fields**: The Visit model fields `chiefComplaint`, `medicalHistory`, `clinicalNotes`, and `vitals` — these must never appear in any admin response.
- **Member_List_API**: The new backend endpoint `GET /admin/members` that returns a paginated list of members.
- **Member_Detail_API**: The existing backend endpoint `GET /admin/members/:memberId`, extended to include visit history.
- **Masked_Phone**: A phone number with the middle digits replaced (e.g., `+254 7** *** 678`) to reduce PII exposure in list views.
- **Annual_Cap**: The subscription benefit limit in KES; composed of `annualCapUsed` and `annualCapLimit` from the Subscription model.
- **Subscription_Tier**: One of `BRONZE`, `SILVER`, or `GOLD`.
- **Subscription_Status**: `ACTIVE` or `INACTIVE` derived from the `isActive` field on the Subscription model.

---

## Requirements

### Requirement 1: Paginated Member List

**User Story:** As an admin, I want to browse a paginated list of all members, so that I can find and review members without needing to know their phone number, email, or ID in advance.

#### Acceptance Criteria

1. THE Member_List_API SHALL return members ordered by registration date descending, with a default page size of 20 records per page.
2. WHEN the admin requests a specific page number and page size, THE Member_List_API SHALL return only the records for that page along with `total`, `page`, `pageSize`, and `totalPages` metadata.
3. THE Member_List_API SHALL include the following fields for each member in the list: `id`, `fullName`, `maskedPhone`, `subscriptionTier`, `subscriptionStatus`, `memberSince`.
4. WHEN a member has no active subscription, THE Member_List_API SHALL return `subscriptionTier` as `null` and `subscriptionStatus` as `INACTIVE`.
5. THE Member_List_API SHALL require a valid admin JWT token; IF the token is absent or invalid, THEN THE Member_List_API SHALL return HTTP 401.
6. THE Member_List_API SHALL mask the phone number in the list response so that only the first 4 and last 3 digits are visible (e.g., `+254 7** *** 678`).

---

### Requirement 2: Member List UI Component

**User Story:** As an admin, I want to see a table of all members in the admin dashboard, so that I can scroll through and click any row to view details.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display the Member_List as a table with columns: Name, Phone (masked), Tier, Status, Member Since.
2. THE Member_List SHALL load the first page of members automatically when the admin navigates to the Member Management section.
3. WHEN the Member_List is loading data, THE Admin_Dashboard SHALL display a loading skeleton or spinner in place of the table rows.
4. IF the Member_List_API returns an error, THEN THE Admin_Dashboard SHALL display an inline error message with a retry option.
5. THE Member_List SHALL display pagination controls showing the current page, total pages, and Previous/Next buttons.
6. WHEN the admin clicks Previous or Next, THE Member_List SHALL fetch and display the corresponding page without a full page reload.
7. WHEN the admin clicks any row in the Member_List, THE Admin_Dashboard SHALL open the Member_Detail_Panel for that member.
8. THE Member_List SHALL display subscription tier badges using the existing tier colour scheme (bronze/silver/gold).
9. THE Member_List SHALL display subscription status badges using the existing status colour scheme (active/inactive/suspended).

---

### Requirement 3: Unified Member Detail Panel

**User Story:** As an admin, I want a single detail panel that opens for any member — whether found via the list or via search — so that I have a consistent view regardless of how I found the member.

#### Acceptance Criteria

1. WHEN the admin clicks a row in the Member_List, THE Admin_Dashboard SHALL open the Member_Detail_Panel populated with that member's data.
2. WHEN the admin clicks a result in the existing search results list, THE Admin_Dashboard SHALL open the same Member_Detail_Panel populated with that member's data.
3. THE Member_Detail_Panel SHALL display a summary header containing: full name, masked phone number, subscription tier, subscription status, annual cap used / annual cap limit (in KES), and member since date.
4. WHEN the Member_Detail_Panel is opened, THE Admin_Dashboard SHALL call `adminApi.getMemberDetail(memberId)` to fetch the full detail including visit history.
5. WHEN the admin closes the Member_Detail_Panel, THE Admin_Dashboard SHALL return focus to the Member_List or search results without losing the current page or search state.
6. THE Member_Detail_Panel SHALL be dismissible via a close button and via pressing the Escape key.

---

### Requirement 4: Member Journey Timeline

**User Story:** As an admin, I want to see a chronological timeline of a member's journey inside the detail panel, so that I can understand their history at a glance.

#### Acceptance Criteria

1. THE Member_Detail_Panel SHALL render a Timeline section that lists Timeline_Events in reverse chronological order (most recent first).
2. THE Timeline SHALL include an "Account Created" event showing the member's registration date.
3. WHEN a member has a subscription, THE Timeline SHALL include a "Subscription Activated" event showing the activation date and tier.
4. WHEN a member's subscription tier has changed, THE Timeline SHALL include a "Subscription Upgraded" event for each tier change, showing the old tier, new tier, and date.
5. WHEN a member's subscription has become inactive, THE Timeline SHALL include a "Subscription Expired / Deactivated" event showing the date.
6. WHEN a member has visits, THE Timeline SHALL include a "Visit" event for each visit showing: visit date, clinic name, dentist name, list of procedures performed, and total cost in KES.
7. THE Timeline SHALL never display the fields `chiefComplaint`, `medicalHistory`, `clinicalNotes`, or `vitals` for any visit event.
8. WHEN a member has claims, THE Timeline SHALL include a "Claim Submitted" event for each claim showing: submission date, claim amount in KES, and claim status.
9. WHEN a member has payments, THE Timeline SHALL include a "Payment" event for each payment showing: payment date, amount in KES, and payment status.
10. WHEN the Timeline contains no events beyond account creation, THE Member_Detail_Panel SHALL display a message indicating no activity has been recorded yet.

---

### Requirement 5: Backend — Extended Member Detail Endpoint

**User Story:** As a developer, I want the `GET /admin/members/:memberId` endpoint to include visit history in its response, so that the frontend can render the full member timeline.

#### Acceptance Criteria

1. WHEN `GET /admin/members/:memberId` is called, THE Member_Detail_API SHALL include a `visitHistory` array in the response.
2. WHEN building the `visitHistory` array, THE Member_Detail_API SHALL query the `Visit` model joined with `StaffUser` (for dentist name), `Clinic` (for clinic name), and `VisitProcedure` joined with `Procedure` (for procedure names and costs).
3. THE Member_Detail_API SHALL include the following fields for each visit in `visitHistory`: `id`, `visitDate`, `clinicName`, `dentistName`, `procedures` (array of `{ name, cost }`), `totalCost`, `status`.
4. THE Member_Detail_API SHALL exclude the fields `chiefComplaint`, `medicalHistory`, `clinicalNotes`, and `vitals` from every visit object in the response.
5. THE Member_Detail_API SHALL exclude the `QuestionnaireData` relation from every visit object in the response.
6. IF a member has no visits, THEN THE Member_Detail_API SHALL return `visitHistory` as an empty array.
7. THE Member_Detail_API SHALL require a valid admin JWT token; IF the token is absent or invalid, THEN THE Member_Detail_API SHALL return HTTP 401.

---

### Requirement 6: Backend — New Paginated Member List Endpoint

**User Story:** As a developer, I want a `GET /admin/members` endpoint that returns a paginated list of members, so that the frontend Member_List component can display and navigate all members.

#### Acceptance Criteria

1. THE Member_List_API SHALL be accessible at `GET /admin/members` and SHALL accept query parameters `page` (default 1) and `pageSize` (default 20, maximum 100).
2. THE Member_List_API SHALL return a response object with shape `{ data: MemberListItem[], total: number, page: number, pageSize: number, totalPages: number }`.
3. THE Member_List_API SHALL require a valid admin JWT token; IF the token is absent or invalid, THEN THE Member_List_API SHALL return HTTP 401.
4. WHEN `pageSize` exceeds 100, THE Member_List_API SHALL respond with HTTP 400 and a descriptive error message.
5. WHEN `page` is less than 1 or not a positive integer, THE Member_List_API SHALL respond with HTTP 400 and a descriptive error message.
6. THE Member_List_API SHALL NOT conflict with the existing `GET /admin/members/search` route; the search route SHALL continue to function as before.

---

### Requirement 7: Sensitive Field Exclusion

**User Story:** As a system, I want to guarantee that sensitive clinical fields are never exposed through the admin member detail API, so that member privacy is protected and the platform remains compliant with data privacy obligations.

#### Acceptance Criteria

1. THE Member_Detail_API SHALL never include `chiefComplaint`, `medicalHistory`, `clinicalNotes`, or `vitals` in any response, regardless of how the Prisma query is constructed.
2. WHEN the Prisma `select` or `include` clause for Visit is written, THE Member_Detail_API SHALL use an explicit `select` that names only the permitted fields, rather than selecting all fields and omitting sensitive ones.
3. THE Admin_Dashboard SHALL not render any UI element that displays `chiefComplaint`, `medicalHistory`, `clinicalNotes`, or `vitals` data, even if such data were accidentally included in an API response.
4. THE Member_Detail_Panel SHALL display a privacy notice stating that clinical treatment details are excluded from the admin view to protect member privacy.

---

### Requirement 8: Existing Search Compatibility

**User Story:** As an admin, I want the existing member search (by phone, email, or ID) to continue working and to open the same detail panel as the member list, so that my existing workflow is not disrupted.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL retain the existing search form with fields for phone number, email, and member ID.
2. WHEN a search returns one or more results, THE Admin_Dashboard SHALL display the results list as before.
3. WHEN the admin clicks a search result, THE Admin_Dashboard SHALL open the Member_Detail_Panel using the same component used by the Member_List row click.
4. THE existing `GET /admin/members/search` endpoint SHALL continue to function without modification to its query parameters or response shape.
5. WHEN the admin clears the search, THE Admin_Dashboard SHALL close the Member_Detail_Panel if it was opened from a search result, and restore the Member_List to its previous state.
