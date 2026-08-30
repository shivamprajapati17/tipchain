import logger from "../utils/logger";

export const eventBus = {
  async emit(_event: string, _payload: Record<string, unknown>): Promise<void> {
    logger.debug(`EventBus stub: ${_event}`);
  },
};
