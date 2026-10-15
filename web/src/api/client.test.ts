import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiClientError, getToken, queryString, setToken } from "./client";

describe("queryString", () => {
  it("skips empty, false, null and undefined values", () => {
    expect(queryString({ a: 1, b: "", c: false, d: null, e: undefined, f: true })).toBe("?a=1&f=true");
  });

  it("returns an empty string when nothing is set", () => {
    expect(queryString({})).toBe("");
  });
});

describe("token storage", () => {
  it("persists and clears the session token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe("apiRequest", () => {
  beforeEach(() => {
    setToken("test-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setToken(null);
  });

  it("returns parsed JSON on success and sends the auth header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiRequest<{ ok: boolean }>("/health");
    expect(data.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("prefixes requests with the /api base path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/health");
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/health");
  });

  it("throws an ApiClientError carrying the server error shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: "Only 2 units available", code: "BAD_REQUEST" } }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(apiRequest("/cart/items")).rejects.toMatchObject({
      message: "Only 2 units available",
      code: "BAD_REQUEST",
      status: 400
    });
  });

  it("surfaces a NETWORK error when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    const error = await apiRequest("/products").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("NETWORK");
  });
});
