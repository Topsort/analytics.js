import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";

// jsdom has no IntersectionObserver, so this installs a controllable fake before
// importing the detector. Each test then drives the exact callbacks a browser
// would deliver for a banner inside a hidden mega-menu.

interface FakeEntry {
  target: Element;
  isIntersecting: boolean;
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  readonly observed = new Set<Element>();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: FakeEntry[]): void {
    this.callback(
      entries as unknown as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

const POLL_MS = 200;
const events: { type: string; product?: string; bid?: string }[] = [];

/** The single observer the detector creates at module scope. */
function observer(): FakeIntersectionObserver {
  const instance = FakeIntersectionObserver.instances[0];
  if (!instance) {
    throw new Error("detector did not create an IntersectionObserver");
  }
  return instance;
}

async function inject(html: string): Promise<HTMLElement> {
  document.body.innerHTML = html;
  // Let the detector's MutationObserver (a microtask) pick the markup up.
  await Promise.resolve();
  await Promise.resolve();
  const target = document.querySelector<HTMLElement>("[data-ts-product]");
  if (!target) {
    throw new Error("no target in markup");
  }
  return target;
}

function open(id: string, style: Partial<CSSStyleDeclaration>): void {
  Object.assign((document.getElementById(id) as HTMLElement).style, style);
}

beforeAll(async () => {
  window.TS = { token: "token" };
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  // Installed once: calling useFakeTimers again mid-file would orphan the
  // detector's interval handle and silently disable the reveal poll.
  vi.useFakeTimers();
  window.addEventListener("topsort", (e) => {
    events.push((e as CustomEvent).detail);
  });
  await import("./detector");
});

afterEach(() => {
  // Detaching pending elements lets the poll drain and clear its timer, so each
  // test starts from a known state.
  document.body.innerHTML = "";
  vi.advanceTimersByTime(POLL_MS);
  events.length = 0;
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("does not report a banner hidden by display:none", async () => {
  const target = await inject(`
    <div id="menu" style="display:none">
      <div data-ts-product="p-display" data-ts-resolved-bid="bid-display"></div>
    </div>
  `);
  expect(observer().observed.has(target)).toBe(true);

  // A real observer reports a display:none element as not intersecting, since it
  // has no box. Claim it is intersecting anyway: the paint check must still
  // refuse, so the gate cannot be defeated by geometry alone.
  observer().trigger([{ target, isIntersecting: true }]);
  vi.advanceTimersByTime(1000);

  expect(events).toEqual([]);
});

test("reports once a display:none menu is opened", async () => {
  const target = await inject(`
    <div id="menu" style="display:none">
      <div data-ts-product="p-open" data-ts-resolved-bid="bid-open"></div>
    </div>
  `);
  observer().trigger([{ target, isIntersecting: false }]);
  expect(events).toEqual([]);

  // Opening the menu gives the element a box, which re-fires the observer.
  open("menu", { display: "block" });
  observer().trigger([{ target, isIntersecting: true }]);

  expect(events).toMatchObject([{ type: "Impression", product: "p-open", bid: "bid-open" }]);
  expect(observer().observed.has(target)).toBe(false);
});

test("polls for a CSS-only reveal, which fires no observer callback", async () => {
  const target = await inject(`
    <div id="menu" style="visibility:hidden">
      <div data-ts-product="p-css" data-ts-resolved-bid="bid-css"></div>
    </div>
  `);

  // visibility:hidden keeps the box, so the element is intersecting.
  observer().trigger([{ target, isIntersecting: true }]);
  expect(events).toEqual([]);

  vi.advanceTimersByTime(3 * POLL_MS);
  expect(events).toEqual([]);

  // Hovering flips visibility with no geometry change, so no observer callback
  // will arrive — only the poll can catch this.
  open("menu", { visibility: "visible" });
  vi.advanceTimersByTime(POLL_MS);
  expect(events).toMatchObject([{ type: "Impression", product: "p-css", bid: "bid-css" }]);

  vi.advanceTimersByTime(5 * POLL_MS);
  expect(events).toHaveLength(1);
});

test("reports a visible banner immediately", async () => {
  const target = await inject(
    `<div data-ts-product="p-visible" data-ts-resolved-bid="bid-visible"></div>`,
  );

  observer().trigger([{ target, isIntersecting: true }]);

  expect(events).toMatchObject([{ type: "Impression", product: "p-visible", bid: "bid-visible" }]);
});

test("stops polling for an element removed before it was revealed", async () => {
  const target = await inject(`
    <div style="visibility:hidden">
      <div data-ts-product="p-removed" data-ts-resolved-bid="bid-removed"></div>
    </div>
  `);
  // Drop the queue's own pending timers so the count below is only the poll.
  vi.clearAllTimers();
  observer().trigger([{ target, isIntersecting: true }]);
  expect(vi.getTimerCount()).toBe(1);

  target.remove();
  vi.advanceTimersByTime(POLL_MS);

  expect(events).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

test("does not poll while the element is far off-screen", async () => {
  const target = await inject(`
    <div id="menu" style="visibility:hidden">
      <div data-ts-product="p-offscreen" data-ts-resolved-bid="bid-offscreen"></div>
    </div>
  `);

  vi.clearAllTimers();
  observer().trigger([{ target, isIntersecting: true }]);
  expect(vi.getTimerCount()).toBe(1);
  observer().trigger([{ target, isIntersecting: false }]);
  expect(vi.getTimerCount()).toBe(0);

  // Revealed while off-screen: still nothing, because it is not in view.
  open("menu", { visibility: "visible" });
  vi.advanceTimersByTime(5 * POLL_MS);
  expect(events).toEqual([]);

  // Scrolling it into view re-fires the observer.
  observer().trigger([{ target, isIntersecting: true }]);
  expect(events).toMatchObject([
    { type: "Impression", product: "p-offscreen", bid: "bid-offscreen" },
  ]);
});
