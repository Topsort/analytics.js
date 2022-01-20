test("change attributes", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-sku="product-id-mod-1:1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  const p = document.getElementById("product");
  if (p) {
    p.dataset.sku = "product-id-mod-2";
  }
  await new Promise(process.nextTick);
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      sku: "product-id-mod-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "impression",
      page: "/",
      sku: "product-id-mod-2",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);

  // Reverting changes should not generate another impression
  if (p) {
    p.dataset.sku = "product-id-mod-1:1247eaae-63a1-4c20-9b52-9efdcdef3095";
  }
  await new Promise(process.nextTick);
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      sku: "product-id-mod-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "impression",
      page: "/",
      sku: "product-id-mod-2",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
