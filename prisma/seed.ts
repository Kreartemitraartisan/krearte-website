import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ==================== CLEAR EXISTING DATA ====================
  console.log("🗑️  Clearing existing data...");
  
  try {
    await prisma.user.deleteMany();
    console.log("  ✓ Cleared Users");
  } catch (e) {
    console.log("  - Skipped Users");
  }
  
  try {
    await prisma.material.deleteMany();
    console.log("  ✓ Cleared Materials");
  } catch (e) {
    console.log("  - Skipped Materials");
  }

  // ==================== CREATE MATERIALS ====================
  console.log("\n📦 Creating materials from Pricelist 2026...");

  const materials = await Promise.all([
    // ==================== PVC WALLCOVERINGS ====================
    prisma.material.create({
      data: {
        id: "smooth-sand-krearte-bst-8626-7",
        name: "Smooth Sand Krearte-BST 8626-7",
        category: "PVC Wallcoverings",
        width: "1.06",
        pricePerM2: 345000,
        designerPricePerM2: 285000,
        resellerPricePerM2: 215000,
        samplePriceA3: 50000,
        waste: 60000,
        stock: 1000,
        is25DEligible: false,
        description: "Smooth sand texture, standard PVC wallcovering",
      },
    }),
    prisma.material.create({
      data: {
        id: "industrial-krearte-bst-8622-1",
        name: "Industrial Krearte-BST 8622-1",
        category: "PVC Wallcoverings",
        width: "1.06",
        pricePerM2: 345000,
        designerPricePerM2: 285000,
        resellerPricePerM2: 215000,
        samplePriceA3: 50000,
        waste: 60000,
        stock: 1000,
        is25DEligible: false,
        description: "Industrial texture, standard PVC wallcovering",
      },
    }),
    
    // ==================== METALLIC COLLECTION ====================
    prisma.material.create({
      data: {
        id: "straw-raw-texture-metallic-de030k",
        name: "Straw Raw Texture Metallic DE030K",
        category: "Metallic Collection",
        width: "1.07",
        pricePerM2: 400000,
        designerPricePerM2: 315000,
        resellerPricePerM2: 240000,
        samplePriceA3: 65000,
        waste: 80000,
        stock: 500,
        is25DEligible: true,
        description: "Straw raw texture with metallic finish",
      },
    }),
    prisma.material.create({
      data: {
        id: "straw-raw-texture-metallic-flx-de030k",
        name: "Straw Raw Texture Metallic FLX DE030K",
        category: "Metallic Collection",
        width: "1.07",
        pricePerM2: 450000,
        designerPricePerM2: 350000,
        resellerPricePerM2: 285000,
        samplePriceA3: 65000,
        waste: 80000,
        stock: 500,
        is25DEligible: true,
        description: "Straw raw texture with flexible metallic finish",
      },
    }),
    prisma.material.create({
      data: {
        id: "abstract-embossing-metallic-wp137-silver",
        name: "Abstract Embossing Texture-Metallic WP137-Silver 01",
        category: "Metallic Collection",
        width: "1.37",
        pricePerM2: 750000,
        designerPricePerM2: 600000,
        resellerPricePerM2: 400000,
        samplePriceA3: 65000,
        waste: 90000,
        stock: 300,
        is25DEligible: true,
        description: "Abstract embossing texture with silver metallic",
      },
    }),
    prisma.material.create({
      data: {
        id: "silver-gold-metallic-pgs-pss-01",
        name: "Silver/Gold Metallic PGS/PSS 01",
        category: "Metallic Collection",
        width: "1.07",
        pricePerM2: 500000,
        designerPricePerM2: 400000,
        resellerPricePerM2: 250000,
        samplePriceA3: 65000,
        waste: 80000,
        stock: 400,
        is25DEligible: true,
        description: "Silver/Gold metallic finish (NON JOIN INSTALLATION)",
      },
    }),
    prisma.material.create({
      data: {
        id: "metallic-silver-japanese-silk-l137",
        name: "Metallic Silver Japanese Silk L137 XQ-4097",
        category: "Metallic Collection",
        width: "1.37",
        pricePerM2: 860000,
        designerPricePerM2: 750000,
        resellerPricePerM2: 520000,
        samplePriceA3: 65000,
        waste: 200000,
        stock: 200,
        is25DEligible: true,
        description: "Premium Japanese silk with metallic silver",
      },
    }),
    
    // ==================== NON-WOVEN WALLPAPER ====================
    prisma.material.create({
      data: {
        id: "white-creamy-raw-texture-nonwoven",
        name: "White or Creamy Raw Texture Non Woven XQ-4011/XQ-4030",
        category: "Non-Woven Wallpaper",
        width: "1.37",
        pricePerM2: 450000,
        designerPricePerM2: 350000,
        resellerPricePerM2: 285000,
        samplePriceA3: 75000,
        waste: 115000,
        stock: 600,
        is25DEligible: true,
        description: "Raw texture non-woven wallpaper, white or creamy",
      },
    }),
    
    // ==================== SELF-ADHESIVE WALLPAPER ====================
    prisma.material.create({
      data: {
        id: "art-fabric-dx340a-e2",
        name: "Art Fabric DX340A-E2",
        category: "Self-Adhesive Wallpaper",
        width: "1.52",
        pricePerM2: 335000,
        designerPricePerM2: 285000,
        resellerPricePerM2: 200000,
        samplePriceA3: 50000,
        waste: 90000,
        stock: 500,
        is25DEligible: false,
        description: "Self-adhesive art fabric wallpaper",
      },
    }),
    
    // ==================== LINEN COLLECTION ====================
    prisma.material.create({
      data: {
        id: "linen-375",
        name: "Linen 375",
        category: "Linen Collection",
        width: "1.26",
        pricePerM2: 375000,
        designerPricePerM2: 300000,
        resellerPricePerM2: 225000,
        samplePriceA3: 75000,
        waste: 70000,
        stock: 300,
        is25DEligible: false,
        description: "Linen texture (While Stock Last!)",
      },
    }),
    
    // ==================== PLAIN SMOOTH ====================
    prisma.material.create({
      data: {
        id: "plain-smooth-n3001",
        name: "Plain Smooth N3001",
        category: "Plain Smooth",
        width: "1.26",
        pricePerM2: 300000,
        designerPricePerM2: 250000,
        resellerPricePerM2: 195000,
        samplePriceA3: 75000,
        waste: 50000,
        stock: 400,
        is25DEligible: false,
        description: "Plain smooth texture (While Stock Last!)",
      },
    }),
    
    // ==================== FABRIC BACK WALLPAPER ====================
    prisma.material.create({
      data: {
        id: "cross-hatch-linen-m69",
        name: "Cross Hatch Linen M69",
        category: "Fabric Back Wallpaper",
        width: "1.40",
        pricePerM2: 385000,
        designerPricePerM2: 330000,
        resellerPricePerM2: 230000,
        samplePriceA3: 75000,
        waste: 80000,
        stock: 350,
        is25DEligible: true,
        description: "Cross hatch linen fabric back wallpaper",
      },
    }),
    prisma.material.create({
      data: {
        id: "fine-sand-texture-m70",
        name: "Fine Sand Texture M70",
        category: "Fabric Back Wallpaper",
        width: "1.40",
        pricePerM2: 385000,
        designerPricePerM2: 330000,
        resellerPricePerM2: 230000,
        samplePriceA3: 75000,
        waste: 80000,
        stock: 350,
        is25DEligible: true,
        description: "Fine sand texture fabric back wallpaper",
      },
    }),
    
    // ==================== STANDARD WALLPAPER ====================
    prisma.material.create({
      data: {
        id: "wallpaper-standard-pvc",
        name: "Wallpaper Standard (PVC Coated on Paper Back)",
        category: "Standard Wallpaper",
        width: "1.2/1.38/1.59/2.78",
        pricePerM2: 175000,
        designerPricePerM2: 140000,
        resellerPricePerM2: 105000,
        samplePriceA3: 50000,
        waste: 80000,
        stock: 1000,
        is25DEligible: true,
        description: "Standard PVC coated wallpaper with various widths",
      },
    }),
    prisma.material.create({
      data: {
        id: "special-effect-wallpaper-pvc",
        name: "Special Effect Wallpaper (PVC Coated on Paper Back)",
        category: "Special Effect Wallpaper",
        width: "1.2/1.38/1.59/2.78",
        pricePerM2: 200000,
        designerPricePerM2: 160000,
        resellerPricePerM2: 120000,
        samplePriceA3: 65000,
        waste: 80000,
        stock: 800,
        is25DEligible: true,
        description: "Special effect PVC coated wallpaper",
      },
    }),
    
    // ==================== SERVICES ====================
    prisma.material.create({
      data: {
        id: "jasa-print-bahan-customer",
        name: "Jasa Print - Bahan dari Customer",
        category: "Service",
        width: null,
        pricePerM2: 200000,
        designerPricePerM2: 200000,
        resellerPricePerM2: 200000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Printing service using customer's own material",
      },
    }),
    prisma.material.create({
      data: {
        id: "jasa-print-bahan-standard",
        name: "Jasa Print - Bahan Standard",
        category: "Service",
        width: null,
        pricePerM2: 135000,
        designerPricePerM2: 135000,
        resellerPricePerM2: 135000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Printing service using standard material",
      },
    }),
    prisma.material.create({
      data: {
        id: "jasa-print-karpet-roller-blind",
        name: "Jasa Print - Karpet / Roller Blind",
        category: "Service",
        width: null,
        pricePerM2: 250000,
        designerPricePerM2: 250000,
        resellerPricePerM2: 250000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Printing service for carpet or roller blind",
      },
    }),
    prisma.material.create({
      data: {
        id: "jasa-design-1-hari",
        name: "Jasa Design/Re-draw - 1 Hari",
        category: "Service",
        width: null,
        pricePerM2: 150000,
        designerPricePerM2: 150000,
        resellerPricePerM2: 150000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Design or re-draw service - 1 day turnaround",
      },
    }),
    prisma.material.create({
      data: {
        id: "jasa-design-1-minggu",
        name: "Jasa Design/Re-draw - 1 Minggu",
        category: "Service",
        width: null,
        pricePerM2: 900000,
        designerPricePerM2: 900000,
        resellerPricePerM2: 900000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Design or re-draw service - 1 week turnaround",
      },
    }),
    prisma.material.create({
      data: {
        id: "jasa-design-2-minggu",
        name: "Jasa Design/Re-draw - 2 Minggu",
        category: "Service",
        width: null,
        pricePerM2: 1800000,
        designerPricePerM2: 1800000,
        resellerPricePerM2: 1800000,
        samplePriceA3: 0,
        waste: 0,
        stock: 999999,
        is25DEligible: false,
        description: "Design or re-draw service - 2 weeks turnaround",
      },
    }),
  ]);

  // Tambahkan di seed.ts setelah create materials

