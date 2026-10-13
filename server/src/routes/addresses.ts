import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

// GET /api/addresses — saved delivery addresses (most recent first) for checkout prefill.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.address.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    res.json({ items });
  })
);

export default router;
