/*
  Warnings:

  - You are about to drop the column `category` on the `GroceryListItem` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the [PantryItem](cci:1://file:///c:/myProjects/windsurf-test/21menus/web/src/components/PantryItemsCell/PantryItemsCell.tsx:173:0-279:1) table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Manually added SQL for data migration --
-- Populate the Category table with all distinct categories from existing tables.
INSERT INTO "Category" (name, "createdAt", "updatedAt")
SELECT DISTINCT category, datetime('now'), datetime('now') FROM "PantryItem" WHERE category IS NOT NULL
UNION
SELECT DISTINCT category, datetime('now'), datetime('now') FROM "GroceryListItem" WHERE category IS NOT NULL;
-- End of manually added SQL --

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Modify GroceryListItem
CREATE TABLE "new_GroceryListItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "GroceryListItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- This is the MODIFIED insert statement. It now populates categoryId.
INSERT INTO "new_GroceryListItem" ("createdAt", "id", "name", "purchased", "updatedAt", "categoryId")
SELECT
  "createdAt",
  "id",
  "name",
  "purchased",
  "updatedAt",
  (SELECT id FROM "Category" WHERE "Category".name = "GroceryListItem".category)
FROM "GroceryListItem";
DROP TABLE "GroceryListItem";
ALTER TABLE "new_GroceryListItem" RENAME TO "GroceryListItem";

-- Modify PantryItem
CREATE TABLE "new_PantryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "order" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'InStock',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "PantryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- This is the MODIFIED insert statement. It now populates categoryId.
INSERT INTO "new_PantryItem" ("createdAt", "id", "name", "notes", "order", "quantity", "status", "updatedAt", "categoryId")
SELECT
  "createdAt",
  "id",
  "name",
  "notes",
  "order",
  "quantity",
  "status",
  "updatedAt",
  (SELECT id FROM "Category" WHERE "Category".name = "PantryItem".category)
FROM "PantryItem";
DROP TABLE "PantryItem";
ALTER TABLE "new_PantryItem" RENAME TO "PantryItem";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
