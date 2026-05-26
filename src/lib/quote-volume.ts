export type QuoteVolumeInput = {
  mode: string;
  containerType: string | null;
  quantity: number | null;
  volumeCbm: unknown;
  weightTon: unknown;
};

export function calculateQuoteVolumes(quote: QuoteVolumeInput) {
  const quantity = quote.quantity ?? 1;
  const volumeCbm = quote.volumeCbm == null ? 0 : Number(quote.volumeCbm);
  const weightTon = quote.weightTon == null ? 0 : Number(quote.weightTon);
  let volumeTeu = 0;

  if (quote.mode === "OCEAN_FCL") {
    if (quote.containerType?.startsWith("20FT")) {
      volumeTeu = quantity;
    } else if (quote.containerType?.startsWith("40FT") || quote.containerType?.startsWith("45FT")) {
      volumeTeu = quantity * 2;
    }
  }

  return { volumeTeu, volumeCbm, weightTon };
}
