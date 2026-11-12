import { BrandLogo } from '@/app/shared/components/brand-logo';
import { cn } from 'cn';
import { Outlet } from 'react-router-dom';
import authLayoutImage from '../../../assets/images/auth-layout.png';

export function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-5">
      {/* Form column */}
      <div className="col-span-3 flex flex-col gap-4 p-6 md:p-10">
        <BrandLogo />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className={cn('w-full max-w-sm')}>
            <Outlet />
          </div>
        </div>
      </div>
      {/* Product visual image */}
      <div className="relative col-span-2 hidden min-h-svh overflow-hidden lg:block">
        <img
          src={authLayoutImage}
          alt="Vizibble industrial monitoring illustration featuring its cyan mascot, production dashboard, quality inspection, and custom ERP solutions."
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}
