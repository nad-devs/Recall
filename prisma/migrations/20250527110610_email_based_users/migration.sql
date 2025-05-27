/*
  Warnings:

  - You are about to drop the column `isNameBased` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `users` table. All the data in the column will be lost.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "users_sessionId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isNameBased",
DROP COLUMN "sessionId",
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
