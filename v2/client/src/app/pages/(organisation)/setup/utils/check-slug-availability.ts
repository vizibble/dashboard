import { authClient } from '@/app/pages/(auth)/client';

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const result = await authClient.organization.checkSlug({ slug });
  if (result.error) {
    if (result.error.code === 'ORGANIZATION_SLUG_ALREADY_TAKEN') {
      return false;
    }
    throw new Error('Could not check organisation URL.');
  }
  return result.data.status;
}
