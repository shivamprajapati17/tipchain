import winston from "winston";
import path from "path";
import { getEnv, isProduction } from "../config/env";

const logDir = path.join(process.cwd(), "logs");

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat }),
];

// File logging only works on hosts with a writable filesystem (local dev,
// containers). Serverless runtimes such as Vercel are read-only outside
// /tmp, so a File transport there would crash on boot — opt in explicitly
// with LOG_TO_FILE=true on hosts that support it.
if (!isProduction() || process.env.LOG_TO_FILE === "true") {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: isProduction() ? "info" : "debug",
  levels,
  transports,
});

export default logger;
