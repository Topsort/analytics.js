test("change attributes", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-ts-product="product-id-mod-1" data-ts-resolved-bid="1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  const p = document.getElementById("product");
  if (p) {
    p.dataset.tsProduct = "product-id-mod-2";
    delete p.dataset.tsResolvedBid;
  }
  await new Promise(process.nextTick);
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "Impression",
      page: "/",
      product: "product-id-mod-1",
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "Impression",
      page: "/",
      product: "product-id-mod-2",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);

  // Reverting changes should not generate another impression
  if (p) {
    p.dataset.tsProduct = "product-id-mod-1";
    p.dataset.tsResolvedBid = "1247eaae-63a1-4c20-9b52-9efdcdef3095";
  }
  await new Promise(process.nextTick);
  expect(events).toMatchObject([
    {
      type: "Impression",
      page: "/",
      product: "product-id-mod-1",
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "Impression",
      page: "/",
      product: "product-id-mod-2",
      bid: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
