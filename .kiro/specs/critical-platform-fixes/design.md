# Design Document

## Overview

This design addresses four critical production issues in the MenoDAO platform:

1. Admin payments tab causing unexpected logout
2. Payment amount verification for production environment
3. Incorrect claim limit displays across the platform
4. Separation of signup and login user flows

The fixes focus on debugging authentication state management, validating payment configuration, correcting claim limit constants, and implementing distinct authentication flows for new and returning users.

## Architecture

### Component Overview

The fixes span multiple architectural layers:

**Frontend Components:**

- Admin payments tab component (bug fix)
- Payment checkout flow (amount verification)
- Member dashboard (claim limit display)
- Staff check-in interface (claim limit display)
- New signup page component
- Updated login page component
- OTP verification component (shared)

**Backend Services:**

- Admin service (session management)
- Payment service (amount calculation)
- Subscription service (claim limit logic)
- Authentication service (signup/login flows)
- SMS service (OTP delivery)

**Configuration:**

- Environment-based payment amounts
- Subscription tier claim limits
- Authentication flow routing

## Components and Interfaces

### 1. Admin Payments Tab Fix

**Problem Analysis:**
The payments tab triggers logout after receiving payment data. This suggests:

- Authentication token being cleared on response
- Error handler incorrectly triggering logout
- Session state being reset during data processing

**Solution Approach:**

- Add comprehensive logging to track authentication state changes
- Review error handling in payment data fetching
- Ensure response handlers don't modify authentication state
- Add defensive checks to preserve session tokens

**Component Changes:**

```typescript
// Admin payments component
interface PaymentTabProps {
  onDataLoad: (data: PaymentData[]) => void;
  onError: (error: Error) => void;
}

// Ensure authentication state is preserved
const fetchPayments = async () => {
  try {
    const response = await adminApi.getPayments();
    // DO NOT clear auth tokens here
    onDataLoad(response.data);
  } catch (error) {
    // Log error without triggering logout
    console.error("Payment fetch error:", error);
    onError(error);
    // DO NOT call logout() here
  }
};
```

### 2. Payment Amount Verification

**Configuration Structure:**

```typescript
interface PaymentConfig {
  environment: "development" | "production";
  amounts: {
    development: {
      test: number; // 5 KES
    };
    production: {
      MenoBronze: {
        monthly: number; // 550 KES
        yearly: number; // 6600 KES
      };
      MenoSilver: {
        monthly: number; // 1100 KES
        yearly: number; // 13200 KES
      };
      MenoGold: {
        monthly: number; // 2200 KES
        yearly: number; // 26400 KES
      };
    };
  };
}

const PAYMENT_AMOUNTS: PaymentConfig = {
  environment: process.env.NODE_ENV as "development" | "production",
  amounts: {
    development: {
      test: 5,
    },
    production: {
      MenoBronze: {
        monthly: 550,
        yearly: 6600,
      },
      MenoSilver: {
        monthly: 1100,
        yearly: 13200,
      },
      MenoGold: {
        monthly: 2200,
        yearly: 26400,
      },
    },
  },
};
```

**Amount Calculation Logic:**

```typescript
function getPaymentAmount(
  tier: SubscriptionTier,
  frequency: "monthly" | "yearly",
  environment: "development" | "production",
): number {
  if (environment === "development") {
    return PAYMENT_AMOUNTS.amounts.development.test;
  }

  return PAYMENT_AMOUNTS.amounts.production[tier][frequency];
}

function validatePaymentAmount(
  tier: SubscriptionTier,
  frequency: "monthly" | "yearly",
  amount: number,
): boolean {
  const expectedAmount = getPaymentAmount(
    tier,
    frequency,
    PAYMENT_AMOUNTS.environment,
  );
  return amount === expectedAmount;
}
```

### 3. Claim Limit Accuracy

**Claim Limit Constants:**

```typescript
const CLAIM_LIMITS: Record<SubscriptionTier, number> = {
  MenoBronze: 6000,
  MenoSilver: 10000,
  MenoGold: 15000,
};

function getClaimLimit(tier: SubscriptionTier): number {
  return CLAIM_LIMITS[tier];
}
```

**Display Components:**

- Member Dashboard: Use `getClaimLimit(member.tier)`
- Staff Check-in: Use `getClaimLimit(member.tier)`
- Admin Portal: Use `getClaimLimit(member.tier)`
- Reports: Use `getClaimLimit(member.tier)` for calculations

