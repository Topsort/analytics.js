import { expect, test } from "vitest";

// A real product whose template renders data-ts-resolved-bid="" is organic:
// the click must carry the product and no bid, not an empty resolvedBidId.
test("a product with an explicit empty bid is organic, not an empty bid", async () => {
  window.TS = { token: "token" };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `<div data-ts-product="sku-1" data-ts-resolved-bid=""><button data-ts-clickable>x</button></div>`;
  await import("./detector");
  document.querySelector("button")?.dispatchEvent(new Event("click", { bubbles: true }));

  expect(events).toMatchObject([{ type: "Click", product: "sku-1" }]);
  expect(events[0].bid).toBeUndefined();
});
