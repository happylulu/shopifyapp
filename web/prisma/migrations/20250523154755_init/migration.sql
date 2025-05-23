-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT,
    "expires" DATETIME,
    "isOnline" BOOLEAN NOT NULL,
    "scope" TEXT,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnlineAccessInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "expiresIn" INTEGER NOT NULL,
    "associatedUserScope" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OnlineAccessInfo_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociatedUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onlineAccessInfoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" BIGINT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accountOwner" BOOLEAN NOT NULL,
    "locale" TEXT NOT NULL,
    "collaborator" BOOLEAN NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    CONSTRAINT "AssociatedUser_onlineAccessInfoId_fkey" FOREIGN KEY ("onlineAccessInfoId") REFERENCES "OnlineAccessInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineAccessInfo_sessionId_key" ON "OnlineAccessInfo"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssociatedUser_onlineAccessInfoId_key" ON "AssociatedUser"("onlineAccessInfoId");
