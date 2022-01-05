test("check clicks", async () => {
  (window as any).TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-sku="product-id-click-1:1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  const p = document.getElementById("product");
  p?.click();
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      sku: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "click",
      page: "/",
      sku: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
