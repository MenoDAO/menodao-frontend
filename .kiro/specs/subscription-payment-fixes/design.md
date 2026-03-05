# Subscription Payment Fixes - Design

## Architecture Overview

This design addresses three critical bugs in the subscription payment flow:

1. Incorrect upgrade endpoint calls for first-time subscriptions
2. Missing SMS notifications after payment
3. Incorrect upgrade cost calculations for annual subscriptions

## Component Design

### 1. Frontend: Subscription Page Logic

**File:** `🖥️ menodao-frontend/src/app/(dashboard)/dashboard/subscription/page.tsx`

**Current Issue:**

```typescript
const isUpgrade =
  subscription?.isActive && tierOrder[tier] > tierOrder[subscription.tier];

if (isUpgrade) {
  await api.upgrade(tier); // ❌ Called even for inactive subscriptions
}
```

**Fixed Logic:**

```typescript
// Only call upgrade if:
// 1. User has an ACTIVE subscription
// 2. AND is selecting a HIGHER tier
const hasActiveSubscription = subscription?.isActive === true;
const isSelectingHigherTier =
  subscription && tierOrder[tier] > tierOrder[subscription.tier];
const isUpgrade = hasActiveSubscription && isSelectingHigherTier;

if (isUpgrade) {
  // This is a true upgrade - call upgrade endpoint to validate
  try {
    await api.upgrade(tier);
    setSelectedTier(tier);
    setIsPaymentDialogOpen(true);
  } catch (error) {
    alert((error as Error).message);
  }
} else {
  // First subscription or reactivation - just open payment dialog
  setSelectedTier(tier);
  setIsPaymentDialogOpen(true);
}
```

**Key Changes:**

- Explicit check for `isActive === true` (not just truthy)
- Separate variables for clarity
- Only call upgrade endpoint when truly upgrading an active subscription

### 2. Backend: SMS Notifications

**File:** `⚙️ menodao-backend/src/payments/payment.service.ts`

**Current State:**

- SMS is sent for upgrades (lines 200-220)
- SMS is NOT sent for new subscriptions

**Solution:**
Add SMS notification in the "new subscription" branch of the payment callback:

```typescript
// After activating new subscription (around line 230)
if (subscription && !subscription.isActive) {
  // Activate the subscription
  await this.prisma.subscription.update({
    where: { memberId: contribution.memberId },
    data: { isActive: true },
  });

  // Send SMS notification for new subscription
  try {
    const waitingDays = subscription.paymentFrequency === "ANNUAL" ? 14 : 60;
    const eligibleDate = new Date(
      Date.now() + waitingDays * 24 * 60 * 60 * 1000,
    );
    const formattedDate = eligibleDate.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const tierName = `Meno${subscription.tier.charAt(0) + subscription.tier.slice(1).toLowerCase()}`;
    const message = `Welcome to MenoDAO! Your ${tierName} subscription is now active. You can start making claims on ${formattedDate} (${waitingDays} days waiting period). Visit your dashboard to explore your benefits. Thank you for joining us!`;

    await this.smsService.sendSMS(subscription.member.phoneNumber, message);
    this.logger.log(
      `[SMS] Welcome notification sent to ${subscription.member.phoneNumber}`,
    );
  } catch (smsError) {
    this.logger.error(
      `[SMS] Failed to send welcome notification: ${smsError.message}`,
    );
    // Don't fail the payment callback if SMS fails
  }
}
```

**Key Points:**

- Non-blocking: SMS failures don't affect payment completion
- Includes waiting period information
- Uses correct tier name format (MenoBronze, MenoSilver, MenoGold)
- Logs success and failures for monitoring

### 3. Backend: Upgrade Cost Calculation

**File:** `⚙️ menodao-backend/src/subscriptions/subscriptions.service.ts`

**Current Issue:**
The upgrade method correctly reads `paymentFrequency` from the subscription (line 380), but the issue is that existing subscriptions may have `paymentFrequency` set to `MONTHLY` by default even if the user selected annual.

**Root Cause:**
The subscription is created BEFORE the user selects payment frequency in the dialog. The frequency selection happens in the PaymentDialog, but the subscription was already created with default `MONTHLY`.

**Solution:**
The subscription should be created AFTER frequency selection, which was already implemented in the previous fix. The upgrade calculation is already correct:

