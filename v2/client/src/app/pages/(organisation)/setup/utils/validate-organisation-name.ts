export function validateOrganisationName(name: string): string | undefined {
  if (name.trim().length < 2) {
    return 'Organisation name must contain at least 2 characters.';
  }

  return undefined;
}
