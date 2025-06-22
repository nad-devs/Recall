-- DropForeignKey
ALTER TABLE "Concept" DROP CONSTRAINT "Concept_conversationId_fkey";

-- AlterTable
ALTER TABLE "Concept" ALTER COLUMN "conversationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
