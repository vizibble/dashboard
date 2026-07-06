import { SidebarTrigger } from '@/components/ui/sidebar';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 h-16 bg-primary text-primary-foreground border-b border-white/10 shadow-md w-full shrink-0">
      <div className="px-4 h-16 flex items-center justify-start">
        <div className="flex items-center gap-4">
          <SidebarTrigger
            className="text-white hover:bg-white"
            variant="ghost"
          />
        </div>
      </div>
    </nav>
  );
}
