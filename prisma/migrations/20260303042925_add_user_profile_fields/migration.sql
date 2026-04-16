-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL DEFAULT 'Krearte',
    "storeEmail" TEXT NOT NULL DEFAULT 'hello@krearte.com',
    "storePhone" TEXT,
    "storeAddress" TEXT,
    "storeDescription" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "instagram" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5000000,
    "domesticShippingRate" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "internationalShippingRate" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "processingTime" TEXT NOT NULL DEFAULT '3-5',
    "metaTitle" TEXT NOT NULL DEFAULT 'Krearte | Luxury Wallcoverings',
    "metaDescription" TEXT,
    "keywords" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
