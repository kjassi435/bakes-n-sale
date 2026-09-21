-- Bakes n Sale migration 002 — run ONCE on the existing Turso database:
--   turso db shell bakes-n-sale < apps/api/prisma/turso-migration-002.sql
-- If it errors with "duplicate column name: deliveryInfo", the column already
-- exists — safe to ignore.
ALTER TABLE "Product" ADD COLUMN "deliveryInfo" TEXT;
