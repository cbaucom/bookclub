/*
  Warnings:

  - You are about to alter the column `rating` on the `Rating` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - Added the required column `groupId` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("bookId", "content", "createdAt", "id", "updatedAt", "userId") SELECT "bookId", "content", "createdAt", "id", "updatedAt", "userId" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_bookId_idx" ON "Note"("bookId");
CREATE INDEX "Note_groupId_idx" ON "Note"("groupId");
CREATE INDEX "Note_userId_idx" ON "Note"("userId");
CREATE UNIQUE INDEX "Note_userId_bookId_key" ON "Note"("userId", "bookId");
CREATE TABLE "new_Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rating" ("bookId", "createdAt", "id", "rating", "review", "updatedAt", "userId") SELECT "bookId", "createdAt", "id", "rating", "review", "updatedAt", "userId" FROM "Rating";
DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";
CREATE INDEX "Rating_bookId_idx" ON "Rating"("bookId");
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");
CREATE UNIQUE INDEX "Rating_bookId_userId_key" ON "Rating"("bookId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
