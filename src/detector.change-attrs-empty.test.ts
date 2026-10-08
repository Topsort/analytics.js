import { expect, test, vi } from "vitest";

// An attribute mutation re-processes the element. If the attribute was
// changed to an empty string the element is no longer a product and must not
// be observed for a second impression with no product.
test("a product attribute changed to empty stops being tracked", async () => {
  window.TS = { token: "token" };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `<div id="product" data-ts-product="product-id-1"></div>`;
  vi.useFakeTimers();
  await import("./detector");
  vi.advanceTimersByTime(1000);
  expect(events).toMatchObject([{ type: "Impression", product: "product-id-1" }]);

  const p = document.getElementById("product");
  if (p) {
    p.dataset.tsProduct = "";
  }
  await new Promise(process.nextTick);
  vi.advanceTimersByTime(1000);
  vi.useRealTimers();

  expect(events).toHaveLength(1);
});
