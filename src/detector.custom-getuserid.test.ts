import { expect, test } from "vitest";

test("support custom getUserId function", async () => {
  window.TS = {
    token: "token",
    getUserId: () => {
      console.log("foo");
      return "custom-user-id";
    },
  };
  const events: any[] = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
  document.body.innerHTML = `
    <div id="product" data-ts-product="product-id-click-1" data-ts-resolved-bid="1247eaae-63a1-4c20-9b52-9efdcdef3095"></div>
  `;
  await import("./detector");

  document.getElementById("product")?.click();
  expect(events).toMatchObject([
    {
      type: "Impression",
      page: "/",
      product: "product-id-click-1",
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid: "custom-user-id",
    },
    {
      type: "Click",
      page: "/",
      product: "product-id-click-1",
      bid: "1247eaae-63a1-4c20-9b52-9efdcdef3095",
      id: expect.stringMatching(/[\d.a-zA-Z-]+/),
      uid: "custom-user-id",
    },
  ]);
});
