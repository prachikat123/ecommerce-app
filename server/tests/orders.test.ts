import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();
const PHONE = "9000000033";

let token: string;
let tomatoId: string;

const address = {
  name: "Ramesh Patil",
  phone: "9876543210",
  line: "Gat No. 42, Ozar Road",
  city: "Nashik",
  state: "Maharashtra",
  pincode: "422003"
};

const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const session = await request(app).post("/api/auth/session").send({ phone: PHONE });
  token = session.body.token;
  const p = await request(app).get("/api/products/tomato-seeds");
  tomatoId = p.body.id;
});

describe("orders API", () => {
  it("rejects checkout with an empty cart", async () => {
    const res = await request(app).post("/api/orders").set(auth()).send({ paymentMethod: "COD", address });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid PIN code", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set(auth())
      .send({ paymentMethod: "COD", address: { ...address, pincode: "12" } });
    expect(res.status).toBe(422);
  });

  it("creates an order from the cart, snapshots items, decrements stock and clears the cart", async () => {
    const before = await request(app).get("/api/products/tomato-seeds");
    const stockBefore = before.body.stock;

    await request(app).post("/api/cart/items").set(auth()).send({ productId: tomatoId, quantity: 2 });

    const res = await request(app)
      .post("/api/orders")
      .set(auth())
      .send({ paymentMethod: "COD", address, notes: "Deliver after 6pm" });

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^KB-/);
    expect(res.body.status).toBe("CONFIRMED");
    expect(res.body.paymentMethod).toBe("COD");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.total).toBe(249);

    const afterProduct = await request(app).get("/api/products/tomato-seeds");
    expect(afterProduct.body.stock).toBe(stockBefore - 2);

    const cart = await request(app).get("/api/cart").set(auth());
    expect(cart.body.items).toHaveLength(0);
  });

  it("lists orders for the current user", async () => {
    const res = await request(app).get("/api/orders").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("fetches a single order by number", async () => {
    const list = await request(app).get("/api/orders").set(auth());
    const orderNumber = list.body.items[0].orderNumber;
    const res = await request(app).get(`/api/orders/${orderNumber}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(orderNumber);
  });

  it("does not expose another user's order", async () => {
    const list = await request(app).get("/api/orders").set(auth());
    const other = await request(app).post("/api/auth/session").send({ phone: "9000000034" });
    const res = await request(app)
      .get(`/api/orders/${list.body.items[0].id}`)
      .set("Authorization", `Bearer ${other.body.token}`);
    expect(res.status).toBe(404);
  });

  it("persists the shipping address for reuse on checkout", async () => {
    const res = await request(app).get("/api/addresses").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].pincode).toBe("422003");
  });
});
