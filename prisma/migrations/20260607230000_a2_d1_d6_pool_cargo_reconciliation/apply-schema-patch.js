#!/usr/bin/env node
/* eslint-disable */
// =====================================================================
// A2 schema.prisma 패치 적용 스크립트
// 사용법: node prisma/migrations/20260607230000_a2_d1_d6_pool_cargo_reconciliation/apply-schema-patch.js
// 결과: prisma/schema.prisma 파일이 마이그레이션 SQL과 일치하도록 패치됨
// 백업: prisma/schema.prisma.bak 파일로 자동 백업됨
// =====================================================================

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');
const BACKUP_PATH = SCHEMA_PATH + '.bak';

console.log('[A2-Patch] schema.prisma 패치를 시작합니다...');
console.log('[A2-Patch] Schema 경로:', SCHEMA_PATH);

// 1. 백업 생성
if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(SCHEMA_PATH, BACKUP_PATH);
  console.log('[A2-Patch] 백업 생성됨:', BACKUP_PATH);
} else {
  console.log('[A2-Patch] 백업이 이미 존재합니다:', BACKUP_PATH);
}

let content = fs.readFileSync(SCHEMA_PATH, 'utf8');

// 2. PoolStatus enum 리네임
const oldPoolStatus = `enum PoolStatus {
  AGGREGATING
  AUCTION
  AWARDED
  FAILED
  SHIPMENT_IN_PROGRESS
  COMPLETED
  CANCELLED
}`;

const newPoolStatus = `enum PoolStatus {
  DRAFT
  AGGREGATING
  AUCTION_LIVE
  AWARDED
  CONTRACTED
  IN_SHIPMENT
  COMPLETED
  FAILED
  CANCELLED
  DISPUTED
}`;

