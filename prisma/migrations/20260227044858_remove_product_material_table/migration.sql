/*
  Warnings:

  - You are about to drop the column `price` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `ProductMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductMaterial" DROP CONSTRAINT "ProductMaterial_materialId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaterial" DROP CONSTRAINT "ProductMaterial_productId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "price",
DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availableMaterialIds" TEXT[],
ADD COLUMN     "recommendedMaterialIds" TEXT[];

-- DropTable
DROP TABLE "ProductMaterial";
