import { describe, expect, it } from "vitest";
import { classForOrderStatus, formatCount, formatINR } from "./format";

describe("format helpers", () => {
  it("formats INR with Indian digit grouping", () => {
    expect(formatINR(125000)).toContain("1,25,000");
    expect(formatINR(0)).toContain("0");
  });

  it("guards against null / NaN values", () => {
    expect(formatINR(null)).toBe("₹0");
    expect(formatINR(undefined)).toBe("₹0");
    expect(formatINR(Number.NaN)).toBe("₹0");
  });

  it("formats counts with grouping", () => {
    expect(formatCount(1240)).toBe("1,240");
    expect(formatCount(500000)).toBe("5,00,000");
  });

  it("maps order statuses to distinct class tokens", () => {
    expect(classForOrderStatus("DELIVERED")).toContain("secondary");
    expect(classForOrderStatus("CANCELLED")).toContain("error");
    expect(classForOrderStatus("CONFIRMED")).toContain("primary");
    // Unknown statuses fall back to the default confirmed styling.
    expect(classForOrderStatus("WEIRD")).toBe(classForOrderStatus("CONFIRMED"));
  });
});
