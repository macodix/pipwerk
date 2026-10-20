/** Whether the window matches a media query; false where the browser cannot tell (tests without a layout engine). */
export function matchesMedia(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** The middle layout: the drawing area and a side area with tabs for the library and the properties view (specification 5.1). */
export const MIDDLE_LAYOUT = '(min-width: 700px) and (max-width: 1099px)';

/** The layouts below 1100 pixels, in which the library and the properties view do not stand beside the drawing area. */
export const NARROW_LAYOUT = '(max-width: 1099px)';
