import { AlertCircle, Trash2 } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteAlertRule,
  useFetchDeviceRules,
} from '@/pages/alerts/hooks/device-alert-rules';
import type { Condition } from '@/pages/alerts/types/types';

const CONDITION_LABEL: Record<Condition, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
};

interface RulesListProps {
  selectedDevice: string;
}

export const RulesList = ({ selectedDevice }: RulesListProps) => {
  const { rules, loading: loadingRules } = useFetchDeviceRules(selectedDevice);
  const deleteMutation = useDeleteAlertRule(selectedDevice);

  return (
    <div className="w-full">
      {loadingRules ? (
        <div className="p-10 flex flex-col justify-center items-center gap-3 text-sm font-medium text-muted-foreground">
          <Spinner className="size-6 text-primary" />
          <span>Loading rules...</span>
        </div>
      ) : rules.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center text-muted-foreground">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 border">
            <AlertCircle className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No rules defined
          </p>
          <p className="text-xs mt-1">
            Add a rule below to monitor this device.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full border rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="px-3 sm:px-4 h-12 font-semibold">
                  Parameter
                </TableHead>
                <TableHead className="px-3 sm:px-4 h-12 font-semibold">
                  Condition
                </TableHead>
                <TableHead className="px-3 sm:px-4 h-12 font-semibold">
                  Threshold
                </TableHead>
                <TableHead className="px-3 sm:px-4 h-12 font-semibold truncate max-w-24">
                  Label
                </TableHead>
                <TableHead className="px-3 sm:px-4 h-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {rules.map((rule) => (
                <TableRow
                  key={rule.rule_id}
                  className="hover:bg-muted/50 transition-colors group"
                >
                  <TableCell className="px-3 sm:px-4 py-4 font-semibold text-foreground whitespace-nowrap truncate max-w-40 sm:max-w-60">
                    {rule.parameter}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-4 font-mono whitespace-nowrap">
                    <Badge
                      className="font-bold bg-primary/5 text-primary border-primary/20"
                      variant="outline"
                    >
                      {CONDITION_LABEL[rule.condition as Condition]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-4 font-mono font-medium whitespace-nowrap">
                    {rule.threshold}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-4 truncate max-w-20 sm:max-w-40">
                    {rule.label ? (
                      <Badge className="font-normal" variant="secondary">
                        {rule.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-4 text-right">
                    <Button
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete rule"
                      variant="ghost"
                      disabled={deleteMutation.isPending}
                      size="icon"
                      onClick={() => deleteMutation.mutate(rule.rule_id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
