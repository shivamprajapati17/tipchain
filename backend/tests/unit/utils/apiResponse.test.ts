import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { sendSuccess, sendCreated, sendDeleted, sendPaginated } from "../../../src/utils/apiResponse";

function createMockRes(): Response {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
}

describe("sendSuccess", () => {
  it("should send a 200 response with data", () => {
    const res = createMockRes();
    const data = { walletAddress: "abc123", username: "testuser" };

    sendSuccess(res, data, "Success");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data,
        message: "Success",
        timestamp: expect.any(String),
      })
    );
  });

  it("should send with default status 200", () => {
    const res = createMockRes();

    sendSuccess(res, { key: "value" });

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should send null data gracefully", () => {
    const res = createMockRes();

    sendSuccess(res, null);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: null,
      })
    );
  });
});

describe("sendCreated", () => {
  it("should send a 201 response", () => {
    const res = createMockRes();
    const data = { id: "1", name: "New" };

    sendCreated(res, data, "Created");

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data,
        message: "Created",
      })
    );
  });
});

describe("sendDeleted", () => {
  it("should send a 200 with default message", () => {
    const res = createMockRes();

    sendDeleted(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: null,
        message: "Resource deleted successfully",
      })
    );
  });

  it("should use custom message", () => {
    const res = createMockRes();

    sendDeleted(res, "Creator removed");

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Creator removed",
      })
    );
  });
});

describe("sendPaginated", () => {
  it("should send paginated response with correct pagination", () => {
    const res = createMockRes();
    const data = [{ id: "1" }, { id: "2" }];

    sendPaginated(res, data, { page: 1, limit: 10, total: 25 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
        timestamp: expect.any(String),
      })
    );
  });

  it("should set hasNext and hasPrev correctly", () => {
    const res = createMockRes();

    sendPaginated(res, [], { page: 2, limit: 10, total: 25 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({
          hasNext: true,
          hasPrev: true,
          totalPages: 3,
        }),
      })
    );
  });

  it("should handle last page correctly", () => {
    const res = createMockRes();

    sendPaginated(res, [], { page: 3, limit: 10, total: 25 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({
          hasNext: false,
          hasPrev: true,
          totalPages: 3,
        }),
      })
    );
  });
});
