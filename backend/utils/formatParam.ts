export function formatParamLabel(key: string): string {
  return key
    .replace(/_/g, " ") // underscores → spaces
    .replace(/\b([a-z])/g, (c) => c.toUpperCase()); // capitalise each word
}
