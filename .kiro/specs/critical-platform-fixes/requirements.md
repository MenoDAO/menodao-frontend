# Requirements Document

## Introduction

This document specifies requirements for critical bug fixes and improvements to the MenoDAO platform. These fixes address production issues affecting admin functionality, payment processing, claim limit accuracy, and user authentication flows.

## Glossary

- **Admin_Portal**: The administrative interface for managing platform operations
- **Payment_System**: The system handling subscription payments and checkout
- **Claim_Limit**: The maximum amount in KES a member can claim based on their subscription tier
- **Member_Dashboard**: The interface where members view their subscription and claim information
- **Staff_Interface**: The interface used by clinic staff for member check-ins and treatment
- **Authentication_System**: The system handling user signup, login, and OTP verification
- **Subscription_Tier**: The membership level (MenoBronze, MenoSilver, MenoGold)
- **OTP**: One-Time Password sent via SMS for authentication
- **Environment**: The deployment context (development, production)

## Requirements

### Requirement 1: Admin Payments Tab Stability

**User Story:** As an admin, I want to view payment data in the payments tab without being logged out, so that I can manage and reconcile payments effectively.

#### Acceptance Criteria

1. WHEN an admin navigates to the payments tab THEN the system SHALL load payment data without triggering logout
2. WHEN the payment endpoint responds with data THEN the system SHALL display the data in the UI without authentication state changes
3. WHEN an admin interacts with payment records THEN the system SHALL maintain the admin session throughout the interaction
4. IF an authentication error occurs THEN the system SHALL log the error details for debugging without forcing logout
5. WHEN payment data is successfully loaded THEN the system SHALL preserve all admin authentication tokens and session state

### Requirement 2: Production Payment Amount Accuracy

**User Story:** As a system administrator, I want payment amounts to be correct in production, so that members are charged the right subscription fees.

#### Acceptance Criteria

1. WHEN the environment is development THEN the Payment_System SHALL use KES 5 for test payments
2. WHEN the environment is production AND subscription tier is MenoBronze AND frequency is monthly THEN the Payment_System SHALL charge KES 550
3. WHEN the environment is production AND subscription tier is MenoBronze AND frequency is yearly THEN the Payment_System SHALL charge KES 6,600
4. WHEN the environment is production AND subscription tier is MenoSilver AND frequency is monthly THEN the Payment_System SHALL charge KES 1,100
5. WHEN the environment is production AND subscription tier is MenoSilver AND frequency is yearly THEN the Payment_System SHALL charge KES 13,200
6. WHEN the environment is production AND subscription tier is MenoGold AND frequency is monthly THEN the Payment_System SHALL charge KES 2,200
7. WHEN the environment is production AND subscription tier is MenoGold AND frequency is yearly THEN the Payment_System SHALL charge KES 26,400
8. WHEN initiating checkout THEN the Payment_System SHALL validate the amount matches the tier and frequency before processing

### Requirement 3: Claim Limit Display Accuracy

**User Story:** As a member, I want to see my correct claim limit on the dashboard, so that I know how much coverage I have available.

#### Acceptance Criteria

1. WHEN a member has MenoBronze subscription THEN the system SHALL display claim limit as KES 6,000
2. WHEN a member has MenoSilver subscription THEN the system SHALL display claim limit as KES 10,000
3. WHEN a member has MenoGold subscription THEN the system SHALL display claim limit as KES 15,000
4. WHEN staff checks in a member THEN the Staff_Interface SHALL display the correct claim limit for that member's tier
5. WHEN admin views member information THEN the Admin_Portal SHALL display the correct claim limit for that member's tier
6. WHEN generating reports THEN the system SHALL use the correct claim limits for calculations and displays

### Requirement 4: Separate Signup and Login Flows

**User Story:** As a new user, I want a dedicated signup page, so that I can create an account with clear instructions and required information.

#### Acceptance Criteria

1. WHEN a user navigates to /sign-up THEN the system SHALL display a signup form with fields for Full Name, Location, and Phone Number
2. WHEN displaying the signup form THEN the system SHALL show the heading "Welcome to MenoDAO" and label "Please provide the details below to continue"
3. WHEN a user submits the signup form THEN the system SHALL require all fields (Full Name, Location, Phone Number) to be filled
4. WHEN a user submits the signup form THEN the system SHALL require the terms and conditions checkbox to be checked
5. WHEN a user successfully submits signup details THEN the system SHALL send an OTP to the provided phone number
6. WHEN the OTP is sent THEN the system SHALL navigate to the OTP verification screen
7. WHEN a user enters the correct OTP on signup flow THEN the system SHALL create a new account with the provided details
8. WHEN account creation is successful THEN the system SHALL authenticate the user and navigate to the dashboard

### Requirement 5: Login Flow for Returning Users

**User Story:** As a returning user, I want to login with my phone number, so that I can access my account quickly.

#### Acceptance Criteria

1. WHEN a user navigates to /login THEN the system SHALL display a login form with a phone number field
2. WHEN a user enters a phone number that does not exist THEN the system SHALL display error message "Phone number not found. Please sign up instead"
3. WHEN displaying the phone not found error THEN the system SHALL show a visible "Sign Up" button that links to /sign-up
4. WHEN a user enters a phone number that exists in the system THEN the system SHALL send an OTP to that phone number
5. WHEN the OTP is sent for login THEN the system SHALL navigate to the OTP verification screen
6. WHEN a user enters the correct OTP on login flow THEN the system SHALL authenticate the user and navigate to the dashboard
7. WHEN a user enters an incorrect OTP THEN the system SHALL display an error message and allow retry
