import { beforeEach, expect, test, vi } from "vitest";

// Templates sometimes render a data-ts-* attribute with an empty value instead
// of omitting it (e.g. a product without a sponsored bid). Such elements must
// not be treated as products: no handlers, no impressions, no clicks.

let events: any[];

beforeEach(() => {
  vi.resetModules();
  window.TS = { token: "token" };
  events = [];
  window.addEventListener("topsort", (e) => {
    events.push((e as any).detail);
  });
});

test("empty attributes produce no render or impression", async () => {
  document.body.innerHTML = `
    <div data-ts-product=""></div>
    <div data-ts-resolved-bid=""></div>
    <div data-ts-action=""></div>
    <div data-ts-items=""></div>
  `;
  vi.useFakeTimers();
  await import("./detector");
  vi.advanceTimersByTime(1000);
  vi.useRealTimers();

  expect(events).toMatchObject([]);
});

test("a click inside an empty data-ts-product produces no event", async () => {
  document.body.innerHTML = `<div data-ts-product=""><button data-ts-clickable>x</button></div>`;
  await import("./detector");
  document.querySelector("button")?.dispatchEvent(new Event("click", { bubbles: true }));

  expect(events).toMatchObject([]);
});

test("a click inside an empty data-ts-resolved-bid produces no event", async () => {
  document.body.innerHTML = `<div data-ts-resolved-bid=""><button data-ts-clickable>x</button></div>`;
  await import("./detector");
  document.querySelector("button")?.dispatchEvent(new Event("click", { bubbles: true }));

  expect(events).toMatchObject([]);
});