// ==================== CREATE PRODUCTS & LINK MATERIALS ====================
  console.log("\n🎨 Creating products and linking materials...");

  const dreamySkyProduct = await prisma.product.upsert({
    where: { slug: "dreamy-sky" },
    update: {
      name: "Dreamy Sky",
      description: "Beautiful night sky design with moon and stars...",
      category: "wallcovering",
      price: 345000,
      images: ["/images/dreamy-sky.jpg"],
      collectionType: "wallcovering",
      is25DEligible: true,
      availableMaterialIds: [
        "smooth-sand-krearte-bst-8626-7",
        "industrial-krearte-bst-8622-1",
        "straw-raw-texture-metallic-de030k",
      ],
      recommendedMaterialIds: ["smooth-sand-krearte-bst-8626-7"],
    },
    create: {
      slug: "dreamy-sky", // ⚠️ slug hanya di create, tidak di update
      name: "Dreamy Sky",
      description: "Beautiful night sky design with moon and stars...",
      category: "wallcovering",
      price: 345000,
      images: ["/images/dreamy-sky.jpg"],
      collectionType: "wallcovering",
      is25DEligible: true,
      availableMaterialIds: [
        "smooth-sand-krearte-bst-8626-7",
        "industrial-krearte-bst-8622-1",
        "straw-raw-texture-metallic-de030k",
      ],
      recommendedMaterialIds: ["smooth-sand-krearte-bst-8626-7"],
    },
  });

  console.log("✅ Created product:", dreamySkyProduct.name);

  console.log(`✅ Created ${materials.length} materials`);

  // ==================== CREATE USERS ====================
  console.log("\n👤 Creating users...");

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const designerPassword = await bcrypt.hash("designer123", 10);
  const resellerPassword = await bcrypt.hash("reseller123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@krearte.com",
        name: "Krearte Admin",
        password: hashedPassword,
        role: "admin",
        phone: "+62 812 3456 7890",
        address: "Jl. Sudirman No. 123, Jakarta",
        city: "Jakarta",
        postalCode: "12190",
      },
    }),
    prisma.user.create({
      data: {
        email: "designer@krearte.com",
        name: "Sample Designer",
        password: designerPassword,
        role: "designer",
        phone: "+62 812 3456 7891",
        address: "Jl. Design No. 456, Jakarta",
        city: "Jakarta",
        postalCode: "12191",
      },
    }),
    prisma.user.create({
      data: {
        email: "reseller@krearte.com",
        name: "Sample Reseller",
        password: resellerPassword,
        role: "reseller",
        phone: "+62 812 3456 7892",
        address: "Jl. Reseller No. 789, Jakarta",
        city: "Jakarta",
        postalCode: "12192",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ==================== SUMMARY ====================
  console.log("\n🎉 Database seed completed!");
  console.log("\n📊 Summary:");
  console.log(`  - Materials: ${materials.length}`);
  console.log(`  - Users: ${users.length}`);
  console.log("\n🔐 Login credentials:");
  console.log("  Admin:");
  console.log("    Email: admin@krearte.com");
  console.log("    Password: admin123");
  console.log("  Designer:");
  console.log("    Email: designer@krearte.com");
  console.log("    Password: designer123");
  console.log("  Reseller:");
  console.log("    Email: reseller@krearte.com");
  console.log("    Password: reseller123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });