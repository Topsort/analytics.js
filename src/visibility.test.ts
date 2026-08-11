import { expect, test } from "vitest";
import { isRendered } from "./visibility";

function render(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.getElementById("target") as HTMLElement;
}

test("a plain element in the document is rendered", () => {
  expect(isRendered(render(`<div id="target"></div>`))).toBe(true);
});

test("display:none on the element itself is not rendered", () => {
  expect(isRendered(render(`<div id="target" style="display:none"></div>`))).toBe(false);
});

test("display:none on an ancestor is not rendered", () => {
  expect(isRendered(render(`<div style="display:none"><div id="target"></div></div>`))).toBe(false);
});

test("visibility:hidden on an ancestor is not rendered", () => {
  expect(isRendered(render(`<div style="visibility:hidden"><div id="target"></div></div>`))).toBe(
    false,
  );
});

test("visibility:collapse on an ancestor is not rendered", () => {
  expect(isRendered(render(`<div style="visibility:collapse"><div id="target"></div></div>`))).toBe(
    false,
  );
});

test("opacity:0 on an ancestor is not rendered", () => {
  expect(isRendered(render(`<div style="opacity:0"><div id="target"></div></div>`))).toBe(false);
});

test("an unset opacity is not treated as transparent", () => {
  // jsdom resolves an unset opacity to "" rather than "1" — that must not be
  // read as fully transparent.
  const el = render(`<div id="target"></div>`);
  expect(getComputedStyle(el).opacity).toBe("");
  expect(isRendered(el)).toBe(true);
});

test("a non-zero opacity is rendered", () => {
  expect(isRendered(render(`<div style="opacity:0.01"><div id="target"></div></div>`))).toBe(true);
});

test("prefers Element.checkVisibility when the engine provides it", () => {
  const el = render(`<div id="target"></div>`);
  const calls: unknown[] = [];
  (el as unknown as { checkVisibility: (opts?: unknown) => boolean }).checkVisibility = (opts) => {
    calls.push(opts);
    return false;
  };

  // Nothing in the computed styles says hidden, so a `false` here can only have
  // come from checkVisibility.
  expect(isRendered(el)).toBe(false);
  expect(calls).toHaveLength(1);
});

test("passes the legacy option spellings alongside the standard ones", () => {
  // Chrome/Edge 105-120 and Firefox 106-121 have checkVisibility but only accept
  // checkOpacity/checkVisibilityCSS. Sending the standard names alone there falls
  // back to the defaults (all false), so only display:none would be caught and a
  // visibility:hidden banner would be reported as visible.
  const el = render(`<div id="target"></div>`);
  let received: Record<string, boolean> | undefined;
  (el as unknown as { checkVisibility: (opts?: unknown) => boolean }).checkVisibility = (opts) => {
    received = opts as Record<string, boolean>;
    return true;
  };

  isRendered(el);

  expect(received).toEqual({
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true,
    checkOpacity: true,
    checkVisibilityCSS: true,
  });
});
