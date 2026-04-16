import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed materials...');

  const materialsData = [
    {
      name: 'PVC Standard - Smooth Sand',
      category: 'PVC Wallcoverings',
      width: '1.06m',
      pricePerM2: 345000,
      samplePriceA3: 50000,
      waste: 60000,
      stock: 1000,
      is25DEligible: false,
      description: 'Krearte-BST 8626-7',
    },
    {
      name: 'PVC Standard - Industrial',
      category: 'PVC Wallcoverings',
      width: '1.06m',
      pricePerM2: 345000,
      samplePriceA3: 50000,
      waste: 60000,
      stock: 1000,
      is25DEligible: false,
      description: 'Krearte-BST 8622-1',
    },
    {
      name: 'Straw Raw Texture Metallic DE030K',
      category: 'Metallic Collection',
      width: '1.07m',
      pricePerM2: 400000,
      samplePriceA3: 65000,
      waste: 80000,
      stock: 500,
      is25DEligible: false,
      description: 'Gold/Flex metallic',
    },
    {
      name: 'Straw Raw Texture Metallic FLX DE030K',
      category: 'Metallic Collection',
      width: '1.07m',
      pricePerM2: 450000,
      samplePriceA3: 65000,
      waste: 80000,
      stock: 500,
      is25DEligible: false,
      description: 'Flexible metallic',
    },
    {
      name: 'Abstract Embossing Texture Metallic',
      category: 'Metallic Collection',
      width: '1.37m',
      pricePerM2: 750000,
      samplePriceA3: 65000,
      waste: 90000,
      stock: 300,
      is25DEligible: true,
      description: 'Silver - WP137-Silver 01',
    },
    {
      name: 'Silver/Gold Metallic',
      category: 'Metallic Collection',
      width: '1.07m',
      pricePerM2: 500000,
      samplePriceA3: 65000,
      waste: 80000,
      stock: 400,
      is25DEligible: false,
      description: 'PGS/PSS 01 - NON JOIN INSTALLATION',
    },
    {
      name: 'Metallic Silver Japanese Silk',
      category: 'Metallic Collection',
      width: '1.37m',
      pricePerM2: 860000,
      samplePriceA3: 65000,
      waste: 200000,
      stock: 200,
      is25DEligible: false,
      description: 'L137 XQ-4097',
    },
    {
      name: 'Non-Woven - White or Creamy',
      category: 'PVC Wallcoverings',
      width: '1.37m',
      pricePerM2: 450000,
      samplePriceA3: 75000,
      waste: 115000,
      stock: 800,
      is25DEligible: false,
      description: 'XQ-4011/XQ-4030',
    },
    {
      name: 'Self Adhesive - Art Fabric',
      category: 'PVC Wallcoverings',
      width: '1.52m',
      pricePerM2: 335000,
      samplePriceA3: 50000,
      waste: 90000,
      stock: 600,
      is25DEligible: false,
      description: 'DX340A-E2',
    },
    {
      name: 'Linen Texture',
      category: 'PVC Wallcoverings',
      width: null,
      pricePerM2: 375000,
      samplePriceA3: 75000,
      waste: 70000,
      stock: 200,
      is25DEligible: false,
      description: 'While stock last!',
    },
    {
      name: 'Plain Smooth',
      category: 'PVC Wallcoverings',
      width: '1.26m',
      pricePerM2: 300000,
      samplePriceA3: 50000,
      waste: 50000,
      stock: 300,
      is25DEligible: false,
      description: 'N3001 - While stock last!',
    },
    {
      name: 'Fabric Back - Cross Hatch Linen',
      category: 'PVC Wallcoverings',
      width: '1.40m',
      pricePerM2: 385000,
      samplePriceA3: 75000,
      waste: 80000,
      stock: 500,
      is25DEligible: false,
      description: 'M69',
    },
    {
      name: 'Fabric Back - Fine Sand Texture',
      category: 'PVC Wallcoverings',
      width: '1.40m',
      pricePerM2: 385000,
      samplePriceA3: 75000,
      waste: 80000,
      stock: 500,
      is25DEligible: false,
      description: 'M70',
    },
  ];

  // ✅ FIX 1: Create materials dengan syntax yang benar
  for (const materialData of materialsData) {
    await prisma.material.create({
      data: materialData,  // ← Harus pakai "data:"
    });
    console.log(`✅ Created: ${materialData.name}`);
  }

  console.log(`\n🎉 Created ${materialsData.length} materials!`);

  // Link products with materials
  const products = await prisma.product.findMany();
  const allMaterials = await prisma.material.findMany();

  console.log('\n🔗 Linking products with materials...');

  // ✅ FIX 2: Loop yang benar
  for (const product of products) {
    // Determine recommended materials
    const recommendedIds: string[] = [];
    
    // Always recommend PVC Standard
    const pvcStandard = allMaterials.find(m => m.name.includes('PVC Standard'));
    if (pvcStandard) recommendedIds.push(pvcStandard.id);
    
    // Recommend Non-Woven for mid-range
    if (product.price >= 125000 && product.price < 155000) {
      const nonWoven = allMaterials.find(m => m.name.includes('Non-Woven'));
      if (nonWoven) recommendedIds.push(nonWoven.id);
    }
    
    // Recommend Metallic for high-end
    if (product.price >= 155000) {
      const japaneseSilk = allMaterials.find(m => m.name.includes('Japanese Silk'));
      if (japaneseSilk) recommendedIds.push(japaneseSilk.id);
    }

    // ✅ FIX 3: Create relations dengan syntax yang benar
    for (const material of allMaterials) {
      await prisma.productMaterial.create({
        data: {  // ← Harus pakai "data:"
          productId: product.id,
          materialId: material.id,
          isRecommended: recommendedIds.includes(material.id),
        },
      });
    }

    console.log(`✅ Linked: ${product.name}`);
  }

  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });