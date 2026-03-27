import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const reportEventMock = vi.fn();
const topsortClientConfigs: Array<Record<string, unknown>> = [];

vi.mock("@topsort/sdk", () => ({
  TopsortClient: class {
    constructor(config: Record<string, unknown>) {
      topsortClientConfigs.push(config);
    }

    reportEvent = reportEventMock;
  },
}));

async function flushQueue() {
  await vi.advanceTimersByTimeAsync(300);
  await Promise.resolve();
}

describe("detector reporting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    reportEventMock.mockReset();
    topsortClientConfigs.length = 0;
    document.body.innerHTML = "";
    localStorage.clear();
    document.cookie = "";
    window.TS = { token: "token" };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("reports click payload with inherited bid as additional attribution", async () => {
    reportEventMock.mockResolvedValue({ retry: false });
    document.body.innerHTML = `
      <div id="promoted" data-ts-product="ad-1" data-ts-resolved-bid="bid-123"></div>
      <div id="organic" data-ts-product="organic-1" data-ts-resolved-bid="inherit"></div>
    `;

    await import("./detector");

    const promoted = document.querySelector("#promoted");
    const organic = document.querySelector("#organic");
    promoted?.dispatchEvent(new Event("click", { bubbles: true }));
    organic?.dispatchEvent(new Event("click", { bubbles: true }));
    await flushQueue();

    const clickPayload = reportEventMock.mock.calls
      .map(([payload]) => payload)
      .find((payload) => "clicks" in (payload as Record<string, unknown>)) as {
      clicks: Array<Record<string, unknown>>;
    };

    expect(clickPayload).toBeDefined();
    expect(clickPayload.clicks).toHaveLength(1);
    const firstClick = clickPayload.clicks[0];
    expect(firstClick).toBeDefined();
    if (!firstClick) {
      throw new Error("Expected at least one click payload");
    }
    expect(firstClick).toMatchObject({
      resolvedBidId: "bid-123",
      additionalAttribution: { type: "product", id: "organic-1" },
    });
    expect(firstClick.entity).toBeUndefined();
    const firstClientConfig = topsortClientConfigs[0];
    expect(firstClientConfig).toBeDefined();
    if (!firstClientConfig) {
      throw new Error("Expected Topsort client config");
    }
    expect(firstClientConfig).toMatchObject({
      apiKey: "token",
      userAgent: expect.stringMatching(/^ts\.js\//),
    });
  });

  test("reports purchase payload and maps item fields", async () => {
    reportEventMock.mockResolvedValue({ retry: false });
    const items = JSON.stringify([
      { product: "sku-1", quantity: 2, price: 19.5 },
      { product: "sku-2", quantity: 1, price: 5.0 },
    ]);
    document.body.innerHTML = `<div data-ts-action="purchase" data-ts-items='${items}'></div>`;

    await import("./detector");
    await flushQueue();

    const purchasePayload = reportEventMock.mock.calls
      .map(([payload]) => payload)
      .find((payload) => "purchases" in (payload as Record<string, unknown>)) as {
      purchases: Array<Record<string, unknown>>;
    };

    expect(purchasePayload).toBeDefined();
    expect(purchasePayload.purchases[0]).toMatchObject({
      items: [
        { productId: "sku-1", quantity: 2, unitPrice: 19.5 },
        { productId: "sku-2", quantity: 1, unitPrice: 5.0 },
      ],
    });
  });

  test("continues processing when reportEvent rejects", async () => {
    reportEventMock.mockRejectedValue(new Error("network-error"));
    document.body.innerHTML = `<div id="product" data-ts-product="p-1"></div>`;

    await import("./detector");
    const product = document.querySelector("#product");
    product?.dispatchEvent(new Event("click", { bubbles: true }));
    await flushQueue();

    expect(reportEventMock).toHaveBeenCalled();
  });

  test("keeps retryable events in queue and retries them", async () => {
    reportEventMock.mockResolvedValueOnce({ retry: true }).mockResolvedValue({ retry: false });
    document.body.innerHTML = `<div id="product" data-ts-product="p-2"></div>`;

    await import("./detector");
    const product = document.querySelector("#product");
    product?.dispatchEvent(new Event("click", { bubbles: true }));
    await flushQueue();
    await flushQueue();

    const clickCalls = reportEventMock.mock.calls
      .map(([payload]) => payload)
      .filter((payload) => "clicks" in (payload as Record<string, unknown>));
    expect(clickCalls.length).toBeGreaterThanOrEqual(2);
  });
});
