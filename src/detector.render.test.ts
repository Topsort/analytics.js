import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const reportEventMock = vi.fn();

vi.mock("@topsort/sdk", () => ({
  TopsortClient: class {
    reportEvent = reportEventMock;
  },
}));

async function flushQueue() {
  await vi.advanceTimersByTimeAsync(300);
  await Promise.resolve();
}

describe("render events", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    reportEventMock.mockReset();
    reportEventMock.mockResolvedValue({ retry: false });
    document.body.innerHTML = "";
    localStorage.clear();
    document.cookie = "";
    window.TS = { token: "token" };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("reports a render as soon as a sponsored ad is inserted", async () => {
    const events: any[] = [];
    window.addEventListener("topsort", (e) => {
      events.push((e as any).detail);
    });
    document.body.innerHTML = `
      <div data-ts-product="p-1" data-ts-resolved-bid="bid-render-1"></div>
    `;

    await import("./detector");

    expect(events).toMatchObject([{ type: "Render", bid: "bid-render-1" }]);

    await flushQueue();
    const renderPayload = reportEventMock.mock.calls
      .map(([payload]) => payload)
      .find((payload) => "renders" in (payload as Record<string, unknown>)) as {
      renders: Array<Record<string, unknown>>;
    };
    expect(renderPayload).toBeDefined();
    expect(renderPayload.renders).toHaveLength(1);
    expect(renderPayload.renders[0]).toMatchObject({
      resolvedBidId: "bid-render-1",
      placement: { path: "/" },
    });
    expect(renderPayload.renders[0]).not.toHaveProperty("entity");
    expect(renderPayload.renders[0]).not.toHaveProperty("additionalAttribution");
  });

  test("does not report a render for an organic product without a bid", async () => {
    const events: any[] = [];
    window.addEventListener("topsort", (e) => {
      events.push((e as any).detail);
    });
    document.body.innerHTML = `<div data-ts-product="p-organic"></div>`;

    await import("./detector");

    expect(events.some((e) => e.type === "Render")).toBe(false);
  });

  test("does not report a render for an inherited bid", async () => {
    const events: any[] = [];
    window.addEventListener("topsort", (e) => {
      events.push((e as any).detail);
    });
    document.body.innerHTML = `
      <div data-ts-product="p-inherited" data-ts-resolved-bid="inherit"></div>
    `;

    await import("./detector");

    expect(events.some((e) => e.type === "Render")).toBe(false);
  });
});
