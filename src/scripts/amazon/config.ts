import type { ScrapingConfig } from "../config";

const CONFIG = {
  maxItems: 5,
  retryAttempts: 5,
  timeouts: {
    element: 10000,
    popupElements: 2500,
    retry: 3000,
    reload: 10000,
    loadState: 20000,
  },
} as const satisfies ScrapingConfig;

export { CONFIG };
