# Design Document

## Overview

This design addresses three critical issues in the MenoDAO platform:

1. **Cookie-Based User Tracking**: Implement browser-based tracking to personalize the sign-up/login experience without requiring phone number lookups
2. **Payment Frequency Visibility**: Ensure the annual payment option is properly displayed and integrated into the checkout flow
3. **Admin Authentication Persistence**: Fix token storage and transmission issues causing 401 errors in the admin dashboard

The solution involves creating a cookie management service, updating the login flow to use cookie-based state, ensuring the PaymentFrequencySelector is properly integrated, and fixing admin token persistence in the admin store and API client.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Cookie Service  │◄────────┤  Cookie Banner   │          │
│  └────────┬─────────┘         └──────────────────┘          │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Login Page     │         │  Payment Page    │          │
│  │  (User Tracking) │         │  (Frequency)     │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Admin Dashboard │◄────────┤  Admin Store     │          │
│  │                  │         │  (Token Persist) │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ AdminAuthGuard   │◄────────┤  Admin Service   │          │
│  │ (Token Verify)   │         │                  │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Cookie Tracking Flow:**

```
User Visit → Check Cookie → Cookie Exists?
                              ├─ Yes → Read State → Personalize UI
                              └─ No  → Create Cookie → Default UI
```

**Admin Authentication Flow:**

```
Admin Login → Store Token → API Request → Include Token → Verify → Success
                ↓                                           ↓
           Persist Store                                  Fail → Refresh
```

## Components and Interfaces

### 1. Cookie Service

**Location**: `🖥️ menodao-frontend/src/lib/cookie-service.ts`

**Purpose**: Centralized cookie management for both tracking and consent

**Interface**:

```typescript
interface CookieOptions {
  expires?: number; // Days until expiration
  path?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

interface UserTrackingData {
  userId?: string;
  firstVisit: string; // ISO timestamp
  lastVisit: string; // ISO timestamp
  isRegistered: boolean;
  hasDeletedAccount: boolean;
}

interface CookieConsentData {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string; // ISO timestamp
}

class CookieService {
  // Core operations
  set(name: string, value: string, options?: CookieOptions): void;
  get(name: string): string | null;
  remove(name: string): void;
  exists(name: string): boolean;

  // Tracking operations
  getTrackingData(): UserTrackingData | null;
  setTrackingData(data: UserTrackingData): void;
  updateLastVisit(): void;
  markAsRegistered(userId: string): void;
  markAccountDeleted(): void;

  // Consent operations
  getConsent(): CookieConsentData | null;
  setConsent(consent: CookieConsentData): void;
  hasConsent(): boolean;
}
```

**Implementation Notes**:

- Use `document.cookie` API for client-side operations
- Encode/decode values using `encodeURIComponent`/`decodeURIComponent`
- Default expiration: 365 days for tracking, 365 days for consent
- Cookie names: `menodao_tracking`, `menodao_consent`

### 2. Cookie Banner Component

**Location**: `🖥️ menodao-frontend/src/components/CookieBanner.tsx`

**Purpose**: GDPR-compliant consent interface

**Interface**:

```typescript
interface CookieBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieBanner({
  onAccept,
  onDecline,
}: CookieBannerProps): JSX.Element;
```

**UI Requirements**:

- Fixed position at bottom of screen
- Clear explanation of cookie usage
- Two buttons: "Accept All" and "Essential Only"
- Link to privacy policy
- Dismissible after choice
- Accessible (ARIA labels, keyboard navigation)

**Behavior**:

- Show only if no consent cookie exists
- On "Accept All": Set all consent flags to true
- On "Essential Only": Set only essential to true
- Store consent and hide banner
- Call optional callbacks

### 3. Updated Login Page

**Location**: `🖥️ menodao-frontend/src/app/login/page.tsx`

**Changes Required**:

1. Import and use CookieService
2. Check tracking cookie on mount
3. Display contextual welcome message based on cookie state
4. Update tracking cookie after successful login
5. Add CookieBanner component

**Welcome Message Logic**:

```typescript
function getWelcomeMessage(trackingData: UserTrackingData | null): string {
  if (!trackingData) {
    return "Welcome to MenoDAO";
  }
  if (trackingData.hasDeletedAccount) {
    return "Welcome Back - Ready to rejoin?";
  }
  if (trackingData.isRegistered) {
    return "Welcome Back";
  }
  return "Welcome to MenoDAO";
}
```

### 4. Payment Page Integration

**Location**: `🖥️ menodao-frontend/src/app/payment/page.tsx`

**Current Issue**: PaymentFrequencySelector component exists but may not be properly integrated into the payment flow

