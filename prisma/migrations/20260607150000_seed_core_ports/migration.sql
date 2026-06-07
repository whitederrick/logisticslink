INSERT INTO "Port" ("code", "name", "countryCode", "timezone", "createdAt", "updatedAt")
VALUES
  ('AUSYD', 'Sydney', 'AU', 'Australia/Sydney', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BRSSZ', 'Santos', 'BR', 'America/Sao_Paulo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CAVAN', 'Vancouver', 'CA', 'America/Vancouver', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CNSHA', 'Shanghai', 'CN', 'Asia/Shanghai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CNNGB', 'Ningbo-Zhoushan', 'CN', 'Asia/Shanghai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DEHAM', 'Hamburg', 'DE', 'Europe/Berlin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('EGALY', 'Alexandria', 'EG', 'Africa/Cairo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('INNSA', 'Nhava Sheva', 'IN', 'Asia/Kolkata', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('JPTYO', 'Tokyo', 'JP', 'Asia/Tokyo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('KRPUS', 'Busan', 'KR', 'Asia/Seoul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('KRINC', 'Incheon', 'KR', 'Asia/Seoul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MXZLO', 'Manzanillo', 'MX', 'America/Mexico_City', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('NLRTM', 'Rotterdam', 'NL', 'Europe/Amsterdam', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PAMIT', 'Manzanillo, Panama', 'PA', 'America/Panama', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PHMNL', 'Manila', 'PH', 'Asia/Manila', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PLGDN', 'Gdansk', 'PL', 'Europe/Warsaw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SGSIN', 'Singapore', 'SG', 'Asia/Singapore', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('THLCH', 'Laem Chabang', 'TH', 'Asia/Bangkok', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TRMER', 'Mersin', 'TR', 'Europe/Istanbul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('USLAX', 'Los Angeles', 'US', 'America/Los_Angeles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('USLGB', 'Long Beach', 'US', 'America/Los_Angeles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('USNYC', 'New York/New Jersey', 'US', 'America/New_York', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('VNHPH', 'Hai Phong', 'VN', 'Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('VNSGN', 'Ho Chi Minh City', 'VN', 'Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "countryCode" = EXCLUDED."countryCode",
  "timezone" = EXCLUDED."timezone",
  "updatedAt" = CURRENT_TIMESTAMP;
