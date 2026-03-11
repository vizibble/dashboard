import { Plus, Trash2 } from "lucide-react";

import { useDeleteAlertRule, useFetchDeviceRules } from "@/pages/alerts/hooks/device-alert-rules";
import type { Condition } from "@/pages/alerts/types/types";
import { Loader } from "@/components/loader";

const CONDITION_LABEL: Record<Condition, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "=",
};

interface RulesListProps {
  selectedDevice: string;
}

export const RulesList = ({ selectedDevice }: RulesListProps) => {
  const { rules, loading: loadingRules } = useFetchDeviceRules(selectedDevice);
  const deleteMutation = useDeleteAlertRule(selectedDevice);

  return (
    <div className="bg-white">
      {loadingRules ? (
        <Loader 
          text="Loading rules..." 
          className="p-6 sm:p-8 flex justify-center items-center gap-3 text-sm font-medium text-slate-400" 
          spinnerClassName="w-5 h-5 animate-spin text-slate-400" 
        />
      ) : rules.length === 0 ? (
        <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center text-slate-400">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
            <Plus className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">No rules defined</p>
          <p className="text-xs mt-1">Add a rule above to monitor this device.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Parameter</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Condition</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Threshold</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Label</th>
                <th className="px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr
                  key={rule.rule_id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {rule.parameter}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-100">
                      {CONDITION_LABEL[rule.condition as Condition]}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                    {rule.threshold}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {rule.label ? (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        {rule.label}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(rule.rule_id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:outline-none focus:ring-red-100 disabled:opacity-50 disabled:cursor-not-allowed group-hover:opacity-100 sm:opacity-0"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
