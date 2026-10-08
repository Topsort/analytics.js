import { expect, test, vi } from "vitest";

// If a product attribute is emptied while the impression dwell timer is
// counting, the timer must be cancelled, not fire an impression with no product.
test("emptying the product attribute mid-dwell cancels the impression", async () => {
  window.TS = { token: "token" };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `<div id="product" data-ts-product="product-id-1"></div>`;
  vi.useFakeTimers();
  await import("./detector");
  vi.advanceTimersByTime(500);
  expect(events).toHaveLength(0);

  const p = document.getElementById("product");
  if (p) {
    p.dataset.tsProduct = "";
  }
  await new Promise(process.nextTick);
  vi.advanceTimersByTime(1500);
  vi.useRealTimers();

  expect(events).toHaveLength(0);
});
