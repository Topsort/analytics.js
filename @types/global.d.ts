export {};

declare global {
  interface Window {
    TS: {
      token?: string;
      url?: string;
      cookieName?: string;
      getUserId?: () => string;
      resetUserId?: () => string;
      setUserId?: (id: string) => void;
      loaded?: boolean;
      gatedImpressions?: boolean;
    };
    testId?: string;
    MozMutationObserver: MutationObserver;
    WebKitMutationObserver: MutationObserver;
  }
}
