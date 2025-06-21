-- AlterTable
ALTER TABLE "Concept" ADD COLUMN     "embedding" vector(1536);

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationText" TEXT NOT NULL,
    "conceptsData" JSONB NOT NULL DEFAULT '[]',
    "journeyAnalysisData" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnalysisSession" ADD CONSTRAINT "AnalysisSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
