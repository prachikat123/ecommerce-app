import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

let sellerToken: string;
let customerToken: string;

const newProduct = {
  name: "Test Hybrid Maize Seeds",
  brand: "TestBrand",
  description: "A high yielding hybrid maize for Kharif.",
  categorySlug: "seeds",
  price: 500,
  mrp: 650,
  unit: "4 kg",
  packSizes: ["4 kg", "10 kg"],
  stock: 25,
  image: "https://example.com/maize.png",
  mandiPrice: 600
};

beforeAll(async () => {
  const seller = await request(app)
    .post("/api/auth/session")
    .send({ phone: "9811111111", role: "SELLER" });
  sellerToken = seller.body.token;
  const customer = await request(app).post("/api/auth/session").send({ phone: "9000000044" });
  customerToken = customer.body.token;
});

const asSeller = () => ({ Authorization: `Bearer ${sellerToken}` });

describe("seller API", () => {
  it("blocks customers from seller routes", async () => {
    const res = await request(app)
      .post("/api/seller/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(newProduct);
    expect(res.status).toBe(403);
  });

  it("creates a product for the authenticated seller", async () => {
    const res = await request(app).post("/api/seller/products").set(asSeller()).send(newProduct);
    expect(res.status).toBe(201);
    expect(res.body.slug).toContain("test-hybrid-maize-seeds");
    expect(res.body.discountPercent).toBe(23);
  });

  it("validates product payloads", async () => {
    const res = await request(app)
      .post("/api/seller/products")
      .set(asSeller())
      .send({ ...newProduct, price: 0, image: "not-a-url" });
    expect(res.status).toBe(422);
  });

  it("rejects price greater than MRP", async () => {
    const res = await request(app)
      .post("/api/seller/products")
      .set(asSeller())
      .send({ ...newProduct, price: 999, mrp: 100 });
    expect(res.status).toBe(400);
  });

  it("lists the seller's own products", async () => {
    const res = await request(app).get("/api/seller/products").set(asSeller());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("returns dashboard stats", async () => {
    const res = await request(app).get("/api/seller/stats").set(asSeller());
    expect(res.status).toBe(200);
    expect(res.body.productCount).toBeGreaterThan(0);
    expect(typeof res.body.revenue).toBe("number");
  });

  it("lists orders containing the seller's products", async () => {
    const res = await request(app).get("/api/seller/orders").set(asSeller());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("updates an order status", async () => {
    const orders = await request(app).get("/api/seller/orders").set(asSeller());
    if (orders.body.items.length > 0) {
      const id = orders.body.items[0].id;
      const res = await request(app)
        .patch(`/api/seller/orders/${id}/status`)
        .set(asSeller())
        .send({ status: "PACKED" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PACKED");
    }
  });
});