**Implementation Strategy:**

1. Create centralized claim limit utility
2. Replace all hardcoded claim limit values
3. Update database queries that reference claim limits
4. Verify display across all interfaces

### 4. Separate Signup and Login Flows

**Route Structure:**

```
/sign-up  -> New user signup page
/login    -> Returning user login page
/verify   -> OTP verification (shared)
```

**Signup Page (/sign-up):**

```typescript
interface SignupFormData {
  fullName: string;
  location: string;
  phoneNumber: string;
  acceptedTerms: boolean;
}

interface SignupPageProps {
  onSubmit: (data: SignupFormData) => Promise<void>;
}

// Validation rules
const signupValidation = {
  fullName: { required: true, minLength: 2 },
  location: { required: true },
  phoneNumber: { required: true, pattern: /^(\+254|0)[17]\d{8}$/ },
  acceptedTerms: { required: true, mustBeTrue: true },
};
```

**Login Page (/login):**

```typescript
interface LoginFormData {
  phoneNumber: string;
}

interface LoginPageProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  onPhoneNotFound: () => void;
}

// Login flow logic
async function handleLogin(phoneNumber: string) {
  const userExists = await checkUserExists(phoneNumber);

  if (!userExists) {
    throw new UserNotFoundError(
      "Phone number not found. Please sign up instead",
    );
  }

  await sendOTP(phoneNumber);
  navigateToVerification();
}
```

**OTP Verification (Shared):**

```typescript
interface OTPVerificationProps {
  phoneNumber: string;
  flow: "signup" | "login";
  signupData?: SignupFormData; // Only for signup flow
  onSuccess: () => void;
}

async function handleOTPVerification(
  otp: string,
  flow: "signup" | "login",
  phoneNumber: string,
  signupData?: SignupFormData,
) {
  const isValid = await verifyOTP(phoneNumber, otp);

  if (!isValid) {
    throw new InvalidOTPError("Incorrect OTP. Please try again.");
  }

  if (flow === "signup") {
    await createAccount(signupData!);
  }

  await authenticateUser(phoneNumber);
  navigateToDashboard();
}
```

**UI Components:**

Signup Page:

```tsx
<div className="signup-container">
  <h1>Welcome to MenoDAO</h1>
  <p>Please provide the details below to continue</p>

  <form onSubmit={handleSignup}>
    <input name="fullName" placeholder="Full Name" required />
    <input name="location" placeholder="Location" required />
    <input name="phoneNumber" placeholder="Phone Number" required />
    <label>
      <input type="checkbox" name="acceptedTerms" required />I accept the terms
      and conditions
    </label>
    <button type="submit">Continue</button>
  </form>
</div>
```

Login Page:

```tsx
<div className="login-container">
  <h1>Welcome Back</h1>

  <form onSubmit={handleLogin}>
    <input name="phoneNumber" placeholder="Phone Number" required />
    <button type="submit">Continue</button>
  </form>

  {error && (
    <div className="error-message">
      <p>{error}</p>
      <Link href="/sign-up">
        <button>Sign Up</button>
      </Link>
    </div>
  )}
</div>
```

## Data Models

### Signup Data

```typescript
interface SignupData {
  fullName: string;
  location: string;
  phoneNumber: string;
  acceptedTerms: boolean;
  createdAt: Date;
}
```

### Payment Configuration

```typescript
interface PaymentAmount {
  tier: SubscriptionTier;
  frequency: "monthly" | "yearly";
  amount: number;
  environment: "development" | "production";
}
```

### Claim Limit

