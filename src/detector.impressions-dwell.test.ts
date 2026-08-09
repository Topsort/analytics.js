import { afterAll, beforeAll, expect, test, vi } from "vitest";

/**
 * A viewable impression must be reported only when an element stays at least
 * INTERSECTION_THRESHOLD (0.5) visible for a continuous IMPRESSION_DWELL_MS
 * (1000ms). jsdom has no real IntersectionObserver, so we install a mock that
 * lets us drive intersection entries manually and pair it with fake timers.
 */

const DWELL_MS = 1000;

class MockIntersectionObserver {
  static current: MockIntersectionObserver | undefined;
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.current = this;
  }

  observe(el: Element): void {
    this.observed.add(el);
  }
  unobserve(el: Element): void {
    this.observed.delete(el);
  }
  disconnect(): void {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(entries: IntersectionObserverEntry[]): void {
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

function entry(
  target: Element,
  ratio: number,
  isIntersecting = ratio > 0,
): IntersectionObserverEntry {
  return { target, intersectionRatio: ratio, isIntersecting } as IntersectionObserverEntry;
}

// Drive the Page Visibility API: jsdom computes `document.hidden` from
// `visibilityState`, so override both and dispatch the `visibilitychange` event
// the detector listens for.
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

const events: any[] = [];
let io: MockIntersectionObserver;

const impressionsFor = (product: string) =>
  events.filter((e) => e.type === "Impression" && e.product === product);

beforeAll(async () => {
  window.TS = { token: "token" };
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  (window as any).IntersectionObserver = MockIntersectionObserver;

  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });

  document.body.innerHTML = `
    <div data-ts-product="product-id-dwell-stays"></div>
    <div data-ts-product="product-id-dwell-scroll"></div>
    <div data-ts-product="product-id-dwell-below"></div>
    <div data-ts-product="product-id-dwell-reentry"></div>
    <div data-ts-product="product-id-dwell-hidden"></div>
  `;

  vi.useFakeTimers();
  await import("./detector");

  const current = MockIntersectionObserver.current;
  if (!current) {
    throw new Error("detector did not create an IntersectionObserver");
  }
  io = current;
});

afterAll(() => {
  vi.useRealTimers();
});

test("uses the 0.5 threshold", () => {
  expect(io.options?.threshold).toBe(0.5);
});

test("reports an impression after the element stays visible for the full dwell", () => {
  const node = document.querySelector<HTMLElement>('[data-ts-product="product-id-dwell-stays"]');
  if (!node) throw new Error("missing node");

  io.emit([entry(node, 0.6)]);

  vi.advanceTimersByTime(DWELL_MS - 1);
  expect(impressionsFor("product-id-dwell-stays")).toHaveLength(0);

  vi.advanceTimersByTime(1);
  expect(impressionsFor("product-id-dwell-stays")).toHaveLength(1);

  // Once counted, the node is unobserved so it never fires again.
  expect(io.observed.has(node)).toBe(false);
});

test("does not report an impression for a quick scroll-past (< dwell)", () => {
  const node = document.querySelector<HTMLElement>('[data-ts-product="product-id-dwell-scroll"]');
  if (!node) throw new Error("missing node");

  io.emit([entry(node, 0.6)]);
  vi.advanceTimersByTime(500);
  // Element leaves the threshold before the dwell completes.
  io.emit([entry(node, 0, false)]);
  vi.advanceTimersByTime(DWELL_MS);

  expect(impressionsFor("product-id-dwell-scroll")).toHaveLength(0);
});

test("does not start the dwell when below the threshold", () => {
  const node = document.querySelector<HTMLElement>('[data-ts-product="product-id-dwell-below"]');
  if (!node) throw new Error("missing node");

  // Some engines report isIntersecting=true below the configured threshold.
  io.emit([entry(node, 0.3, true)]);
  vi.advanceTimersByTime(DWELL_MS * 2);

  expect(impressionsFor("product-id-dwell-below")).toHaveLength(0);
});

test("re-entering while counting does not restart or duplicate the timer", () => {
  const node = document.querySelector<HTMLElement>('[data-ts-product="product-id-dwell-reentry"]');
  if (!node) throw new Error("missing node");

  io.emit([entry(node, 0.6)]);
  vi.advanceTimersByTime(500);
  // A second intersecting callback mid-dwell must not reset the countdown.
  io.emit([entry(node, 0.7)]);
  vi.advanceTimersByTime(499);
  expect(impressionsFor("product-id-dwell-reentry")).toHaveLength(0);

  vi.advanceTimersByTime(1);
  expect(impressionsFor("product-id-dwell-reentry")).toHaveLength(1);
});

test("pauses the dwell while the tab is hidden and requires a fresh second on return", () => {
  const node = document.querySelector<HTMLElement>('[data-ts-product="product-id-dwell-hidden"]');
  if (!node) throw new Error("missing node");

  io.emit([entry(node, 0.6)]);
  vi.advanceTimersByTime(500); // halfway through the dwell

  // The tab is backgrounded: the ad is no longer viewable, so the pending dwell
  // is cancelled. Even after well over a second hidden, nothing is reported.
  setHidden(true);
  vi.advanceTimersByTime(DWELL_MS * 2);
  expect(impressionsFor("product-id-dwell-hidden")).toHaveLength(0);

  // The tab returns to the foreground. Because a hide breaks the continuous
  // second, the ad must earn a *fresh* full second — the earlier 500ms does not
  // carry over.
  setHidden(false);
  vi.advanceTimersByTime(DWELL_MS - 1);
  expect(impressionsFor("product-id-dwell-hidden")).toHaveLength(0);

  vi.advanceTimersByTime(1);
  expect(impressionsFor("product-id-dwell-hidden")).toHaveLength(1);
  // Counted once, then unobserved.
  expect(io.observed.has(node)).toBe(false);

  // Restore visibility so later suites are unaffected.
  setHidden(false);
});
