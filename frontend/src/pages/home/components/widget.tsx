import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ReactNode } from 'react';

interface StatWidgetProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export const StatWidget = ({ title, icon, children }: StatWidgetProps) => {
  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2 space-y-0">
        {icon}
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-4 pt-0 min-h-0">
        {children}
      </CardContent>
    </Card>
  );
};
