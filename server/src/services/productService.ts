import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import type { ProductQuery } from "../schemas/index.js";

export type ProductDTO = ReturnType<typeof toProductDTO>;

export function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function toProductDTO(p: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  longDesc: string | null;
  price: number;
  mrp: number;
  unit: string;
  packSizes: string;
  stock: number;
  rating: number;
  ratingCount: number;
  image: string;
  gallery: string | null;
  badge: string | null;
  certification: string | null;
  mandiPrice: number | null;
  isFlashDeal: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  category?: { slug: string; name: string; icon: string } | null;
  seller?: { id: string; shopName: string; verified: boolean; district: string | null } | null;
}) {
  const discountPercent = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    longDesc: p.longDesc ?? undefined,
    price: p.price,
    mrp: p.mrp,
    discountPercent,
    unit: p.unit,
    packSizes: splitList(p.packSizes),
    stock: p.stock,
    inStock: p.stock > 0,
    rating: p.rating,
    ratingCount: p.ratingCount,
    image: p.image,
    gallery: splitList(p.gallery),
    badge: p.badge ?? undefined,
    certification: p.certification ?? undefined,
    mandiPrice: p.mandiPrice ?? undefined,
    mandiSavings: p.mandiPrice ? Math.max(0, p.mandiPrice - p.price) : undefined,
    isFlashDeal: p.isFlashDeal,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    category: p.category ?? undefined,
    seller: p.seller
      ? {
          id: p.seller.id,
          shopName: p.seller.shopName,
          verified: p.seller.verified,
          district: p.seller.district ?? undefined
        }
      : undefined
  };
}

const include = {
  category: { select: { slug: true, name: true, icon: true } },
  seller: { select: { id: true, shopName: true, verified: true, district: true } }
} satisfies Prisma.ProductInclude;

export async function listProducts(query: ProductQuery) {
  const where: Prisma.ProductWhereInput = {};

  if (query.category) where.category = { slug: query.category };
  if (query.brand) where.brand = query.brand;
  if (query.badge) where.badge = query.badge;
  if (query.isFlashDeal !== undefined) where.isFlashDeal = query.isFlashDeal;
  if (query.isBestSeller !== undefined) where.isBestSeller = query.isBestSeller;
  if (query.isNewArrival !== undefined) where.isNewArrival = query.isNewArrival;
  if (query.minRating !== undefined) where.rating = { gte: query.minRating };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {})
    };
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { brand: { contains: query.q } },
      { description: { contains: query.q } }
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === "price-asc"
      ? { price: "asc" }
      : query.sort === "price-desc"
        ? { price: "desc" }
        : query.sort === "rating"
          ? { rating: "desc" }
          : query.sort === "newest"
            ? { createdAt: "desc" }
            : query.sort === "discount"
              ? { mrp: "desc" }
              : { ratingCount: "desc" };

  const skip = (query.page - 1) * query.limit;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy, skip, take: query.limit })
  ]);

  return {
    items: rows.map(toProductDTO),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    hasMore: skip + rows.length < total
  };
}

export async function getProductBySlugOrId(idOrSlug: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include
  });
  return product ? toProductDTO(product) : null;
}

export async function getRelatedProducts(slug: string, limit = 6) {
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
  if (!product) return [];
  const rows = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include,
    orderBy: { ratingCount: "desc" },
    take: limit
  });
  return rows.map(toProductDTO);
}

export async function listCategories() {
  const cats = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { products: true } } }
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    subtitle: c.subtitle ?? undefined,
    productCount: c._count.products
  }));
}

export async function listBrands() {
  const rows = await prisma.product.findMany({ distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } });
  return rows.map((r) => r.brand);
}

/** Public farmer / agri-dealer storefront profile with their catalog. */
export async function getSellerProfile(sellerId: string) {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: { user: { select: { name: true } } }
  });
  if (!seller) return null;

  const products = await prisma.product.findMany({
    where: { sellerId },
    include,
    orderBy: [{ isBestSeller: "desc" }, { ratingCount: "desc" }]
  });

  return {
    id: seller.id,
    shopName: seller.shopName,
    ownerName: seller.user?.name ?? "Agri Seller",
    village: seller.village ?? undefined,
    district: seller.district ?? undefined,
    state: seller.state ?? undefined,
    verified: seller.verified,
    rating: seller.rating,
    memberSince: seller.createdAt.toISOString(),
    productCount: products.length,
    products: products.map(toProductDTO)
  };
}
