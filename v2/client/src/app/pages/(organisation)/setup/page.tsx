import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { LocationInput } from '@/app/pages/(organisation)/setup/components/location-input';
import { useCreateOrganisation } from '@/app/pages/(organisation)/setup/hooks/use-create-organisation';
import { BrandLogo } from '@/app/shared/components/brand-logo';
import { StatusBanner } from '@/app/shared/components/status-banner';
import type { ChangeEvent } from 'react';
import orgSetupBanner from '../../../../assets/images/org-setup-banner.png';

export function OrganisationSetupPage() {
  const {
    form,
    error,
    isSubmitting,
    slugAvailability,
    handleNameChange,
    handleSlugChange,
    onSubmit,
    clearError,
  } = useCreateOrganisation();

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const location = watch('location');

  return (
    <main className="bg-background min-h-svh">
      <header className="mb-8 flex p-6 md:p-10">
        <BrandLogo />
      </header>

      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <section>
          <img src={orgSetupBanner} alt="" aria-hidden="true" className="h-28 w-full object-cover sm:h-32" />
          <div className="mb-6">
            <h1 className="text-center text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Create your <span className="text-primary">organisation</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm leading-6">
              Set up your organisation to manage your team.
            </p>
          </div>
          {error && (
            <StatusBanner variant="destructive" className="mb-3">
              {error}
            </StatusBanner>
          )}

          <form
            onSubmit={(event) => {
              clearError();
              void onSubmit(event);
            }}
            className="space-y-5"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="organisation-name">
                  Organisation name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="organisation-name"
                  placeholder="e.g. Coca Cola"
                  autoComplete="organization"
                  maxLength={100}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  {...register('name', {
                    onChange: (event: ChangeEvent<HTMLInputElement>) => handleNameChange(event.target.value),
                  })}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="org-location">
                  Location <span className="text-destructive">*</span>
                </FieldLabel>
                <LocationInput
                  id="org-location"
                  value={location}
                  disabled={isSubmitting}
                  hasError={Boolean(errors.location)}
                  onChange={(value) =>
                    setValue('location', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
                <FieldError>{errors.location?.message}</FieldError>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="organisation-slug">
                    Organisation URL <span className="text-destructive">*</span>
                  </FieldLabel>

                  <div
                    id="slug-availability"
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    {slugAvailability === 'checking' && (
                      <>
                        <Spinner />
                        <span className="text-muted-foreground">Checking</span>
                      </>
                    )}
                    {slugAvailability === 'available' && (
                      <>
                        <CheckCircleIcon className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Available</span>
                      </>
                    )}
                    {slugAvailability === 'taken' && (
                      <>
                        <XCircleIcon className="text-destructive size-3.5" />
                        <span className="text-destructive">Already taken</span>
                      </>
                    )}
                    {slugAvailability === 'error' && (
                      <>
                        <WarningCircleIcon className="text-muted-foreground size-3.5" />
                        <span className="text-muted-foreground">Check failed</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-input focus-within:ring-ring flex h-11 items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2">
                  <span className="text-muted-foreground pl-3 text-sm">/org/</span>
                  <Input
                    id="organisation-slug"
                    placeholder="coca-cola"
                    maxLength={48}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.slug) || slugAvailability === 'taken'}
                    aria-describedby={errors.slug ? 'slug-error' : 'slug-availability'}
                    className="h-full border-0 shadow-none focus-visible:ring-0"
                    {...register('slug', {
                      onChange: (event: ChangeEvent<HTMLInputElement>) =>
                        handleSlugChange(event.target.value),
                    })}
                  />
                </div>
                <FieldError id="slug-error">{errors.slug?.message}</FieldError>
                {slugAvailability === 'error' && (
                  <p className="text-muted-foreground text-xs">
                    Availability will be checked again when you submit.
                  </p>
                )}
              </Field>
            </FieldGroup>

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Creating...
                </>
              ) : (
                'Create organisation'
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
