test("check clicks", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-ts-resolved-bid="1212eaae-12a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  document.getElementById("product")?.click();
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "impression",
      page: "/",
      bid: "1212eaae-12a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "click",
      page: "/",
      bid: "1212eaae-12a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
