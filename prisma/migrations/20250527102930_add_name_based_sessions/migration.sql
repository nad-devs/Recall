/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isNameBased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_sessionId_key" ON "users"("sessionId");
