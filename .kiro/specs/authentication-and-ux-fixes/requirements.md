# Requirements Document

## Introduction

This specification addresses critical UX and authentication issues in the MenoDAO platform that impact user experience and system functionality. The issues span three main areas: sign-up/login flow personalization, payment option visibility, and admin dashboard authentication. These problems affect both new and returning users, as well as administrative operations.

## Glossary

- **System**: The MenoDAO platform (frontend and backend)
- **User**: A member or potential member of MenoDAO
- **Admin**: A platform administrator with elevated privileges
- **Cookie_Tracker**: Browser-based storage mechanism for user state
- **Auth_Token**: JWT token used for authentication
- **Payment_Frequency**: Monthly or annual subscription billing cycle
- **Cookie_Banner**: GDPR-compliant consent interface
- **Admin_Dashboard**: Administrative interface for platform management
- **Landing_Page**: Public-facing marketing website
- **Frontend_App**: Authenticated member application

## Requirements

### Requirement 1: Cookie-Based User Tracking

**User Story:** As a product manager, I want to track user state via cookies, so that we can personalize messaging and improve the sign-up/login experience.

#### Acceptance Criteria

1. WHEN a user visits the platform for the first time, THE System SHALL create a tracking cookie with a unique identifier
2. WHEN a user returns to the platform, THE System SHALL read the tracking cookie to determine user history
3. WHEN a user completes sign-up, THE System SHALL update the tracking cookie to mark them as a registered user
4. WHEN a user deletes their account, THE System SHALL preserve the tracking cookie to recognize them as a returning user
5. THE Cookie_Tracker SHALL store user state including: first visit timestamp, registration status, and last visit timestamp
6. THE Cookie_Tracker SHALL expire after 365 days of inactivity
7. WHEN cookie data is unavailable or expired, THE System SHALL treat the user as a new visitor

### Requirement 2: GDPR-Compliant Cookie Consent

**User Story:** As a compliance officer, I want GDPR-compliant cookie consent banners, so that we meet legal requirements for data privacy.

#### Acceptance Criteria

1. WHEN a user visits the Landing_Page without prior consent, THE System SHALL display a cookie consent banner
2. WHEN a user visits the Frontend_App without prior consent, THE System SHALL display a cookie consent banner
3. THE Cookie_Banner SHALL clearly explain what cookies are used and why
4. THE Cookie_Banner SHALL provide options to accept or decline non-essential cookies
5. WHEN a user accepts cookies, THE System SHALL store the consent decision and hide the banner
6. WHEN a user declines cookies, THE System SHALL only use essential cookies and hide the banner
7. THE Cookie_Banner SHALL include a link to the privacy policy
8. THE System SHALL not set non-essential cookies until consent is granted
9. WHEN a user has previously provided consent, THE System SHALL not display the banner again

### Requirement 3: Contextual Welcome Messaging

**User Story:** As a user, I want to see appropriate welcome messages based on my history, so that the experience feels personalized and accurate.

#### Acceptance Criteria

1. WHEN a new user (no tracking cookie) visits the login page, THE System SHALL display "Welcome to MenoDAO" messaging
2. WHEN a returning user (has tracking cookie, previously registered) visits the login page, THE System SHALL display "Welcome Back" messaging
3. WHEN a user who deleted their account returns, THE System SHALL display "Welcome Back" messaging with a note about re-registration
4. THE System SHALL not require phone number lookup to determine user status for messaging purposes
5. WHEN cookie tracking is unavailable, THE System SHALL default to neutral welcome messaging

### Requirement 4: Annual Payment Option Visibility

**User Story:** As a user, I want to see and select the annual payment option during checkout, so that I can choose the plan that best fits my needs.

#### Acceptance Criteria

1. WHEN a user reaches the payment page, THE System SHALL display both monthly and annual payment options
2. THE System SHALL clearly show the annual option includes a 14-day waiting period (vs 60-90 days for monthly)
3. THE System SHALL display a benefits comparison between monthly and annual plans
4. WHEN a user selects the annual option, THE System SHALL show the total annual cost and per-month equivalent
5. THE Payment_Frequency selector SHALL be visible and functional on the payment page
6. THE System SHALL persist the selected payment frequency through the checkout flow

### Requirement 5: Admin Authentication Token Persistence

**User Story:** As an admin, I want my authentication to persist across dashboard tabs, so that I can access all admin features without repeated login errors.

#### Acceptance Criteria

1. WHEN an admin logs in, THE System SHALL store the Auth_Token in persistent browser storage
2. WHEN an admin navigates between dashboard tabs, THE System SHALL include the Auth_Token in all API requests
3. WHEN an Auth_Token expires, THE System SHALL attempt to refresh it automatically
4. IF token refresh fails, THEN THE System SHALL redirect the admin to the login page with an appropriate message
5. THE System SHALL include the Auth_Token in requests to metrics, users, clinics, and payments endpoints
6. WHEN an admin closes and reopens the browser, THE System SHALL restore the authentication session if the token is still valid

### Requirement 6: Admin Dashboard Endpoint Authorization

**User Story:** As an admin, I want all dashboard endpoints to work correctly, so that I can perform administrative tasks without errors.

#### Acceptance Criteria

1. WHEN an authenticated admin requests metrics data, THE System SHALL return the data without 401 errors
2. WHEN an authenticated admin requests user data, THE System SHALL return the data without 401 errors
3. WHEN an authenticated admin requests clinic data, THE System SHALL return the data without 401 errors
4. WHEN an authenticated admin requests payment data, THE System SHALL return the data without 401 errors
5. THE Admin_Dashboard SHALL validate tokens using the AdminAuthGuard on all protected endpoints
6. WHEN a token is invalid or missing, THE System SHALL return a 401 error with a clear error message
7. THE System SHALL log authentication failures for security monitoring

### Requirement 7: Cookie Storage Service

**User Story:** As a developer, I want a centralized cookie management service, so that cookie operations are consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL provide a Cookie_Service for reading and writing cookies
2. THE Cookie_Service SHALL handle cookie expiration dates
3. THE Cookie_Service SHALL support secure and httpOnly cookie flags where appropriate
4. THE Cookie_Service SHALL provide methods for: setting cookies, reading cookies, deleting cookies, and checking cookie existence
5. THE Cookie_Service SHALL handle cookie encoding and decoding
6. THE Cookie_Service SHALL work consistently across both Landing_Page and Frontend_App
