test("check clicks", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-ts-product="product-id-click-1" data-ts-auction="1247eaae-63a1-4c20-9b52-9efdcdef3095"><div id="clickable1" data-ts-clickable>Clickable 1</div><div id="non-clickable">Non clickable Text</div><div id="clickable2" data-ts-clickable>Clickable 2</div></div>
  `;
  await import("./detector");

  // These do not generate a click event
  document.getElementById("product")?.click();
  document.getElementById("non-clickable")?.click();
  expect(events).toHaveLength(1);

  document.getElementById("clickable2")?.click();

  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      product: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "click",
      page: "/",
      product: "product-id-click-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
