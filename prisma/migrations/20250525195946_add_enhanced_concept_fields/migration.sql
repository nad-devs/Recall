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
    "masteryLevel" TEXT,
    "learningProgress" INTEGER NOT NULL DEFAULT 0,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" DATETIME,
    "difficultyRating" INTEGER,
    "timeToMaster" INTEGER,
    "videoResources" TEXT NOT NULL DEFAULT '[]',
    "documentationLinks" TEXT NOT NULL DEFAULT '[]',
    "practiceExercises" TEXT NOT NULL DEFAULT '[]',
    "realWorldExamples" TEXT NOT NULL DEFAULT '[]',
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "personalNotes" TEXT,
    "mnemonics" TEXT,
    "commonMistakes" TEXT NOT NULL DEFAULT '[]',
    "personalExamples" TEXT NOT NULL DEFAULT '[]',
    "learningTips" TEXT NOT NULL DEFAULT '[]',
    "useCases" TEXT NOT NULL DEFAULT '[]',
    "industries" TEXT NOT NULL DEFAULT '[]',
    "tools" TEXT NOT NULL DEFAULT '[]',
    "projectsUsedIn" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "personalRating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Concept_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Concept" ("category", "confidenceScore", "conversationId", "details", "examples", "id", "isPlaceholder", "keyPoints", "lastReviewed", "lastUpdated", "nextReviewDate", "relatedConcepts", "relationships", "reviewCount", "summary", "title") SELECT "category", "confidenceScore", "conversationId", "details", "examples", "id", "isPlaceholder", "keyPoints", "lastReviewed", "lastUpdated", "nextReviewDate", "relatedConcepts", "relationships", "reviewCount", "summary", "title" FROM "Concept";
DROP TABLE "Concept";
ALTER TABLE "new_Concept" RENAME TO "Concept";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
