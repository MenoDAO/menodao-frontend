/**
 * Centralized Claim Limit Configuration
 *
 * This module provides the correct claim limits for each subscription tier.
 * All claim limit displays across the platform should use these utilities.
 */

export type SubscriptionTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "MenoBronze"
  | "MenoSilver"
  | "MenoGold";

/**
 * Claim limits in KES for each subscription tier
 */
export const CLAIM_LIMITS: Record<string, number> = {
  BRONZE: 6000,
  MenoBronze: 6000,
  SILVER: 10000,
  MenoSilver: 10000,
  GOLD: 15000,
  MenoGold: 15000,
};

/**
 * Get the claim limit for a given subscription tier
 *
 * @param tier - The subscription tier
 * @returns The claim limit in KES
 * @throws Error if tier is not recognized
 *
 * @example
 * ```typescript
 * const limit = getClaimLimit('SILVER');
 * // Returns: 10000
 * ```
 */
export function getClaimLimit(tier: SubscriptionTier): number {
  const normalizedTier = tier.toUpperCase();

  if (!(normalizedTier in CLAIM_LIMITS)) {
    console.error(`[ClaimLimits] Invalid tier: ${tier}`);
    throw new Error(`Invalid subscription tier: ${tier}`);
  }

  const limit = CLAIM_LIMITS[normalizedTier];
  console.log(`[ClaimLimits] Claim limit for ${tier}:`, limit);
  return limit;
}

/**
 * Calculate remaining claim limit
 *
 * @param tier - The subscription tier
 * @param usedAmount - The amount already claimed
 * @returns The remaining claim limit in KES
 *
 * @example
 * ```typescript
 * const remaining = getRemainingClaimLimit('SILVER', 3000);
 * // Returns: 7000
 * ```
 */
export function getRemainingClaimLimit(
  tier: SubscriptionTier,
  usedAmount: number,
): number {
  const totalLimit = getClaimLimit(tier);
  const remaining = Math.max(0, totalLimit - usedAmount);

  console.log(`[ClaimLimits] Remaining for ${tier}:`, {
    total: totalLimit,
    used: usedAmount,
    remaining,
  });

  return remaining;
}

/**
 * Format claim limit for display
 *
 * @param amount - The amount to format
 * @returns Formatted string with KES prefix
 *
 * @example
 * ```typescript
 * const formatted = formatClaimLimit(10000);
 * // Returns: "KES 10,000"
 * ```
 */
export function formatClaimLimit(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

/**
 * Get claim limit percentage used
 *
 * @param tier - The subscription tier
 * @param usedAmount - The amount already claimed
 * @returns Percentage of limit used (0-100)
 *
 * @example
 * ```typescript
 * const percentage = getClaimLimitPercentage('SILVER', 5000);
 * // Returns: 50
 * ```
 */
export function getClaimLimitPercentage(
  tier: SubscriptionTier,
  usedAmount: number,
): number {
  const totalLimit = getClaimLimit(tier);
  const percentage = (usedAmount / totalLimit) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Check if claim amount would exceed limit
 *
 * @param tier - The subscription tier
 * @param usedAmount - The amount already claimed
 * @param newClaimAmount - The new claim amount to check
 * @returns True if the new claim would exceed the limit
 *
 * @example
 * ```typescript
 * const wouldExceed = wouldExceedLimit('SILVER', 9000, 2000);
 * // Returns: true (9000 + 2000 = 11000 > 10000)
 * ```
 */
export function wouldExceedLimit(
  tier: SubscriptionTier,
  usedAmount: number,
  newClaimAmount: number,
): boolean {
  const totalLimit = getClaimLimit(tier);
  return usedAmount + newClaimAmount > totalLimit;
}

/**
 * Get all tier limits for comparison
 *
 * @returns Object with all tier limits
 */
export function getAllTierLimits(): Record<string, number> {
  return {
    BRONZE: CLAIM_LIMITS.BRONZE,
    SILVER: CLAIM_LIMITS.SILVER,
    GOLD: CLAIM_LIMITS.GOLD,
  };
}
