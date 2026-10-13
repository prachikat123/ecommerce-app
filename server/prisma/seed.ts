/**
 * KrishiBazaar seed data — realistic Indian agri-commerce catalog.
 * Idempotent: clears catalog tables, then recreates them.
 * Run with: npm run db:seed   (or  npm run db:reset)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Imagery reused from the Stitch design (public CDN links).
const IMG = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3V23FUo7scyZkT3l4oTKl0RpY9PAmcz_I6brqaSSsI41cX5AikznyFmGfxP4k3OuWDHKhYaumsRgHw1WaVVixVuWguNamCCPTgw2vAZtOXhvySc2L8vL_AMkDLaNAcofEp2503opbxkKV3OXkDkp2nqlHCOyVrGOriD5PkQKfPsABQFeBy9gt2pr2aVPqXlnIfOqW5RkyLerUudTtiOlI-mioQYrOxz1R_PgTmg",
  tomatoSeeds:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAtd2K31ve7rOm1C05gqMjQeiJRK6DZ5IAcFOhT6-K3hDMXfBgNEycyCsCHPB7fVEnnAa5civaU5rPvzGLoPghRgfWUOfgNT4O6yaP8W4-9lN_3gTn4rFViyLuFpEMUmt0yuGYpJMiXEsY-eJhvaIkVUA7qnHRGA8rnKcm9M77tsdSyx-hiBc4JXT6X_z5VQDg44o9b6bBeC6UQo2S75xvgR_wwwUDgSeh_BVqaCg",
  npk: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6yV8Wi2LgrGiwLnJXGQiRFBpApf4Jx-C9KvVip9iKQF4q95T3K5JwPNZ2wzXi3WaxBdjR3N13sgMkD6I_R1Wf5TYMOIT2sXSdH6qSG24YXX0_2UPptKP_Y93Ou5a7lG-1VenrmRSlfkyTlPL5GhsVRVH2kdn15Nd9k-j5Qztug9yhSRgb1-tORgFfsx5CijBmh7_aU-aHEZ05KCY3bQ9UoFZATaWBaJ5yWemQ0A",
  sprayer:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA0QgIAMIg0y-epdxBaetWO1htzfZ3XeAmqlCY5RDoBQvmkaKaONZ6S-y1f8qT5CpI5UFWyhEcOO4MWyQXKLhr33JedpHiF2MLg_goYLYW-QdHYzR7g2zggqVwQu5EJUdcpxxARljNswzR5R0OIla0dqHXg_qwiMMdSnZmGckDqb0VzpmV57oBB_-_FbAMACRws6OEp2afhIYgx1dwa0SmJg4MjjbBdyBtJuo6cVQ",
  confidor:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ1Dmh2ehue6lO_fG6uU1qKtupg5t-w_ZKRtD2uUa-ar78SzxdSuy_kwBoAsT3DGv4mHTok96evXrkdcNvIuUD41m5qMaDQrpmk44p3tmLYXzG-eCespD7Stn62A0s89olqIbReaCOP3X5KApVZWi4_nXEmJEZaUQ3KfbG3WZ6VpicAcyN296lgNzgGIgIwkjYTBSQdgT8_BM3WRhXoxSYZlWpHXgPZhPA91C4hQ",
  cotton:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCQtEg4vWlYRyD209lUenXUFKtxX0P-hKZWUhwhFk7eG9psRhsaIc2uZ0IgdsaFssRXgI2Xgt0cKbOtAqjjYDrolj1ud6_I_zp_52xbTwgSlzdZTPDExSkRB80Pgwlq1Nm0nuRxpGOzmAN6ygA2bBcUc-jK9Qf3wson3oUeFl49DldwFvd6HLhLX2wNC9-5CBD5w5ZML5G4qfA7vf0H6wIAH064yVFOvFVxMAeOlQ",
  drip: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAtdIRKuUevbirzKxwJiaVnEJMSQpoMdljPnlhkEQW0vtZF14vPqwQaa5_M-m_LjH7ElXJVKgP3-z7x7nKLinnEUARZMpvrhkl-4ZAeLQ1a1Gw7To1ZQBOMcPiM-aBxkXe-y0C9jw7MNQY2GHCi86ydHJcvMIt9bzaon6TvbachzqxCxqMmaZu9FZPS4hNEsByxz09CoF_78mSul-8n7GSIDMXZcZG_W6N7eNAAw",
  vermicompost:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDriM88l5hbf93QylGQonmnaPfjXvyXWhQjQFWWlF5S5XWBopkDDx-RH5ip9ua6seCleHzAY0rCulRQE9HT3YpJgCpV1OtlNYJLQ-DvVvJnf9GtIvOo9NkXJMQHhFeeEsDAoj2IRk9tfOG0zoKim6AhFslrdRxZnJ5Gwf9Wli43Iu7PIjLSQE9ksELovbAUlHFVdzxSITxjdSjmGfxsH1tpnnkrvmA2yZjmNTkkhg",
  farmer:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-vyqt3YPN3ov_T3sXpAnYuyi3A5EX6hUGKVBrGwroib3Vtkkku5NiX4EPAxd9Zzdak2rvEdvn5DhDBKutwTGKAYVjgx9AsVbVzyJN9yqBwR63TbGBA_ZRk0ceaKBiYIa7_9X3arIXHFPhYtMUle8_M-cr4cBH9Hns5xSC1fHssyrF1Wz8ea_mHUOX-VSeomQnyIXaaa4HtK73HaYE-Nak1Hqpa9uAzOZLQNi4sQ"
};

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/800`;
}

const categories = [
  { slug: "seeds", name: "Seeds", icon: "spa", subtitle: "Hybrid & Desi", sort: 1 },
  { slug: "fertilizers", name: "Fertilizers", icon: "compost", subtitle: "NPK & Urea", sort: 2 },
  { slug: "pesticides", name: "Pesticides", icon: "pest_control", subtitle: "Protection", sort: 3 },
  { slug: "equipment", name: "Equipment", icon: "agriculture", subtitle: "Tillers & Sprayers", sort: 4 },
  { slug: "irrigation", name: "Irrigation", icon: "water_drop", subtitle: "Drip & Sprinkler", sort: 5 },
  { slug: "organic", name: "Organic", icon: "eco", subtitle: "Bio-Manure", sort: 6 },
  { slug: "gardening", name: "Gardening", icon: "potted_plant", subtitle: "Tools & Pots", sort: 7 },
  { slug: "animal-feed", name: "Animal Feed", icon: "cruelty_free", subtitle: "Cattle Nutrition", sort: 8 }
];

type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  description: string;
  longDesc: string;
  category: string;
  price: number;
  mrp: number;
  unit: string;
  packSizes: string;
  stock: number;
  rating: number;
  ratingCount: number;
  image: string;
  badge?: string;
  certification?: string;
  mandiPrice?: number;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
};

const products: SeedProduct[] = [
  {
    slug: "namdhari-tomato-ns-501",
    name: "Namdhari Tomato NS-501",
    brand: "Namdhari Seeds",
    description: "High disease tolerance & heavy yield hybrid tomato seeds.",
    longDesc:
      "NS-501 is a determinate hybrid tomato with excellent fruit setting even under high temperatures. Strong tolerance to bacterial wilt and tomato leaf curl virus makes it a dependable choice for Kharif and Rabi sowing across Maharashtra and Karnataka.",
    category: "seeds",
    price: 340,
    mrp: 450,
    unit: "10 g",
    packSizes: "10 g,50 g,250 g",
    stock: 120,
    rating: 4.8,
    ratingCount: 1240,
    image: IMG.tomatoSeeds,
    badge: "ICAR Certified",
    certification: "ICAR Certified",
    mandiPrice: 410,
    isFlashDeal: true,
    isBestSeller: true
  },
  {
    slug: "iffco-npk-19-19-19",
    name: "IFFCO NPK 19:19:19",
    brand: "IFFCO",
    description: "100% water soluble balanced foliage spray fertilizer.",
    longDesc:
      "Fully water-soluble NPK 19:19:19 for fertigation and foliar spray. Promotes uniform vegetative growth, greening and flowering across vegetables, fruits and field crops. Free-flowing, residue-free and chloride-free.",
    category: "fertilizers",
    price: 175,
    mrp: 220,
    unit: "1 kg Pouch",
    packSizes: "1 kg Pouch,5 kg Bucket,25 kg Bag",
    stock: 400,
    rating: 4.9,
    ratingCount: 3890,
    image: IMG.npk,
    badge: "IFFCO Purity",
    certification: "FCO Certified",
    mandiPrice: 205,
    isFlashDeal: true,
    isBestSeller: true
  },
  {
    slug: "battery-knapsack-sprayer-16l",
    name: "Battery Knapsack Sprayer 16L",
    brand: "KisanPro",
    description: "12V 8Ah heavy duty, single charge up to 6 hrs.",
    longDesc:
      "16-litre battery operated knapsack sprayer with brass lance, twin-mode nozzle and ergonomic padded straps. Covers up to 1 acre per tank with a consistent 0.8–1.2 lpm discharge. Eligible for agriculture machinery subsidy.",
    category: "equipment",
    price: 2199,
    mrp: 3200,
    unit: "16L Tank",
    packSizes: "12L Tank,16L Tank,20L Tank",
    stock: 60,
    rating: 4.7,
    ratingCount: 890,
    image: IMG.sprayer,
    badge: "Govt Subsidy Valid",
    certification: "BIS Approved",
    mandiPrice: 2750,
    isFlashDeal: true
  },
  {
    slug: "bayer-confidor-insecticide",
    name: "Confidor Insecticide",
    brand: "Bayer CropScience",
    description: "Systemic control of sucking pests — aphids, jassids, whitefly.",
    longDesc:
      "Confidor (Imidacloprid 17.8% SL) is a systemic insecticide providing long-duration protection against sucking pests in cotton, chilli, tomato and mango. Absorbed rapidly by the plant and resistant to rain wash-off after drying.",
    category: "pesticides",
    price: 549,
    mrp: 680,
    unit: "100 ml",
    packSizes: "100 ml,250 ml,500 ml",
    stock: 210,
    rating: 4.8,
    ratingCount: 2100,
    image: IMG.confidor,
    badge: "Genuine Batch",
    certification: "CIB&RC Approved",
    isBestSeller: true
  },
  {
    slug: "mahyco-cotton-bollgard-ii",
    name: "Cotton Bollgard II",
    brand: "Mahyco Seeds",
    description: "BG-II hybrid cotton with built-in bollworm protection.",
    longDesc:
      "Certified Bollgard II (BG-II) hybrid cotton seed pouch with government purity barcode and GEAC approval. Strong boll retention, high ginning out-turn and tolerance to sucking pests across rainfed and irrigated cotton belts.",
    category: "seeds",
    price: 810,
    mrp: 864,
    unit: "450 g",
    packSizes: "450 g,2 x 450 g",
    stock: 180,
    rating: 4.9,
    ratingCount: 4520,
    image: IMG.cotton,
    badge: "Bollgard II",
    certification: "GEAC Approved",
    isBestSeller: true
  },
  {
    slug: "jain-drip-irrigation-kit-50",
    name: "Drip Irrigation Kit",
    brand: "Jain Irrigation",
    description: "Complete 50-plant micro drip kit for home & vegetable plots.",
    longDesc:
      "Ready-to-install drip kit with 100 m lateral tube, 50 inline drippers, screen filter, venturi and all connectors. Delivers precise root-zone irrigation, saving up to 60% water compared to flood irrigation. Subsidy eligible under PMKSY.",
    category: "irrigation",
    price: 1399,
    mrp: 1850,
    unit: "50 Plants Kit",
    packSizes: "25 Plants Kit,50 Plants Kit,100 Plants Kit",
    stock: 90,
    rating: 4.6,
    ratingCount: 560,
    image: IMG.drip,
    badge: "PMKSY Eligible",
    certification: "BIS Approved",
    isBestSeller: true
  },
  {
    slug: "enriched-vermicompost-25kg",
    name: "Enriched Vermicompost",
    brand: "Kisan Organics",
    description: "Nutrient-rich worm manure for soil revitalisation.",
    longDesc:
      "Fully decomposed, sieved and enriched vermicompost with 1.2% N, 0.8% P and 1.0% K plus beneficial microbes. Improves soil porosity, water holding capacity and white-root development. Safe for all crops including organic cultivation.",
    category: "organic",
    price: 320,
    mrp: 500,
    unit: "25 kg Bag",
    packSizes: "10 kg Bag,25 kg Bag,50 kg Bag",
    stock: 500,
    rating: 4.7,
    ratingCount: 1840,
    image: IMG.vermicompost,
    badge: "Organic",
    certification: "NPOP Organic",
    isBestSeller: true
  },
  {
    slug: "kharif-protection-bundle",
    name: "Kharif Protection Bundle",
    brand: "KrishiBazaar",
    description: "Mahyco Bio-tonic + Neem Oil 10000 PPM + Trichoderma.",
    longDesc:
      "Season advisor bundle curated for Cotton, Soybean and Grape growers in western Maharashtra. Protects against early leaf curl, fungal damp-off and sucking pest pressure from sowing to first flowering.",
    category: "organic",
    price: 1149,
    mrp: 1599,
    unit: "Bundle (3 items)",
    packSizes: "Bundle (3 items)",
    stock: 75,
    rating: 4.8,
    ratingCount: 720,
    image: img("kharif-bundle"),
    badge: "Bundle Deal",
    isBestSeller: true
  },
  {
    slug: "neem-oil-10000-ppm",
    name: "Neem Oil 10000 PPM",
    brand: "Kisan Organics",
    description: "Cold-pressed azadirachtin-rich botanical pest repellent.",
    longDesc:
      "Concentrated cold-pressed neem oil (10000 PPM azadirachtin) for organic control of thrips, mites, aphids and whitefly. Acts as antifeedant, repellent and oviposition deterrent with zero residue tolerance issues.",
    category: "organic",
    price: 449,
    mrp: 599,
    unit: "1 L",
    packSizes: "500 ml,1 L,5 L",
    stock: 260,
    rating: 4.5,
    ratingCount: 640,
    image: img("neem-oil"),
    badge: "Organic",
    certification: "NPOP Organic",
    isFlashDeal: true
  },
  {
    slug: "kribhco-urea-46",
    name: "Urea 46% Nitrogen",
    brand: "KRIBHCO",
    description: "Standard neem-coated nitrogen fertiliser.",
    longDesc:
      "Neem-coated urea with 46% nitrogen for top dressing of cereals, sugarcane and cotton. Uniform prill size for even spread and reduced nitrogen volatilisation loss.",
    category: "fertilizers",
    price: 266,
    mrp: 300,
    unit: "45 kg Bag",
    packSizes: "45 kg Bag",
    stock: 900,
    rating: 4.6,
    ratingCount: 5200,
    image: img("urea-bag"),
    certification: "FCO Certified",
    mandiPrice: 290
  },
  {
    slug: "coromandel-gromor-dap",
    name: "Gromor DAP 18:46:0",
    brand: "Coromandel",
    description: "Di-ammonium phosphate basal dose fertiliser.",
    longDesc:
      "Granular DAP supplying 18% nitrogen and 46% phosphorus for strong root establishment. Ideal basal application for wheat, pulses, oilseeds and horticulture crops.",
    category: "fertilizers",
    price: 1350,
    mrp: 1500,
    unit: "50 kg Bag",
    packSizes: "50 kg Bag",
    stock: 340,
    rating: 4.4,
    ratingCount: 980,
    image: img("dap-bag"),
    certification: "FCO Certified"
  },
  {
    slug: "syngenta-amistar-fungicide",
    name: "Amistar Fungicide",
    brand: "Syngenta",
    description: "Broad-spectrum azoxystrobin fungicide.",
    longDesc:
      "Amistar (Azoxystrobin 23% SC) offers preventive and curative control of downy mildew, powdery mildew, rust and blight in grapes, vegetables and cereals with a long spray interval.",
    category: "pesticides",
    price: 720,
    mrp: 900,
    unit: "250 ml",
    packSizes: "100 ml,250 ml,1 L",
    stock: 140,
    rating: 4.7,
    ratingCount: 760,
    image: img("amistar"),
    certification: "CIB&RC Approved",
    isNewArrival: true
  },
  {
    slug: "mahindra-power-weeder",
    name: "Power Weeder 7HP",
    brand: "Mahindra Agri",
    description: "Inter-cultivation and weeding between crop rows.",
    longDesc:
      "7HP diesel power weeder for inter-cultivation in orchards and row crops. Rotavator and ridger attachments included. Subsidy eligible under the SMAM scheme for eligible farmer categories.",
    category: "equipment",
    price: 32500,
    mrp: 38000,
    unit: "1 Unit",
    packSizes: "1 Unit",
    stock: 12,
    rating: 4.5,
    ratingCount: 120,
    image: img("power-weeder"),
    badge: "Govt Subsidy Valid",
    isNewArrival: true
  },
  {
    slug: "netafim-sprinkler-set-20",
    name: "Sprinkler Nozzle Set",
    brand: "Netafim",
    description: "20-nozzle impact sprinkler set with connectors.",
    longDesc:
      "Complete impact sprinkler set covering up to 0.5 acre with uniform water distribution. UV-stabilised nozzles, brass bearing and quick-connect couplers for hassle-free field installation.",
    category: "irrigation",
    price: 2450,
    mrp: 3200,
    unit: "20 Nozzle Set",
    packSizes: "10 Nozzle Set,20 Nozzle Set",
    stock: 55,
    rating: 4.6,
    ratingCount: 210,
    image: img("sprinkler"),
    isNewArrival: true
  },
  {
    slug: "seminis-hybrid-chilli-seeds",
    name: "Hybrid Chilli Seeds",
    brand: "Seminis",
    description: "High pungency, dark green to deep red hybrid chilli.",
    longDesc:
      "Seminis hybrid chilli with uniform 10–12 cm fruits, high pungency and excellent red colour on maturity. Tolerant to powdery mildew and suitable for fresh market and dry chilli production.",
    category: "seeds",
    price: 620,
    mrp: 780,
    unit: "10 g",
    packSizes: "10 g,50 g",
    stock: 130,
    rating: 4.7,
    ratingCount: 430,
    image: img("chilli-seeds"),
    certification: "ICAR Certified",
    isNewArrival: true
  },
  {
    slug: "godrej-poultry-feed-grower",
    name: "Poultry Feed Grower",
    brand: "Godrej Agrovet",
    description: "Balanced grower ration for healthy weight gain.",
    longDesc:
      "Crumb feed formulated for 4–8 week commercial broiler grower phase with balanced amino acids, vitamins and minerals for uniform flock growth and healthy feed conversion.",
    category: "animal-feed",
    price: 1180,
    mrp: 1400,
    unit: "50 kg Bag",
    packSizes: "50 kg Bag",
    stock: 220,
    rating: 4.5,
    ratingCount: 340,
    image: img("poultry-feed"),
    isBestSeller: true
  },
  {
    slug: "cattle-mineral-mixture-5kg",
    name: "Cattle Mineral Mixture",
    brand: "Amul",
    description: "Chelated mineral supplement for milk yield & fertility.",
    longDesc:
      "BIS Type-2 chelated mineral mixture for dairy cattle and buffaloes. Supports milk yield, improves udder health, reproductive efficiency and hoof strength. Mix 50 g per animal per day with feed.",
    category: "animal-feed",
    price: 540,
    mrp: 650,
    unit: "5 kg",
    packSizes: "2 kg,5 kg,10 kg",
    stock: 310,
    rating: 4.6,
    ratingCount: 510,
    image: img("mineral-mixture"),
    isBestSeller: true
  },
  {
    slug: "garden-tool-kit-5pc",
    name: "Garden Tool Kit",
    brand: "Kisan Organics",
    description: "5-piece ergonomic kit for kitchen & terrace gardens.",
    longDesc:
      "Rust-resistant 5-piece gardening kit — hand trowel, transplanting trowel, weeder, cultivator claw and pruning shear with cushioned grips. Ideal for terrace, kitchen and nursery gardening.",
    category: "gardening",
    price: 899,
    mrp: 1400,
    unit: "5 pc Kit",
    packSizes: "3 pc Kit,5 pc Kit,8 pc Kit",
    stock: 160,
    rating: 4.4,
    ratingCount: 260,
    image: img("garden-tools"),
    badge: "24% OFF",
    isNewArrival: true
  }
];

async function main() {
  console.log("→ Seeding KrishiBazaar database ...");

  // Clear catalog + transactional data (FK-safe order).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    categoryMap.set(c.slug, created.id);
  }
  console.log(`  ✓ ${categories.length} categories`);

  // Seller accounts
  const seller1 = await prisma.user.create({
    data: {
      name: "Ramesh Patil",
      phone: "9800000001",
      role: "SELLER",
      village: "Ozar",
      district: "Nashik",
      state: "Maharashtra",
      seller: {
        create: {
          shopName: "Patil Agri Seeds & Inputs",
          village: "Ozar",
          district: "Nashik",
          state: "Maharashtra",
          verified: true,
          rating: 4.8
        }
      }
    },
    include: { seller: true }
  });
  const seller1Id = seller1.seller!.id;

  // Demo customer (auto-session on the storefront)
  await prisma.user.create({
    data: {
      name: "Kisan Customer",
      phone: "9000000000",
      role: "CUSTOMER",
      village: "Nashik",
      district: "Nashik",
      state: "Maharashtra"
    }
  });

  // Products (attach most to seller1 for the seller dashboard)
  let created = 0;
  for (const p of products) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.category}`);
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        description: p.description,
        longDesc: p.longDesc,
        categoryId,
        sellerId: seller1Id,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        packSizes: p.packSizes,
        stock: p.stock,
        rating: p.rating,
        ratingCount: p.ratingCount,
        image: p.image,
        gallery: [IMG.hero, p.image].join(","),
        badge: p.badge,
        certification: p.certification,
        mandiPrice: p.mandiPrice,
        isFlashDeal: p.isFlashDeal ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isNewArrival: p.isNewArrival ?? false
      }
    });
    created++;
  }
  console.log(`  ✓ ${created} products`);
  console.log(`  ✓ 2 users (1 seller, 1 demo customer)`);
  console.log("✓ Seed complete.\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
