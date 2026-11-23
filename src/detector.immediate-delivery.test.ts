import { afterEach, beforeEach, expect, test, vi } from "vitest";

const reportEventMock = vi.fn();

vi.mock("@topsort/sdk", () => ({
  TopsortClient: class {
    reportEvent = reportEventMock;
  },
}));

function reportedTypes(): string[] {
  return reportEventMock.mock.calls.flatMap(([payload]) => Object.keys(payload as object));
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  reportEventMock.mockReset();
  reportEventMock.mockResolvedValue({ retry: false });
  document.body.innerHTML = "";
  localStorage.clear();
  window.TS = { token: "token" };
});

afterEach(() => {
  vi.useRealTimers();
});

test("sends each event as soon as it is detected", async () => {
  document.body.innerHTML = `<div id="ad" data-ts-product="p-1" data-ts-resolved-bid="bid-1"></div>`;

  await import("./detector");
  expect(reportedTypes()).toEqual(["renders"]);

  // The impression fires when the 1 second dwell ends, with no queue delay on top.
  vi.advanceTimersByTime(1000);
  expect(reportedTypes()).toEqual(["renders", "impressions"]);

  document.querySelector("#ad")?.dispatchEvent(new Event("click", { bubbles: true }));
  // The request starts inside the click handler, before the page could unload.
  expect(reportedTypes()).toContain("clicks");
});

test("sends events a previous page left in storage on load", async () => {
  const leftover = {
    type: "Click",
    product: "p-1",
    bid: "bid-1",
    t: Date.now(),
    page: "/previous",
    id: "leftover-1",
    uid: "user-1",
  };
  localStorage.setItem("ts-q", JSON.stringify([{ e: leftover, r: 0 }]));

  await import("./detector");

  expect(reportEventMock).toHaveBeenCalledTimes(1);
  expect(reportEventMock.mock.calls[0]?.[0]).toMatchObject({
    clicks: [{ id: "leftover-1", placement: { path: "/previous" } }],
  });
});
