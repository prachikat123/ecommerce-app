import { prisma } from "../prisma.js";
import { ApiError } from "../utils/ApiError.js";

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  brand: string;
  image: string;
  unit: string | null;
  price: number;
  mrp: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  savings: number;
}

export interface CartSummary {
  id: string;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
}

const FREE_DELIVERY_THRESHOLD = 999;
const DELIVERY_FEE = 49;

/** Fetches (creating if needed) the cart for a user and computes all totals server-side. */
export async function getCart(userId: string): Promise<CartSummary> {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } }
    });
  }

  const items: CartLine[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    brand: item.product.brand,
    image: item.product.image,
    unit: item.unit ?? item.product.unit,
    price: item.product.price,
    mrp: item.product.mrp,
    quantity: item.quantity,
    stock: item.product.stock,
    lineTotal: item.product.price * item.quantity,
    savings: Math.max(0, item.product.mrp - item.product.price) * item.quantity
  }));

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const mrpTotal = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  return {
    id: cart.id,
    items,
    itemCount,
    subtotal,
    mrpTotal,
    savings,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}

export async function addItem(userId: string, productId: string, quantity: number, unit?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");
  if (product.stock < 1) throw ApiError.badRequest("This product is out of stock");

  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {}
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } }
  });

  const nextQty = Math.min((existing?.quantity ?? 0) + quantity, 99, product.stock);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: nextQty, unit: unit ?? product.unit },
    update: { quantity: nextQty, unit: unit ?? existing?.unit ?? product.unit }
  });

  return getCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound("Cart not found");

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true } });
  if (!item || item.cartId !== cart.id) throw ApiError.notFound("Cart item not found");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return getCart(userId);
  }

  if (quantity > item.product.stock) {
    throw ApiError.badRequest(`Only ${item.product.stock} unit(s) available`);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound("Cart not found");
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) throw ApiError.notFound("Cart item not found");
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return getCart(userId);
}

export const cartConfig = { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE };
