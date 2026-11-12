const SLUG_MAX_LENGTH = 48;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function generateOrganisationSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

export function normaliseSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/** Only well-formed slugs are worth asking the server about. */
export function isCheckableSlug(slug: string): boolean {
  if (!slug || slug.length > SLUG_MAX_LENGTH) {
    return false;
  }

  return SLUG_PATTERN.test(slug);
}
