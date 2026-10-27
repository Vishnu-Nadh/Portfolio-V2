const firstFamily = (list: string) => list.split(",")[0].trim().replace(/^["']|["']$/g, "");

let display: string | null = null;

/**
 * True when `el` is set in the display face. Compared against whatever
 * --font-display resolves to, since next/font generates the family name.
 */
export function isDisplayFace(el: Element) {
  if (display === null) {
    const probe = document.createElement("span");
    probe.style.fontFamily = "var(--font-display)";
    document.body.appendChild(probe);
    display = firstFamily(getComputedStyle(probe).fontFamily);
    probe.remove();
  }
  return !!display && firstFamily(getComputedStyle(el).fontFamily) === display;
}
