ALTER TABLE "Quote"
ADD COLUMN "serviceCode" TEXT NOT NULL DEFAULT 'forwardlink-ocean';

ALTER TABLE "CoBuyPool"
ADD COLUMN "serviceCode" TEXT NOT NULL DEFAULT 'forwardlink-ocean';

CREATE INDEX "Quote_serviceCode_status_idx"
ON "Quote"("serviceCode", "status");

DROP INDEX IF EXISTS "CoBuyPool_status_auctionStartUtc_auctionEndUtc_idx";

CREATE INDEX "CoBuyPool_serviceCode_status_auctionStartUtc_auctionEndUtc_idx"
ON "CoBuyPool"("serviceCode", "status", "auctionStartUtc", "auctionEndUtc");
