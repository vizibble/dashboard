import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useCreateAlertRule } from '@/pages/alerts/hooks/device-alert-rules';
import type {
  AddRuleFormData,
  AddRuleFormProps,
  Condition,
} from '@/pages/alerts/types/types';
import { submitRuleForm } from '@/pages/alerts/utils/submit-form';

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
];

export const AddRuleForm = ({
  selectedDeviceId,
  availableParams,
  loadingParams,
}: AddRuleFormProps) => {
  const createMutation = useCreateAlertRule();

  const form = useForm<AddRuleFormData>({
    defaultValues: {
      parameter: '',
      condition: 'gt',
      threshold: '',
      label: '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { isValid },
  } = form;

  const onSubmit = async (data: AddRuleFormData) => {
    await submitRuleForm(
      data,
      selectedDeviceId,
      createMutation.mutateAsync,
      reset
    );
  };

  return (
    <div className="px-4 py-3 border-t bg-muted/20">
      <h3 className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        Add Rule
      </h3>

      <form
        id="add-rule-form"
        className="flex flex-wrap items-end gap-x-3 gap-y-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup className="flex flex-wrap items-end gap-x-3 gap-y-3 w-full">
          {/* Parameter */}
          <Controller
            name="parameter"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="w-full lg:flex-1 min-w-[180px]"
              >
                <FieldLabel className="text-[11px]">Parameter</FieldLabel>

                {loadingParams ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className="h-9"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select parameter" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableParams.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
            rules={{ required: 'Required' }}
          />

          {/* Condition */}
          <Controller
            name="condition"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-[11px]">Condition</FieldLabel>

                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className="h-9"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {CONDITION_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
            rules={{ required: 'Required' }}
          />

          {/* Threshold */}
          <Controller
            name="threshold"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-[11px]">Value</FieldLabel>

                <Input
                  {...field}
                  className="h-9"
                  placeholder="30"
                  aria-invalid={fieldState.invalid}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
            rules={{
              required: 'Required',
              validate: (val) => !isNaN(Number(val)) || 'Must be a number',
            }}
          />

          {/* Label */}
          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <Field className="w-full lg:flex-1 min-w-[180px]">
                <FieldLabel className="text-[11px]">Label</FieldLabel>

                <Input
                  {...field}
                  className="h-9"
                  placeholder="High temp warning"
                />
              </Field>
            )}
          />

          {/* Button */}
          <Button
            className="gap-2 h-9 px-4"
            type="submit"
            disabled={createMutation.isPending || !isValid}
            form="add-rule-form"
          >
            {createMutation.isPending ? (
              'Saving…'
            ) : (
              <>
                <Plus className="size-4" />
                Add
              </>
            )}
          </Button>
        </FieldGroup>
      </form>

      {createMutation.isError && (
        <p className="mt-2 text-xs text-destructive font-medium">
          Failed to create rule. Please try again.
        </p>
      )}
    </div>
  );
};
