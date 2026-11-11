import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/app/pages/(auth)/client';
import {
  organisationSchema,
  type OrganisationFormValues,
} from '@/app/pages/(organisation)/setup/schemas/organisation-setup-schema';
import { checkSlugAvailability } from '@/app/pages/(organisation)/setup/utils/check-slug-availability';
import { generateOrganisationSlug } from '@/app/pages/(organisation)/setup/utils/generate-organisation-slug';

type SlugAvailability = {
  slug: string;
  status: 'checking' | 'available' | 'taken' | 'error';
};

export function useCreateOrganisation() {
  const navigate = useNavigate();
  const slugEdited = useRef(false);
  const submitting = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability | null>(null);

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationSchema),
    defaultValues: { name: '', slug: '', location: '' },
    mode: 'onBlur',
  });
  const name = useWatch({ control: form.control, name: 'name' }) ?? '';
  const slug = (useWatch({ control: form.control, name: 'slug' }) ?? '').trim().toLowerCase();

  useEffect(() => {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 48) {
      return;
    }
    let active = true;
    async function checkAvailability() {
      try {
        const available = await checkSlugAvailability(slug);
        if (active) {
          setSlugAvailability({
            slug,
            status: available ? 'available' : 'taken',
          });
        }
      } catch {
        if (active) {
          setSlugAvailability({ slug, status: 'error' });
        }
      }
    }

    const timeout = window.setTimeout(() => {
      setSlugAvailability({ slug, status: 'checking' });
      void checkAvailability();
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [slug]);

  function handleNameChange(value: string) {
    form.setValue('name', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!slugEdited.current) {
      form.setValue('slug', generateOrganisationSlug(value), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function handleSlugChange(value: string) {
    slugEdited.current = true;
    form.setValue('slug', generateOrganisationSlug(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: OrganisationFormValues) {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const submittedSlug = values.slug.trim().toLowerCase();
      const available = await checkSlugAvailability(submittedSlug);
      if (!available) {
        form.setError('slug', {
          type: 'manual',
          message: 'This organisation URL is already taken.',
        });
        setSlugAvailability({ slug: submittedSlug, status: 'taken' });
        return;
      }
      const result = await authClient.organization.create({
        name: values.name.trim(),
        slug: submittedSlug,
        ...(values.location.trim() ? { metadata: { location: values.location.trim() } } : {}),
      });
      if (result.error) {
        setError(result.error.message || 'Could not create the organisation.');
        return;
      }
      void navigate('/dashboard');
    } catch {
      setError('Could not verify the organisation URL');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  const currentSlugAvailability = slugAvailability?.slug === slug ? slugAvailability.status : null;

  return {
    form,
    name,
    error,
    isSubmitting,
    slugAvailability: currentSlugAvailability,
    handleNameChange,
    handleSlugChange,
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(event);
    },
    clearError: () => setError(null),
  };
}
