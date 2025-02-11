/*
  Warnings:

  - You are about to drop the column `groupId` on the `Note` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN "categories" TEXT;
ALTER TABLE "Book" ADD COLUMN "pageCount" INTEGER;
ALTER TABLE "Book" ADD COLUMN "subtitle" TEXT;
ALTER TABLE "Book" ADD COLUMN "textSnippet" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("bookId", "content", "createdAt", "id", "updatedAt", "userId") SELECT "bookId", "content", "createdAt", "id", "updatedAt", "userId" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
