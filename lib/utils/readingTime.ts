export function calculateReadingTime(html: string): number {
  if (!html) return 1;
  // Strip HTML tags
  const text = html.replace(/<[^>]*>?/gm, " ");
  // Count words
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  // Calculate minutes (avg 200 words per minute)
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}
