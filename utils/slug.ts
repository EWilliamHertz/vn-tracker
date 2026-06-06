/**
 * Convert a title to a URL-friendly slug
 * e.g., "Spice & Wolf" -> "spice-and-wolf"
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Decode a slug back to check against titles
 */
export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ');
}
