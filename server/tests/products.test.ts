import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("products API", () => {
  it("lists products with pagination metadata", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/products?category=seeds");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((p: { category: { slug: string } }) => p.category.slug === "seeds")).toBe(true);
  });

  it("filters by price range", async () => {
    const res = await request(app).get("/api/products?minPrice=200&maxPrice=300");
    expect(res.status).toBe(200);
    expect(res.body.items.every((p: { price: number }) => p.price >= 200 && p.price <= 300)).toBe(true);
  });

  it("searches by text query", async () => {
    const res = await request(app).get("/api/products?q=urea");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("sorts by price ascending", async () => {
    const res = await request(app).get("/api/products?sort=price-asc&limit=20");
    const prices = res.body.items.map((p: { price: number }) => p.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("computes discount percentage and mandi savings", async () => {
    const res = await request(app).get("/api/products/tomato-seeds");
    expect(res.status).toBe(200);
    expect(res.body.discountPercent).toBe(50);
    expect(res.body.mandiSavings).toBe(50);
    expect(res.body.packSizes).toEqual(["1 kg", "5 kg"]);
    expect(res.body.inStock).toBe(true);
  });

  it("rejects an invalid sort value", async () => {
    const res = await request(app).get("/api/products?sort=banana");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for an unknown product", async () => {
    const res = await request(app).get("/api/products/nope-not-here");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("lists categories with product counts", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    const seeds = res.body.items.find((c: { slug: string }) => c.slug === "seeds");
    expect(seeds.productCount).toBeGreaterThan(0);
  });

  it("returns related products from the same category", async () => {
    const res = await request(app).get("/api/products/tomato-seeds/related");
    expect(res.status).toBe(200);
    expect(res.body.items.every((p: { slug: string }) => p.slug !== "tomato-seeds")).toBe(true);
  });
});
