/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "numero" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_numero_key" ON "Receipt"("numero");
