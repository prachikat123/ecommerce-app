import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, "prisma", "test.db").replace(/\\/g, "/");
const url = `file:${dbFile}`;

/** Creates a fresh test database with a deterministic fixture set. */
export default async function globalSetup() {
  execSync("npx prisma db push --force-reset --skip-generate", {
    cwd: root,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "ignore"
  });

  const prisma = new PrismaClient({ datasources: { db: { url } } });

  const cat = await prisma.category.create({
    data: { slug: "seeds", name: "Seeds", icon: "spa", subtitle: "Hybrid & Desi", sort: 1 }
  });
  const fert = await prisma.category.create({
    data: { slug: "fertilizers", name: "Fertilizers", icon: "compost", subtitle: "NPK & Urea", sort: 2 }
  });

  const seller = await prisma.user.create({
    data: {
      name: "Test Seller",
      phone: "9811111111",
      role: "SELLER",
      seller: { create: { shopName: "Test Agri Store", verified: true, district: "Nashik" } }
    },
    include: { seller: true }
  });

  const base = {
    brand: "TestBrand",
    description: "desc",
    unit: "1 kg",
    packSizes: "1 kg,5 kg",
    rating: 4.5,
    ratingCount: 10,
    image: "https://example.com/p.png",
    sellerId: seller.seller!.id
  };

  await prisma.product.createMany({
    data: [
      { ...base, slug: "tomato-seeds", name: "Tomato Seeds", categoryId: cat.id, price: 100, mrp: 200, stock: 10, isFlashDeal: true, mandiPrice: 150 },
      { ...base, slug: "npk-19", name: "NPK 19:19:19", categoryId: fert.id, price: 175, mrp: 220, stock: 5 },
      { ...base, slug: "neem-oil", name: "Neem Oil", categoryId: fert.id, price: 449, mrp: 599, stock: 0, rating: 3.2 },
      { ...base, slug: "urea", name: "Urea", categoryId: fert.id, price: 266, mrp: 300, stock: 99, isBestSeller: true }
    ]
  });

  await prisma.$disconnect();
}
