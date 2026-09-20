-- AlterTable: Add supabaseId column to User table to link Supabase Auth user with Prisma profile
ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT;

-- Backfill: existing rows get empty string temporarily (will be replaced when users link accounts)
-- In production, existing users will need to re-register or be manually linked.
UPDATE "User" SET "supabaseId" = id WHERE "supabaseId" IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE "User" ALTER COLUMN "supabaseId" SET NOT NULL;
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
