# Requirements Document

## Introduction

The MenoDAO frontend currently stores JWT tokens in localStorage via Zustand persist with no client-side expiry enforcement. Tokens are issued by the backend for 24 hours, but the frontend never validates the `iat` (issued-at) or `exp` (expiry) claims — a stale token silently fails on the next API call, leaving the user in a broken state with no feedback.

This feature enforces a configurable session lifetime (default 8 hours, acceptable range 6–12 hours) on the frontend for both member and admin sessions. On app load and on every dashboard navigation, the system decodes the stored JWT, checks its age and expiry, and redirects to the login page with a clear "Your session has expired" message if the session is invalid. The backend admin JWT expiry is also aligned to match the frontend enforcement.

## Glossary

- **Session_Validator**: The client-side utility responsible for decoding a JWT and evaluating whether the session is still valid based on `exp` and `iat` claims.
- **Auth_Store**: The Zustand member authentication store (`src/lib/auth-store.ts`) persisted under the key `menodao-auth` in localStorage.
- **Admin_Store**: The Zustand admin authentication store (`src/lib/admin-store.ts`) persisted under the key `admin-auth-storage` in localStorage.
- **Dashboard_Layout**: The Next.js layout component at `src/app/(dashboard)/layout.tsx` that wraps all member dashboard pages.
- **Admin_Layout**: The Next.js layout component at `src/app/admin/layout.tsx` that wraps all admin pages.
- **SESSION_MAX_AGE**: The configurable maximum session lifetime in seconds. Default value is 28800 (8 hours). Acceptable range is 21600–43200 (6–12 hours).
- **JWT**: A JSON Web Token containing at minimum the `iat` (issued-at) and `exp` (expiry) Unix timestamp claims.
- **Expiry_Toast**: A transient UI notification displayed to the user before a session-expiry redirect.
- **Admin_Service**: The NestJS service at `src/admin/admin.service.ts` in the backend that issues admin JWTs.

---

## Requirements

### Requirement 1: JWT Decode and Claim Validation

**User Story:** As a developer, I want a reusable utility that decodes a JWT and evaluates its validity, so that session checks are consistent and testable across member and admin flows.

#### Acceptance Criteria

1. THE Session_Validator SHALL decode a JWT string and extract the `iat`, `exp`, and `sub` claims without making a network request.
2. WHEN a JWT string is malformed or cannot be decoded, THE Session_Validator SHALL return an invalid-session result rather than throwing an unhandled exception.
3. WHEN a JWT's `exp` claim is less than the current Unix timestamp, THE Session_Validator SHALL classify the session as expired.
4. WHEN a JWT's `iat` claim is more than SESSION_MAX_AGE seconds before the current Unix timestamp, THE Session_Validator SHALL classify the session as exceeded-max-age.
5. WHEN a JWT is missing the `iat` or `exp` claims, THE Session_Validator SHALL classify the session as invalid.
6. FOR ALL valid JWT strings, decoding then re-encoding the payload SHALL produce an equivalent claim set (round-trip property).
7. FOR ALL JWT strings where `exp` is less than the current time, THE Session_Validator SHALL return `isExpired: true`.
8. FOR ALL JWT strings where `(currentTime - iat) > SESSION_MAX_AGE`, THE Session_Validator SHALL return `isExceededMaxAge: true`.

---

### Requirement 2: Session Enforcement on App Load

**User Story:** As a member, I want the app to check my session when it first loads, so that I am not silently stuck with a broken stale token.

#### Acceptance Criteria

1. WHEN the Auth_Store `loadUser()` function is called and a token is present in storage, THE Auth_Store SHALL invoke the Session_Validator before making any API call.
2. IF the Session_Validator returns `isExpired: true` or `isExceededMaxAge: true`, THEN THE Auth_Store SHALL clear the stored token and member state, display the Expiry_Toast, and redirect the user to `/login`.
3. IF the Session_Validator returns a valid result, THEN THE Auth_Store SHALL proceed with the existing `api.getMe()` call to hydrate member state.
4. WHEN a session is cleared due to expiry on app load, THE Auth_Store SHALL set `isAuthenticated` to `false` and `member` to `null` before the redirect occurs.

---

### Requirement 3: Session Enforcement on Dashboard Navigation

