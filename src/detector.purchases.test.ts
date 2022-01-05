test("check clicks", async () => {
  (window as any).TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div data-action="purchase" data-items='[{"sku":"product-id-purchase1", "price": "2399", "quantity": 1}, {"sku":"product-id-purchase2", "price": "299", "quantity": 1}, {"sku":"product-id-purchase3", "price": "399", "quantity": 4}]'></div>
  `;
  await import("./detector");

  expect(events).toMatchObject([
    {
      type: "purchase",
      page: "/",
      sku: "",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      items: [
        { sku: "product-id-purchase1", price: "2399", quantity: 1 },
        { sku: "product-id-purchase2", price: "299", quantity: 1 },
        { sku: "product-id-purchase3", price: "399", quantity: 4 },
      ],
    },
  ]);
});
