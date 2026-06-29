import { describe, it, expect } from "vitest";
import { extractPagination, extractSort, extractDateRange } from "../../../src/utils/pagination";
import { Request } from "express";

function createMockReq(query: Record<string, string>): Partial<Request> {
  return { query } as any;
}

describe("extractPagination", () => {
  it("should extract default page and limit", () => {
    const req = createMockReq({});
    const result = extractPagination(req as Request);

    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("should respect custom page and limit", () => {
    const req = createMockReq({ page: "3", limit: "10" });
    const result = extractPagination(req as Request);

    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("should clamp limit to maxLimit", () => {
    const req = createMockReq({ limit: "500" });
    const result = extractPagination(req as Request, 20, 100);

    expect(result.limit).toBe(100);
  });

  it("should ensure minimum page is 1", () => {
    const req = createMockReq({ page: "0", limit: "10" });
    const result = extractPagination(req as Request);

    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("should handle invalid page and limit values", () => {
    const req = createMockReq({ page: "abc", limit: "xyz" });
    const result = extractPagination(req as Request);

    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("should handle negative numbers", () => {
    const req = createMockReq({ page: "-5", limit: "-10" });
    const result = extractPagination(req as Request);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it("should allow custom default limit", () => {
    const req = createMockReq({});
    const result = extractPagination(req as Request, 50);

    expect(result.limit).toBe(50);
  });

  it("should attach pagination to request object", () => {
    const req = createMockReq({ page: "2", limit: "15" }) as any;
    extractPagination(req as Request);

    expect(req.pagination).toEqual({ page: 2, limit: 15, skip: 15 });
  });
});

describe("extractSort", () => {
  it("should return default sort by createdAt desc", () => {
    const req = createMockReq({});
    const result = extractSort(req as Request);

    expect(result).toEqual({ field: "createdAt", order: "desc" });
  });

  it("should parse custom sort field and order", () => {
    const req = createMockReq({ sortBy: "totalTips", sortOrder: "asc" });
    const result = extractSort(req as Request);

    expect(result).toEqual({ field: "totalTips", order: "asc" });
  });

  it("should default to desc for invalid order", () => {
    const req = createMockReq({ sortOrder: "invalid" });
    const result = extractSort(req as Request);

    expect(result.order).toBe("desc");
  });

  it("should allow custom default field", () => {
    const req = createMockReq({});
    const result = extractSort(req as Request, "totalTips", "asc");

    expect(result).toEqual({ field: "totalTips", order: "asc" });
  });
});

describe("extractDateRange", () => {
  it("should return default 30 day range", () => {
    const req = createMockReq({});
    const result = extractDateRange(req as Request);

    expect(result.days).toBe(30);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.startDate < result.endDate).toBe(true);
  });

  it("should parse custom days parameter", () => {
    const req = createMockReq({ days: "7" });
    const result = extractDateRange(req as Request);

    expect(result.days).toBe(7);
  });

  it("should clamp days to max 365", () => {
    const req = createMockReq({ days: "500" });
    const result = extractDateRange(req as Request);

    expect(result.days).toBe(365);
  });

  it("should handle invalid days value", () => {
    const req = createMockReq({ days: "invalid" });
    const result = extractDateRange(req as Request);

    expect(result.days).toBe(30);
  });

  it("should calculate correct date range", () => {
    const req = createMockReq({ days: "1" });
    const result = extractDateRange(req as Request);

    const diffMs = result.endDate.getTime() - result.startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThanOrEqual(23.5);
    expect(diffHours).toBeLessThanOrEqual(24.5);
  });
});
