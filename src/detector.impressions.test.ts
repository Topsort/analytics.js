test("check impresssions", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div data-sku="product-id-imp-1"></div>
    <div data-sku="product-id-imp-2:bogus-auction"></div>
    <div data-sku="product-id-imp-3:1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      sku: "product-id-imp-1",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "impression",
      page: "/",
      sku: "product-id-imp-2",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
    },
    {
      type: "impression",
      page: "/",
      sku: "product-id-imp-3",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
