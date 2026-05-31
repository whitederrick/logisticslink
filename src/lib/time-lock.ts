const DAY_MS = 24 * 60 * 60 * 1000;

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function zonedMidnightToUtc(year: number, monthIndex: number, day: number, timeZone: string) {
  const utcGuess = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offset);
}

export function calculateAuctionWindow(targetEtd: Date, portTimezone = "UTC") {
  const localEtdMidnightUtc = zonedMidnightToUtc(
    targetEtd.getUTCFullYear(),
    targetEtd.getUTCMonth(),
    targetEtd.getUTCDate(),
    portTimezone
  );

  return {
    auctionStartUtc: new Date(localEtdMidnightUtc.getTime() - 14 * DAY_MS),
    auctionEndUtc: new Date(localEtdMidnightUtc.getTime() - 7 * DAY_MS)
  };
}
