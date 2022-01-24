export {};

declare global {
  interface Window {
    TS: { token: string; url?: string };
    TSJS: {
      getUserId: () => string;
      resetUserId: () => string;
      setUserId: (id: string) => void;
    };
    testId?: string;
    MozMutationObserver: MutationObserver;
    WebKitMutationObserver: MutationObserver;
  }
}
