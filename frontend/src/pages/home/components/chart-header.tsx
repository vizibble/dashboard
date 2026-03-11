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
          onClick={onDownload}
          title="Download PNG"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Download size={16} className="sm:hidden" />
          <Download size={18} className="hidden sm:block" />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className={cn(
            'p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
          )}
        >
          {isFullscreen ? (
            <Minimize size={16} className="sm:hidden" />
          ) : (
            <Maximize size={16} className="sm:hidden" />
          )}
          {isFullscreen ? (
            <Minimize size={18} className="hidden sm:block" />
          ) : (
            <Maximize size={18} className="hidden sm:block" />
          )}
        </button>
      </div>
    </header>
  );
};
