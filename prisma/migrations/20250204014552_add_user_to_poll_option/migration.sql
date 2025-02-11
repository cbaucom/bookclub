/*
  Warnings:

  - Added the required column `userId` to the `PollOption` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "round" INTEGER,
    "matchup" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollOption_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PollOption" ("bookId", "createdAt", "id", "matchup", "pollId", "round", "updatedAt") SELECT "bookId", "createdAt", "id", "matchup", "pollId", "round", "updatedAt" FROM "PollOption";
DROP TABLE "PollOption";
ALTER TABLE "new_PollOption" RENAME TO "PollOption";
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");
CREATE INDEX "PollOption_bookId_idx" ON "PollOption"("bookId");
CREATE INDEX "PollOption_userId_idx" ON "PollOption"("userId");
CREATE UNIQUE INDEX "PollOption_pollId_bookId_key" ON "PollOption"("pollId", "bookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
