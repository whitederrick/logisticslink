const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateAuctionWindow(targetEtd: Date) {
  const etdUtcMidnight = Date.UTC(
    targetEtd.getUTCFullYear(),
    targetEtd.getUTCMonth(),
    targetEtd.getUTCDate(),
    0,
    0,
    0,
    0
  );

  return {
    auctionStartUtc: new Date(etdUtcMidnight - 14 * DAY_MS),
    auctionEndUtc: new Date(etdUtcMidnight - 7 * DAY_MS)
  };
}
