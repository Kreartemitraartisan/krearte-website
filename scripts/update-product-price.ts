// scripts/update-product-prices.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateProductPrices() {
  try {
    console.log("🚀 Starting product price update...\n");

    // Ambil semua product yang punya material
    const products = await prisma.product.findMany({
      where: {
        availableMaterialIds: {
          isEmpty: false,
        },
      },
    });

    console.log(`📦 Found ${products.length} products to update\n`);

    for (const product of products) {
      console.log(`🔄 Processing: ${product.name}`);

      // Ambil semua material yang terkait
      const materials = await prisma.material.findMany({
        where: {
          id: {
            in: product.availableMaterialIds,
          },
        },
        select: {
          pricePerM2: true,
          designerPricePerM2: true,
          resellerPricePerM2: true,
        },
      });

      if (!materials || materials.length === 0) {
        console.log(`⚠️ No materials found for ${product.name}, skipping...\n`);
        continue;
      }

      // Ambil semua kemungkinan harga
      const prices = materials
        .flatMap((m) => [
          m.pricePerM2,
          ...(m.designerPricePerM2 ? [m.designerPricePerM2] : []),
          ...(m.resellerPricePerM2 ? [m.resellerPricePerM2] : []),
        ])
        .filter((p): p is number => typeof p === "number" && p > 0);

      if (prices.length === 0) {
        console.log(`⚠️ No valid prices for ${product.name}, skipping...\n`);
        continue;
      }

      const minPrice = Math.min(...prices);

      // Update product price
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: minPrice,
        },
      });

      console.log(
        `✅ Updated "${product.name}" → Rp ${minPrice.toLocaleString("id-ID")}/m²\n`
      );
    }

    console.log("🎉 DONE! All product prices updated successfully.\n");
  } catch (error) {
    console.error("❌ Error updating product prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
updateProductPrices();