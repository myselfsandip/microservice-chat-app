import winston from "winston";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const { combine, timestamp, json, errors, align, printf, colorize } =
  winston.format;

// Base logger with console and default app.log file
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({
      format: combine(
        // Colorize only in non-production
        ...(process.env.NODE_ENV !== "production" ? [colorize({ all: true })] : []),
        timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }),
        align(),
        printf(({ timestamp, level, message, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0
              ? `\n${JSON.stringify(meta, null, 2)}`
              : "";

          return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
        })
      ),
    }),
    // Default file transport for app.log in development
    ...(process.env.NODE_ENV === "development" ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), "logs", "app.log"),
        format: combine(
          timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }), // Readable timestamp
          errors({ stack: true }),
          json()
        ),
        maxsize: 5 * 1024 * 1024, // 5MB per file
        maxFiles: 5, // Rotate up to 5 files (e.g., app.log.1)
      }),
    ] : []),
  ],
  silent: process.env.NODE_ENV === "test",
});

// Function to get a dynamic file logger (for additional files)
export const getFileLogger = (filename: string) => {
  if (process.env.NODE_ENV !== "development") {
    return logger; // Fallback to base in non-dev
  }

  const fullPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
      timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }),
      errors({ stack: true }),
      json()
    ),
    transports: [
      new winston.transports.File({
        filename: fullPath,
      }),
    ],
  });
};
