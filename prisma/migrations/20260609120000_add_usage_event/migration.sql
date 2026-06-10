-- CreateTable
CREATE TABLE "usage_event" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_event_userId_action_createdAt_idx" ON "usage_event"("userId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "usage_event_guestId_action_createdAt_idx" ON "usage_event"("guestId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "usage_event_ipHash_action_createdAt_idx" ON "usage_event"("ipHash", "action", "createdAt");
