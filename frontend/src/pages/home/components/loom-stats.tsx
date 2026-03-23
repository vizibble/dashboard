import { Activity, Clock, Gauge } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoomStatsProps {
  summary: {
    totalProduction: number;
    avgSpeed: number;
    utilization: number;
  };
}

export const LoomStats = ({ summary }: LoomStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2 space-y-0 text-emerald-600">
          <Activity size={18} />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Total Production
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800 tabular-nums leading-none">
              {summary.totalProduction.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-400">meters</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2 space-y-0 text-blue-500">
          <Gauge size={18} />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Average Speed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800 tabular-nums leading-none">
              {summary.avgSpeed.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-400">m / hr</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Based on active running time</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2 space-y-0 text-amber-500">
          <Clock size={18} />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Machine Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800 tabular-nums leading-none">
              {summary.utilization}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${summary.utilization}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
