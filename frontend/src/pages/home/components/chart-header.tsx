import { Download, Maximize, Minimize } from 'lucide-react';

import { cn } from '@/utils/cn';

type Props = {
  title: string;
  isFullscreen: boolean;
  onDownload: () => void;
  onToggleFullscreen: () => void;
};

export const ChartHeader = ({
  title,
  isFullscreen,
  onDownload,
  onToggleFullscreen,
}: Props) => {
  return (
    <header className="flex items-center justify-between mb-3 md:mb-4">
      <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest truncate pr-2">
        {title}
      </h3>

      <div className="flex gap-0.5 sm:gap-1 shrink-0">
        <button
          className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Download PNG"
          onClick={onDownload}
        >
          <Download className="sm:hidden" size={16} />
          <Download className="hidden sm:block" size={18} />
        </button>

        <button
          className={cn(
            'p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
          )}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="sm:hidden" size={16} />
          ) : (
            <Maximize className="sm:hidden" size={16} />
          )}
          {isFullscreen ? (
            <Minimize className="hidden sm:block" size={18} />
          ) : (
            <Maximize className="hidden sm:block" size={18} />
          )}
        </button>
      </div>
    </header>
  );
};
