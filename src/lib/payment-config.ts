/**
 * Centralized Payment Configuration
 *
 * This module provides environment-aware payment amount configuration
 * for all subscription tiers and payment frequencies.
 */

export type SubscriptionTier = "MenoBronze" | "MenoSilver" | "MenoGold";
export type PaymentFrequency = "monthly" | "yearly";
export type Environment = "development" | "production";

interface PaymentAmounts {
  monthly: number;
  yearly: number;
}

interface PaymentConfig {
  environment: Environment;
  amounts: {
    development: {
      test: number;
    };
    production: {
      MenoBronze: PaymentAmounts;
      MenoSilver: PaymentAmounts;
      MenoGold: PaymentAmounts;
    };
  };
}

/**
 * Payment configuration with correct amounts for each tier and frequency
 */
export const PAYMENT_CONFIG: PaymentConfig = {
  environment: (process.env.NODE_ENV === "production"
    ? "production"
    : "development") as Environment,
  amounts: {
    development: {
      test: 5, // KES 5 for all test payments
    },
    production: {
      MenoBronze: {
        monthly: 350,
        yearly: 4200, // 350 * 12
      },
      MenoSilver: {
        monthly: 550,
        yearly: 6600, // 550 * 12
      },
      MenoGold: {
        monthly: 700,
        yearly: 8400, // 700 * 12
      },
    },
  },
};

/**
 * Get the payment amount for a given tier and frequency
 *
 * @param tier - The subscription tier
 * @param frequency - The payment frequency (monthly or yearly)
 * @param environment - Optional environment override (defaults to NODE_ENV)
 * @returns The payment amount in KES
 *
 * @example
 * ```typescript
 * const amount = getPaymentAmount('MenoSilver', 'monthly');
 * // Returns 5 in development, 1100 in production
 * ```
 */
export function getPaymentAmount(
  tier: SubscriptionTier,
  frequency: PaymentFrequency,
  environment?: Environment,
): number {
  const env = environment || PAYMENT_CONFIG.environment;

  // Development environment always uses test amount
  if (env === "development") {
    return PAYMENT_CONFIG.amounts.development.test;
  }

  // Production environment uses tier-specific amounts
  const amount = PAYMENT_CONFIG.amounts.production[tier][frequency];
  return amount;
}

/**
 * Validate that a payment amount matches the expected amount for the tier and frequency
 *
 * @param tier - The subscription tier
 * @param frequency - The payment frequency
 * @param amount - The amount to validate
 * @param environment - Optional environment override
 * @returns True if the amount is correct, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validatePaymentAmount('MenoSilver', 'monthly', 1100);
 * // Returns true in production, false in development (expects 5)
 * ```
 */
export function validatePaymentAmount(
  tier: SubscriptionTier,
  frequency: PaymentFrequency,
  amount: number,
  environment?: Environment,
): boolean {
  const expectedAmount = getPaymentAmount(tier, frequency, environment);
  const isValid = amount === expectedAmount;

  return isValid;
}

/**
 * Get all payment amounts for a tier (both monthly and yearly)
 *
 * @param tier - The subscription tier
 * @param environment - Optional environment override
 * @returns Object with monthly and yearly amounts
 */
export function getTierAmounts(
  tier: SubscriptionTier,
  environment?: Environment,
): PaymentAmounts {
  const env = environment || PAYMENT_CONFIG.environment;

  if (env === "development") {
    return {
      monthly: PAYMENT_CONFIG.amounts.development.test,
      yearly: PAYMENT_CONFIG.amounts.development.test,
    };
  }

  return PAYMENT_CONFIG.amounts.production[tier];
}

/**
 * Get the current environment
 */
export function getCurrentEnvironment(): Environment {
  return PAYMENT_CONFIG.environment;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return PAYMENT_CONFIG.environment === "development";
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return PAYMENT_CONFIG.environment === "production";
}
