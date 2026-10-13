import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../schemas/index.js";
import { createOrder, getOrder, listOrders } from "../services/orderService.js";

const router = Router();

router.use(requireAuth);

// POST /api/orders  (checkout)
router.post(
  "/",
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const order = await createOrder(req.auth!.userId, req.body);
    res.status(201).json(order);
  })
);

// GET /api/orders
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ items: await listOrders(req.auth!.userId) });
  })
);

// GET /api/orders/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await getOrder(req.auth!.userId, req.params.id));
  })
);

export default router;
