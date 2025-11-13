import { expect, test } from "vitest";

test("check banner clicks", async () => {
  window.TS = {
    token: "token",
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    if ((e as any).detail.type === "Click") {
      events.push((e as any).detail);
    }
  });
  document.body.innerHTML = `
    <div id="banner" data-ts-resolved-bid="1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
    <div id="banner-product" data-ts-product="additional-banner-product" data-ts-resolved-bid="inherit"></div>
  `;
  await import("./detector");

  document.getElementById("banner")?.click();
  document.getElementById("banner")?.click();
  document.getElementById("banner-product")?.click();
  const uid = events[0]?.uid;
  expect(events).toMatchObject([
    {
      type: "Click",
      page: "/",
      product: undefined,
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
    {
      type: "Click",
      page: "/",
      additionalProduct: "additional-banner-product",
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid,
    },
  ]);
});
