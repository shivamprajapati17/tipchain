import { Request, Response } from "express";
import { vaultService } from "../services/vault.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { extractPagination } from "../utils/pagination";

export const listVaults = asyncHandler(async (req: Request, res: Response) => {
  const { limit, skip } = extractPagination(req, 24, 100);
  const result = await vaultService.list({ limit, offset: skip });
  sendSuccess(res, result);
});

export const getVault = asyncHandler(async (req: Request, res: Response) => {
  const vault = await vaultService.getById(req.params.id as string);
  sendSuccess(res, vault);
});

export const createVault = asyncHandler(async (req: Request, res: Response) => {
  const vault = await vaultService.create(req.body);
  sendCreated(res, vault, "Vault created");
});

export const updateVault = asyncHandler(async (req: Request, res: Response) => {
  const vault = await vaultService.update(req.params.id as string, req.body);
  sendSuccess(res, vault, "Vault updated");
});

export const deleteVault = asyncHandler(async (req: Request, res: Response) => {
  const ownerWallet = req.body.ownerWallet as string | undefined;
  const result = await vaultService.remove(req.params.id as string, ownerWallet);
  sendSuccess(res, result, "Vault deleted");
});

export const supportVault = asyncHandler(async (req: Request, res: Response) => {
  const result = await vaultService.support({
    vaultId: req.params.id as string,
    supporterWallet: req.body.supporterWallet,
    amount: req.body.amount,
    token: req.body.token,
    message: req.body.message,
  });
  sendCreated(res, result, "Vault supported");
});

export const getVaultTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit, skip } = extractPagination(req, 20, 50);
    const result = await vaultService.getTransactions(req.params.id as string, {
      limit,
      offset: skip,
    });
    sendSuccess(res, result);
  }
);
