export type AccessRole = "ADMIN" | "CARRIER" | "FORWARDER" | "SHIPPER";

type UserLike = {
  id: number;
  role: AccessRole;
};

type QuoteOwnerLike = {
  requesterId: number;
};

type BidOwnerLike = {
  carrierId: number;
};

type PoolParticipantLike = {
  userId: number;
};

type PoolLike = {
  createdById: number;
  participants?: PoolParticipantLike[];
  status: string;
  winningCarrierId?: number | null;
};

export function canReadQuote(user: UserLike, quote: QuoteOwnerLike) {
  return user.role === "ADMIN" || quote.requesterId === user.id;
}

export function canCreateOrJoinPoolWithQuote(user: UserLike, quote: QuoteOwnerLike) {
  return (user.role === "SHIPPER" || user.role === "FORWARDER") && quote.requesterId === user.id;
}

export function canReadPool(user: UserLike, pool: PoolLike) {
  if (user.role === "ADMIN") return true;
  if (user.role === "CARRIER") return pool.status === "AUCTION" || pool.winningCarrierId === user.id;
  return pool.createdById === user.id || Boolean(pool.participants?.some((participant) => participant.userId === user.id));
}

export function canReadBid(user: UserLike, bid: BidOwnerLike) {
  return user.role === "ADMIN" || (user.role === "CARRIER" && bid.carrierId === user.id);
}