**Required Changes**:

1. Ensure PaymentFrequencySelector is rendered on payment page
2. Pass selected frequency to payment initiation
3. Store selected frequency in subscription data
4. Display frequency in confirmation

**Integration Pattern**:

```typescript
const [selectedFrequency, setSelectedFrequency] = useState<'MONTHLY' | 'ANNUAL' | null>(null);
const [selectedAmount, setSelectedAmount] = useState<number>(0);

const handleFrequencySelect = (frequency: 'MONTHLY' | 'ANNUAL', amount: number) => {
  setSelectedFrequency(frequency);
  setSelectedAmount(amount);
};

// In render:
<PaymentFrequencySelector
  tier={selectedTier}
  monthlyPrice={monthlyPrice}
  onSelect={handleFrequencySelect}
/>
```

### 5. Admin Store Enhancement

**Location**: `🖥️ menodao-frontend/src/lib/admin-store.ts`

**Current Issue**: Token is stored but may not be properly used in API requests

**Required Changes**:

1. Ensure token is persisted to localStorage via zustand persist middleware (already configured)
2. Add token getter for use in API client
3. Add token refresh mechanism

**Enhanced Interface**:

```typescript
interface AdminAuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (admin: Admin, token: string) => void;
  logout: () => void;
  getToken: () => string | null; // NEW
  refreshToken: () => Promise<void>; // NEW
}
```

### 6. Admin API Client

**Location**: `🖥️ menodao-frontend/src/lib/admin-api.ts`

**Current Issue**: May not be including admin token in requests

**Required Changes**:

1. Read token from admin store
2. Include token in Authorization header for all requests
3. Handle 401 errors with token refresh attempt
4. Redirect to login on auth failure

**Implementation Pattern**:

```typescript
class AdminApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = useAdminStore.getState().token;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      try {
        await useAdminStore.getState().refreshToken();
        // Retry request with new token
        return this.request<T>(endpoint, options);
      } catch {
        // Refresh failed, logout and redirect
        useAdminStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
        throw new Error("Authentication failed");
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
```

### 7. Backend Admin Auth Guard

**Location**: `⚙️ menodao-backend/src/admin/guards/admin-auth.guard.ts`

**Current State**: Already properly configured with JWT verification

**Verification Needed**:

- Ensure JWT_SECRET is set in environment
- Verify token payload structure matches expectations
- Confirm AdminService.validateAdminToken works correctly

**No changes required** - the guard is already properly implemented.

## Data Models

### Cookie Data Structures

**Tracking Cookie** (`menodao_tracking`):

```json
{
  "userId": "uuid-string",
  "firstVisit": "2024-01-15T10:30:00Z",
  "lastVisit": "2024-03-04T14:22:00Z",
  "isRegistered": true,
  "hasDeletedAccount": false
}
```

**Consent Cookie** (`menodao_consent`):

