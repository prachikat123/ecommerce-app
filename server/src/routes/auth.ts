import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { prisma } from "../prisma.js";
import { sessionSchema, updateProfileSchema } from "../schemas/index.js";
import { getCart } from "../services/cartService.js";

const router = Router();

interface SessionUserRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  seller?: { id: string; shopName: string } | null;
}

/** The session user shape shared by /auth/session, GET /auth/me and PATCH /auth/me. */
function toSessionUser(user: SessionUserRecord) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    sellerId: user.seller?.id ?? null,
    shopName: user.seller?.shopName ?? null
  };
}

/**
 * POST /api/auth/session
 * Frictionless session bootstrap: signs in by phone number, creating the user
 * (and a seller profile when role=SELLER) on first use. Mirrors the low-friction
 * mobile-first login expected by Tier 2–4 farmers.
 */
router.post(
  "/session",
  validate(sessionSchema),
  asyncHandler(async (req, res) => {
    const { phone, name, role } = req.body;

    let user = await prisma.user.findUnique({ where: { phone }, include: { seller: true } });
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            phone,
            name: name ?? (role === "SELLER" ? "Agri Seller" : "Kisan Customer"),
            role,
            state: "Maharashtra",
            district: "Nashik",
            seller:
              role === "SELLER"
                ? {
                    create: {
                      shopName: `${name ?? "Krishi"}'s Agri Store`,
                      district: "Nashik",
                      state: "Maharashtra",
                      verified: true,
                      rating: 4.7
                    }
                  }
                : undefined
          },
          include: { seller: true }
        });
      } catch (err) {
        // Concurrent bootstrap requests (e.g. React StrictMode double-invoke) can
        // race to create the same phone. The loser re-reads the winning row.
        user = await prisma.user.findUnique({ where: { phone }, include: { seller: true } });
        if (!user) throw err;
      }
    }

    // Ensure a seller role always has a storefront profile, even if the account
    // was first created as a customer.
    if (role === "SELLER" && !user.seller) {
      await prisma.seller.create({
        data: {
          userId: user.id,
          shopName: `${name ?? user.name}'s Agri Store`,
          district: user.district ?? "Nashik",
          state: user.state ?? "Maharashtra",
          verified: true,
          rating: 4.7
        }
      });
      user = await prisma.user.findUnique({ where: { phone }, include: { seller: true } });
      if (!user) {
        res.status(500).json({ error: { message: "Could not create session", code: "SESSION_ERROR" } });
        return;
      }
    }

    const token = signToken({ userId: user.id, role: user.role });
    const cart = await getCart(user.id);

    res.json({
      token,
      user: toSessionUser(user),
      cartCount: cart.itemCount
    });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { seller: true }
    });
    if (!user) {
      res.status(401).json({ error: { message: "Session no longer valid", code: "UNAUTHORIZED" } });
      return;
    }
    res.json(toSessionUser(user));
  })
);

// PATCH /api/auth/me — update the signed-in user's display name and/or photo.
router.patch(
  "/me",
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string | null };
    const data: { name?: string; avatarUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data,
      include: { seller: true }
    });
    res.json(toSessionUser(user));
  })
);

export default router;
