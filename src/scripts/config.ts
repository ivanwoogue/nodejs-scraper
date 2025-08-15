interface ScrapingConfig {
  maxItems: number;
  retryAttempts: number;
  timeouts: {
    element: number;
    popupElements: number;
    retry: number;
    reload: number;
    loadState: number;
  };
}

export type { ScrapingConfig };
