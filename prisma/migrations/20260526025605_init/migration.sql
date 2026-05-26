-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SHIPPER', 'FORWARDER', 'CARRIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_PROFILE', 'PENDING_APPROVAL', 'ACTIVE', 'RESTRICTED', 'LOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHED_TO_POOL', 'STANDALONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('AGGREGATING', 'AUCTION', 'AWARDED', 'FAILED', 'SHIPMENT_IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('JOINED', 'CANCELLED', 'CONFIRMED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "FreightMode" AS ENUM ('OCEAN_FCL', 'OCEAN_LCL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "companyNameKr" TEXT,
    "companyNameEn" TEXT NOT NULL,
    "companyRegion" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "phone" TEXT,
    "nameKr" TEXT,
    "nameEn" TEXT,
    "businessType" TEXT,
    "ecommerceStatus" BOOLEAN NOT NULL DEFAULT false,
    "monthlyLogisticsBudget" TEXT,
    "logisticsModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "membershipLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Port" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Port_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "requesterRole" "UserRole" NOT NULL,
    "mode" "FreightMode" NOT NULL,
    "polCode" TEXT NOT NULL,
    "podCode" TEXT NOT NULL,
    "targetEtd" TIMESTAMP(3) NOT NULL,
    "cargoType" TEXT NOT NULL,
    "containerType" TEXT,
    "quantity" INTEGER,
    "weightTon" DECIMAL(10,2),
    "volumeCbm" DECIMAL(10,2),
    "packageType" TEXT,
    "unitSystem" TEXT,
    "isHeavy" BOOLEAN NOT NULL DEFAULT false,
    "isHazardous" BOOLEAN NOT NULL DEFAULT false,
    "isReefer" BOOLEAN NOT NULL DEFAULT false,
    "cargoDescription" TEXT,
    "guideRateUsd" DECIMAL(10,2),
    "status" "QuoteStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoBuyPool" (
    "id" SERIAL NOT NULL,
    "createdById" INTEGER NOT NULL,
    "polCode" TEXT NOT NULL,
    "podCode" TEXT NOT NULL,
    "targetEtd" TIMESTAMP(3) NOT NULL,
    "cargoType" TEXT NOT NULL,
    "containerType" TEXT,
    "isHazardous" BOOLEAN NOT NULL DEFAULT false,
    "isReefer" BOOLEAN NOT NULL DEFAULT false,
    "isHeavy" BOOLEAN NOT NULL DEFAULT false,
    "totalVolumeTeu" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalVolumeCbm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalWeightTon" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "PoolStatus" NOT NULL DEFAULT 'AGGREGATING',
    "auctionStartUtc" TIMESTAMP(3) NOT NULL,
    "auctionEndUtc" TIMESTAMP(3) NOT NULL,
    "scfiBaseRateUsd" DECIMAL(10,2) NOT NULL,
    "finalRateUsd" DECIMAL(10,2),
    "winningCarrierId" INTEGER,
    "limitOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoBuyPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolParticipant" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "quoteId" INTEGER,
    "role" "UserRole" NOT NULL,
    "volumeTeu" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "volumeCbm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "weightTon" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'JOINED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PoolParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "carrierId" INTEGER NOT NULL,
    "proposedRateUsd" DECIMAL(10,2) NOT NULL,
    "bidTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWinningAtTime" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "CoBuyPool_status_auctionStartUtc_auctionEndUtc_idx" ON "CoBuyPool"("status", "auctionStartUtc", "auctionEndUtc");

-- CreateIndex
CREATE INDEX "CoBuyPool_polCode_podCode_targetEtd_cargoType_idx" ON "CoBuyPool"("polCode", "podCode", "targetEtd", "cargoType");

-- CreateIndex
CREATE UNIQUE INDEX "PoolParticipant_poolId_userId_key" ON "PoolParticipant"("poolId", "userId");

-- CreateIndex
CREATE INDEX "AuctionBid_poolId_proposedRateUsd_idx" ON "AuctionBid"("poolId", "proposedRateUsd");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_polCode_fkey" FOREIGN KEY ("polCode") REFERENCES "Port"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_podCode_fkey" FOREIGN KEY ("podCode") REFERENCES "Port"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoBuyPool" ADD CONSTRAINT "CoBuyPool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoBuyPool" ADD CONSTRAINT "CoBuyPool_winningCarrierId_fkey" FOREIGN KEY ("winningCarrierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoBuyPool" ADD CONSTRAINT "CoBuyPool_polCode_fkey" FOREIGN KEY ("polCode") REFERENCES "Port"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoBuyPool" ADD CONSTRAINT "CoBuyPool_podCode_fkey" FOREIGN KEY ("podCode") REFERENCES "Port"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolParticipant" ADD CONSTRAINT "PoolParticipant_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "CoBuyPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolParticipant" ADD CONSTRAINT "PoolParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolParticipant" ADD CONSTRAINT "PoolParticipant_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "CoBuyPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
