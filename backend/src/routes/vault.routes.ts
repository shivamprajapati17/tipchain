import { Router } from "express";
import { vaultController } from "../controllers";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.get("/vaults", apiLimiter, vaultController.listVaults);
router.get("/vaults/:id", apiLimiter, vaultController.getVault);
router.post("/vaults", apiLimiter, vaultController.createVault);
router.put("/vaults/:id", apiLimiter, vaultController.updateVault);
router.delete("/vaults/:id", apiLimiter, vaultController.deleteVault);
router.post("/vaults/:id/support", apiLimiter, vaultController.supportVault);

export default router;
