-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Concept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "keyPoints" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "relatedConcepts" TEXT NOT NULL,
    "relationships" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL DEFAULT 0.5,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" DATETIME,
    "nextReviewDate" DATETIME,
    "conversationId" TEXT NOT NULL,
    CONSTRAINT "Concept_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Concept" ("category", "confidenceScore", "conversationId", "details", "examples", "id", "keyPoints", "lastReviewed", "lastUpdated", "nextReviewDate", "relatedConcepts", "relationships", "reviewCount", "summary", "title") SELECT "category", "confidenceScore", "conversationId", "details", "examples", "id", "keyPoints", "lastReviewed", "lastUpdated", "nextReviewDate", "relatedConcepts", "relationships", "reviewCount", "summary", "title" FROM "Concept";
DROP TABLE "Concept";
ALTER TABLE "new_Concept" RENAME TO "Concept";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
