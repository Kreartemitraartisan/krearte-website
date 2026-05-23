/*
  Warnings:

  - You are about to drop the column `recommendedMaterials` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "areaM2" DOUBLE PRECISION,
ADD COLUMN     "is25DAddOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "materialId" TEXT,
ADD COLUMN     "materialName" TEXT,
ADD COLUMN     "pricePerM2" DOUBLE PRECISION,
ADD COLUMN     "wasteCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "recommendedMaterials",
ADD COLUMN     "is25DEligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "width" TEXT,
    "pricePerM2" DOUBLE PRECISION NOT NULL,
    "samplePriceA3" DOUBLE PRECISION NOT NULL,
    "waste" DOUBLE PRECISION NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL,
    "is25DEligible" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMaterial" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductMaterial_productId_materialId_key" ON "ProductMaterial"("productId", "materialId");

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
