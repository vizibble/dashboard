import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  suffix?: React.ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ error, suffix, className, ...props }, ref) => (
    <div>
      <div className="relative">
        <input
          ref={ref}
          {...props}
          className={`w-full sm:px-4 px-2 sm:py-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-400 text-gray-700 ${
            error
              ? 'border-red-400 focus:border-red-400'
              : 'border-gray-200 focus:border-blue-400'
          } ${suffix ? 'pr-10' : ''} ${className || ''}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>}
    </div>
  )
);

InputField.displayName = 'InputField';
