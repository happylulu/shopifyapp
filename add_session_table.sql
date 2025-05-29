-- Add Prisma Session table to existing Neon database
-- This allows Next.js and FastAPI to share the same database

-- Create Session table for Shopify app authentication
CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY,
    "accessToken" TEXT,
    expires TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL,
    scope TEXT,
    shop TEXT NOT NULL,
    state TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create OnlineAccessInfo table
CREATE TABLE IF NOT EXISTS "OnlineAccessInfo" (
    id TEXT PRIMARY KEY,
    "sessionId" TEXT UNIQUE,
    "expiresIn" INTEGER NOT NULL,
    "associatedUserScope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create AssociatedUser table
CREATE TABLE IF NOT EXISTS "AssociatedUser" (
    id TEXT PRIMARY KEY,
    "onlineAccessInfoId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT NOT NULL,
    "accountOwner" BOOLEAN NOT NULL,
    locale TEXT NOT NULL,
    collaborator BOOLEAN NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    FOREIGN KEY ("onlineAccessInfoId") REFERENCES "OnlineAccessInfo"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Session_shop_idx" ON "Session"(shop);
CREATE INDEX IF NOT EXISTS "Session_isOnline_idx" ON "Session"("isOnline");
CREATE INDEX IF NOT EXISTS "Session_accessToken_idx" ON "Session"("accessToken");

-- Add a comment to track this addition
COMMENT ON TABLE "Session" IS 'Prisma session table for Shopify app authentication - added for multi-tenant support';

-- Show success message
SELECT 'Session tables created successfully! Next.js and FastAPI can now share session data.' AS result;
