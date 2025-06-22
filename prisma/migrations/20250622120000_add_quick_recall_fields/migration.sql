-- AlterTable
ALTER TABLE "Concept" ADD COLUMN     "analogy" TEXT,
ADD COLUMN     "keyTakeaway" TEXT,
ADD COLUMN     "practicalTips" TEXT NOT NULL DEFAULT '[]'; 