```json
{
  "essential": true,
  "analytics": true,
  "marketing": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Payment Frequency Data

**Subscription Model Extension**:

```typescript
interface Subscription {
  id: string;
  tier: "BRONZE" | "SILVER" | "GOLD";
  paymentFrequency: "MONTHLY" | "ANNUAL"; // NEW FIELD
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  benefits?: string[];
}
```

### Admin Token Payload

```typescript
interface AdminTokenPayload {
  sub: string; // Admin ID
  type: "admin";
  username: string;
  iat: number;
  exp: number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Cookie Tracking Properties

Property 1: Cookie reading consistency
_For any_ valid tracking cookie data, reading the cookie should return the same data structure that was written
**Validates: Requirements 1.2**

Property 2: Registration state transition
_For any_ user state, completing sign-up should update the tracking cookie to set isRegistered to true
**Validates: Requirements 1.3**

Property 3: Account deletion preserves tracking
_For any_ registered user, deleting their account should preserve the tracking cookie and set hasDeletedAccount to true
**Validates: Requirements 1.4**

Property 4: Tracking cookie structure completeness
_For any_ tracking cookie created by the system, it should contain all required fields: userId, firstVisit, lastVisit, isRegistered, and hasDeletedAccount
**Validates: Requirements 1.5**

Property 5: Cookie expiration configuration
_For any_ tracking cookie set by the Cookie_Service, it should have an expiration date of 365 days from creation
**Validates: Requirements 1.6**

Property 6: Missing cookie fallback behavior
_For any_ state where tracking cookies are missing, expired, or invalid, the system should treat the user as a new visitor
**Validates: Requirements 1.7**

### Cookie Consent Properties

Property 7: Consent acceptance stores decision
_For any_ cookie banner state, accepting cookies should store the consent decision with all flags set to true and hide the banner
**Validates: Requirements 2.5**

Property 8: Consent decline limits cookies
_For any_ cookie banner state, declining cookies should store consent with only essential set to true and hide the banner
**Validates: Requirements 2.6**

Property 9: Non-essential cookies require consent
_For any_ non-essential cookie, it should only be set if consent has been granted
**Validates: Requirements 2.8**

Property 10: Consent prevents banner redisplay
_For any_ page load where consent cookie exists, the cookie banner should not be displayed
**Validates: Requirements 2.9**

### Welcome Message Properties

Property 11: Cookie unavailable shows neutral message
_For any_ error state or missing cookie scenario, the system should display neutral welcome messaging
**Validates: Requirements 3.5**

### Payment Frequency Properties

Property 12: Annual selection displays cost breakdown
_For any_ annual payment option selection, the system should display both the total annual cost and the per-month equivalent
**Validates: Requirements 4.4**

Property 13: Payment frequency persistence
_For any_ selected payment frequency, it should remain selected and accessible throughout the checkout flow
**Validates: Requirements 4.6**

### Admin Authentication Properties

Property 14: Admin login persists token
_For any_ successful admin login, the authentication token should be stored in persistent browser storage
**Validates: Requirements 5.1**

Property 15: API requests include token
_For any_ authenticated admin API request, the Authorization header should include the admin token
**Validates: Requirements 5.2, 5.5**

Property 16: Token expiration triggers refresh
_For any_ expired admin token, the system should attempt to refresh it automatically before failing the request
**Validates: Requirements 5.3**

Property 17: Failed refresh redirects to login
_For any_ failed token refresh attempt, the system should redirect the admin to the login page with an error message
**Validates: Requirements 5.4**

Property 18: Session restoration from storage
_For any_ valid admin token in persistent storage, reopening the browser should restore the authenticated session
**Validates: Requirements 5.6**

### Admin Dashboard Properties

Property 19: Authenticated requests succeed
_For any_ authenticated admin request to protected endpoints (metrics, users, clinics, payments), the system should return data without 401 errors
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 20: Invalid token returns 401
_For any_ API request with an invalid or missing admin token, the system should return a 401 error with a clear error message
**Validates: Requirements 6.6**

Property 21: Authentication failures are logged
_For any_ authentication failure, the system should create a log entry for security monitoring
**Validates: Requirements 6.7**

### Cookie Service Properties

Property 22: Cookie encoding round-trip
_For any_ cookie value, encoding then decoding should return the original value
**Validates: Requirements 7.5**

Property 23: Cookie expiration handling
_For any_ cookie set with an expiration date, the Cookie_Service should correctly set the expires attribute
**Validates: Requirements 7.2**

Property 24: Secure cookie flags
_For any_ cookie that requires security (tracking, consent), the Cookie_Service should set appropriate secure and sameSite flags
**Validates: Requirements 7.3**

Property 25: Cross-context consistency
_For any_ cookie operation (set, get, delete), it should work identically in both Landing_Page and Frontend_App contexts
**Validates: Requirements 7.6**

## Error Handling

### Cookie Service Errors

**Invalid Cookie Data**:

- Gracefully handle malformed cookie strings
- Return null for corrupted data
- Log parsing errors for debugging
- Never throw exceptions that break the UI

**Storage Quota Exceeded**:

- Catch QuotaExceededError
- Fall back to session-only storage
- Notify user if persistent storage fails

**Cross-Domain Issues**:

- Ensure cookies work across subdomains (app.menodao.org, menodao.org)
- Set domain attribute appropriately
- Handle third-party cookie blocking

### Admin Authentication Errors

**Token Expiration**:

- Detect 401 responses
- Attempt automatic token refresh
- Show user-friendly message if refresh fails
- Redirect to login page

**Network Failures**:

- Retry failed requests (max 3 attempts)
- Show offline indicator
- Queue requests when offline
- Sync when connection restored

**Invalid Credentials**:

- Clear stored token
- Show specific error message
- Prevent brute force with rate limiting
- Log failed attempts

### Payment Frequency Errors

**Missing Component**:

- Verify PaymentFrequencySelector is rendered
- Show error if component fails to load
- Provide fallback to monthly option

**State Persistence Failure**:

- Validate frequency selection before checkout
- Prevent checkout if no frequency selected
- Store selection in multiple places (state + localStorage)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:

- Specific examples of cookie operations
- UI component rendering (CookieBanner, PaymentFrequencySelector)
- Integration between components
- Edge cases (expired cookies, missing data, network errors)
- Admin authentication flow steps

**Property-Based Tests** focus on:

- Universal properties across all cookie values
- Token persistence and transmission
- State transitions (registration, deletion, consent)
- Round-trip operations (encoding/decoding)
- Cross-context consistency

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:

- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: authentication-and-ux-fixes, Property {number}: {property_text}`

**Example Property Test**:

```typescript
// Feature: authentication-and-ux-fixes, Property 22: Cookie encoding round-trip
test("cookie encoding round-trip", () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.uuid(),
        firstVisit: fc.date().map((d) => d.toISOString()),
        lastVisit: fc.date().map((d) => d.toISOString()),
        isRegistered: fc.boolean(),
        hasDeletedAccount: fc.boolean(),
      }),
      (trackingData) => {
        const cookieService = new CookieService();
        cookieService.setTrackingData(trackingData);
        const retrieved = cookieService.getTrackingData();
        expect(retrieved).toEqual(trackingData);
      },
    ),
    { numRuns: 100 },
  );
});
```

### Unit Testing Examples

**Cookie Banner Tests**:

- Renders with accept and decline buttons
- Hides after accept is clicked
- Stores consent correctly
- Includes privacy policy link
- Accessible keyboard navigation

**Login Page Tests**:

- Shows correct welcome message for new users
- Shows "Welcome Back" for returning users
- Shows re-registration message for deleted accounts
- Updates tracking cookie after login
- Handles missing cookie gracefully

**Payment Frequency Tests**:

- Renders both monthly and annual options
- Shows correct waiting periods
- Displays cost breakdown
- Persists selection through navigation
- Handles selection changes

**Admin Authentication Tests**:

- Stores token on login
- Includes token in API requests
- Refreshes expired tokens
- Redirects on auth failure
- Restores session from storage

### Integration Testing

**End-to-End Flows**:

1. First-time user journey (no cookies → consent → login → tracking)
2. Returning user journey (existing cookies → personalized welcome)
3. Payment flow (frequency selection → checkout → confirmation)
4. Admin dashboard (login → navigate tabs → data loads correctly)

**Cross-Browser Testing**:

- Test cookie operations in Chrome, Firefox, Safari, Edge
- Verify localStorage persistence
- Check third-party cookie blocking scenarios

### Manual Testing Checklist

- [ ] Cookie banner appears on first visit to landing page
- [ ] Cookie banner appears on first visit to frontend app
- [ ] Accepting cookies stores consent and hides banner
- [ ] Declining cookies stores essential-only consent
- [ ] New user sees "Welcome to MenoDAO"
- [ ] Returning user sees "Welcome Back"
- [ ] Deleted account user sees re-registration message
- [ ] Payment page shows both monthly and annual options
- [ ] Annual option shows 14-day waiting period
- [ ] Monthly option shows 60-90 day waiting period
- [ ] Selected frequency persists through checkout
- [ ] Admin login stores token in localStorage
- [ ] Admin dashboard tabs load without 401 errors
- [ ] Admin token persists after browser close/reopen
- [ ] Expired admin token triggers refresh
- [ ] Failed refresh redirects to login

## Implementation Notes

### Cookie Security Considerations

**SameSite Attribute**:

- Use `SameSite=Lax` for tracking cookies (allows navigation)
- Use `SameSite=Strict` for authentication tokens (prevents CSRF)

**Secure Flag**:

- Always set `Secure=true` in production (HTTPS only)
- Allow `Secure=false` in local development

**HttpOnly Flag**:

- Do NOT use HttpOnly for client-side cookies (JavaScript needs access)
- Consider HttpOnly for sensitive auth cookies if server-side rendering

### Performance Considerations

**Cookie Size**:

- Keep tracking cookie under 1KB
- Minimize data stored in cookies
- Use compression for large data structures

**Read Performance**:

- Cache cookie reads in memory
- Avoid repeated document.cookie parsing
- Use memoization for expensive operations

### Browser Compatibility

**Supported Browsers**:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Fallbacks**:

- Detect cookie support on page load
- Show warning if cookies disabled
- Provide alternative authentication methods

### Deployment Considerations

**Environment Variables**:

- `NEXT_PUBLIC_COOKIE_DOMAIN`: Domain for cookie scope
- `NEXT_PUBLIC_SECURE_COOKIES`: Enable secure flag in production

**Migration Strategy**:

1. Deploy cookie service and banner (no breaking changes)
2. Update login page to use cookie tracking
3. Update payment page to show frequency selector
4. Fix admin authentication token handling
5. Monitor error logs for issues
6. Gradually roll out to all users

**Rollback Plan**:

- Cookie service is additive (no breaking changes)
- Can disable cookie tracking via feature flag
- Admin auth fix is backward compatible
- Payment frequency is UI-only change
