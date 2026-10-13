import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addCartItemSchema, updateCartItemSchema } from "../schemas/index.js";
import {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem
} from "../services/cartService.js";

const router = Router();

router.use(requireAuth);

// GET /api/cart
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await getCart(req.auth!.userId));
  })
);

// POST /api/cart/items
router.post(
  "/items",
  validate(addCartItemSchema),
  asyncHandler(async (req, res) => {
    const { productId, quantity, unit } = req.body;
    const cart = await addItem(req.auth!.userId, productId, quantity, unit);
    res.status(201).json(cart);
  })
);

// PATCH /api/cart/items/:id
router.patch(
  "/items/:id",
  validate(updateCartItemSchema),
  asyncHandler(async (req, res) => {
    const cart = await updateItem(req.auth!.userId, req.params.id, req.body.quantity);
    res.json(cart);
  })
);

// DELETE /api/cart/items/:id
router.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const cart = await removeItem(req.auth!.userId, req.params.id);
    res.json(cart);
  })
);

// DELETE /api/cart
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await clearCart(req.auth!.userId));
  })
);

export default router;
