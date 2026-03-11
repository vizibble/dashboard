import { type ReactNode } from 'react';

interface StatWidgetProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export const StatWidget = ({ title, icon, children }: StatWidgetProps) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      <header className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
      </header>
      <div className="flex-1 flex items-center justify-center min-h-0">
        {children}
      </div>
    </div>
  );
};
