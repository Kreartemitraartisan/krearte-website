// scripts/update-product-prices.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductPrices() {
  const products = await prisma.product.findMany({
    where: {
      availableMaterialIds: {
        not: [],
      },
    },
  });

  console.log(`Found ${products.length} products to update`);

  for (const product of products) {
    const materials = await prisma.material.findMany({
      where: {
        id: {
          in: product.availableMaterialIds,
        },
      },
      select: {
        pricePerM2: true,
      },
    });

    if (materials.length > 0) {
      const prices = materials.map(m => m.pricePerM2);
      const minPrice = Math.min(...prices);

      await prisma.product.update({
        where: { id: product.id },
        data: { price: minPrice },
      });

      console.log(`✅ Updated ${product.name}: Rp ${minPrice}`);
    }
  }

  console.log('Done!');
}

updateProductPrices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());