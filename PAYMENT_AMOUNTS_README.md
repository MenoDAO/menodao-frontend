# Payment Amount Configuration

## Overview

This document explains how payment amounts are configured and validated in the MenoDAO platform.

## Centralized Configuration

All payment amounts are now managed through the centralized `payment-config.ts` module located at `src/lib/payment-config.ts`.

### Environment-Based Amounts

The system automatically detects the environment and uses appropriate amounts:

**Development Environment:**

- All payments use KES 5 for testing purposes
- This applies regardless of tier or frequency

**Production Environment:**

- MenoBronze: KES 550/month or KES 6,600/year
- MenoSilver: KES 1,100/month or KES 13,200/year
- MenoGold: KES 2,200/month or KES 26,400/year

## Usage

### Getting Payment Amounts

```typescript
import { getPaymentAmount } from "@/lib/payment-config";

// Get monthly amount for MenoSilver
const amount = getPaymentAmount("MenoSilver", "monthly");
// Returns: 5 in development, 1100 in production
```

### Validating Payment Amounts

```typescript
import { validatePaymentAmount } from "@/lib/payment-config";

// Validate an amount before processing
const isValid = validatePaymentAmount("MenoSilver", "monthly", 1100);
// Returns: false in development (expects 5), true in production
```

### Checking Environment

```typescript
import { isDevelopment, isProduction } from "@/lib/payment-config";

if (isDevelopment()) {
  console.log("Using test payment amounts");
}
```

## Components Using Payment Config

1. **PaymentDialog** (`src/app/(dashboard)/dashboard/subscription/PaymentDialog.tsx`)
   - Validates payment amounts before initiating payment
   - Logs payment details for debugging
   - Throws error if amount doesn't match expected value

2. **PaymentFrequencySelector** (`src/app/payment/components/PaymentFrequencySelector.tsx`)
   - Uses centralized config to display correct amounts
   - Shows both monthly and annual options with correct pricing

## Verification

To verify payment amounts are correct:

1. Check browser console logs when selecting payment frequency
2. Look for `[PaymentConfig]` and `[PaymentDialog]` log messages
3. Verify amounts match the expected values for your environment

## Production Deployment Checklist

Before deploying to production:

- [ ] Verify `NODE_ENV` is set to `production`
- [ ] Test payment flow in staging environment
- [ ] Confirm amounts displayed match production pricing
- [ ] Check console logs show correct environment detection
- [ ] Verify payment validation is working

## Troubleshooting

**Issue:** Wrong amounts displayed in production

- **Solution:** Check that `NODE_ENV=production` is set correctly

**Issue:** Payment validation failing

- **Solution:** Check console logs for amount mismatch details
- **Solution:** Verify the tier and frequency parameters are correct

**Issue:** Development using production amounts

- **Solution:** Ensure `NODE_ENV` is not set to `production` in development

## Future Enhancements

Consider adding:

- Backend validation of payment amounts
- Admin interface to update pricing
- A/B testing for different pricing strategies
- Promotional pricing support
