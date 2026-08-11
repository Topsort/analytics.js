/**
 * `IntersectionObserver` is purely geometric: it treats `visibility:hidden` and
 * `opacity:0` elements as visible as long as their box overlaps the viewport, and
 * only respects `display:none`. Markup preloaded into a hidden container — a
 * mega-menu revealed on hover, say — would otherwise record an impression for a
 * banner the shopper never saw.
 */
export function isRendered(el: HTMLElement): boolean {
  const check = (el as unknown as { checkVisibility?: (opts?: unknown) => boolean })
    .checkVisibility;
  if (typeof check === "function") {
    return check.call(el, {
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true,
    });
  }
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    // An unset opacity resolves to "" in some engines, which is not transparent.
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      style.opacity === "0"
    ) {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}
