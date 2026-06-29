import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendDeleted } from "../utils/apiResponse";
import { socialService } from "../services/social.service";

export const follow = asyncHandler(async (req: Request, res: Response) => {
  const { followerWallet, creatorWallet } = req.body;
  const result = await socialService.follow(followerWallet, creatorWallet);
  sendSuccess(res, result, "Followed successfully", 201);
});

export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  const follower = req.params.follower as string;
  const creator = req.params.creator as string;
  await socialService.unfollow(follower, creator);
  sendDeleted(res, "Unfollowed successfully");
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const result = await socialService.getFollowers(wallet);
  sendSuccess(res, { creatorWallet: wallet, ...result });
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const result = await socialService.getFollowing(wallet);
  sendSuccess(res, { wallet, ...result });
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { authorWallet, creatorWallet, content } = req.body;
  const comment = await socialService.addComment(authorWallet, creatorWallet, content);
  sendSuccess(res, comment, "Comment added", 201);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const creatorWallet = req.params.creatorWallet as string;
  const comments = await socialService.getComments(creatorWallet);
  sendSuccess(res, { creatorWallet, comments });
});

export const createUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { creatorWallet, title, content, imageUrl } = req.body;
  const update = await socialService.createUpdate(creatorWallet, title, content, imageUrl);
  sendSuccess(res, update, "Update created", 201);
});

export const getUpdates = asyncHandler(async (req: Request, res: Response) => {
  const creatorWallet = req.params.creatorWallet as string;
  const updates = await socialService.getUpdates(creatorWallet);
  sendSuccess(res, { creatorWallet, updates });
});

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const feed = await socialService.getFeed(wallet);
  sendSuccess(res, { feed });
});