```typescript
// This is already correct in the code
const currentPrice = this.getPrice(
  existing.tier,
  existing.paymentFrequency === "ANNUAL" ? "annual" : "monthly",
);
const newPrice = this.getPrice(
  newTier,
  existing.paymentFrequency === "ANNUAL" ? "annual" : "monthly",
);
```

**Verification:**

- Ensure subscriptions are created with the correct `paymentFrequency`
- Verify the upgrade endpoint reads the frequency correctly
- Test with both monthly and annual subscriptions

## Data Flow

### First-Time Subscription Flow

```
User selects tier
  ↓
Frontend: handleSubscribe()
  ↓
Check: subscription?.isActive === true? NO
  ↓
Open PaymentDialog (isUpgrade=false)
  ↓
User selects frequency (MONTHLY or ANNUAL)
  ↓
Call onSubscribe(tier, frequency)
  ↓
Backend: subscribe(memberId, tier, frequency)
  ↓
Create subscription with paymentFrequency
  ↓
User completes payment
  ↓
Payment callback: processCallback()
  ↓
Activate subscription + Send SMS
```

### Upgrade Flow

```
User selects higher tier
  ↓
Frontend: handleSubscribe()
  ↓
Check: subscription?.isActive === true? YES
Check: tierOrder[newTier] > tierOrder[currentTier]? YES
  ↓
Call api.upgrade(tier) to validate
  ↓
Backend: upgrade(memberId, newTier)
  ↓
Read existing.paymentFrequency
Calculate cost based on frequency
  ↓
Return upgrade info to frontend
  ↓
Open PaymentDialog (isUpgrade=true)
  ↓
User completes payment
  ↓
Payment callback: processCallback()
  ↓
Update subscription tier + Send SMS
```

## Error Handling

### 1. Upgrade Validation Errors

- **Scenario:** User tries to upgrade but has active claims
- **Handling:** Show error message, don't open payment dialog
- **User Experience:** Clear message explaining they must exhaust current package

### 2. SMS Failures

- **Scenario:** SMS service is down or phone number is invalid
- **Handling:** Log error, continue with payment completion
- **User Experience:** Payment succeeds, SMS fails silently
- **Monitoring:** Check logs for SMS failures

### 3. Payment Frequency Mismatch

- **Scenario:** Subscription has wrong frequency in database
- **Handling:** Use stored frequency value (even if incorrect)
- **User Experience:** May see wrong upgrade cost
- **Resolution:** Data migration script to fix existing records

## Testing Strategy

### Unit Tests

1. Test `handleSubscribe` logic with various subscription states
2. Test upgrade cost calculation with monthly and annual frequencies
3. Test SMS message formatting

### Integration Tests

1. Test complete first-time subscription flow
2. Test complete upgrade flow
3. Test payment callback with SMS sending

### Manual Testing

1. Create new account, subscribe to Bronze monthly
2. Verify SMS received
3. Upgrade to Silver, verify cost is monthly difference
4. Create new account, subscribe to Gold annual
5. Verify SMS received with 14-day waiting period
6. Downgrade attempt should be blocked

## Deployment Considerations

### Database State

- Existing subscriptions may have incorrect `paymentFrequency` values
- Consider running migration script to fix existing data
- Or accept that existing users may see incorrect upgrade costs until next payment

### SMS Service

- Verify SMS service is configured in production
- Check SMS balance/credits
- Monitor SMS delivery rates

### Rollback Plan

- If issues occur, can disable SMS sending via feature flag
- Frontend changes are backward compatible
- Backend changes don't break existing functionality

## Performance Impact

- Minimal: Only adds one SMS API call per payment
- SMS sending is non-blocking
- No additional database queries

## Security Considerations

- SMS messages don't contain sensitive information
- Phone numbers are already validated during signup
- Payment amounts are validated before processing

## Monitoring and Logging

### Key Metrics

- SMS delivery success rate
- Payment completion rate
- 400 error rate on subscription endpoint
- Upgrade cost calculation accuracy

### Log Messages

- `[SMS] Welcome notification sent to {phone}`
- `[SMS] Upgrade notification sent to {phone}`
- `[SMS] Failed to send notification: {error}`
- `[SUBSCRIPTION] Activated subscription for member {id}`
- `[UPGRADE] Processing upgrade for member {id} to {tier}`

## Future Improvements

- Add SMS retry logic for failed sends
- Add email notifications as backup
- Add in-app notifications
- Add SMS delivery status tracking
