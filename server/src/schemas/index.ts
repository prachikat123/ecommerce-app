import { z } from "zod";

export const productQuerySchema = z.object({
  category: z.string().trim().optional(),
  q: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  isFlashDeal: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  isBestSeller: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  isNewArrival: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "rating", "newest", "discount"]).default("popular"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12)
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  unit: z.string().trim().max(40).optional()
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99)
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["COD", "UPI", "CARD", "KCC"]),
  address: z.object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    line: z.string().trim().min(4, "Address is too short").max(200),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
    label: z.string().trim().max(30).optional()
  }),
  notes: z.string().trim().max(300).optional()
});

export const sessionSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  role: z.enum(["CUSTOMER", "SELLER"]).default("CUSTOMER")
});

const DATA_IMAGE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80).optional(),
    // Accept a small uploaded data URL, a remote URL, or null to clear the photo.
    avatarUrl: z
      .union([
        z.string().trim().url("Provide a valid image URL").max(500),
        z.string().trim().max(900_000).regex(DATA_IMAGE, "Provide a valid image file")
      ])
      .nullable()
      .optional()
  })
  .refine((value) => value.name !== undefined || value.avatarUrl !== undefined, {
    message: "Nothing to update"
  });

export const createProductSchema = z.object({
  name: z.string().trim().min(3, "Product name is too short").max(120),
  brand: z.string().trim().min(2).max(60),
  description: z.string().trim().min(5).max(300),
  longDesc: z.string().trim().max(2000).optional(),
  categorySlug: z.string().trim().min(2),
  price: z.coerce.number().int().positive("Price must be greater than 0"),
  mrp: z.coerce.number().int().positive("MRP must be greater than 0"),
  unit: z.string().trim().min(1).max(40),
  packSizes: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one pack size"),
  stock: z.coerce.number().int().min(0).default(0),
  image: z.string().url("Provide a valid image URL"),
  badge: z.string().trim().max(40).optional(),
  certification: z.string().trim().max(60).optional(),
  mandiPrice: z.coerce.number().int().nonnegative().optional()
});

export const updateProductSchema = createProductSchema.partial();

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"])
});
