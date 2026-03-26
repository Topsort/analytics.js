import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("detector bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    document.cookie = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does nothing when already loaded", async () => {
    const observe = vi.fn();
    class MutationObserverMock {
      observe = observe;
    }
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: MutationObserverMock,
    });

    window.TS = {
      token: "token",
      loaded: true,
    };

    await import("./detector");
    expect(observe).not.toHaveBeenCalled();
  });

  test("logs when token is missing", async () => {
    const observe = vi.fn();
    class MutationObserverMock {
      observe = observe;
    }
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: MutationObserverMock,
    });

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    window.TS = {} as typeof window.TS;

    await import("./detector");
    expect(error).toHaveBeenCalledWith("Missing TS token");
    expect(observe).not.toHaveBeenCalled();
  });

  test("registers DOMContentLoaded listener when document is loading", async () => {
    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, "readyState");
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    window.TS = {
      token: "token",
    };

    await import("./detector");
    expect(addEventListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));

    if (readyStateDescriptor) {
      Object.defineProperty(document, "readyState", readyStateDescriptor);
    } else {
      delete (document as { readyState?: string }).readyState;
    }
  });

  test("uses hash router path when hash starts with slash", async () => {
    window.TS = {
      token: "token",
    };
    window.history.replaceState({}, "", "/checkout#/products/list");
    document.body.innerHTML = '<div id="product" data-ts-product="product-id-hash"></div>';

    const events: Array<{ page?: string }> = [];
    window.addEventListener("topsort", (event) => {
      events.push((event as CustomEvent).detail);
    });

    await import("./detector");
    const product = document.querySelector("#product");
    product?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(events.some((event) => event.page === "#/products/list")).toBe(true);
  });

  test("uses IntersectionObserver and skips non-HTMLElement matches", async () => {
    const unobserve = vi.fn();
    const observe = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    class IntersectionObserverMock {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe = observe.mockImplementation((node: Element) => {
        callback?.([{ isIntersecting: true, target: node } as IntersectionObserverEntry], this);
      });
      unobserve = unobserve;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "";
      thresholds = [0.5];
    }
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: IntersectionObserverMock,
    });

    const mutationObserve = vi.fn();
    class MutationObserverMock {
      observe = mutationObserve;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: MutationObserverMock,
    });

    window.TS = { token: "token" };
    document.body.innerHTML = `
      <svg id="svg-product" data-ts-product="svg-product"></svg>
      <div id="html-product" data-ts-product="html-product"></div>
    `;
    const events: Array<{ type: string; product?: string }> = [];
    window.addEventListener("topsort", (event) => {
      events.push((event as CustomEvent).detail);
    });

    await import("./detector");

    expect(observe).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(unobserve).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(
      events.some((event) => event.type === "Impression" && event.product === "html-product"),
    ).toBe(true);
    expect(events.some((event) => event.product === "svg-product")).toBe(false);
  });

  test("ignores attribute mutations for non-HTMLElement targets", async () => {
    const observe = vi.fn();
    class MutationObserverMock {
      private callback: MutationCallback;

      constructor(cb: MutationCallback) {
        this.callback = cb;
      }

      observe = observe.mockImplementation(() => {
        const text = document.createTextNode("not-an-element");
        this.callback([{ type: "attributes", target: text } as unknown as MutationRecord], this);
      });
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: MutationObserverMock,
    });

    window.TS = { token: "token" };
    await import("./detector");

    expect(observe).toHaveBeenCalledOnce();
  });
});
