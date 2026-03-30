import { afterEach, beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  document.cookie = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("captures impressions before token is set", async () => {
  window.TS = {} as typeof window.TS;
  document.body.innerHTML = '<div data-ts-product="prod-1"></div>';

  const events: CustomEvent[] = [];
  window.addEventListener("topsort", (e) => events.push(e as CustomEvent));

  await import("./detector");

  expect(events).toHaveLength(1);
  expect(events[0]?.detail.type).toBe("Impression");
  expect(events[0]?.detail.product).toBe("prod-1");
});

test("captures clicks before token is set", async () => {
  window.TS = {} as typeof window.TS;
  document.body.innerHTML = '<div data-ts-product="prod-click"></div>';

  const events: CustomEvent[] = [];
  window.addEventListener("topsort", (e) => events.push(e as CustomEvent));

  await import("./detector");

  const card = document.querySelector<HTMLElement>("[data-ts-product]");
  card?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  const clickEvent = events.find((e) => e.detail.type === "Click");
  expect(clickEvent).toBeDefined();
  expect(clickEvent?.detail.product).toBe("prod-click");
});

test("observes dynamically added elements before token is set", async () => {
  window.TS = {} as typeof window.TS;

  const events: CustomEvent[] = [];
  window.addEventListener("topsort", (e) => events.push(e as CustomEvent));

  await import("./detector");

  const div = document.createElement("div");
  div.dataset.tsProduct = "prod-dynamic";
  document.body.appendChild(div);
  await new Promise(process.nextTick);

  expect(events.some((e) => e.detail.product === "prod-dynamic")).toBe(true);
});

test("installs getter/setter on window.TS.token when no token is provided", async () => {
  window.TS = {} as typeof window.TS;
  await import("./detector");

  const descriptor = Object.getOwnPropertyDescriptor(window.TS, "token");
  expect(typeof descriptor?.get).toBe("function");
  expect(typeof descriptor?.set).toBe("function");
  expect(descriptor?.configurable).toBe(true);
});

test("does not install token watcher when token is already present", async () => {
  window.TS = { token: "existing-token" };
  await import("./detector");

  // Plain data property — no getter/setter installed
  const descriptor = Object.getOwnPropertyDescriptor(window.TS, "token");
  expect(descriptor?.get).toBeUndefined();
  expect(descriptor?.value).toBe("existing-token");
});

test("setting the token via watcher makes it readable through the getter", async () => {
  window.TS = {} as typeof window.TS;
  await import("./detector");

  window.TS.token = "deferred-token";

  expect(window.TS.token).toBe("deferred-token");
});

test("setting the token twice updates the value", async () => {
  window.TS = {} as typeof window.TS;
  await import("./detector");

  window.TS.token = "token-v1";
  window.TS.token = "token-v2";

  expect(window.TS.token).toBe("token-v2");
});
