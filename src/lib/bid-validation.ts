type BidValidationInput = {
  auctionEndUtc: Date;
  auctionStartUtc: Date;
  carrierStatus: string;
  currentLowestRate: number | null;
  limitOverride: boolean;
  now: Date;
  proposedRateUsd: number;
  scfiBaseRateUsd: number;
  status: string;
};

export function validateCarrierBid(input: BidValidationInput) {
  if (input.status !== "AUCTION_LIVE") {
    return "POOL_NOT_IN_AUCTION";
  }

  if (input.now < input.auctionStartUtc) {
    return "AUCTION_NOT_STARTED_D14_LOCK";
  }

  if (input.now > input.auctionEndUtc) {
    return "AUCTION_CLOSED_D7_LOCK";
  }

  if (input.carrierStatus === "LOCKED" || input.carrierStatus === "SUSPENDED" || input.carrierStatus === "RESTRICTED") {
    return "CARRIER_NOT_ALLOWED_TO_BID";
  }

  if (!input.limitOverride && input.proposedRateUsd >= input.scfiBaseRateUsd) {
    return "BID_MUST_BE_BELOW_BASE_RATE";
  }

  if (input.currentLowestRate != null && input.proposedRateUsd >= input.currentLowestRate) {
    return "BID_MUST_BE_LOWER_THAN_CURRENT_LOWEST";
  }

  return null;
}
