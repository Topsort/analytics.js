export {};

declare global {
  interface Window {
    TS: { token: string; url?: string };
    testId?: string;
    MozMutationObserver: MutationObserver;
    WebKitMutationObserver: MutationObserver;
  }
}
