export function isHeavyCargo(containerType: string | null | undefined, weightTon: number | null | undefined) {
  if (!containerType || weightTon == null) return false;
  if (containerType.startsWith("20FT")) return weightTon >= 16;
  if (containerType.startsWith("40FT")) return weightTon >= 20;
  return false;
}

export function calculateCbm(widthCm: number, lengthCm: number, heightCm: number, quantity: number) {
  if (widthCm <= 0 || lengthCm <= 0 || heightCm <= 0 || quantity <= 0) return 0;
  return (widthCm * lengthCm * heightCm * quantity) / 1_000_000;
}
