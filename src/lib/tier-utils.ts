// Tier utility functions for Protocol v5.0
// Converts tier codes to display names with "Meno" prefix

export type TierCode = "BRONZE" | "SILVER" | "GOLD";

export function getTierDisplayName(tier?: string | null): string {
  if (!tier) return "Unknown";

  const tierUpper = tier.toUpperCase();

  switch (tierUpper) {
    case "BRONZE":
      return "MenoBronze";
    case "SILVER":
      return "MenoSilver";
    case "GOLD":
      return "MenoGold";
    default:
      return tier;
  }
}

export function getTierColor(tier?: string): string {
  if (!tier) return "bg-gray-500 text-white";

  const tierUpper = tier.toUpperCase();

  switch (tierUpper) {
    case "GOLD":
      return "bg-yellow-500 text-yellow-900";
    case "SILVER":
      return "bg-gray-400 text-gray-900";
    case "BRONZE":
      return "bg-orange-600 text-orange-100";
    default:
      return "bg-gray-500 text-white";
  }
}

export function getTierBadgeColor(tier?: string): string {
  if (!tier) return "bg-gray-500/20 text-gray-300";

  const tierUpper = tier.toUpperCase();

  switch (tierUpper) {
    case "GOLD":
      return "bg-yellow-500/20 text-yellow-400";
    case "SILVER":
      return "bg-gray-500/20 text-gray-300";
    case "BRONZE":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
}
