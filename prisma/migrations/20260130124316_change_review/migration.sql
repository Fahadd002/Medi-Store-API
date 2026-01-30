/*
  Warnings:

  - You are about to drop the column `price` on the `medicines` table. All the data in the column will be lost.
  - Added the required column `basePrice` to the `medicines` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- DropIndex
DROP INDEX "reviews_rating_idx";

-- AlterTable
ALTER TABLE "medicines" DROP COLUMN "price",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "discountPercent" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "sellerId" TEXT,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
