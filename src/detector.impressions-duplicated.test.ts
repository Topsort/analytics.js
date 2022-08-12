test("check impresssions", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div data-ts-product="product-id-imp-1"></div>
    <div data-ts-product="product-id-imp-1"></div>
  `;
  await import("./detector");

  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "Impression",
      page: "/",
      product: "product-id-imp-1",
      auction: undefined,
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
