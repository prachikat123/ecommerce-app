import { Router } from "express";
import { config } from "../config.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { prisma } from "../prisma.js";
import { otpRequestSchema, otpVerifySchema, sessionSchema, updateProfileSchema } from "../schemas/index.js";
import { getCart } from "../services/cartService.js";
import { issueOtp, VERIFY_FAILURE_MESSAGE, verifyOtp } from "../services/otpService.js";
import { sendOtpMessage } from "../services/messageService.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

interface SessionUserRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  seller?: { id: string; shopName: string } | null;
}

/** The session user shape shared by every sign-in route and GET/PATCH /auth/me. */
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
 * Finds or creates the account for a phone number and returns a signed session.
 * Shared by the OTP flow (the real sign-in path) and the demo `/session` route.
 */
async function establishSession(input: { phone: string; role: string; name?: string }) {
  const { phone, role } = input;
  const name = input.name;

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
    if (!user) throw new ApiError(500, "Could not create session", "SESSION_ERROR");
  }

  const token = signToken({ userId: user.id, role: user.role });
  const cart = await getCart(user.id);

  return { token, user: toSessionUser(user), cartCount: cart.itemCount };
}

/**
 * POST /api/auth/otp/request
 * Issues a one-time passcode for a phone number and delivers it on WhatsApp.
 *
 * With `OTP_DEV_BYPASS` enabled (the default outside production) the generated
 * code is also returned as `devCode` so the UI can pre-fill it without a live
 * message provider.
 */
router.post(
  "/otp/request",
  authLimiter,
  validate(otpRequestSchema),
  asyncHandler(async (req, res) => {
    const { phone, role, name } = req.body as { phone: string; role: string; name?: string };
    const { code } = await issueOtp({ phone, role, name });

    const body: { expiresInSeconds: number; devCode?: string } = {
      expiresInSeconds: config.otpExpirySeconds
    };
    if (config.otpDevBypass) body.devCode = code;

    await sendOtpMessage({ phone, code, expirySeconds: config.otpExpirySeconds });

    res.json(body);
  })
);

/**
 * POST /api/auth/otp/verify
 * Validates the submitted code and returns a session, creating the account on
 * first successful sign-in.
 */
router.post(
  "/otp/verify",
  authLimiter,
  validate(otpVerifySchema),
  asyncHandler(async (req, res) => {
    const { phone, code, role, name } = req.body as {
      phone: string;
      code: string;
      role: string;
      name?: string;
    };

    // Development bypass: accept the well-known code when no message provider
    // is available. Never active in production (enforced by the config guard).
    const bypassed = config.otpDevBypass && code === config.otpDevCode;
    if (!bypassed) {
      const result = await verifyOtp({ phone, code });
      if (!result.ok) {
        throw new ApiError(401, VERIFY_FAILURE_MESSAGE[result.reason], "INVALID_OTP");
      }
    }

    res.json(await establishSession({ phone, role, name }));
  })
);

/**
 * POST /api/auth/session
 * Demo / guest bootstrap: signs in by phone number with no verification,
 * creating the user (and a seller profile when role=SELLER) on first use.
 *
 * This is what makes frictionless guest browsing work. It is NOT a secure
 * sign-in method and should be disabled in production (see README).
 */
router.post(
  "/session",
  authLimiter,
  validate(sessionSchema),
  asyncHandler(async (req, res) => {
    const { phone, name, role } = req.body as { phone: string; name?: string; role: string };
    res.json(await establishSession({ phone, role, name }));
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
