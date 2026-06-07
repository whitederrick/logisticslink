import { z } from "zod";
import { canCreateOrJoinPoolWithQuote } from "@/lib/access-policy";

export const bidRequestSchema = z.object({
  carrierId: z.number().int().positive().optional(),
  proposedRateUsd: z.number().positive()
});

export const joinPoolRequestSchema = z.object({
  quoteId: z.number().int().positive()
});

export const shipmentStatusRequestSchema = z.object({
  status: z.enum(["AWARDED", "SHIPMENT_IN_PROGRESS", "COMPLETED"])
});

export const userStatusRequestSchema = z.object({
  reason: z.string().trim().max(240).optional(),
  status: z.enum(["PENDING_PROFILE", "PENDING_APPROVAL", "ACTIVE", "RESTRICTED", "LOCKED", "SUSPENDED"])
});

export function parsePositiveRouteId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type JoinUser = {
  id: number;
  role: "ADMIN" | "CARRIER" | "FORWARDER" | "SHIPPER";
};

type JoinPool = {
  serviceCode?: string;
  cargoType?: string | null;
  containerType?: string | null;
  isHazardous: boolean;
  isHeavy: boolean;
  isReefer: boolean;
  podCode: string;
  polCode: string;
  status: string;
};

type JoinQuote = {
  serviceCode?: string;
  cargoType?: string | null;
  containerType?: string | null;
  isHazardous: boolean;
  isHeavy: boolean;
  isReefer: boolean;
  participants: unknown[];
  podCode: string;
  polCode: string;
  requesterId: number;
};

export function validatePoolJoinRequest({
  existingParticipant,
  pool,
  quote,
  user
}: {
  existingParticipant: unknown | null;
  pool: JoinPool;
  quote: JoinQuote;
  user: JoinUser;
}) {
  if (!canCreateOrJoinPoolWithQuote(user, quote)) return "QUOTE_ACCESS_DENIED";
  if (pool.status !== "AGGREGATING") return "POOL_NOT_AGGREGATING";
  if (quote.participants.length > 0) return "QUOTE_ALREADY_IN_POOL";
  if (existingParticipant) return "PARTICIPANT_ALREADY_IN_POOL";

  const matches =
    pool.serviceCode === quote.serviceCode &&
    pool.polCode === quote.polCode &&
    pool.podCode === quote.podCode &&
    pool.cargoType === quote.cargoType &&
    pool.containerType === quote.containerType &&
    pool.isHeavy === quote.isHeavy &&
    pool.isHazardous === quote.isHazardous &&
    pool.isReefer === quote.isReefer;

  return matches ? null : "QUOTE_DOES_NOT_MATCH_POOL";
}
