test("check clicks", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div data-ts-action="purchase" data-ts-items='[{"product":"product-id-purchase1", "price": "2399", "quantity": 1}, {"product":"product-id-purchase2", "price": "299", "quantity": 1}, {"product":"product-id-purchase3", "price": "399", "quantity": 4}]'></div>
  `;
  await import("./detector");

  expect(events).toMatchObject([
    {
      type: "purchase",
      page: "/",
      product: "",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      items: [
        { product: "product-id-purchase1", price: "2399", quantity: 1 },
        { product: "product-id-purchase2", price: "299", quantity: 1 },
        { product: "product-id-purchase3", price: "399", quantity: 4 },
      ],
    },
  ]);
});