**User Story:** As a member, I want the app to check my session on every page navigation within the dashboard, so that a session that expires mid-use is caught promptly rather than on the next API call.

#### Acceptance Criteria

1. WHEN the Dashboard_Layout mounts or the current pathname changes, THE Dashboard_Layout SHALL invoke the Session_Validator against the token in the Auth_Store.
2. IF the Session_Validator returns an expired or exceeded-max-age result during navigation, THEN THE Dashboard_Layout SHALL display the Expiry_Toast and redirect the user to `/login`.
3. WHILE a valid session exists, THE Dashboard_Layout SHALL render the dashboard content without interruption.
4. THE Dashboard_Layout SHALL perform the session check before rendering protected page content on each navigation event.

---

### Requirement 4: Session Expiry User Notification

**User Story:** As a member, I want to see a clear message when my session expires, so that I understand why I was redirected to the login page.

#### Acceptance Criteria

1. WHEN a session expiry redirect is triggered, THE Expiry_Toast SHALL display the message "Your session has expired. Please log in again." before the redirect completes.
2. THE Expiry_Toast SHALL be visible for a minimum of 3 seconds to ensure the user can read it.
3. THE Expiry_Toast SHALL be visually distinct from standard error messages, using a warning or info style.
4. WHERE the application supports multiple languages, THE Expiry_Toast message SHALL be rendered using the i18n translation system.

---

### Requirement 5: Configurable Session Max Age

**User Story:** As a developer, I want the session max age to be defined in a single configuration constant, so that it can be adjusted without hunting through multiple files.

#### Acceptance Criteria

1. THE Session_Validator SHALL read SESSION_MAX_AGE from a single exported configuration constant.
2. THE SESSION_MAX_AGE constant SHALL default to 28800 seconds (8 hours).
3. THE SESSION_MAX_AGE constant SHALL be defined within the acceptable range of 21600–43200 seconds (6–12 hours).
4. WHEN SESSION_MAX_AGE is changed in the configuration, THE Session_Validator SHALL apply the new value without requiring changes to any other file.

---

### Requirement 6: Admin Session Enforcement

**User Story:** As an admin, I want my session to be subject to the same expiry enforcement as member sessions, so that stale admin tokens do not remain active indefinitely.

#### Acceptance Criteria

1. WHEN the Admin_Layout mounts or the current pathname changes (excluding `/admin/login`), THE Admin_Layout SHALL invoke the Session_Validator against the token stored in the Admin_Store.
2. IF the Session_Validator returns an expired or exceeded-max-age result for an admin token, THEN THE Admin_Layout SHALL clear the Admin_Store state, display the Expiry_Toast, and redirect the user to `/admin/login`.
3. THE Admin_Layout SHALL use the same SESSION_MAX_AGE constant and Session_Validator utility as the member Dashboard_Layout.
4. WHILE a valid admin session exists, THE Admin_Layout SHALL render the admin content without interruption.

---

### Requirement 7: Session Timer Reset After Login

**User Story:** As a member or admin, I want my session timer to reset when I log in, so that a fresh login always grants a full session window.

#### Acceptance Criteria

1. WHEN a member successfully completes OTP verification, THE Auth_Store SHALL store the newly issued JWT, and the Session_Validator SHALL classify the new token as valid (not expired, not exceeded-max-age).
2. WHEN an admin successfully completes password-based login, THE Admin_Store SHALL store the newly issued JWT, and the Session_Validator SHALL classify the new token as valid.
3. THE Session_Validator SHALL evaluate the new token's `iat` claim as the start of the session window, effectively resetting the session timer.

---

### Requirement 8: Backend Admin JWT Expiry Alignment

**User Story:** As a security-conscious operator, I want the backend admin JWT expiry to match the frontend session max age, so that a token cannot be reused after the frontend has invalidated it.

#### Acceptance Criteria

1. THE Admin_Service SHALL issue admin JWTs with an `expiresIn` value of `'8h'`.
2. WHEN an admin JWT is issued, the `exp` claim SHALL equal the `iat` claim plus 28800 seconds (8 hours).
3. THE Admin_Service SHALL NOT issue admin JWTs with an `expiresIn` value greater than `'8h'`.
