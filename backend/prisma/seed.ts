import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AgriNexus database...");

  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.dealerResponse.deleteMany();
  await prisma.cropPost.deleteMany();
  await prisma.cropAnalysis.deleteMany();
  await prisma.dealerProfile.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();


  const passwordHash = await bcrypt.hash("farmer123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const farmer1 = await prisma.user.create({
    data: {
      name: "Ramesh Kumar",
      email: "ramesh@farmer.com",
      phone: "+919437123456",
      passwordHash,
      role: "FARMER",
      location: "Pune, Maharashtra",
      preferredLanguage: "or",
      farmerProfile: {
        create: {
          farmName: "Ramesh Organic Paddy Farm",
          farmSize: 3.5,
          location: "Salepur, Cuttack",
          district: "Pune",
          state: "Maharashtra",
          primaryCrops: "Paddy, Tomato, Vegetables",
          soilType: "Alluvial Loam",
        },
      },
    },
  });

  const dealer1 = await prisma.user.create({
    data: {
      name: "Pradeep Agro",
      email: "dealer@odishaagro.com",
      phone: "+919861011223",
      passwordHash,
      role: "DEALER",
      location: "Pune, Maharashtra",
      dealerProfile: {
        create: {
          businessName: "Odisha Agro Center",
          businessAddress: "FC Road, Pune, Maharashtra 411004",
          phone: "+919861011223",
          whatsappNumber: "919861011223",
          specialization: "Bio-Fertilizers & Crop Protection",
          products: "Neem Oil, Trichoderma, NPK",
          location: "Pune, Maharashtra",
          district: "Pune",
          state: "Maharashtra",
          verificationStatus: "VERIFIED",
        },
      },
    },
    include: { dealerProfile: true },
  });

  await prisma.user.create({
    data: {
      name: "AgriNexus Admin",
      email: "admin@agrinexus.ai",
      phone: "+919800000000",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      location: "New Delhi, Delhi",
    },
  });

  const products = [
    {
      name: "Pure Cold Pressed Organic Neem Oil (10,000 PPM) - 1 Litre",
      category: "Bio-Pesticide",
      brand: "Katyayani Organics",
      description: "Natural organic pest repellent for sucking insects, caterpillars, paddy, cotton, and vegetables.",
      price: 499,
      imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80",
      purchaseUrl: "https://www.amazon.in/s?k=organic+neem+oil+pest+control+plants",
      recommendedFor: "Rice Blast, Whitefly, Aphids, Pest Damage, Tomato Early Blight",
    },
    {
      name: "Trichoderma Viride Bio-Fungicide (1% WP) - 1 Kg",
      category: "Bio-Fungicide",
      brand: "Multiplex Bio-Tech",
      description: "Beneficial biocontrol fungus that protects root zone from blast and root rot.",
      price: 280,
      imageUrl: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=600&auto=format&fit=crop&q=80",
      purchaseUrl: "https://www.flipkart.com/search?q=trichoderma+viride+bio+fungicide",
      recommendedFor: "Rice Blast, Root Rot, Damping Off, Fungal Infection",
    },
    {
      name: "100% Water Soluble NPK 19-19-19 Balanced Fertilizer - 1 Kg",
      category: "Fertilizer",
      brand: "IFFCO / Utkarsh",
      description: "Balanced essential macronutrients for rapid vegetative growth and healthy green tillers.",
      price: 240,
      imageUrl: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80",
      purchaseUrl: "https://www.amazon.in/s?k=npk+19+19+19+water+soluble+fertilizer",
      recommendedFor: "Nitrogen Deficiency, Low Potassium, Rice, Tomato",
    },
    {
      name: "Double Sided Yellow Sticky Traps for Sucking Pests (Pack of 25)",
      category: "Pest Management",
      brand: "AgraPlast",
      description: "Glue-coated weatherproof yellow sheets that catch whiteflies and thrips.",
      price: 349,
      imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=600&auto=format&fit=crop&q=80",
      purchaseUrl: "https://www.flipkart.com/search?q=yellow+sticky+traps+for+agriculture",
      recommendedFor: "Whitefly, Cotton Leaf Curl, Thrips, Aphids",
    },
    {
      name: "Pure 100% Organic Vermicompost Fertilizer - 5 Kg",
      category: "Organic Soil Conditioner",
      brand: "TrustBasket Organics",
      description: "Enriched with microorganisms and humic acid to loosen soil and boost fertility.",
      price: 380,
      imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80",
      purchaseUrl: "https://www.amazon.in/s?k=vermicompost+fertilizer+organic",
      recommendedFor: "Soil Deficiency, Soil Condition, Loamy, Red Soil",
    },
  ];


  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  const analysis1 = await prisma.cropAnalysis.create({
    data: {
      farmerId: farmer1.id,
      imageUrl: "https://images.unsplash.com/photo-1536657464919-892534f60d7e?w=800&auto=format&fit=crop&q=80",
      cropName: "Paddy (Rice)",
      cropHealth: "NEEDS_ATTENTION",
      disease: "Rice Blast (Pyricularia oryzae)",
      confidence: 0.92,
      pathogen: "Fungal",
      nutrientDeficiency: "Excessive Nitrogen / Low Potash",
      severity: "Medium",
      recommendations: JSON.stringify(["Spray Trichoderma viride (5g/L)", "Drain excess water for 2 days"]),
      farmerExplanation: "Lower leaves of paddy show spindle-shaped blast spots.",
      aiResponse: "{}",
    },
  });

  const post1 = await prisma.cropPost.create({
      data: {
        farmerId: farmer1.id,
        imageUrl: "https://images.unsplash.com/photo-1536657464919-892534f60d7e?w=800&auto=format&fit=crop&q=80",
        cropName: "Paddy (Rice)",
        description: "Noticed brown spots after 3 days of countinuous cloudy weather in Cuttack.",
        problem: "Rice Blast Disease Suspected",
        location: "Pune, Maharashtra",
        status: "RESPONDED",
      },
    });

  await prisma.dealerResponse.create({
    data: {
      cropPostId: post1.id,
      dealerId: dealer1.dealerProfile!.id,
      message: "Hello Ramesh ji, we have Trichoderma Viride and Neem Oil 10,000 PPM available at Odisha Agro Center. You can also order via WhatsApp.",
      recommendedProducts: JSON.stringify(["Trichoderma Viride", "Neem Ool"]),
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
