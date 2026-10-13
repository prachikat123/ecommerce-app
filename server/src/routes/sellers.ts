import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getSellerProfile } from "../services/productService.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

// GET /api/sellers/:id — public farmer / agri-dealer storefront
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await getSellerProfile(req.params.id);
    if (!profile) throw ApiError.notFound("Seller not found");
    res.json(profile);
  })
);

export default router;
