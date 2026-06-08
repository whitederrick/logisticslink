export const shipmentStatuses = ["AWARDED", "IN_SHIPMENT", "COMPLETED"] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export function isShipmentStatus(status: string): status is ShipmentStatus {
  return shipmentStatuses.includes(status as ShipmentStatus);
}

export function nextShipmentStatus(status: ShipmentStatus): ShipmentStatus | null {
  if (status === "AWARDED") return "IN_SHIPMENT";
  if (status === "IN_SHIPMENT") return "COMPLETED";
  return null;
}

export function shipmentProgress(status: string) {
  if (status === "COMPLETED") return 100;
  if (status === "IN_SHIPMENT") return 66;
  if (status === "AWARDED") return 33;
  return 0;
}