```typescript
interface ClaimLimitInfo {
  tier: SubscriptionTier;
  limit: number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Admin Session Preservation

Property 1: Authentication state preservation during payment operations
_For any_ admin session and payment data request, loading payment data should not modify authentication tokens or session state
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

Property 2: Error logging without logout
_For any_ authentication error during payment operations, the system should log the error details without clearing authentication state or triggering logout
**Validates: Requirements 1.4**

### Payment Amount Validation

Property 3: Payment amount correctness
_For any_ subscription tier and payment frequency in production environment, the calculated payment amount should match the specified tier pricing (MenoBronze: 550/6600, MenoSilver: 1100/13200, MenoGold: 2200/26400)
**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 4: Development environment test amount
_For any_ payment request in development environment, the payment amount should be KES 5 regardless of tier or frequency
**Validates: Requirements 2.1**

### Claim Limit Accuracy

Property 5: Claim limit display consistency
_For any_ member with a subscription tier, the displayed claim limit across all interfaces (dashboard, staff, admin, reports) should match the tier specification (MenoBronze: 6000, MenoSilver: 10000, MenoGold: 15000)
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Signup Flow Validation

Property 6: Signup form validation
_For any_ signup form submission, the system should reject submissions where any required field (fullName, location, phoneNumber) is empty or terms checkbox is unchecked
**Validates: Requirements 4.3, 4.4**

Property 7: Signup account creation
_For any_ valid signup data and correct OTP, the system should create a new account with the provided details and authenticate the user
**Validates: Requirements 4.5, 4.7**

### Login Flow Validation

Property 8: Non-existent phone number handling
_For any_ phone number that does not exist in the system, the login attempt should display the error message "Phone number not found. Please sign up instead" without sending an OTP
**Validates: Requirements 5.2**

Property 9: Existing phone number OTP sending
_For any_ phone number that exists in the system, the login attempt should send an OTP to that number and navigate to verification
**Validates: Requirements 5.4**

Property 10: Login authentication
_For any_ existing user and correct OTP, the system should authenticate the user and navigate to the dashboard
**Validates: Requirements 5.6**

Property 11: Incorrect OTP handling
_For any_ incorrect OTP entry, the system should display an error message and allow the user to retry without terminating the authentication flow
**Validates: Requirements 5.7**

## Error Handling

### Admin Payments Tab

- Catch all errors during payment data fetching
- Log errors with full context (endpoint, response, auth state)
- Display user-friendly error messages
- Never clear authentication state on error

### Payment Amount Validation

- Validate environment configuration on startup
- Throw error if payment amounts are misconfigured
- Log all payment amount calculations
- Reject checkout if amount validation fails

### Claim Limit Display

- Throw error if tier is not recognized
- Log warning if claim limit is accessed for invalid tier
- Provide fallback display value if calculation fails

### Authentication Flows

- Handle network errors during OTP sending
- Provide clear error messages for validation failures
- Handle OTP verification failures gracefully
- Log all authentication state transitions

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests** focus on:

- Specific payment amount examples for each tier/frequency combination
- Specific claim limit values for each tier
- UI rendering of signup and login pages
- Error message display for specific scenarios
- Navigation flows between pages

**Property-Based Tests** focus on:

- Authentication state preservation across random payment operations
- Payment amount calculation correctness across all tier/frequency combinations
- Claim limit consistency across all interfaces and tiers
- Form validation across random invalid input combinations
- OTP handling across random phone numbers and codes

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**

- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: critical-platform-fixes, Property {N}: {property text}`

**Test Organization:**

```typescript
// Example property test structure
describe("Feature: critical-platform-fixes", () => {
  it("Property 1: Authentication state preservation during payment operations", () => {
    fc.assert(
      fc.property(
        fc.record({
          adminSession: adminSessionArbitrary(),
          paymentData: paymentDataArbitrary(),
        }),
        ({ adminSession, paymentData }) => {
          const initialAuthState = cloneAuthState(adminSession);
          loadPaymentData(paymentData);
          const finalAuthState = getCurrentAuthState();

          expect(finalAuthState).toEqual(initialAuthState);
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

### Test Coverage

**Admin Payments Tab:**

- Unit test: Navigate to payments tab and verify no logout
- Property test: Load random payment data and verify auth state unchanged
- Unit test: Simulate auth error and verify logging without logout

**Payment Amounts:**

- Unit tests: Test each tier/frequency combination in production
- Unit test: Test development environment uses KES 5
- Property test: Validate all tier/frequency combinations produce correct amounts

**Claim Limits:**

- Unit tests: Test each tier displays correct limit
- Property test: Verify claim limit consistency across all interfaces
- Unit test: Test report calculations use correct limits

**Signup Flow:**

- Unit test: Render signup page with correct fields and labels
- Property test: Test form validation with random invalid inputs
- Unit test: Test successful signup creates account
- Unit test: Test OTP verification navigates to dashboard

**Login Flow:**

- Unit test: Render login page with phone field
- Property test: Test non-existent phone numbers show error
- Property test: Test existing phone numbers send OTP
- Unit test: Test correct OTP authenticates user
- Property test: Test incorrect OTPs allow retry
