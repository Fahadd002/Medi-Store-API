/*
  Warnings:

  - The values [REFUNDED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CARD,UPI,NET_BANKING] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdBy` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `dosageForm` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `isPrescription` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `packaging` on the `medicines` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerNotes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `finalAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `placedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reviews` table. All the data in the column will be lost.
  - Made the column `orderId` on table `reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PLACED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH_ON_DELIVERY');
ALTER TABLE "public"."orders" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH_ON_DELIVERY';
COMMIT;

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_fkey";

-- DropIndex
DROP INDEX "categories_isActive_idx";

-- DropIndex
DROP INDEX "categories_name_idx";

-- DropIndex
DROP INDEX "medicines_isActive_idx";

-- DropIndex
DROP INDEX "medicines_manufacturer_idx";

-- DropIndex
DROP INDEX "medicines_price_idx";

-- DropIndex
DROP INDEX "order_items_sellerId_idx";

-- DropIndex
DROP INDEX "orders_createdAt_idx";

-- DropIndex
DROP INDEX "orders_orderNumber_idx";

-- DropIndex
DROP INDEX "reviews_customerId_idx";

-- DropIndex
DROP INDEX "reviews_orderId_idx";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "createdBy",
DROP COLUMN "imageUrl",
DROP COLUMN "isActive",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "medicines" DROP COLUMN "dosageForm",
DROP COLUMN "imageUrl",
DROP COLUMN "isPrescription",
DROP COLUMN "packaging";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "sellerId",
DROP COLUMN "subtotal",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "cancelledAt",
DROP COLUMN "customerNotes",
DROP COLUMN "customerPhone",
DROP COLUMN "deliveredAt",
DROP COLUMN "discount",
DROP COLUMN "finalAmount",
DROP COLUMN "paymentStatus",
DROP COLUMN "placedAt",
DROP COLUMN "processedAt",
DROP COLUMN "shippedAt",
DROP COLUMN "shippingFee";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "updatedAt",
ALTER COLUMN "rating" DROP DEFAULT,
ALTER COLUMN "orderId" SET NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
