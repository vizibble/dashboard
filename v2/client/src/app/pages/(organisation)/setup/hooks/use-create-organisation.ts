import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, type SubmitEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { checkSlugAvailability, createOrganisation } from '@/app/pages/(organisation)/setup/api';
import { useSlugAvailability } from '@/app/pages/(organisation)/setup/hooks/use-slug-availability';
import {
  generateOrganisationSlug,
  normaliseSlug,
} from '@/app/pages/(organisation)/setup/lib/organisation-slug';
import {
  organisationSchema,
  type OrganisationFormValues,
} from '@/app/pages/(organisation)/setup/schemas/organisation-setup-schema';
import { getErrorMessage } from '@/app/shared/utils/error-message';

const setValueOptions = { shouldDirty: true, shouldValidate: true } as const;

export function useCreateOrganisation() {
  const navigate = useNavigate();

  const slugEdited = useRef(false);

  const submitting = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationSchema),
    defaultValues: { name: '', slug: '', location: '' },
    mode: 'onBlur',
  });

  const name = useWatch({ control: form.control, name: 'name' }) ?? '';

  const slug = normaliseSlug(useWatch({ control: form.control, name: 'slug' }) ?? '');

  const slugAvailability = useSlugAvailability(slug);

  function handleNameChange(value: string) {
    form.setValue('name', value, setValueOptions);
    if (slugEdited.current) {
      return;
    }
    form.setValue('slug', generateOrganisationSlug(value), setValueOptions);
  }

  function handleSlugChange(value: string) {
    slugEdited.current = true;
    form.setValue('slug', generateOrganisationSlug(value), setValueOptions);
  }

  /** Re-checks the slug, then creates the organisation. Returns an error message, or null on success. */
  async function submit(values: OrganisationFormValues): Promise<string | null> {
    const submittedSlug = normaliseSlug(values.slug);

    let available: boolean;

    try {
      available = await checkSlugAvailability(submittedSlug);
    } catch {
      return 'Could not verify the organisation URL';
    }
    if (!available) {
      form.setError('slug', {
        type: 'manual',
        message: 'This organisation URL is already taken.',
      });
      slugAvailability.markTaken(submittedSlug);

      return null;
    }
    try {
      await createOrganisation(values, submittedSlug);
    } catch (cause: unknown) {
      return getErrorMessage(cause, 'Could not create the organisation.');
    }
    void navigate('/dashboard');

    return null;
  }

  async function onSubmit(values: OrganisationFormValues) {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      setError(await submit(values));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return {
    form,
    name,
    error,
    isSubmitting,
    slugAvailability: slugAvailability.status,
    handleNameChange,
    handleSlugChange,
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(event);
    },
    clearError: () => setError(null),
  };
}
