export {};

declare global {
  interface Window {
    TS: {
      token: string;
      url?: string;
      getUserId?: () => string;
      resetUserId?: () => string;
      setUserId?: (id: string) => void;
    };
    testId?: string;
    MozMutationObserver: MutationObserver;
    WebKitMutationObserver: MutationObserver;
  }
}
