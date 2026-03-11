import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AddRuleFormData>({
    defaultValues: {
      parameter: '',
      condition: 'gt',
      threshold: '',
      label: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AddRuleFormData) => {
    await submitRuleForm(
      data,
      selectedDeviceId,
      createMutation.mutateAsync,
      reset
    );
  };

  return (
    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
      <h3 className="text-xs font-semibold text-slate-600 mb-4 uppercase tracking-wider">
        Add New Rule
      </h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col md:flex-row items-start md:items-end gap-4"
      >
        {/* Parameter */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-1 md:w-auto">
          <label className="text-xs font-medium text-slate-500">
            Parameter
          </label>
          {loadingParams ? (
            <select
              disabled
              className="bg-slate-100 border border-slate-200 text-slate-400 text-sm rounded-lg block w-full py-2.5 pl-2.5 pr-8 bg-[position:right_0.75rem_center] cursor-not-allowed"
            >
              <option>Loading…</option>
            </select>
          ) : (
            <div className="relative">
              <select
                {...register('parameter', { required: 'Required' })}
                className={`bg-white border ${errors.parameter ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 text-sm rounded-lg focus:ring-2 block w-full py-2.5 pl-2.5 pr-8 bg-[position:right_0.75rem_center] shadow-sm transition-colors cursor-pointer`}
              >
                <option value="" disabled>
                  Select parameter
                </option>
                {availableParams.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-none sm:w-[120px]">
          <label className="text-xs font-medium text-slate-500">
            Condition
          </label>
          <select
            {...register('condition', { required: 'Required' })}
            className={`bg-white border ${errors.condition ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 text-sm rounded-lg focus:ring-2 block w-full py-2.5 pl-2.5 pr-8 bg-[position:right_0.75rem_center] shadow-sm transition-colors cursor-pointer`}
          >
            {CONDITION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Threshold */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-[0.5] md:w-[140px]">
          <label className="text-xs font-medium text-slate-500">
            Threshold
          </label>
          <input
            type="number"
            {...register('threshold', {
              required: 'Required',
              valueAsNumber: false,
              validate: (val) =>
                !isNaN(Number(val)) || 'Must be a valid number',
            })}
            placeholder="e.g. 30"
            className={`bg-white border ${errors.threshold ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 text-sm rounded-lg focus:ring-2 block w-full p-2.5 shadow-sm transition-colors`}
          />
        </div>

        {/* Label */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-1 md:w-auto">
          <label className="text-xs font-medium text-slate-500">
            Label (optional)
          </label>
          <input
            {...register('label')}
            placeholder="e.g. High temp warning"
            className="bg-white border text-slate-900 text-sm rounded-lg focus:ring-2 border-slate-300 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm transition-colors"
          />
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0">
          <button
            type="submit"
            disabled={createMutation.isPending || !isValid}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {createMutation.isPending ? (
              'Saving…'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Rule
              </>
            )}
          </button>
        </div>
      </form>

      {createMutation.isError && (
        <p className="mt-3 text-sm text-red-500 font-medium">
          Failed to create rule. Please try again.
        </p>
      )}
    </div>
  );
};
