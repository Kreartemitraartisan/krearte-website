import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update Designer-Collection products
  const updated = await prisma.product.updateMany({
    where: {
      category: {
        in: ['Designer-Collection', 'Designer Collection', 'designer-collection']
      }
    },
    data: {
      category: 'designer',
      collectionType: 'designer'
    }
  })
  
  console.log(`✅ Updated ${updated.count} products`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())