if (content.includes(oldPoolStatus)) {
  content = content.replace(oldPoolStatus, newPoolStatus);
  console.log('[A2-Patch] ✅ PoolStatus enum 10-state로 리네임 완료');
} else if (content.includes(newPoolStatus)) {
  console.log('[A2-Patch] ⏭️  PoolStatus enum이 이미 10-state입니다 (건너뜀)');
} else {
  console.error('[A2-Patch] ❌ PoolStatus enum 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// 3. HazmatClass enum 추가
const rateBenchmarkTypeEnd = `enum RateBenchmarkType {
  MARKET_INDEX
  SPOT_RATE
  CONTRACT_RATE
  FAK
  PUBLIC_TARIFF
  INTERNAL_MASTER
}`;

const rateBenchmarkTypeAndHazmat = `enum RateBenchmarkType {
  MARKET_INDEX
  SPOT_RATE
  CONTRACT_RATE
  FAK
  PUBLIC_TARIFF
  INTERNAL_MASTER
}

enum HazmatClass {
  CLASS_1
  CLASS_2
  CLASS_3
  CLASS_4
  CLASS_5
  CLASS_6
  CLASS_7
  CLASS_8
  CLASS_9
}`;

if (content.includes(rateBenchmarkTypeEnd) && !content.includes('enum HazmatClass')) {
  content = content.replace(rateBenchmarkTypeEnd, rateBenchmarkTypeAndHazmat);
  console.log('[A2-Patch] ✅ HazmatClass enum 추가 완료');
} else if (content.includes('enum HazmatClass')) {
  console.log('[A2-Patch] ⏭️  HazmatClass enum이 이미 존재합니다 (건너뜀)');
} else {
  console.error('[A2-Patch] ❌ RateBenchmarkType enum 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// 4. CargoCategory, CargoSubType 모델 추가 (AuditLog 이전)
const oldAuditLog = `model AuditLog {
  id          Int      @id @default(autoincrement())
  actorId     Int?
  action      String
  entityType  String
  entityId    Int?
  beforeJson  Json?
  afterJson   Json?
  createdAt   DateTime @default(now())
}`;

const newCargoAndAuditLog = `model CargoCategory {
  code                String          @id
  nameKr              String
  nameEn              String
  isHazardous         Boolean         @default(false)
  defaultHazmatClass  HazmatClass?
  isReeferDefault     Boolean         @default(false)
  requiresSpecialDoc  Boolean         @default(false)
  requiredDocs        Json
  isActive            Boolean         @default(true)
  displayOrder        Int             @default(0)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  subTypes            CargoSubType[]
  quotes              Quote[]
  pools               CoBuyPool[]

  @@index([isActive, displayOrder])
}

model CargoSubType {
  id                    Int              @id @default(autoincrement())
  categoryCode          String
  subTypeCode           String
  nameKr                String
  nameEn                String
  hazardousClass        HazmatClass?
  unNumber              String?
  requiredDocuments     Json?
  recommendedContainers Json?
  isActive              Boolean          @default(true)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  category              CargoCategory    @relation(fields: [categoryCode], references: [code], onDelete: Cascade)
  quotes                Quote[]
  pools                 CoBuyPool[]

  @@unique([categoryCode, subTypeCode])
  @@index([isActive])
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  actorId     Int?
  action      String
  entityType  String
  entityId    Int?
  beforeJson  Json?
  afterJson   Json?
  createdAt   DateTime @default(now())
}`;

if (content.includes(oldAuditLog) && !content.includes('model CargoCategory')) {
  content = content.replace(oldAuditLog, newCargoAndAuditLog);
  console.log('[A2-Patch] ✅ CargoCategory / CargoSubType 모델 추가 완료');
} else if (content.includes('model CargoCategory')) {
  console.log('[A2-Patch] ⏭️  CargoCategory / CargoSubType 모델이 이미 존재합니다 (건너뜀)');
} else {
  console.error('[A2-Patch] ❌ AuditLog 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// 5. Quote 모델 확장
const oldQuote = `model Quote {
  id               Int          @id @default(autoincrement())
  serviceCode      String       @default("forwardlink-ocean")
  requesterId      Int
  requesterRole    UserRole
  mode             FreightMode
  polCode          String
  podCode          String
  targetEtd        DateTime
  cargoType        String
  containerType    String?
  quantity         Int?
  weightTon        Decimal?     @db.Decimal(10, 2)
  volumeCbm        Decimal?     @db.Decimal(10, 2)
  packageType      String?
  unitSystem       String?
  isHeavy          Boolean      @default(false)
  isHazardous      Boolean      @default(false)
  isReefer         Boolean      @default(false)
  cargoDescription String?
  guideRateUsd     Decimal?     @db.Decimal(10, 2)
  status           QuoteStatus  @default(SUBMITTED)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  requester        User         @relation(fields: [requesterId], references: [id])
  pol              Port         @relation("QuotePol", fields: [polCode], references: [code])
  pod              Port         @relation("QuotePod", fields: [podCode], references: [code])
  participants     PoolParticipant[]

  @@index([serviceCode, status])
}`;

const newQuote = `model Quote {
  id                 Int          @id @default(autoincrement())
  serviceCode        String       @default("forwardlink-ocean")
  requesterId        Int
  requesterRole      UserRole
  mode               FreightMode
  polCode            String
  podCode            String
  targetEtd          DateTime
  cargoType          String?
  cargoCategoryCode  String?
  cargoSubTypeId     Int?
  hsCode             String?
  containerType      String?
  quantity           Int?
  weightTon          Decimal?     @db.Decimal(10, 2)
  volumeCbm          Decimal?     @db.Decimal(10, 2)
  packageType        String?
  unitSystem         String?
  isHeavy            Boolean      @default(false)
  isHazardous        Boolean      @default(false)
  isReefer           Boolean      @default(false)
  cargoDescription   String?
  guideRateUsd       Decimal?     @db.Decimal(10, 2)
  status             QuoteStatus  @default(SUBMITTED)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  requester          User         @relation(fields: [requesterId], references: [id])
  pol                Port         @relation("QuotePol", fields: [polCode], references: [code])
  pod                Port         @relation("QuotePod", fields: [podCode], references: [code])
  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants       PoolParticipant[]

  @@index([serviceCode, status])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

if (content.includes(oldQuote) && !content.includes('cargoCategoryCode  String?')) {
  content = content.replace(oldQuote, newQuote);
  console.log('[A2-Patch] ✅ Quote 모델 확장 완료 (cargo 2단계 분류)');
} else if (content.includes('cargoCategoryCode  String?')) {
  console.log('[A2-Patch] ⏭️  Quote 모델이 이미 cargo 2단계 분류로 확장되었습니다 (건너뜀)');
} else {
  console.error('[A2-Patch] ❌ Quote 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// 6. CoBuyPool 모델 확장
const oldCoBuyPool = `model CoBuyPool {
  id               Int          @id @default(autoincrement())
  serviceCode      String       @default("forwardlink-ocean")
  createdById      Int
  polCode          String
  podCode          String
  targetEtd        DateTime
  cargoType        String
  containerType    String?
  isHazardous      Boolean      @default(false)
  isReefer         Boolean      @default(false)
  isHeavy          Boolean      @default(false)
  totalVolumeTeu   Decimal      @default(0) @db.Decimal(10, 2)
  totalVolumeCbm   Decimal      @default(0) @db.Decimal(10, 2)
  totalWeightTon   Decimal      @default(0) @db.Decimal(10, 2)
  status           PoolStatus   @default(AGGREGATING)
  auctionStartUtc  DateTime
  auctionEndUtc    DateTime
  scfiBaseRateUsd  Decimal      @db.Decimal(10, 2)
  finalRateUsd     Decimal?     @db.Decimal(10, 2)
  winningCarrierId Int?
  limitOverride    Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  createdBy        User         @relation("PoolCreator", fields: [createdById], references: [id])
  winningCarrier   User?        @relation("WinningCarrier", fields: [winningCarrierId], references: [id])
  pol              Port         @relation("PoolPol", fields: [polCode], references: [code])
  pod              Port         @relation("PoolPod", fields: [podCode], references: [code])
  participants     PoolParticipant[]
  bids             AuctionBid[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([polCode, podCode, targetEtd, cargoType])
}`;

const newCoBuyPool = `model CoBuyPool {
  id                 Int          @id @default(autoincrement())
  serviceCode        String       @default("forwardlink-ocean")
  createdById        Int
  polCode            String
  podCode            String
  targetEtd          DateTime
  cargoType          String?
  cargoCategoryCode  String?
  cargoSubTypeId     Int?
  containerType      String?
  isHazardous        Boolean      @default(false)
  isReefer           Boolean      @default(false)
  isHeavy            Boolean      @default(false)
  totalVolumeTeu     Decimal      @default(0) @db.Decimal(10, 2)
  totalVolumeCbm     Decimal      @default(0) @db.Decimal(10, 2)
  totalWeightTon     Decimal      @default(0) @db.Decimal(10, 2)
  status             PoolStatus   @default(AGGREGATING)
  auctionStartUtc    DateTime
  auctionEndUtc      DateTime
  scfiBaseRateUsd    Decimal      @db.Decimal(10, 2)
  finalRateUsd       Decimal?     @db.Decimal(10, 2)
  winningCarrierId   Int?
  limitOverride      Boolean      @default(false)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  createdBy          User         @relation("PoolCreator", fields: [createdById], references: [id])
  winningCarrier     User?        @relation("WinningCarrier", fields: [winningCarrierId], references: [id])
  pol                Port         @relation("PoolPol", fields: [polCode], references: [code])
  pod                Port         @relation("PoolPod", fields: [podCode], references: [code])
  cargoCategory      CargoCategory? @relation(fields: [cargoCategoryCode], references: [code])
  cargoSubType       CargoSubType?  @relation(fields: [cargoSubTypeId], references: [id])
  participants       PoolParticipant[]
  bids               AuctionBid[]

  @@index([serviceCode, status, auctionStartUtc, auctionEndUtc])
  @@index([cargoCategoryCode, polCode, podCode, targetEtd])
}`;

if (content.includes(oldCoBuyPool) && !content.includes('cargoCategoryCode  String?')) {
  content = content.replace(oldCoBuyPool, newCoBuyPool);
  console.log('[A2-Patch] ✅ CoBuyPool 모델 확장 완료 (cargo 2단계 분류)');
} else if (content.includes('cargoCategoryCode  String?')) {
  console.log('[A2-Patch] ⏭️  CoBuyPool 모델이 이미 cargo 2단계 분류로 확장되었습니다 (건너뜀)');
} else {
  console.error('[A2-Patch] ❌ CoBuyPool 모델 패턴을 찾을 수 없습니다. 수동 패치 필요.');
  process.exit(1);
}

// 7. 파일 저장
fs.writeFileSync(SCHEMA_PATH, content, 'utf8');
console.log('[A2-Patch] ✅ schema.prisma 저장 완료');
console.log('');
console.log('[A2-Patch] 다음 단계:');
console.log('  1) npx prisma validate');
console.log('  2) npx prisma format');
console.log('  3) npx prisma generate');
console.log('  4) npx prisma migrate deploy');
