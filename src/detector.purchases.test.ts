import { expect, test } from "vitest";

test("check purchase", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div data-ts-action="purchase" data-ts-items='[{"product":"product-id-purchase1", "price": "2399", "quantity": 1}, {"product":"product-id-purchase2", "price": "299", "quantity": 1}, {"product":"product-id-purchase3", "price": "399", "quantity": 4}]'></div>
    <div data-ts-action="purchase" data-ts-items='[{"product":"product-id-purchase-after", "price": "2199", "quantity": 1, "vendorId": "example-vendor"}]'></div>
  `;
  await import("./detector");

  expect(events).toMatchObject([
    {
      type: "Purchase",
      page: "/",
      product: undefined,
      bid: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      items: [
        { product: "product-id-purchase1", price: "2399", quantity: 1 },
        { product: "product-id-purchase2", price: "299", quantity: 1 },
        { product: "product-id-purchase3", price: "399", quantity: 4 },
      ],
    },
    {
      type: "Purchase",
      page: "/",
      product: undefined,
      bid: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      items: [
        {
          product: "product-id-purchase-after",
          price: "2199",
          quantity: 1,
          vendorId: "example-vendor",
        },
      ],
    },
  ]);
});
