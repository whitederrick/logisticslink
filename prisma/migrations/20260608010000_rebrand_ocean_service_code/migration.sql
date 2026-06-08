UPDATE "Quote"
SET "serviceCode" = 'logisticslink-ocean'
WHERE "serviceCode" = 'for' || 'ward' || 'link-ocean';

UPDATE "CoBuyPool"
SET "serviceCode" = 'logisticslink-ocean'
WHERE "serviceCode" = 'for' || 'ward' || 'link-ocean';

ALTER TABLE "Quote"
ALTER COLUMN "serviceCode" SET DEFAULT 'logisticslink-ocean';

ALTER TABLE "CoBuyPool"
ALTER COLUMN "serviceCode" SET DEFAULT 'logisticslink-ocean';
