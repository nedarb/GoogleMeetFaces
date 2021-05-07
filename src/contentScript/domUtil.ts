export function findAncestor(
  el: Element,
  selector: string
): Element | undefined {
  if (el?.matches(selector)) {
    return el;
  }
  return el ? findAncestor(el.parentElement, selector) : null;
}
