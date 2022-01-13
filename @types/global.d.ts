export {};

declare global {
  interface Window {
    TS: { token: string; url?: string };
    MozMutationObserver: MutationObserver;
    WebKitMutationObserver: MutationObserver;
  }
}
