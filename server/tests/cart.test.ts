import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();
const PHONE = "9000000022";

let token: string;
let tomatoId: string;
let neemId: string;

async function productId(slug: string) {
  const res = await request(app).get(`/api/products/${slug}`);
  return res.body.id as string;
}

beforeAll(async () => {
  const session = await request(app).post("/api/auth/session").send({ phone: PHONE });
  token = session.body.token;
  tomatoId = await productId("tomato-seeds");
  neemId = await productId("neem-oil");
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("cart API", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
  });

  it("starts empty", async () => {
    const res = await request(app).get("/api/cart").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.itemCount).toBe(0);
    expect(res.body.total).toBe(0);
  });

  it("adds an item and computes totals server-side", async () => {
    const res = await request(app).post("/api/cart/items").set(auth()).send({ productId: tomatoId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.itemCount).toBe(2);
    expect(res.body.subtotal).toBe(200);
    expect(res.body.savings).toBe(200); // (200-100)*2
    expect(res.body.deliveryFee).toBe(49); // under free-delivery threshold
    expect(res.body.total).toBe(249);
  });

  it("increments quantity when the same product is added again", async () => {
    const res = await request(app).post("/api/cart/items").set(auth()).send({ productId: tomatoId, quantity: 1 });
    expect(res.body.itemCount).toBe(3);
    expect(res.body.items).toHaveLength(1);
  });

  it("rejects adding an out-of-stock product", async () => {
    const res = await request(app).post("/api/cart/items").set(auth()).send({ productId: neemId, quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown product", async () => {
    const res = await request(app).post("/api/cart/items").set(auth()).send({ productId: "ghost", quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("updates quantity", async () => {
    const cart = await request(app).get("/api/cart").set(auth());
    const itemId = cart.body.items[0].id;
    const res = await request(app).patch(`/api/cart/items/${itemId}`).set(auth()).send({ quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.itemCount).toBe(1);
  });

  it("removes an item when quantity is set to 0", async () => {
    const cart = await request(app).get("/api/cart").set(auth());
    const itemId = cart.body.items[0].id;
    const res = await request(app).patch(`/api/cart/items/${itemId}`).set(auth()).send({ quantity: 0 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it("deletes an item by id", async () => {
    await request(app).post("/api/cart/items").set(auth()).send({ productId: tomatoId, quantity: 1 });
    const cart = await request(app).get("/api/cart").set(auth());
    const itemId = cart.body.items[0].id;
    const res = await request(app).delete(`/api/cart/items/${itemId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it("clears the cart", async () => {
    await request(app).post("/api/cart/items").set(auth()).send({ productId: tomatoId, quantity: 1 });
    const res = await request(app).delete("/api/cart").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});
