import { prisma } from "../prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { getCart } from "./cartService.js";

interface CheckoutInput {
  paymentMethod: string;
  address: {
    name: string;
    phone: string;
    line: string;
    city: string;
    state: string;
    pincode: string;
    label?: string;
  };
  notes?: string;
}

function buildOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1_0000).toString().padStart(4, "0");
  return `KB-${stamp}-${rand}`;
}

/**
 * Creates an order from the user's current cart inside a single transaction:
 * validates stock, decrements inventory, snapshots line items, and clears the cart.
 */
export async function createOrder(userId: string, input: CheckoutInput) {
  const cart = await getCart(userId);
  if (cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  // Pre-validate stock with fresh reads inside the transaction.
  const order = await prisma.$transaction(async (tx) => {
    const productIds = cart.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const line of cart.items) {
      const product = byId.get(line.productId);
      if (!product) throw ApiError.notFound(`Product not found: ${line.name}`);
      if (product.stock < line.quantity) {
        throw ApiError.badRequest(`Only ${product.stock} unit(s) of "${product.name}" are available`);
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber: buildOrderNumber(),
        userId,
        status: "CONFIRMED",
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "COD" ? "PENDING" : "PAID",
        subtotal: cart.subtotal,
        discount: cart.savings,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        itemCount: cart.itemCount,
        addressName: input.address.name,
        addressPhone: input.address.phone,
        addressLine: input.address.line,
        addressCity: input.address.city,
        addressState: input.address.state,
        addressPincode: input.address.pincode,
        notes: input.notes,
        items: {
          create: cart.items.map((line) => ({
            productId: line.productId,
            productName: line.name,
            brand: line.brand,
            unit: line.unit,
            image: line.image,
            price: line.price,
            mrp: line.mrp,
            quantity: line.quantity,
            lineTotal: line.lineTotal
          }))
        }
      },
      include: { items: true }
    });

    for (const line of cart.items) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { decrement: line.quantity } }
      });
    }

    const userCart = await tx.cart.findUnique({ where: { userId } });
    if (userCart) {
      await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
    }

    // Persist the shipping address for reuse on the next checkout.
    await tx.address.create({
      data: {
        userId,
        label: input.address.label ?? "Home",
        name: input.address.name,
        phone: input.address.phone,
        line: input.address.line,
        city: input.address.city,
        state: input.address.state,
        pincode: input.address.pincode
      }
    });

    return created;
  });

  return order;
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true }
  });
}

export async function getOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      userId
    },
    include: { items: true }
  });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function listSellerOrders(sellerUserId: string, status?: string) {
  const seller = await prisma.seller.findUnique({ where: { userId: sellerUserId } });
  if (!seller) throw ApiError.forbidden("Seller profile not found");

  const productIds = (
    await prisma.product.findMany({ where: { sellerId: seller.id }, select: { id: true } })
  ).map((p) => p.id);

  return prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      items: { some: { productId: { in: productIds } } }
    },
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true, phone: true } } }
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: orderId }, { orderNumber: orderId }] }
  });
  if (!order) throw ApiError.notFound("Order not found");
  return prisma.order.update({ where: { id: order.id }, data: { status }, include: { items: true } });
}
