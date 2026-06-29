import morgan from "morgan";
import logger from "../utils/logger";
import { isProduction } from "../config/env";

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const skip = () => {
  return !isProduction() && process.env.LOG_HTTP === "false";
};

export const httpLogger = morgan(
  isProduction()
    ? ':remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
    : ":method :url :status :response-time ms - :res[content-length]",
  { stream, skip }
);
