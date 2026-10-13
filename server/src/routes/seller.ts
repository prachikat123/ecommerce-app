import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireSeller } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateOrderStatusSchema,
  updateProductSchema
} from "../schemas/index.js";
import { prisma } from "../prisma.js";
import { toProductDTO } from "../services/productService.js";
import { listSellerOrders, updateOrderStatus } from "../services/orderService.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.use(requireSeller);

function slugify(input: string): string {
  return `${input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
}

async function currentSeller(userId: string) {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw ApiError.forbidden("Seller profile not found");
  return seller;
}

// GET /api/seller/profile
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    res.json(seller);
  })
);

// GET /api/seller/stats  — dashboard KPI tiles
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    const products = await prisma.product.findMany({ where: { sellerId: seller.id } });
    const productIds = products.map((p) => p.id);

    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      include: { order: true }
    });

    const revenue = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const unitsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0);
    const orderIds = new Set(orderItems.map((i) => i.orderId));

    res.json({
      productCount: products.length,
      lowStock: products.filter((p) => p.stock <= 5).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      orderCount: orderIds.size,
      unitsSold,
      revenue,
      avgOrderValue: orderIds.size ? Math.round(revenue / orderIds.size) : 0
    });
  })
);

// GET /api/seller/products
router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    const rows = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { slug: true, name: true, icon: true } } }
    });
    res.json({ items: rows.map(toProductDTO) });
  })
);

// POST /api/seller/products
router.post(
  "/products",
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    const body = req.body;
    const category = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
    if (!category) throw ApiError.badRequest(`Unknown category: ${body.categorySlug}`);
    if (body.price > body.mrp) throw ApiError.badRequest("Selling price cannot exceed MRP");

    const product = await prisma.product.create({
      data: {
        slug: slugify(body.name),
        name: body.name,
        brand: body.brand,
        description: body.description,
        longDesc: body.longDesc,
        categoryId: category.id,
        sellerId: seller.id,
        price: body.price,
        mrp: body.mrp,
        unit: body.unit,
        packSizes: body.packSizes.join(","),
        stock: body.stock,
        image: body.image,
        badge: body.badge,
        certification: body.certification,
        mandiPrice: body.mandiPrice
      },
      include: { category: { select: { slug: true, name: true, icon: true } } }
    });
    res.status(201).json(toProductDTO(product));
  })
);

// PATCH /api/seller/products/:id
router.patch(
  "/products/:id",
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.sellerId !== seller.id) throw ApiError.notFound("Product not found");

    const body = req.body;
    const data: Record<string, unknown> = { ...body };
    if (body.packSizes) data.packSizes = body.packSizes.join(",");
    if (body.categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
      if (!category) throw ApiError.badRequest(`Unknown category: ${body.categorySlug}`);
      data.categoryId = category.id;
      delete data.categorySlug;
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data,
      include: { category: { select: { slug: true, name: true, icon: true } } }
    });
    res.json(toProductDTO(product));
  })
);

// DELETE /api/seller/products/:id
router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const seller = await currentSeller(req.auth!.userId);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.sellerId !== seller.id) throw ApiError.notFound("Product not found");
    await prisma.product.delete({ where: { id: existing.id } });
    res.json({ deleted: true, id: existing.id });
  })
);

// GET /api/seller/orders
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json({ items: await listSellerOrders(req.auth!.userId, status) });
  })
);

// PATCH /api/seller/orders/:id/status
router.patch(
  "/orders/:id/status",
  validate(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateOrderStatus(req.params.id, req.body.status));
  })
);

export default router;
