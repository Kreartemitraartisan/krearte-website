-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "collectionType" TEXT NOT NULL DEFAULT 'wallcovering',
ADD COLUMN     "recommendedMaterials" TEXT[];
