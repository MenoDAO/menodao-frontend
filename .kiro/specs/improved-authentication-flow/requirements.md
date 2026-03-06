# Requirements Document

## Introduction

This specification defines an improved authentication flow for the MenoDAO application that distinguishes between new user signup and returning user login. The current implementation shows "Welcome Back" to all users regardless of their status, creating confusion for new users. This enhancement will provide distinct user experiences for signup versus login, include legal compliance through terms and conditions acceptance, and ensure a smooth, intuitive flow for both user types.

## Glossary

- **Authentication_System**: The backend service responsible for user authentication, OTP generation, and user state management
- **Frontend_App**: The Next.js TypeScript application that presents the user interface
- **New_User**: A user whose phone number does not exist in the system database
- **Returning_User**: A user whose phone number exists in the system database
- **OTP**: One-Time Password sent via SMS for phone number verification
- **User_Profile**: User data including full name, location, and phone number
- **Terms_And_Conditions**: Legal agreement that users must accept before creating an account

## Requirements

### Requirement 1: User Status Detection

**User Story:** As a system, I want to detect whether a user is new or returning before showing the main authentication screen, so that I can provide the appropriate signup or login experience.

#### Acceptance Criteria

1. WHEN a phone number is submitted, THE Authentication_System SHALL query the database to determine if the phone number exists
2. WHEN the phone number exists in the database, THE Authentication_System SHALL return a status indicating "returning user"
3. WHEN the phone number does not exist in the database, THE Authentication_System SHALL return a status indicating "new user"
4. THE Authentication_System SHALL respond to status queries within 500ms
5. WHEN the database query fails, THE Authentication_System SHALL return an error status and log the failure

### Requirement 2: New User Signup Flow

**User Story:** As a new user, I want to see a signup form that collects my information and requires terms acceptance, so that I feel like I'm joining something real and genuine.

#### Acceptance Criteria

1. WHEN a new user is detected, THE Frontend_App SHALL display a "Join MenoDAO" signup screen
2. THE Frontend_App SHALL display input fields for full name, location, and phone number on the signup screen
3. THE Frontend_App SHALL display a terms and conditions checkbox on the signup screen
4. WHEN the terms checkbox is not checked, THE Frontend_App SHALL prevent form submission
5. WHEN all required fields are filled and terms are accepted, THE Frontend_App SHALL enable the submit button
6. WHEN the signup form is submitted, THE Authentication_System SHALL generate and send an OTP to the provided phone number
7. WHEN the OTP is sent successfully, THE Frontend_App SHALL navigate to the OTP verification screen
8. WHEN the OTP is verified successfully, THE Authentication_System SHALL create a new user record with the provided profile information

### Requirement 3: Returning User Login Flow

**User Story:** As a returning user, I want to see a simple login screen that only asks for my phone number, so that I can quickly access my account without re-entering my profile information.

#### Acceptance Criteria

1. WHEN a returning user is detected, THE Frontend_App SHALL display a "Welcome Back" login screen
2. THE Frontend_App SHALL display only a phone number input field on the login screen
3. THE Frontend_App SHALL NOT display full name, location, or terms and conditions fields for returning users
4. WHEN the phone number is submitted, THE Authentication_System SHALL generate and send an OTP to the phone number
5. WHEN the OTP is sent successfully, THE Frontend_App SHALL navigate to the OTP verification screen
6. WHEN the OTP is verified successfully, THE Authentication_System SHALL authenticate the user without collecting additional profile information

### Requirement 4: OTP Verification

**User Story:** As a user, I want to verify my phone number with an OTP code, so that the system can confirm my identity securely.

#### Acceptance Criteria

1. WHEN the OTP verification screen is displayed, THE Frontend_App SHALL show an input field for the OTP code
2. WHEN an OTP code is submitted, THE Authentication_System SHALL validate the code against the generated OTP
3. WHEN the OTP is valid and not expired, THE Authentication_System SHALL mark the verification as successful
4. WHEN the OTP is invalid or expired, THE Authentication_System SHALL return an error message
5. THE Authentication_System SHALL expire OTP codes after 10 minutes
6. WHEN OTP verification fails, THE Frontend_App SHALL display the error message and allow retry

### Requirement 5: Terms and Conditions Compliance

**User Story:** As a system administrator, I want new users to explicitly accept terms and conditions, so that the application maintains legal compliance.

#### Acceptance Criteria

1. THE Frontend_App SHALL display the full terms and conditions text or a link to view them
2. WHEN a user attempts to submit the signup form without accepting terms, THE Frontend_App SHALL display a validation error
3. WHEN a user accepts terms and completes signup, THE Authentication_System SHALL record the acceptance timestamp
4. THE Authentication_System SHALL store the terms acceptance status with the user record
5. WHEN querying user data, THE Authentication_System SHALL include the terms acceptance status and timestamp

### Requirement 6: User Experience and Navigation

**User Story:** As a user, I want clear visual distinction between signup and login screens, so that I understand which flow I'm in.

#### Acceptance Criteria

1. THE Frontend_App SHALL display "Join MenoDAO" as the heading for new user signup
2. THE Frontend_App SHALL display "Welcome Back" as the heading for returning user login
3. WHEN on the signup screen, THE Frontend_App SHALL use welcoming, inclusive language
4. WHEN on the login screen, THE Frontend_App SHALL use familiar, returning-user language
5. THE Frontend_App SHALL maintain consistent styling and branding across both flows

### Requirement 7: Error Handling and Edge Cases

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know how to proceed.

#### Acceptance Criteria

1. WHEN the phone number format is invalid, THE Frontend_App SHALL display a validation error before submission
2. WHEN the OTP sending fails, THE Authentication_System SHALL return a descriptive error message
3. WHEN the database is unavailable, THE Authentication_System SHALL return a service unavailable error
4. WHEN network errors occur, THE Frontend_App SHALL display a user-friendly error message with retry options
5. THE Frontend_App SHALL log all authentication errors for debugging purposes
