import { promises as fs } from "fs";
import pRetry from "p-retry";
import * as path from "path";
import z from "zod";

const retryConfigSchema = z.object({
  maxRetries: z.number().int().min(1).default(3),
  baseDelay: z.number().positive().default(1000),
});

async function retry<T>(
  operation: () => Promise<T>,
  config?: { maxRetries: number; baseDelay?: number },
  onFailure?: () => Promise<void>,
): Promise<T> {
  const { maxRetries, baseDelay } = retryConfigSchema.parse(config);

  return pRetry(operation, {
    retries: maxRetries,
    factor: 2,
    minTimeout: baseDelay,
    onFailedAttempt: async (error) => {
      console.warn(`Attempt ${error.attemptNumber} failed: ${error.message}`);
      if (onFailure) {
        await onFailure();
      }
    },
  });
}

async function getFilePath(folder: string, filename: string) {
  const dirPath = path.resolve(process.cwd(), folder);
  const filePath = path.join(dirPath, filename);

  await fs.mkdir(dirPath, { recursive: true });

  return filePath;
}

export { getFilePath, retry };
