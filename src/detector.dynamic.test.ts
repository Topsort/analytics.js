test("dynamic content", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  await import("./detector");

  const div = document.createElement("div");
  div.dataset.tsProduct = "product-id-dyn-1";
  div.dataset.tsAuction = "1247eaae-63a1-4c20-9b52-9efdcdef3095";
  document.body.appendChild(div);
  await new Promise(process.nextTick);
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      product: "product-id-dyn-1",
      auction: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
    },
  ]);
});
