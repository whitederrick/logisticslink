export const shipmentStatuses = ["AWARDED", "SHIPMENT_IN_PROGRESS", "COMPLETED"] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export function isShipmentStatus(status: string): status is ShipmentStatus {
  return shipmentStatuses.includes(status as ShipmentStatus);
}

export function nextShipmentStatus(status: ShipmentStatus): ShipmentStatus | null {
  if (status === "AWARDED") return "SHIPMENT_IN_PROGRESS";
  if (status === "SHIPMENT_IN_PROGRESS") return "COMPLETED";
  return null;
}

export function shipmentProgress(status: string) {
  if (status === "COMPLETED") return 100;
  if (status === "SHIPMENT_IN_PROGRESS") return 66;
  if (status === "AWARDED") return 33;
  return 0;
}
