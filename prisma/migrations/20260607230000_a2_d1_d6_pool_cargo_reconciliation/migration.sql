-- =====================================================================
-- A2 마이그레이션 1차: 마스터 정합성 통합 (D-1 + D-6) — v2 (updatedAt 수정)
-- 작성 근거: docs/MASTER_RECONCILIATION.md
-- 작성일:   2026-06-07
-- 적용 방법: prisma migrate deploy
-- =====================================================================

-- Part 1. HazmatClass enum 생성 (D-6)
CREATE TYPE "HazmatClass" AS ENUM (
  'CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5',
  'CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9'
);

-- Part 2. CargoCategory 테이블 생성 (D-6)
CREATE TABLE "CargoCategory" (
  "code"                TEXT             NOT NULL,
  "nameKr"              TEXT             NOT NULL,
  "nameEn"              TEXT             NOT NULL,
  "isHazardous"         BOOLEAN          NOT NULL DEFAULT false,
  "defaultHazmatClass"  "HazmatClass",
  "isReeferDefault"     BOOLEAN          NOT NULL DEFAULT false,
  "requiresSpecialDoc"  BOOLEAN          NOT NULL DEFAULT false,
  "requiredDocs"        JSONB            NOT NULL,
  "isActive"            BOOLEAN          NOT NULL DEFAULT true,
  "displayOrder"        INTEGER          NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CargoCategory_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "CargoCategory_isActive_displayOrder_idx"
  ON "CargoCategory"("isActive", "displayOrder");

-- Part 3. CargoSubType 테이블 생성 (D-6)
CREATE TABLE "CargoSubType" (
  "id"                    SERIAL          NOT NULL,
  "categoryCode"          TEXT            NOT NULL,
  "subTypeCode"           TEXT            NOT NULL,
  "nameKr"                TEXT            NOT NULL,
  "nameEn"                TEXT            NOT NULL,
  "hazardousClass"        "HazmatClass",
  "unNumber"              TEXT,
  "requiredDocuments"     JSONB,
  "recommendedContainers" JSONB,
  "isActive"              BOOLEAN         NOT NULL DEFAULT true,
  "createdAt"             TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CargoSubType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoSubType_categoryCode_subTypeCode_key"
  ON "CargoSubType"("categoryCode", "subTypeCode");

CREATE INDEX "CargoSubType_isActive_idx"
  ON "CargoSubType"("isActive");

ALTER TABLE "CargoSubType"
  ADD CONSTRAINT "CargoSubType_categoryCode_fkey"
  FOREIGN KEY ("categoryCode") REFERENCES "CargoCategory"("code")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Part 4. PoolStatus enum 10-state 마이그레이션 (D-1)
CREATE TYPE "PoolStatus_new" AS ENUM (
  'DRAFT', 'AGGREGATING', 'AUCTION_LIVE', 'AWARDED', 'CONTRACTED',
  'IN_SHIPMENT', 'COMPLETED', 'FAILED', 'CANCELLED', 'DISPUTED'
);

ALTER TABLE "CoBuyPool" ADD COLUMN "status_new" "PoolStatus_new";

UPDATE "CoBuyPool" SET "status_new" =
  CASE "status"::text
    WHEN 'AUCTION'              THEN 'AUCTION_LIVE'::"PoolStatus_new"
    WHEN 'SHIPMENT_IN_PROGRESS' THEN 'IN_SHIPMENT'::"PoolStatus_new"
    WHEN 'AGGREGATING'          THEN 'AGGREGATING'::"PoolStatus_new"
    WHEN 'AWARDED'              THEN 'AWARDED'::"PoolStatus_new"
    WHEN 'COMPLETED'            THEN 'COMPLETED'::"PoolStatus_new"
    WHEN 'FAILED'               THEN 'FAILED'::"PoolStatus_new"
    WHEN 'CANCELLED'            THEN 'CANCELLED'::"PoolStatus_new"
    ELSE 'AGGREGATING'::"PoolStatus_new"
  END;

ALTER TABLE "CoBuyPool" DROP COLUMN "status";
ALTER TABLE "CoBuyPool" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "CoBuyPool" ALTER COLUMN "status" SET DEFAULT 'AGGREGATING'::"PoolStatus_new";
ALTER TABLE "CoBuyPool" ALTER COLUMN "status" SET NOT NULL;

DROP TYPE "PoolStatus";
ALTER TYPE "PoolStatus_new" RENAME TO "PoolStatus";

CREATE INDEX "CoBuyPool_serviceCode_status_auctionStartUtc_auctionEndUtc_idx"
  ON "CoBuyPool"("serviceCode", "status", "auctionStartUtc", "auctionEndUtc");

-- Part 5. Quote 테이블 확장 (D-6: cargo 2단계 분류)
ALTER TABLE "Quote" ALTER COLUMN "cargoType" DROP NOT NULL;
ALTER TABLE "Quote" ADD COLUMN "cargoCategoryCode" TEXT;
ALTER TABLE "Quote" ADD COLUMN "cargoSubTypeId"    INTEGER;
ALTER TABLE "Quote" ADD COLUMN "hsCode"            TEXT;

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_cargoCategoryCode_fkey"
  FOREIGN KEY ("cargoCategoryCode") REFERENCES "CargoCategory"("code")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_cargoSubTypeId_fkey"
  FOREIGN KEY ("cargoSubTypeId") REFERENCES "CargoSubType"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Quote_cargoCategoryCode_polCode_podCode_targetEtd_idx"
  ON "Quote"("cargoCategoryCode", "polCode", "podCode", "targetEtd");

-- Part 6. CoBuyPool 테이블 확장 (D-6: cargo 2단계 분류)
ALTER TABLE "CoBuyPool" ALTER COLUMN "cargoType" DROP NOT NULL;
ALTER TABLE "CoBuyPool" ADD COLUMN "cargoCategoryCode" TEXT;
ALTER TABLE "CoBuyPool" ADD COLUMN "cargoSubTypeId"    INTEGER;

ALTER TABLE "CoBuyPool"
  ADD CONSTRAINT "CoBuyPool_cargoCategoryCode_fkey"
  FOREIGN KEY ("cargoCategoryCode") REFERENCES "CargoCategory"("code")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CoBuyPool"
  ADD CONSTRAINT "CoBuyPool_cargoSubTypeId_fkey"
  FOREIGN KEY ("cargoSubTypeId") REFERENCES "CargoSubType"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CoBuyPool_cargoCategoryCode_polCode_podCode_targetEtd_idx"
  ON "CoBuyPool"("cargoCategoryCode", "polCode", "podCode", "targetEtd");

-- Part 7. 13개 산업군 마스터 시드 데이터 (D-6)
-- DEFAULT CURRENT_TIMESTAMP 사용으로 createdAt, updatedAt 자동 설정
INSERT INTO "CargoCategory" ("code", "nameKr", "nameEn", "isHazardous", "defaultHazmatClass", "isReeferDefault", "requiresSpecialDoc", "requiredDocs", "displayOrder")
VALUES
  ('ELECTRONICS',          '전기/전자',           'Electronics',             false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                  1),
  ('BATTERY',              '배터리/2차전지',      'Battery / Secondary Cell', true,  'CLASS_9', false, true,  '["MSDS", "UN38.3", "\ud56d\uacf5/\ud574\uc0c1 \uc2dc\ud5d8\uc131\uc801\uc11c"]'::jsonb,                                                                                              2),
  ('CHEMICAL',             '화학/제약',           'Chemical / Pharmaceutical', true,  'CLASS_3', false, true,  '["MSDS", "REACH"]'::jsonb,                                                                                                                                                                    3),
  ('AUTOMOTIVE',           '자동차 부품',         'Automotive Parts',        false, NULL,    false, false, '["\uc6d0\uc0b0\uc9c0\uc99d\uba85"]'::jsonb,                                                                                                                                                    4),
  ('STEEL_METAL',          '철강/금속',           'Steel / Metal',           false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                5),
  ('FOOD_AGRI',            '식음료/농산물',       'Food / Agriculture',      false, NULL,    true,  true,  '["\uc704\uc0dd\uc99d", "\uac80\uc5ed\uc99d"]'::jsonb,                                                                                                                                         6),
  ('TEXTILE_APPAREL',      '섬유/의류',           'Textile / Apparel',       false, NULL,    false, false, '["\uc6d0\uc0b0\uc9c0\uc99d\uba85"]'::jsonb,                                                                                                                                                    7),
  ('COSMETICS',            '화장품/뷰티',         'Cosmetics / Beauty',      false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                8),
  ('FURNITURE',            '가구/인테리어',       'Furniture / Interior',    false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                9),
  ('INDUSTRIAL_MACHINERY', '산업기계/설비',       'Industrial Machinery',    false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                10),
  ('LIFE_SCIENCE',         '바이오/의료',         'Life Science / Medical',  false, NULL,    false, true,  '["\uc758\uc57d\ud488 \uc218\ucd9c\ud5c8\uac00"]'::jsonb,                                                                                                                                         11),
  ('CONSUMER_GOODS',       '소비재/기타',         'Consumer Goods',          false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                12),
  ('OTHER',                '기타',               'Other',                   false, NULL,    false, false, '[]'::jsonb,                                                                                                                                                                                99)
ON CONFLICT ("code") DO NOTHING;

-- Part 8. 데이터 백필 (cargoType → cargoCategoryCode)
UPDATE "Quote" SET "cargoCategoryCode" =
  CASE UPPER("cargoType")
    WHEN 'BATTERY'      THEN 'BATTERY'
    WHEN 'LITHIUM'      THEN 'BATTERY'
    WHEN 'ELECTRONICS'  THEN 'ELECTRONICS'
    WHEN 'SEMI'         THEN 'ELECTRONICS'
    WHEN 'CHEMICAL'     THEN 'CHEMICAL'
    WHEN 'AUTOMOTIVE'   THEN 'AUTOMOTIVE'
    WHEN 'AUTO'         THEN 'AUTOMOTIVE'
    WHEN 'STEEL'        THEN 'STEEL_METAL'
    WHEN 'METAL'        THEN 'STEEL_METAL'
    WHEN 'FOOD'         THEN 'FOOD_AGRI'
    WHEN 'TEXTILE'      THEN 'TEXTILE_APPAREL'
    WHEN 'APPAREL'      THEN 'TEXTILE_APPAREL'
    WHEN 'COSMETICS'    THEN 'COSMETICS'
    WHEN 'BEAUTY'       THEN 'COSMETICS'
    WHEN 'FURNITURE'    THEN 'FURNITURE'
    WHEN 'MACHINERY'    THEN 'INDUSTRIAL_MACHINERY'
    WHEN 'LIFE_SCIENCE' THEN 'LIFE_SCIENCE'
    WHEN 'MEDICAL'      THEN 'LIFE_SCIENCE'
    ELSE 'OTHER'
  END
WHERE "cargoCategoryCode" IS NULL
  AND "cargoType" IS NOT NULL;

UPDATE "CoBuyPool" SET "cargoCategoryCode" =
  CASE UPPER("cargoType")
    WHEN 'BATTERY'      THEN 'BATTERY'
    WHEN 'LITHIUM'      THEN 'BATTERY'
    WHEN 'ELECTRONICS'  THEN 'ELECTRONICS'
    WHEN 'SEMI'         THEN 'ELECTRONICS'
    WHEN 'CHEMICAL'     THEN 'CHEMICAL'
    WHEN 'AUTOMOTIVE'   THEN 'AUTOMOTIVE'
    WHEN 'AUTO'         THEN 'AUTOMOTIVE'
    WHEN 'STEEL'        THEN 'STEEL_METAL'
    WHEN 'METAL'        THEN 'STEEL_METAL'
    WHEN 'FOOD'         THEN 'FOOD_AGRI'
    WHEN 'TEXTILE'      THEN 'TEXTILE_APPAREL'
    WHEN 'APPAREL'      THEN 'TEXTILE_APPAREL'
    WHEN 'COSMETICS'    THEN 'COSMETICS'
    WHEN 'BEAUTY'       THEN 'COSMETICS'
    WHEN 'FURNITURE'    THEN 'FURNITURE'
    WHEN 'MACHINERY'    THEN 'INDUSTRIAL_MACHINERY'
    WHEN 'LIFE_SCIENCE' THEN 'LIFE_SCIENCE'
    WHEN 'MEDICAL'      THEN 'LIFE_SCIENCE'
    ELSE 'OTHER'
  END
WHERE "cargoCategoryCode" IS NULL
  AND "cargoType" IS NOT NULL;
