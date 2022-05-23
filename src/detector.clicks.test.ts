test("check clicks", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-ts-product="product-id-click-1" data-ts-auction="1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  document.getElementById("product")?.click();
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "Impression",
      page: "/",
      product: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "ClickEvent",
      page: "/",
      product: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
