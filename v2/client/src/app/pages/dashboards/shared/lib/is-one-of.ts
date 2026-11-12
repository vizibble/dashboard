/** Narrows a string (e.g. a Select value) to one of a fixed set of options. */
export function isOneOf<T extends string>(options: readonly T[], value: string): value is T {
  return options.some((option) => option === value);
}
