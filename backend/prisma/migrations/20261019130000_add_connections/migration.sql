-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'DECLINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('SESSION_BOOKING', 'DIRECT_REQUEST');

-- CreateTable
CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "initiatorId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "ConnectionType" NOT NULL DEFAULT 'DIRECT_REQUEST',
    "bookingId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connection_initiatorId_receiverId_key" ON "Connection"("initiatorId", "receiverId");

-- CreateIndex
CREATE INDEX "Connection_initiatorId_status_idx" ON "Connection"("initiatorId", "status");

-- CreateIndex
CREATE INDEX "Connection_receiverId_status_idx" ON "Connection"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Connection_bookingId_idx" ON "Connection"("bookingId");

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
