import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating products with materials...');

  // Get all materials
  const allMaterials = await prisma.material.findMany();
  console.log(`📦 Found ${allMaterials.length} materials`);

  // Get material IDs by category
  const pvcMaterials = allMaterials
    .filter(m => m.category === 'PVC Wallcoverings')
    .map(m => m.id);

  const metallicMaterials = allMaterials
    .filter(m => m.category === 'Metallic Collection')
    .map(m => m.id);

  // Update each product
  const products = await prisma.product.findMany();
  console.log(`📦 Found ${products.length} products`);

  for (const product of products) {
    // Semua product bisa di semua materials KECUALI Custom Print
    const availableIds = [...pvcMaterials, ...metallicMaterials];
    
    // Recommended based on price
    const recommendedIds: string[] = [];
    
    if (product.price >= 155000) {
      // High-end: recommend Metallic
      const japaneseSilk = metallicMaterials.find(id => 
        allMaterials.find(m => m.id === id)?.name.includes('Japanese Silk')
      );
      const abstractEmbossing = metallicMaterials.find(id =>
        allMaterials.find(m => m.id === id)?.name.includes('Abstract Embossing')
      );
      
      if (japaneseSilk) recommendedIds.push(japaneseSilk);
      if (abstractEmbossing) recommendedIds.push(abstractEmbossing);
    }
    
    // Always recommend PVC Standard
    const pvcStandard = pvcMaterials.find(id =>
      allMaterials.find(m => m.id === id)?.name.includes('PVC Standard')
    );
    if (pvcStandard) recommendedIds.push(pvcStandard);

    // Update product
    await prisma.product.update({
      where: { id: product.id },
      data: {
        availableMaterialIds: availableIds,
        recommendedMaterialIds: recommendedIds.slice(0, 3),
      },
    });

    console.log(`✅ Updated: ${product.name}`);
    console.log(`   Available: ${availableIds.length} materials`);
    console.log(`   Recommended: ${recommendedIds.slice(0, 3).length} materials`);
  }

  console.log('\n✨ Update complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });