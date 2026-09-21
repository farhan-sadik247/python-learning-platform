-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRoleAssignment_role_idx" ON "UserRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Migrate existing roles
INSERT INTO "UserRoleAssignment" ("id", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, "id", "role", CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT DO NOTHING;

-- Data Migration: Ensure development account has all roles
DO $$
DECLARE
    dev_user_id TEXT;
BEGIN
    SELECT id INTO dev_user_id FROM "User" WHERE email = 'ufarhan.sadik@gmail.com';
    IF dev_user_id IS NOT NULL THEN
        INSERT INTO "UserRoleAssignment" ("id", "userId", "role", "createdAt") VALUES (gen_random_uuid()::text, dev_user_id, 'ADMIN', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
        INSERT INTO "UserRoleAssignment" ("id", "userId", "role", "createdAt") VALUES (gen_random_uuid()::text, dev_user_id, 'TEACHER', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
        INSERT INTO "UserRoleAssignment" ("id", "userId", "role", "createdAt") VALUES (gen_random_uuid()::text, dev_user_id, 'STUDENT', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";
