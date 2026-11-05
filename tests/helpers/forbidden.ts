/** Internal codenames and research notes that must never appear on the site, in metadata or in alt text. The site's own list; it is not shipped in any bundle. */
export const FORBIDDEN_TERMS = ['Akatsuki', 'Bankai Cloud', 'rlaope'];
export const forbiddenPattern = new RegExp(FORBIDDEN_TERMS.map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');
