import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { productQuerySchema } from "../schemas/index.js";
import {
  getProductBySlugOrId,
  getRelatedProducts,
  listBrands,
  listCategories,
  listProducts
} from "../services/productService.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

// GET /api/products
router.get(
  "/",
  validate(productQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const result = await listProducts(req.query as unknown as ReturnType<typeof productQuerySchema.parse>);
    res.json(result);
  })
);

// GET /api/products/brands
router.get(
  "/brands",
  asyncHandler(async (_req, res) => {
    res.json({ items: await listBrands() });
  })
);

// GET /api/products/:idOrSlug
router.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const product = await getProductBySlugOrId(req.params.idOrSlug);
    if (!product) throw ApiError.notFound("Product not found");
    res.json(product);
  })
);

// GET /api/products/:slug/related
router.get(
  "/:slug/related",
  asyncHandler(async (req, res) => {
    res.json({ items: await getRelatedProducts(req.params.slug) });
  })
);

export default router;

// GET /api/categories
export const categoriesRouter = Router().get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ items: await listCategories() });
  })
);
