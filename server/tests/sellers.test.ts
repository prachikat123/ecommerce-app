import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("sellers API", () => {
  it("exposes the seller id on product listings", async () => {
    const res = await request(app).get("/api/products?limit=1");
    expect(res.status).toBe(200);
    expect(res.body.items[0].seller.id).toBeTruthy();
  });

  it("returns a public storefront with the seller catalog", async () => {
    const list = await request(app).get("/api/products?limit=1");
    const sellerId = list.body.items[0].seller.id as string;

    const res = await request(app).get(`/api/sellers/${sellerId}`);
    expect(res.status).toBe(200);
    expect(res.body.shopName).toBe("Test Agri Store");
    expect(res.body.verified).toBe(true);
    expect(res.body.productCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products[0].seller.id).toBe(sellerId);
  });

  it("returns 404 for an unknown seller", async () => {
    const res = await request(app).get("/api/sellers/not-a-real-seller");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
